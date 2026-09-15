export interface ExchangeFeeConfig {
  id: string
  name: string
  makerFee: number // in Prozent (z.B. 0.02 = 0.02%)
  takerFee: number // in Prozent (z.B. 0.06 = 0.06%)
}

export const EXCHANGE_FEES: Record<string, ExchangeFeeConfig> = {
  bitget: {
    id: 'bitget',
    name: 'Bitget',
    makerFee: 0.02,
    takerFee: 0.06
  },
  okx: {
    id: 'okx',
    name: 'OKX',
    makerFee: 0.02,
    takerFee: 0.05
  },
  bybit: {
    id: 'bybit',
    name: 'Bybit',
    makerFee: 0.02,
    takerFee: 0.055
  },
  binance: {
    id: 'binance',
    name: 'Binance',
    makerFee: 0.02,
    takerFee: 0.05
  }
}

/**
 * Ermittelt die effektive Fee basierend auf Börse, Order-Typ und evtl. Custom-Overrides
 */
export function getEffectiveFee(params: {
  exchangeId: string
  orderType: 'maker' | 'taker' | 'limit' | 'market'
  customMakerFee?: number | null
  customTakerFee?: number | null
}): number {
  const isMaker = params.orderType === 'maker' || params.orderType === 'limit'
  
  // 1. Custom Override prüfen
  if (isMaker && params.customMakerFee !== undefined && params.customMakerFee !== null) {
    return params.customMakerFee
  }
  if (!isMaker && params.customTakerFee !== undefined && params.customTakerFee !== null) {
    return params.customTakerFee
  }

  // 2. Standard-Börsen-Fee laden
  const config = EXCHANGE_FEES[params.exchangeId] || EXCHANGE_FEES.bitget
  return isMaker ? config.makerFee : config.takerFee
}