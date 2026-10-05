import crypto from 'crypto'
import { sendScaleInPrompt } from '@/lib/telegram/telegramService'

export interface LivePosition {
  symbol: string
  marginCoin: string
  productType: string
  total: number
  size: number
  holdSide: 'LONG' | 'SHORT'
  entryPrice: number
  markPrice: number
  leverage: number
  unrealizedPL: number
  info: any
}

export class BitgetSyncService {
  private apiKey: string
  private apiSecret: string
  private apiPassphrase: string
  private baseURL: string = 'https://api.bitget.com'

  constructor(apiKey: string, apiSecret: string, apiPassphrase: string) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
    this.apiPassphrase = apiPassphrase
  }

  async fetchLivePositions(productType: 'USDT-FUTURES' | 'USDC-FUTURES' | 'COIN-FUTURES' = 'USDT-FUTURES'): Promise<LivePosition[]> {
    const endpoint = '/api/v2/mix/position/all-position'
    const queryString = `?productType=${productType}`
    const url = `${this.baseURL}${endpoint}${queryString}`

    const headers = this.generateAuthHeaders('GET', endpoint, queryString)

    try {
      const res = await fetch(url, { method: 'GET', headers })
      const data = await res.json()

      if (data && data.code === '00000') {
        return (data.data || []).map((item: any) => {
          const rawSide = String(item.holdSide || item.posSide || item.side || '').toUpperCase()
          const side: 'LONG' | 'SHORT' = rawSide.includes('SHORT') ? 'SHORT' : 'LONG'
          const totalSize = Number(item.total || item.totalPos || item.contracts || item.size || 0)

          const entryPr = Number(item.openPriceAvg || item.averageOpenPrice || item.openAvgPrice || 0)
          const markPr = Number(item.markPrice || 0)
          const lev = Number(item.leverage || item.openLeverage || 1)
          const upl = Number(item.unrealizedPL || 0)

          return {
            symbol: item.symbol,
            marginCoin: item.marginCoin || (productType === 'COIN-FUTURES' ? item.symbol?.split('/')[0] || 'BTC' : 'USDT'),
            productType: productType,
            total: Math.abs(totalSize),
            size: Math.abs(totalSize),
            holdSide: side,
            entryPrice: entryPr,
            markPrice: markPr,
            leverage: lev,
            unrealizedPL: upl,
            info: item,
          }
        })
      }
    } catch (e) {
      console.warn(`[BITGET SYNC] Konnte Live-Positionen für ${productType} nicht laden`, e)
    }
    return []
  }

  async fetchSpotMarginPositions(): Promise<LivePosition[]> {
    const endpoint = '/api/v2/spot/margin/isolated/position'
    const url = `${this.baseURL}${endpoint}`
    const headers = this.generateAuthHeaders('GET', endpoint, '')

    try {
      const res = await fetch(url, { method: 'GET', headers })
      const data = await res.json()

      if (data && data.code === '00000') {
        const positions: LivePosition[] = []
        
        ;(data.data || []).forEach((item: any) => {
          const baseAssetAmount = Number(item.baseAsset?.holding || item.total || 0)
          const borrowedAmount = Number(item.quoteAsset?.borrowed || item.borrowed || 0)

          if (baseAssetAmount > 0 || borrowedAmount > 0) {
            const entryPr = Number(item.baseAsset?.averageOpenPrice || item.openPriceAvg || item.averageOpenPrice || 0)
            const lev = Number(item.leverage || 10)
            const upl = Number(item.unrealizedPL || 0)

            positions.push({
              symbol: item.symbol || 'BTC/USDT',
              marginCoin: item.quoteAsset?.coin || 'USDT',
              productType: 'SPOT-MARGIN',
              total: Math.abs(baseAssetAmount),
              size: Math.abs(baseAssetAmount),
              holdSide: 'LONG',
              entryPrice: entryPr,
              markPrice: Number(item.markPrice || entryPr),
              leverage: lev,
              unrealizedPL: upl,
              info: item,
            })
          }
        })
        return positions
      }
    } catch (e) {
      console.warn('[BITGET SYNC] Konnte Spot-Margin Positionen nicht laden', e)
    }
    return []
  }

  async fetchClosedPositions(productType: 'USDT-FUTURES' | 'USDC-FUTURES' | 'COIN-FUTURES' = 'USDT-FUTURES', pageSize: number = 10): Promise<any[]> {
    const endpoint = '/api/v2/mix/position/history-position'
    const queryString = `?productType=${productType}&pageSize=${pageSize}`
    const url = `${this.baseURL}${endpoint}${queryString}`

    const headers = this.generateAuthHeaders('GET', endpoint, queryString)

    try {
      const res = await fetch(url, { method: 'GET', headers })
      const data = await res.json()

      if (data && data.code === '00000') {
        return data.data?.list || []
      }
    } catch (e) {
      console.warn(`[BITGET SYNC] Konnte Historie für ${productType} nicht laden`, e)
    }
    return []
  }

  async fetchRecentFills(productType: 'USDT-FUTURES' | 'USDC-FUTURES' | 'COIN-FUTURES' = 'USDT-FUTURES', limit: number = 20): Promise<any[]> {
    const endpoint = '/api/v2/mix/order/fills'
    const queryString = `?productType=${productType}&limit=${limit}`
    const url = `${this.baseURL}${endpoint}${queryString}`

    const headers = this.generateAuthHeaders('GET', endpoint, queryString)

    try {
      const res = await fetch(url, { method: 'GET', headers })
      const data = await res.json()

      if (data && data.code === '00000') {
        return data.data?.fillList || []
      }
    } catch (e) {
      console.warn(`[BITGET SYNC] Konnte Fills für ${productType} nicht laden`, e)
    }
    return []
  }

  async syncFillsAndDetectScaleIns(supabaseClient: any, userId: string, activePositions: LivePosition[]): Promise<void> {
    try {
      // 1. Prüfen, ob der Nutzer Telegram überhaupt verknüpft hat
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('telegram_chat_id')
        .eq('id', userId)
        .maybeSingle()

      const telegramChatId = profile?.telegram_chat_id

      // 2. Fills von Bitget abrufen
      const productTypes: Array<'USDT-FUTURES' | 'USDC-FUTURES' | 'COIN-FUTURES'> = ['USDT-FUTURES', 'USDC-FUTURES', 'COIN-FUTURES']
      const fillsLists = await Promise.all(
        productTypes.map(pType => this.fetchRecentFills(pType, 15))
      )
      const allFills: any[] = fillsLists.flat()

      if (allFills.length === 0) return

      // Nach Zeit sortieren (älteste zuerst, damit Sequenz stimmt)
      allFills.sort((a, b) => Number(a.cTime || 0) - Number(b.cTime || 0))

      for (const fill of allFills) {
        const fillExternalId = String(fill.tradeId || fill.fillId || `${fill.orderId}-${fill.cTime}`)
        const symbol = String(fill.symbol || '').toUpperCase()
        const sideRaw = String(fill.side || '').toLowerCase()
        const isLong = sideRaw.includes('buy') || sideRaw.includes('long')
        const side: 'long' | 'short' = isLong ? 'long' : 'short'
        const fillPrice = Number(fill.priceAvg || fill.price || 0)
        const fillSize = Number(fill.baseVolume || fill.size || 0)
        const orderType: 'limit' | 'market' = (fill.orderType || '').toLowerCase().includes('market') ? 'market' : 'limit'

        // 3. Prüfen, ob dieser Fill bereits in raw_fills existiert
        const { data: existingFill } = await supabaseClient
          .from('raw_fills')
          .select('id')
          .eq('user_id', userId)
          .eq('external_id', fillExternalId)
          .maybeSingle()

        if (existingFill) {
          continue // Bereits verarbeitet
        }

        // 4. Prüfen, ob zeitgleich eine Live-Position in dieselbe Richtung lief (Scale-In)
        const matchingLivePos = (activePositions || []).find((pos) => {
          const posSymbol = pos.symbol.toUpperCase().replace(/_.*$/, '').replace(/[^A-Z0-9]/g, '')
          const cleanFillSymbol = symbol.replace(/_.*$/, '').replace(/[^A-Z0-9]/g, '')
          const posSide = pos.holdSide.toLowerCase()
          return (posSymbol === cleanFillSymbol || posSymbol.includes(cleanFillSymbol)) && posSide === side
        })

        // 5. In raw_fills einfügen
        const fillPayload: any = {
          user_id: userId,
          external_id: fillExternalId,
          symbol: symbol,
          side: side,
          price: fillPrice,
          size: fillSize,
          order_type: orderType,
          created_at: new Date(Number(fill.cTime || Date.now())).toISOString(),
          scale_in_reason: null
        }

        const { data: insertedFill, error: insertError } = await supabaseClient
          .from('raw_fills')
          .insert(fillPayload)
          .select()
          .single()

        if (insertError) {
          console.error('[BITGET SYNC] Fehler beim Speichern des Fills:', insertError.message)
          continue
        }

        // 6. Wenn Live-Position vorhanden und Bot verbunden: Telegram Prompt triggern!
        if (matchingLivePos && telegramChatId && insertedFill) {
          // Offenen Trade aus DB holen (falls vorhanden) oder Symbol als Referenz
          const { data: openTrade } = await supabaseClient
            .from('trades')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'OPEN')
            .ilike('pair', `%${symbol.replace(/USDT$/, '')}%`)
            .maybeSingle()

          await sendScaleInPrompt({
            chatId: telegramChatId,
            tradeId: openTrade?.id || 'live',
            fillId: insertedFill.id,
            symbol: symbol,
            side: side,
            size: fillSize,
            price: fillPrice,
            orderType: orderType,
            newAvgPrice: matchingLivePos.entryPrice || fillPrice
          })
        }
      }
    } catch (err) {
      console.warn('[BITGET SYNC] Fehler in syncFillsAndDetectScaleIns:', err)
    }
  }

  async syncHistory(supabaseClient: any, userId: string, activeTags: any, activePreTrades: any, activePositions: any[]): Promise<boolean> {
    const productTypes: Array<'USDT-FUTURES' | 'USDC-FUTURES' | 'COIN-FUTURES'> = ['USDT-FUTURES', 'USDC-FUTURES', 'COIN-FUTURES']

    const historyLists = await Promise.all(
      productTypes.map(pType => this.fetchClosedPositions(pType, 10))
    )
    let allClosedPositions: any[] = historyLists.flat()

    let settingsModified = false
    if (allClosedPositions.length === 0) return false

    allClosedPositions.sort((a, b) => Number(b.uTime || b.cTime || 0) - Number(a.uTime || a.cTime || 0))
    const top10Positions = allClosedPositions.slice(0, 10)

    for (const pos of top10Positions) {
      const rawSymbol = String(pos.symbol || '').toUpperCase()
      const rawSide = String(pos.holdSide || pos.posSide || pos.side || pos.direction || '').toUpperCase()
      const posSide: 'LONG' | 'SHORT' = rawSide.includes('SHORT') || rawSide.includes('SELL') ? 'SHORT' : 'LONG'
      const marginCoin = String(pos.marginCoin || 'USDT').toUpperCase()
      
      const closeTime = Number(pos.uTime || pos.cTime || Date.now())
      const externalId = `bitget-${marginCoin.toLowerCase()}-${pos.positionId || `${rawSymbol}-${posSide}-${closeTime}`}`

      const { data: existing } = await supabaseClient
        .from('trades')
        .select('id, pnl, entry_tags, is_locked')
        .eq('user_id', userId)
        .eq('external_id', externalId)
        .maybeSingle()

      const cleanRawSymbol = rawSymbol.replace(/_.*$/, '').replace(/[^A-Z0-9]/g, '')

      // Prüfen, ob für dieses Symbol aktuell eine Position LIVE geöffnet ist
      const isOpenNow = (activePositions || []).some((ap: any) => {
        const apSymbol = String(ap.symbol || '').toUpperCase().replace(/_.*$/, '').replace(/[^A-Z0-9]/g, '')
        const rawApSide = String(ap.holdSide || ap.posSide || ap.side || '').toUpperCase()
        const apSide: 'LONG' | 'SHORT' = rawApSide.includes('SHORT') || rawApSide.includes('SELL') ? 'SHORT' : 'LONG'
        return (apSymbol === cleanRawSymbol || apSymbol.includes(cleanRawSymbol) || cleanRawSymbol.includes(apSymbol)) && apSide === posSide
      })

      const getDictKey = (dict: any) => {
        if (!dict || typeof dict !== 'object') return null

        // 1. Exakter Match: z. B. "BTCUSDT-LONG-USDT"
        const exactKey = `${rawSymbol}-${posSide}-${marginCoin}`
        if (dict[exactKey]) return exactKey

        // 2. Normalisierter Match über alle Keys
        for (const k of Object.keys(dict)) {
          const upperKey = k.toUpperCase()
          const cleanK = upperKey.replace(/_.*$/, '').replace(/[^A-Z0-9]/g, '')

          if (cleanK.includes(cleanRawSymbol) && upperKey.includes(posSide)) {
            return k
          }
        }

        // 3. Fallback: Reines Basis-Asset (z. B. BTC) + Seite
        const baseAsset = cleanRawSymbol.replace(/USDT|USDC|USD/g, '')
        for (const k of Object.keys(dict)) {
          const upperKey = k.toUpperCase()
          if (upperKey.includes(baseAsset) && upperKey.includes(posSide)) {
            return k
          }
        }

        return null
      }

      // Schlüssel nur abgreifen, wenn die Position NICHT gerade noch aktiv offen ist
      const tagKey = !isOpenNow ? getDictKey(activeTags) : null
      const preTradeKey = !isOpenNow ? getDictKey(activePreTrades) : null

      const rawPnl = pos.netProfit ?? pos.netProfits ?? pos.pnl ?? pos.realizedPL ?? pos.achievedProfits ?? pos.closeProfit ?? 0
      const pnl = Number(rawPnl)
      const totalFees = Math.abs(Number(pos.totalFee ?? pos.fee ?? 0))
      const size = Math.abs(Number(pos.closeTotalPos || pos.openTotalPos || pos.total || 0))
      const exitPrice = Number(pos.closeAvgPrice || 0)
      const entryPrice = Number(pos.openAvgPrice || 0)

      const preselectedTags = tagKey && Array.isArray(activeTags[tagKey]) ? activeTags[tagKey] : []
      const preTrade = preTradeKey && activePreTrades[preTradeKey] ? activePreTrades[preTradeKey] : {}
      const wasLocked = Boolean(preTrade.locked)
      const displayPair = rawSymbol.includes('/') ? rawSymbol : `${cleanRawSymbol.replace(/USDT$/, '')}/USDT`

      if (!existing) {
        const tradePayload: any = {
          user_id: userId,
          external_id: externalId,
          pair: displayPair,
          status: 'CLOSED',
          side: posSide,
          entry_price: entryPrice,
          exit_price: exitPrice,
          pnl: pnl,
          total_fees: totalFees,
          size: size,
          timestamp: new Date(closeTime).toISOString(),
          entry_tags: preselectedTags,
          entry_notes: preTrade.preNotes || null,
          energy_level: preTrade.energy !== undefined ? preTrade.energy : null,
          conviction: preTrade.conviction !== undefined ? preTrade.conviction : null,
          is_locked: wasLocked,
          is_transferred: false
        }

        let { error: insertErr } = await supabaseClient.from('trades').insert(tradePayload)

        // Fallback falls Spalte is_locked in trades noch nicht existiert
        if (insertErr && insertErr.message?.includes('is_locked')) {
          delete tradePayload.is_locked
          const retry = await supabaseClient.from('trades').insert(tradePayload)
          insertErr = retry.error
        }

        if (!insertErr) {
          // NUR bereinigen, wenn Position nicht mehr offen ist und Daten tatsächlich übertragen wurden
          if (tagKey) { delete activeTags[tagKey]; settingsModified = true; }
          if (preTradeKey) { delete activePreTrades[preTradeKey]; settingsModified = true; }
        } else {
          console.error('[BITGET SYNC INSERT ERROR]:', insertErr.message)
        }
      } else {
        // Trade existiert bereits: PnL und Gebühren aktualisieren, falls noch offen/0
        if (existing.pnl === 0 && pnl !== 0) {
          await supabaseClient
            .from('trades')
            .update({ 
              pnl: pnl, 
              total_fees: totalFees,
              exit_price: exitPrice,
              entry_price: entryPrice,
            })
            .eq('id', existing.id)
        }
        // Keine Deletes von activeTags oder activePreTrades im else-Zweig!
      }
    }

    return settingsModified
  }

  private generateAuthHeaders(method: string, endpoint: string, queryParams: string = '') {
    const timestamp = Date.now().toString()
    const message = timestamp + method.toUpperCase() + endpoint + queryParams
    const sign = crypto.createHmac('sha256', this.apiSecret).update(message).digest('base64')

    return {
      'ACCESS-KEY': this.apiKey,
      'ACCESS-SIGN': sign,
      'ACCESS-TIMESTAMP': timestamp,
      'ACCESS-PASSPHRASE': this.apiPassphrase,
      'Content-Type': 'application/json',
    }
  }
}