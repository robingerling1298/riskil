'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  ChevronDown,
  Search,
  Check,
  Calculator,
  Crown,
  Layers,
  PlusCircle,
  Settings
} from 'lucide-react'
import { TradeData } from '@/components/LogTradeModal'
import { useAuth } from '@/context/AuthContext'
import { useUserPreferences, EXCHANGES, ExchangeId } from '@/context/UserPreferencesContext'
import { supabase } from '@/lib/supabase/client'

interface EntryTranche {
  id: string
  price: string
  margin: string
  orderType: 'LIMIT' | 'MARKET'
}

interface AssetOption {
  symbol: string
  name: string
  iconColor: string
}

const POPULAR_ASSETS: AssetOption[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', iconColor: 'bg-amber-500' },
  { symbol: 'ETHUSDT', name: 'Ethereum', iconColor: 'bg-indigo-500' },
  { symbol: 'SOLUSDT', name: 'Solana', iconColor: 'bg-purple-500' },
  { symbol: 'XRPUSDT', name: 'Ripple', iconColor: 'bg-blue-400' },
  { symbol: 'BNBUSDT', name: 'Binance Coin', iconColor: 'bg-yellow-500' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', iconColor: 'bg-yellow-600' },
  { symbol: 'AVAXUSDT', name: 'Avalanche', iconColor: 'bg-red-500' },
]

interface LeverageCalculatorProps {
  onOpenPaywall?: () => void
  onLogTrade?: (data: TradeData) => void
}

export default function LeverageCalculator({ 
  onOpenPaywall,
  onLogTrade
}: LeverageCalculatorProps) {
  // Global Contexts
  const { isPro } = useAuth()
  const { defaultExchange } = useUserPreferences()

  // Exchange State
  const [selectedExchange, setSelectedExchange] = useState<ExchangeId | 'custom'>(
    defaultExchange || 'bitget'
  )

  // Direct Supabase Fetch for selected_exchange
  useEffect(() => {
    async function loadUserExchange() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: settings } = await supabase
          .from('user_settings')
          .select('selected_exchange')
          .eq('user_id', user.id)
          .maybeSingle()

        if (settings?.selected_exchange) {
          setSelectedExchange(settings.selected_exchange as ExchangeId)
        }
      } catch (err) {
        console.error('Fehler beim Laden der Börsen-Einstellung aus Supabase:', err)
      }
    }

    loadUserExchange()
  }, [])

  useEffect(() => {
    if (defaultExchange) {
      setSelectedExchange(defaultExchange)
    }
  }, [defaultExchange])

  // Asset & Live Prices
  const [selectedAsset, setSelectedAsset] = useState<AssetOption>(POPULAR_ASSETS[0])
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null)

  // Dropdown UI State
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Direction
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('SHORT')

  // Tranchen State
  const [tranches, setTranches] = useState<EntryTranche[]>([
    { id: '1', price: '', margin: '', orderType: 'LIMIT' },
  ])

  // Stop Loss & Risk Mode
  const [stopLoss, setStopLoss] = useState<string>('')
  const [riskMode, setRiskMode] = useState<'PERCENT' | 'USD'>('PERCENT')
  const [allowedMarginLossPercent, setAllowedMarginLossPercent] = useState<string>('')
  const [allowedMarginLossUsd, setAllowedMarginLossUsd] = useState<string>('')

  const isLong = direction === 'LONG'
  const isCustom = selectedAsset.symbol === 'CUSTOM / EINFACH'
  const assetBaseSymbol = isCustom ? '' : selectedAsset.symbol.replace('USDT', '')

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchLivePrice = async (symbol: string) => {
    if (symbol === 'CUSTOM / EINFACH') {
      setCurrentPrice(null)
      setPriceChange24h(null)
      return
    }

    try {
      const res = await fetch(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${symbol}`)
      const data = await res.json()
      if (data.result?.list?.[0]) {
        const item = data.result.list[0]
        setCurrentPrice(parseFloat(item.lastPrice))
        if (item.price24hPcnt) {
          setPriceChange24h(parseFloat(item.price24hPcnt) * 100)
        }
      }
    } catch (err) {
      console.error('Fehler beim Laden des Kurses:', err)
    }
  }

  useEffect(() => {
    fetchLivePrice(selectedAsset.symbol)
    if (selectedAsset.symbol === 'CUSTOM / EINFACH') return
    const interval = setInterval(() => {
      fetchLivePrice(selectedAsset.symbol)
    }, 2000)
    return () => clearInterval(interval)
  }, [selectedAsset])

  const validTranches = tranches.filter(t => (parseFloat(t.price) || 0) > 0 && (parseFloat(t.margin) || 0) > 0)
  const activeMargin = validTranches.reduce((sum, t) => sum + parseFloat(t.margin), 0)
  const avgEntryPrice = activeMargin > 0
    ? validTranches.reduce((sum, t) => sum + (parseFloat(t.price) * parseFloat(t.margin)), 0) / activeMargin
    : 0

  const totalMargin = tranches.reduce((sum, t) => sum + (parseFloat(t.margin) || 0), 0)

  const handleAddTranche = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    if (!isPro && tranches.length >= 2) {
      if (onOpenPaywall) onOpenPaywall()
      return
    }
    const newTranche: EntryTranche = {
      id: Date.now().toString(),
      price: '',
      margin: '',
      orderType: 'LIMIT'
    }
    setTranches(prev => [...prev, newTranche])
  }

  const handleRemoveTranche = (id: string) => {
    if (tranches.length <= 1) return
    setTranches(prev => prev.filter(t => t.id !== id))
  }

  const handleTrancheChange = (id: string, field: keyof EntryTranche, value: string) => {
    setTranches(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  const handleUseCurrentPrice = () => {
    if (currentPrice) {
      setTranches(prev => prev.map((t, idx) => idx === 0 ? { ...t, price: currentPrice.toString() } : t))
    }
  }

  const handleQuickSl = (percentOffset: number) => {
    const basePrice = avgEntryPrice > 0 
      ? avgEntryPrice 
      : (parseFloat(tranches[0]?.price) || currentPrice || 0)
    if (!basePrice) return
    const factor = isLong ? (1 - percentOffset / 100) : (1 + percentOffset / 100)
    const sl = basePrice * factor
    setStopLoss(sl.toFixed(2))
  }

  const numStopLoss = parseFloat(stopLoss) || 0
  const numPercent = parseFloat(allowedMarginLossPercent) || 0
  const numUsd = parseFloat(allowedMarginLossUsd) || 0

  const handlePercentChange = (valStr: string) => {
    setAllowedMarginLossPercent(valStr)
    const val = parseFloat(valStr)
    if (!isNaN(val) && totalMargin > 0) {
      setAllowedMarginLossUsd(((totalMargin * val) / 100).toString())
    } else if (valStr === '') {
      setAllowedMarginLossUsd('')
    }
  }

  const handleUsdChange = (valStr: string) => {
    setAllowedMarginLossUsd(valStr)
    const val = parseFloat(valStr)
    if (!isNaN(val) && totalMargin > 0) {
      setAllowedMarginLossPercent(((val / totalMargin) * 100).toString())
    } else if (valStr === '') {
      setAllowedMarginLossPercent('')
    }
  }

  // Fee Logic
  const currentExchangeConfig = selectedExchange !== 'custom' ? EXCHANGES[selectedExchange] : null
  const makerRate = currentExchangeConfig?.makerFee ?? 0.02
  const takerRate = currentExchangeConfig?.takerFee ?? 0.06

  // Blended Entry Fee basierend auf den Margin-Anteilen der Tranchen
  const blendedEntryFeeRatePct = activeMargin > 0
    ? validTranches.reduce((sum, t) => sum + (parseFloat(t.margin) * (t.orderType === 'LIMIT' ? makerRate : takerRate)), 0) / activeMargin
    : makerRate

  // SL ist standardmäßig eine Market-Order
  const slFeeRatePct = takerRate 
  const totalFeeRateRoundtripPct = blendedEntryFeeRatePct + slFeeRatePct
  const totalFeeRateDecimal = totalFeeRateRoundtripPct / 100

  const effectiveLossPercent = riskMode === 'PERCENT' ? numPercent : (totalMargin > 0 ? (numUsd / totalMargin) * 100 : 0)

  const isValidSetup = avgEntryPrice > 0 && totalMargin > 0 && numStopLoss > 0 && (
    isLong ? numStopLoss < avgEntryPrice : numStopLoss > avgEntryPrice
  )

  const priceDiffAbs = Math.abs(avgEntryPrice - numStopLoss)
  const rawSlDistancePercent = avgEntryPrice > 0 ? (priceDiffAbs / avgEntryPrice) * 100 : 0

  const totalRiskPctWithFees = rawSlDistancePercent + totalFeeRateRoundtripPct

  const calculatedLeverage = (isValidSetup && totalRiskPctWithFees > 0 && effectiveLossPercent > 0)
    ? effectiveLossPercent / totalRiskPctWithFees
    : 0

  const maxLossUsd = riskMode === 'PERCENT' ? (totalMargin * numPercent) / 100 : numUsd
  const totalPositionSizeUsd = totalMargin * calculatedLeverage
  const totalPositionUnits = avgEntryPrice > 0 ? totalPositionSizeUsd / avgEntryPrice : 0

  const estimatedFeesUsd = totalPositionSizeUsd * totalFeeRateDecimal

  const filteredAssets = POPULAR_ASSETS.filter(a => 
    a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="bg-term-bg border border-term-border rounded-3xl p-5 md:p-7 shadow-2xl space-y-6 text-slate-100 font-sans">
      
      {/* HEADER */}
      <div className="bg-term-card border border-term-border p-4 rounded-2xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative inline-block" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className="flex items-center gap-2.5 bg-term-bg hover:bg-term-hover border border-term-border text-white px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer"
            >
              <div className={`w-2.5 h-2.5 rounded-full ${selectedAsset.iconColor}`} />
              <span className="font-bold text-xs tracking-wide">{selectedAsset.symbol}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-term-bg border border-term-border rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="p-2.5 border-b border-term-border flex items-center gap-2 bg-term-card">
                  <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none font-mono"
                    autoFocus
                  />
                </div>

                <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAsset({ symbol: 'CUSTOM / EINFACH', name: 'Manuelle Berechnung', iconColor: 'bg-slate-400' })
                      setIsDropdownOpen(false)
                      setSearchQuery('')
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                      selectedAsset.symbol === 'CUSTOM / EINFACH' ? 'bg-brand-muted text-brand font-bold' : 'text-slate-300 hover:bg-term-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Calculator className="w-3.5 h-3.5 text-brand" />
                      <div className="text-left">
                        <div className="font-bold">Einfache Berechnung</div>
                        <div className="text-[10px] text-slate-500 font-mono">Ohne Live-API</div>
                      </div>
                    </div>
                    {selectedAsset.symbol === 'CUSTOM / EINFACH' && <Check className="w-3.5 h-3.5 text-brand" />}
                  </button>

                  {filteredAssets.map((asset) => {
                    const isSelected = asset.symbol === selectedAsset.symbol
                    return (
                      <button
                        key={asset.symbol}
                        type="button"
                        onClick={() => {
                          setSelectedAsset(asset)
                          setIsDropdownOpen(false)
                          setSearchQuery('')
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                          isSelected ? 'bg-brand-muted text-brand font-bold' : 'text-slate-300 hover:bg-term-hover hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${asset.iconColor}`} />
                          <div className="text-left">
                            <div className="font-bold">{asset.symbol}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{asset.name}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 bg-term-bg border border-term-border px-3.5 py-2.5 rounded-xl font-mono text-xs shadow-inner">
            <div className="relative flex h-2 w-2 items-center justify-center">
              {!isCustom && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isCustom ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
            </div>
            <span className="text-slate-500 font-medium">Live:</span>
            <span className="font-bold text-white">
              {currentPrice ? `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Manuell'}
            </span>
            {priceChange24h !== null && !isCustom && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${priceChange24h >= 0 ? 'text-[#089981] bg-[#089981]/10' : 'text-[#F23645] bg-[#F23645]/10'}`}>
                {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 bg-term-bg border border-term-border text-slate-300 px-3 py-2.5 rounded-xl text-xs font-mono">
            <Settings className="w-3.5 h-3.5 text-brand" />
            <span className="font-bold text-white">
              {selectedExchange === 'custom' ? 'Custom' : currentExchangeConfig?.name}
            </span>
          </div>
        </div>

        <div className="flex p-1 bg-term-bg border border-term-border rounded-xl self-start md:self-auto">
          <button
            type="button"
            onClick={() => setDirection('LONG')}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              isLong ? 'bg-[#089981] text-white shadow-[0_0_12px_rgba(8,153,129,0.4)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" /> LONG
          </button>
          <button
            type="button"
            onClick={() => setDirection('SHORT')}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              !isLong ? 'bg-[#F23645] text-white shadow-[0_0_12px_rgba(242,54,69,0.4)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" /> SHORT
          </button>
        </div>
      </div>

      {/* EINSTIEGS-TRANCHEN */}
      <div className="bg-term-card border border-term-border p-5 rounded-2xl space-y-4">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand" />
            <span>EINSTIEGS-TRANCHEN ({tranches.length}{!isPro ? '/2' : ''})</span>
          </div>
          {currentPrice && (
            <button
              type="button"
              onClick={handleUseCurrentPrice}
              className="text-[11px] font-mono text-brand hover:underline transition cursor-pointer"
            >
              Live-Kurs (${currentPrice.toFixed(2)}) als Entry 1 übernehmen
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {tranches.map((tranche, idx) => (
            <div key={tranche.id} className="grid grid-cols-12 gap-3 bg-term-bg border border-term-border p-3.5 rounded-xl items-center hover:border-slate-700 transition">
              <div className="col-span-12 sm:col-span-2 text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand" />
                Entry #{idx + 1}
              </div>

              <div className="col-span-6 sm:col-span-3 relative">
                <input
                  type="number"
                  placeholder={`${idx + 1}. Einstieg`}
                  value={tranche.price}
                  onChange={(e) => handleTrancheChange(tranche.id, 'price', e.target.value)}
                  className="w-full bg-term-card border border-term-border focus:border-brand rounded-xl py-2 px-3 pr-8 text-xs font-mono font-bold text-white placeholder-slate-600 outline-none transition"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">$</span>
              </div>

              <div className="col-span-6 sm:col-span-3 relative">
                <input
                  type="number"
                  placeholder="Marge"
                  value={tranche.margin}
                  onChange={(e) => handleTrancheChange(tranche.id, 'margin', e.target.value)}
                  className="w-full bg-term-card border border-term-border focus:border-brand rounded-xl py-2 px-3 pr-8 text-xs font-mono font-bold text-white placeholder-slate-600 outline-none transition"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">$</span>
              </div>

              <div className="col-span-10 sm:col-span-3 flex p-1 bg-term-card border border-term-border rounded-xl">
                <button
                  type="button"
                  onClick={() => handleTrancheChange(tranche.id, 'orderType', 'LIMIT')}
                  className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition cursor-pointer ${
                    tranche.orderType === 'LIMIT' ? 'bg-brand text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Limit
                </button>
                <button
                  type="button"
                  onClick={() => handleTrancheChange(tranche.id, 'orderType', 'MARKET')}
                  className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition cursor-pointer ${
                    tranche.orderType === 'MARKET' ? 'bg-brand text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Market
                </button>
              </div>

              <div className="col-span-2 sm:col-span-1 flex justify-end">
                {tranches.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTranche(tranche.id)}
                    className="p-2 text-slate-500 hover:text-[#F23645] hover:bg-[#F23645]/10 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {isPro || tranches.length < 2 ? (
          <button
            type="button"
            onClick={handleAddTranche}
            className="w-full py-3.5 border border-brand-border bg-brand-muted hover:bg-brand/20 text-brand hover:text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition duration-200 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 text-brand" />
            <span>Weiteren Entry hinzufügen</span>
          </button>
        ) : (
          <div className="p-4 bg-term-bg border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  Free-Limit erreicht (2 Einstiegs-Tranchen)
                  <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Schalte unbegrenzte DCA-Entrys mit PRO frei.
                </div>
              </div>
            </div>
            <button 
              type="button" 
              onClick={onOpenPaywall}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 fill-slate-950" />
              PRO Freischalten
            </button>
          </div>
        )}
      </div>

      {/* STOP LOSS & RISIKO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-term-card border border-term-border p-5 rounded-2xl">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-[#F23645] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F23645]" />
              Stop Loss Preis
            </label>
            <div className="flex gap-1">
              {[1, 2, 5].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickSl(pct)}
                  className="px-2 py-0.5 bg-term-bg border border-term-border hover:border-[#F23645] rounded-md text-[10px] font-mono text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {pct}% SL
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <input
              type="number"
              placeholder="Stop Loss Preis"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="w-full bg-term-bg border border-[#F23645]/40 focus:border-[#F23645] rounded-xl py-2.5 px-3 pr-8 text-sm font-mono font-bold text-white placeholder-slate-600 outline-none transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">$</span>
          </div>

          <span className="text-[10px] text-slate-500 font-mono block">
            Preisabstand: <span className="text-slate-300 font-bold">{rawSlDistancePercent > 0 ? `${rawSlDistancePercent.toFixed(2)}%` : '-'}</span>
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-300">Max. Margen-Verlust</label>
            <div className="flex bg-term-bg p-0.5 rounded-lg border border-term-border text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setRiskMode('PERCENT')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${riskMode === 'PERCENT' ? 'bg-brand text-black font-extrabold' : 'text-slate-400 hover:text-white'}`}
              >
                % von Marge
              </button>
              <button
                type="button"
                onClick={() => setRiskMode('USD')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${riskMode === 'USD' ? 'bg-brand text-black font-extrabold' : 'text-slate-400 hover:text-white'}`}
              >
                $ Betrag
              </button>
            </div>
          </div>

          {riskMode === 'PERCENT' ? (
            <div className="relative">
              <input
                type="number"
                placeholder="Max. Loss in %"
                value={allowedMarginLossPercent}
                onChange={(e) => handlePercentChange(e.target.value)}
                className="w-full bg-term-bg border border-term-border focus:border-brand rounded-xl py-2.5 px-3 pr-8 text-sm font-mono font-bold text-white placeholder-slate-600 outline-none transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">%</span>
            </div>
          ) : (
            <div className="relative">
              <input
                type="number"
                placeholder="Max. Loss in $"
                value={allowedMarginLossUsd}
                onChange={(e) => handleUsdChange(e.target.value)}
                className="w-full bg-term-bg border border-term-border focus:border-brand rounded-xl py-2.5 px-3 pr-8 text-sm font-mono font-bold text-white placeholder-slate-600 outline-none transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">$</span>
            </div>
          )}

          <span className="text-[10px] text-slate-500 font-mono block">
            {riskMode === 'PERCENT'
              ? (totalMargin > 0 && numPercent > 0 ? `≈ $${maxLossUsd.toFixed(2)} von $${totalMargin.toFixed(2)} Marge` : '-')
              : (totalMargin > 0 && numUsd > 0 ? `≈ ${((numUsd / totalMargin) * 100).toFixed(1)}% der Marge` : '-')}
          </span>
        </div>
      </div>

      {numStopLoss > 0 && avgEntryPrice > 0 && !isValidSetup && (
        <div className="flex items-center gap-2.5 text-xs text-[#F23645] bg-[#F23645]/10 border border-[#F23645]/30 p-4 rounded-2xl shadow-lg">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>Ungültiges Setup: Stop Loss muss bei {isLong ? 'Long UNTER' : 'Short ÜBER'} dem Mischkurs (${avgEntryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}) liegen.</span>
        </div>
      )}

      {/* RESULTS CONTAINER */}
      <div className="bg-term-card border border-brand-border rounded-2xl p-6 space-y-4 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-center border-b border-term-border pb-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand" />
            Ergebnis & Parameter ({selectedAsset.symbol})
          </div>
          
          {isPro && (
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1 font-bold">
              <Crown className="w-3 h-3 fill-amber-400" /> PRO UNLOCKED
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1 transition-all duration-300">
          <div className="bg-term-bg border border-term-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Mischkurs (Avg Entry)</span>
            <p className="text-xl font-mono font-bold text-white">
              {avgEntryPrice > 0 ? `$${avgEntryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
            </p>
            <p className="text-[10px] font-mono text-slate-500">Exakter Durchschnitt</p>
          </div>

          <div className="bg-term-bg border border-brand-border p-4 rounded-xl space-y-1 relative overflow-hidden">
            <span className="text-[11px] text-brand font-medium">Optimaler Hebel</span>
            <p className="text-2xl font-mono font-extrabold text-brand">
              {isValidSetup && calculatedLeverage > 0 ? `${calculatedLeverage.toFixed(2)}x` : '-'}
            </p>
            <p className="text-[10px] font-mono text-slate-500">Inkl. Börsengebühren</p>
          </div>

          <div className="bg-term-bg border border-term-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Gesamt-Marge</span>
            <p className="text-xl font-mono font-bold text-brand">
              {totalMargin > 0 ? `$${totalMargin.toFixed(2)}` : '-'}
            </p>
            <p className="text-[10px] font-mono text-slate-500">
              Max. Loss: <span className="text-[#F23645] font-bold">{maxLossUsd > 0 ? `-$${maxLossUsd.toFixed(2)}` : '-'}</span>
            </p>
          </div>

          <div className="bg-term-bg border border-term-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Positionswert (Notional)</span>
            <p className="text-xl font-mono font-bold text-slate-200">
              {isValidSetup && totalPositionSizeUsd > 0 ? `$${totalPositionSizeUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
            </p>
            <p className="text-[10px] font-mono text-slate-500">
              {!isCustom && isValidSetup && totalPositionUnits > 0 ? `≈ ${totalPositionUnits.toFixed(4)} ${assetBaseSymbol}` : '-'}
            </p>
          </div>
        </div>

        {isValidSetup && totalPositionSizeUsd > 0 && (
          <div className="bg-term-bg/60 border border-term-border p-3 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs font-mono gap-2">
            <span className="text-slate-400">Geschätzte Börsengebühren (Entry + SL):</span>
            <span className="text-amber-400 font-semibold">
              -${estimatedFeesUsd.toFixed(2)} ({totalFeeRateRoundtripPct.toFixed(3)}% vom Positionswert)
            </span>
          </div>
        )}

        {avgEntryPrice > 0 && onLogTrade && (
          <button
            type="button"
            onClick={() =>
              onLogTrade({
                pair: selectedAsset.symbol === 'CUSTOM / EINFACH' ? 'BTC/USDT' : selectedAsset.symbol,
                direction,
                entryPrice: Number(avgEntryPrice.toFixed(2)),
                leverage: Number(calculatedLeverage.toFixed(2)) || 1,
                margin: Number(totalMargin.toFixed(2)),
                stopLoss: numStopLoss > 0 ? numStopLoss : undefined,
              })
            }
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-black font-extrabold py-3.5 px-4 rounded-xl text-xs transition-all shadow-lg shadow-brand/20 mt-4 cursor-pointer"
          >
            <PlusCircle size={16} strokeWidth={2.5} />
            <span>Trade zum Journal hinzufügen</span>
          </button>
        )}
      </div>

    </div>
  )
}