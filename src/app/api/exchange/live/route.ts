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

    // 💥 API-Keys und Passphrase sicher entschlüsseln
    let decryptedApiKey: string
    let decryptedApiSecret: string
    let decryptedPassphrase: string | undefined

    try {
      decryptedApiKey = decryptApiKey(settings.api_key)
      decryptedApiSecret = decryptApiKey(settings.api_secret)
      decryptedPassphrase = settings.passphrase ? decryptApiKey(settings.passphrase) : undefined
    } catch (encErr) {
      console.error('[DECRYPTION ERROR]', encErr)
      return NextResponse.json({ success: false, error: 'Fehler beim Entschlüsseln der API-Schlüssel. Prüfe den ENCRYPTION_KEY.' }, { status: 500 })
    }

    const exchangeId = (settings.selected_exchange || 'bitget').toLowerCase()
    const exchangeClass = (ccxt as Record<string, any>)[exchangeId]
    if (!exchangeClass) return NextResponse.json({ error: 'Unbekannte Börse.' }, { status: 400 })

    const exchange = new exchangeClass({
      apiKey: decryptedApiKey,
      secret: decryptedApiSecret,
      password: decryptedPassphrase,
      enableRateLimit: true,
      options: { defaultType: 'swap' },
    })

    const exchangeInverse = new exchangeClass({
      apiKey: decryptedApiKey,
      secret: decryptedApiSecret,
      password: decryptedPassphrase,
      enableRateLimit: true,
      options: { defaultType: 'future' },
    })

    // Balance, Positionen und Snapshots parallel abrufen
    const balancePromise = exchange.fetchBalance()

    const positionsPromise = (async () => {
      if (exchangeId === 'bitget' && decryptedPassphrase) {
        try {
          const bitgetSync = new BitgetSyncService(decryptedApiKey, decryptedApiSecret, decryptedPassphrase)
          const [usdtPos, usdcPos, coinPos, spotMarginPos] = await Promise.all([
            bitgetSync.fetchLivePositions('USDT-FUTURES'),
            bitgetSync.fetchLivePositions('USDC-FUTURES'),
            bitgetSync.fetchLivePositions('COIN-FUTURES'),
            bitgetSync.fetchSpotMarginPositions(),
          ])
          return [...usdtPos, ...usdcPos, ...coinPos, ...spotMarginPos].filter((p: any) => Math.abs(Number(p.total || 0)) > 0)
        } catch (err: any) {
          console.warn('[BITGET LIVE POSITIONS WARNING]', err.message)
          return []
        }
      } else {
        try {
          const [linearPositions, inversePositions] = await Promise.all([
            exchange.fetchPositions().catch(() => []),
            exchangeInverse.fetchPositions().catch(() => []),
          ])
          const combinedFallback = [...linearPositions, ...inversePositions]
          return combinedFallback.filter((p: any) => Math.abs(Number(p.contracts || p.size || p.info?.size || 0)) > 0)
        } catch (e: any) {
          console.warn('[CCXT FALLBACK POSITIONS WARNING]', e.message)
          return []
        }
      }
    })()

    const snapshotsPromise = supabase
      .from('portfolio_snapshots')
      .select('timestamp, equity')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: true })

    const [balanceResult, activePositionsResult, snapshotsResult] = await Promise.allSettled([
      balancePromise,
      positionsPromise,
      snapshotsPromise
    ])

    const balance = balanceResult.status === 'fulfilled' ? balanceResult.value : { total: {}, info: {} }
    const activePositions = activePositionsResult.status === 'fulfilled' ? activePositionsResult.value : []
    const existingSnapshots = snapshotsResult.status === 'fulfilled' ? snapshotsResult.value.data || [] : []

    let totalPortfolioEquity = 0
    let accountCurrency = 'USD'

    if (balance.info?.totalEq) {
      totalPortfolioEquity = Number(balance.info.totalEq)
      accountCurrency = 'USD'
    } else if (balance.info?.totalEquity) {
      totalPortfolioEquity = Number(balance.info.totalEquity)
      accountCurrency = 'USD'
    } else if (balance.info?.usdtEquity) {
      totalPortfolioEquity = Number(balance.info.usdtEquity)
      accountCurrency = 'USDT'
    } else if (balance.info?.usdcEquity) {
      totalPortfolioEquity = Number(balance.info.usdcEquity)
      accountCurrency = 'USDC'
    } else {
      if (balance.total?.USD !== undefined && balance.total?.USD !== null) {
        totalPortfolioEquity = Number(balance.total.USD)
        accountCurrency = 'USD'
      } else if (balance.total?.USDT !== undefined || balance.USDT?.total !== undefined) {
        totalPortfolioEquity = Number(balance.total?.USDT || balance.USDT?.total || 0)
        accountCurrency = 'USDT'
      } else if (balance.total?.USDC !== undefined || balance.USDC?.total !== undefined) {
        totalPortfolioEquity = Number(balance.total?.USDC || balance.USDC?.total || 0)
        accountCurrency = 'USDC'
      } else if (balance.total?.BTC !== undefined || balance.BTC?.total !== undefined) {
        totalPortfolioEquity = Number(balance.total?.BTC || balance.BTC?.total || 0)
        accountCurrency = 'BTC'
      } else if (balance.total?.ETH !== undefined || balance.ETH?.total !== undefined) {
        totalPortfolioEquity = Number(balance.total?.ETH || balance.ETH?.total || 0)
        accountCurrency = 'ETH'
      }
    }

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

    // Sync wird abgewartet, bevor die Trades abgefragt werden
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
        console.warn('[SYNC WARNING]', syncErr.message)
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
      openPositions: activePositions,
      balance: balance.total,
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

    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
    }

    const body = await req.json()
    const { exchange, apiKey, apiSecret, passphrase } = body

    if (!exchange || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'API Key und Secret sind Pflichtfelder.' }, { status: 400 })
    }

    const exchangeId = String(exchange).toLowerCase()
    const exchangeClass = (ccxt as Record<string, any>)[exchangeId]

    if (!exchangeClass) {
      return NextResponse.json({ error: 'Börse wird nicht unterstützt.' }, { status: 400 })
    }

    const exchangeInstance = new exchangeClass({
      apiKey: apiKey,
      secret: apiSecret,
      password: passphrase || undefined,
      enableRateLimit: true,
      options: { defaultType: 'swap' },
    })

    try {
      await exchangeInstance.fetchBalance()
    } catch (ccxtError: any) {
      return NextResponse.json({ error: 'Verbindung fehlgeschlagen.' }, { status: 401 })
    }

    // 💥 API-Keys und Passphrase vor dem Speichern in Supabase verschlüsseln
    let encryptedApiKey: string
    let encryptedApiSecret: string
    let encryptedPassphrase: string | null = null

    try {
      encryptedApiKey = encryptApiKey(apiKey.trim())
      encryptedApiSecret = encryptApiKey(apiSecret.trim())
      if (passphrase) {
        encryptedPassphrase = encryptApiKey(passphrase.trim())
      }
    } catch (encErr) {
      console.error('[ENCRYPTION ERROR]', encErr)
      return NextResponse.json({ error: 'Verschlüsselungsfehler auf dem Server.' }, { status: 500 })
    }

    const { error: dbError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        selected_exchange: exchangeId,
        api_key: encryptedApiKey,       // 💥 Verschlüsselt
        api_secret: encryptedApiSecret, // 💥 Verschlüsselt
        passphrase: encryptedPassphrase, // 💥 Verschlüsselt
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (dbError) {
      return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
    }

    const { error: dbError } = await supabase
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

    if (dbError) {
      return NextResponse.json({ error: 'Trennen fehlgeschlagen.' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}