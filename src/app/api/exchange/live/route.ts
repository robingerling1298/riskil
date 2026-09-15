import { NextResponse } from 'next/server'
import ccxt from 'ccxt'
import { createClient } from '@/lib/supabase/server'
import { BitgetSyncService } from '@/lib/services/BitgetSyncService'
import { encryptApiKey, decryptApiKey } from '@/lib/encryption'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

    let { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!settings) {
      const { data: newSettings } = await supabase
        .from('user_settings')
        .insert({ user_id: user.id })
        .select('*')
        .single()
      settings = newSettings
    }

    if (!settings?.api_key || !settings?.api_secret) {
      return NextResponse.json({ success: false, error: 'Keine API Keys hinterlegt.' }, { status: 200 })
    }

    let decryptedApiKey: string
    let decryptedApiSecret: string
    let decryptedPassphrase: string | undefined

    try {
      decryptedApiKey = decryptApiKey(settings.api_key)
      decryptedApiSecret = decryptApiKey(settings.api_secret)
      decryptedPassphrase = settings.passphrase ? decryptApiKey(settings.passphrase) : undefined
    } catch (encErr) {
      return NextResponse.json({ success: false, error: 'Fehler beim Entschlüsseln der API-Schlüssel.' }, { status: 500 })
    }

    const exchangeId = (settings.selected_exchange || 'bitget').toLowerCase()
    const exchangeClass = (ccxt as Record<string, any>)[exchangeId]
    if (!exchangeClass) return NextResponse.json({ error: 'Unbekannte Börse.' }, { status: 400 })

    const exchangeSwap = new exchangeClass({
      apiKey: decryptedApiKey,
      secret: decryptedApiSecret,
      password: decryptedPassphrase,
      enableRateLimit: true,
      options: { defaultType: 'swap' },
    })

    // 1. Master-Balance über Bitget V2 abfragen (ohne führendes /api/)
    const masterBalancePromise = (async () => {
      if (exchangeId === 'bitget') {
        try {
          const res = await exchangeSwap.request('v2/account/all-account-balance', 'private', 'GET', {})
          return res?.data || []
        } catch (err: any) {
          console.warn('[MASTER BALANCE WARN]:', err?.message)
          return null
        }
      }
      return null
    })()

    // 2. Fallback-Swap-Balance
    const swapBalancePromise = exchangeSwap.fetchBalance().catch((err: any) => {
      console.error('[USDT-M ERROR]:', err?.message)
      return { total: {}, info: {} }
    })

    // 3. Positionen ermitteln
    const positionsPromise = (async () => {
      if (exchangeId === 'bitget' && decryptedPassphrase) {
        try {
          const bitgetSync = new BitgetSyncService(decryptedApiKey, decryptedApiSecret, decryptedPassphrase)
          const [usdtPos, coinPos] = await Promise.all([
            bitgetSync.fetchLivePositions('USDT-FUTURES'),
            bitgetSync.fetchLivePositions('COIN-FUTURES'),
          ])
          return [...usdtPos, ...coinPos].filter((p: any) => Math.abs(Number(p.total || 0)) > 0)
        } catch {
          return []
        }
      }
      return []
    })()

    // 4. Supabase Snapshots laden
    const snapshotsPromise = supabase
      .from('portfolio_snapshots')
      .select('timestamp, equity')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: true })

    const [masterRes, swapRes, positionsResult, snapshotsResult] = await Promise.allSettled([
      masterBalancePromise,
      swapBalancePromise,
      positionsPromise,
      snapshotsPromise,
    ])

    const masterAccounts = masterRes.status === 'fulfilled' ? masterRes.value : null
    const swapBalance = swapRes.status === 'fulfilled' ? swapRes.value : { total: {}, info: {} }
    const activePositions = positionsResult.status === 'fulfilled' ? positionsResult.value : []
    const existingSnapshots = snapshotsResult.status === 'fulfilled' ? snapshotsResult.value.data || [] : []

    let totalPortfolioEquity = 0
    let masterDetected = false

    // Primär: Aggregierte Master-Balance von Bitget V2 auswerten
    if (Array.isArray(masterAccounts) && masterAccounts.length > 0) {
      totalPortfolioEquity = masterAccounts.reduce((sum: number, acc: any) => {
        const val = Number(acc.usdtEquity || acc.equity || acc.usdtValue || acc.balance || 0)
        return sum + (isNaN(val) ? 0 : val)
      }, 0)

      if (totalPortfolioEquity > 0) {
        masterDetected = true
      }
    }

    // Sekundär: Fallback auf USDT-Futures Equity, falls Master-Endpoint 0 oder unberechtigt war
    if (!masterDetected) {
      if (swapBalance.info?.totalEq) totalPortfolioEquity = Number(swapBalance.info.totalEq)
      else if (swapBalance.info?.usdtEquity) totalPortfolioEquity = Number(swapBalance.info.usdtEquity)
      else totalPortfolioEquity = Number(swapBalance.total?.USDT || 0)
    }

    totalPortfolioEquity = Number(totalPortfolioEquity.toFixed(2))
    const accountCurrency = 'USDT'

    // Snapshot in Supabase sichern (maximal einmal pro Stunde)
    if (totalPortfolioEquity > 0) {
      const lastSnapshotTime = existingSnapshots && existingSnapshots.length > 0 
        ? new Date(existingSnapshots[existingSnapshots.length - 1].timestamp).getTime() 
        : 0
      
      const ONE_HOUR_MS = 60 * 60 * 1000
      if (Date.now() - lastSnapshotTime > ONE_HOUR_MS) {
        supabase.from('portfolio_snapshots').insert({
          user_id: user.id,
          equity: totalPortfolioEquity,
          currency: accountCurrency
        }).then(({ error }) => {
          if (error) console.warn('[SNAPSHOT ERROR]', error.message)
        })
      }
    }

    let currentActiveTags = { ...(settings.active_tags || {}) }
    let currentPreTrades = { ...(settings.active_pre_trades || {}) }

    if (exchangeId === 'bitget' && decryptedPassphrase) {
      const bitgetSync = new BitgetSyncService(decryptedApiKey, decryptedApiSecret, decryptedPassphrase)
      try {
        const didModify = await bitgetSync.syncHistory(supabase, user.id, currentActiveTags, currentPreTrades, activePositions)
        if (didModify) {
          await supabase.from('user_settings').update({
            active_tags: currentActiveTags,
            active_pre_trades: currentPreTrades,
          }).eq('user_id', user.id)
        }
      } catch (syncErr: any) {
        console.warn('[SYNC WARNING]', syncErr?.message)
      }
    }

    const { data: allDbTrades } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })

    return NextResponse.json({
      success: true,
      equity: totalPortfolioEquity,
      currency: accountCurrency,
      debug: {
        totalPortfolioEquity,
        masterDetected,
        masterRaw: masterAccounts,
      },
      openPositions: activePositions,
      balance: swapBalance.total,
      dbTrades: allDbTrades || [],
      snapshots: existingSnapshots || [],
      activeTags: currentActiveTags,
      activePreTrades: currentPreTrades,
      connectedAt: settings.updated_at
    }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Serverfehler' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

    const body = await req.json()
    const { exchange, apiKey, apiSecret, passphrase } = body
    if (!exchange || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'API Key und Secret sind Pflichtfelder.' }, { status: 400 })
    }

    const exchangeId = String(exchange).toLowerCase()
    const exchangeClass = (ccxt as Record<string, any>)[exchangeId]
    if (!exchangeClass) return NextResponse.json({ error: 'Börse wird nicht unterstützt.' }, { status: 400 })

    const exchangeInstance = new exchangeClass({
      apiKey,
      secret: apiSecret,
      password: passphrase || undefined,
      enableRateLimit: true,
      options: { defaultType: 'swap' },
    })

    await exchangeInstance.fetchBalance()

    const encryptedApiKey = encryptApiKey(apiKey.trim())
    const encryptedApiSecret = encryptApiKey(apiSecret.trim())
    const encryptedPassphrase = passphrase ? encryptApiKey(passphrase.trim()) : null

    const { error: dbError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        selected_exchange: exchangeId,
        api_key: encryptedApiKey,
        api_secret: encryptedApiSecret,
        passphrase: encryptedPassphrase,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (dbError) return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 500 })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

    await supabase
      .from('user_settings')
      .update({
        selected_exchange: null,
        api_key: null,
        api_secret: null,
        passphrase: null,
        active_tags: {},
        active_pre_trades: {},
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}