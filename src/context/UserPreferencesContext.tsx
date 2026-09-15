'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ExchangeId = 'bybit' | 'binance' | 'okx' | 'bitget' | 'mexc'
export type OrderType = 'LIMIT' | 'MARKET'

export interface ExchangeConfig {
  id: ExchangeId
  name: string
  logoColor: string
  makerFee: number // in %
  takerFee: number // in %
}

export const EXCHANGES: Record<ExchangeId, ExchangeConfig> = {
  bybit: { id: 'bybit', name: 'Bybit', logoColor: 'bg-amber-500', makerFee: 0.02, takerFee: 0.055 },
  binance: { id: 'binance', name: 'Binance', logoColor: 'bg-yellow-400', makerFee: 0.02, takerFee: 0.04 },
  okx: { id: 'okx', name: 'OKX', logoColor: 'bg-slate-100', makerFee: 0.02, takerFee: 0.05 },
  bitget: { id: 'bitget', name: 'Bitget', logoColor: 'bg-cyan-400', makerFee: 0.02, takerFee: 0.06 },
  mexc: { id: 'mexc', name: 'MEXC', logoColor: 'bg-emerald-500', makerFee: 0.0, takerFee: 0.02 },
}

interface UserPreferencesContextType {
  defaultExchange: ExchangeId
  setDefaultExchange: (exchange: ExchangeId) => void
  defaultOrderType: OrderType
  setDefaultOrderType: (type: OrderType) => void
  activeFee: number
  getFeeForType: (type: OrderType, exchange?: ExchangeId) => number
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined)

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [defaultExchange, setDefaultExchange] = useState<ExchangeId>('bybit')
  const [defaultOrderType, setDefaultOrderType] = useState<OrderType>('LIMIT')

  // Laden & Speichern in LocalStorage
  useEffect(() => {
    const savedExchange = localStorage.getItem('rm_default_exchange') as ExchangeId
    const savedOrderType = localStorage.getItem('rm_default_order_type') as OrderType
    if (savedExchange && EXCHANGES[savedExchange]) setDefaultExchange(savedExchange)
    if (savedOrderType) setDefaultOrderType(savedOrderType)
  }, [])

  const updateExchange = (ex: ExchangeId) => {
    setDefaultExchange(ex)
    localStorage.setItem('rm_default_exchange', ex)
  }

  const updateOrderType = (type: OrderType) => {
    setDefaultOrderType(type)
    localStorage.setItem('rm_default_order_type', type)
  }

  const getFeeForType = (type: OrderType, exchange: ExchangeId = defaultExchange) => {
    const config = EXCHANGES[exchange] || EXCHANGES.bybit
    return type === 'LIMIT' ? config.makerFee : config.takerFee
  }

  const activeFee = getFeeForType(defaultOrderType, defaultExchange)

  return (
    <UserPreferencesContext.Provider
      value={{
        defaultExchange,
        setDefaultExchange: updateExchange,
        defaultOrderType,
        setDefaultOrderType: updateOrderType,
        activeFee,
        getFeeForType,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  )
}

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext)
  if (!context) {
    throw new Error('useUserPreferences muss innerhalb eines UserPreferencesProviders verwendet werden')
  }
  return context
}