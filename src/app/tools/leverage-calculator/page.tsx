'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { toPng } from 'html-to-image'
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
  Layers,
  Settings,
  ArrowRight,
  Sliders,
  X,
  Zap,
  ShieldCheck,
  Download,
  FileImage
} from 'lucide-react'

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

interface ExchangePreset {
  id: string
  name: string
  makerFee: number
  takerFee: number
}

const EXCHANGES: ExchangePreset[] = [
  { id: 'bitget', name: 'Bitget', makerFee: 0.02, takerFee: 0.06 },
  { id: 'bybit', name: 'Bybit', makerFee: 0.02, takerFee: 0.055 },
  { id: 'bitunix', name: 'Bitunix', makerFee: 0.02, takerFee: 0.06 },
  { id: 'binance', name: 'Binance', makerFee: 0.02, takerFee: 0.05 },
  { id: 'okx', name: 'OKX', makerFee: 0.02, takerFee: 0.05 },
  { id: 'custom', name: 'Custom Fees', makerFee: 0.02, takerFee: 0.06 }
]

const POPULAR_ASSETS: AssetOption[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', iconColor: 'bg-amber-500' },
  { symbol: 'ETHUSDT', name: 'Ethereum', iconColor: 'bg-indigo-500' },
  { symbol: 'SOLUSDT', name: 'Solana', iconColor: 'bg-purple-500' },
  { symbol: 'XRPUSDT', name: 'Ripple', iconColor: 'bg-blue-400' },
  { symbol: 'BNBUSDT', name: 'Binance Coin', iconColor: 'bg-yellow-500' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', iconColor: 'bg-yellow-600' },
  { symbol: 'AVAXUSDT', name: 'Avalanche', iconColor: 'bg-red-500' },
]

export default function FreeLeverageCalculator() {
  const [selectedExchangeId, setSelectedExchangeId] = useState<string>('bitget')
  const [customFees, setCustomFees] = useState<{ maker: number; taker: number }>({ maker: 0.02, taker: 0.06 })
  const [isCustomFeeModalOpen, setIsCustomFeeModalOpen] = useState<boolean>(false)
  const [tempMakerFee, setTempMakerFee] = useState<string>('0.02')
  const [tempTakerFee, setTempTakerFee] = useState<string>('0.06')

  const [selectedAsset, setSelectedAsset] = useState<AssetOption>(POPULAR_ASSETS[0])
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null)

  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState<boolean>(false)
  const [isExchangeDropdownOpen, setIsExchangeDropdownOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')

  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const assetDropdownRef = useRef<HTMLDivElement>(null)
  const exchangeDropdownRef = useRef<HTMLDivElement>(null)

  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG')

  const [tranches, setTranches] = useState<EntryTranche[]>([
    { id: '1', price: '', margin: '', orderType: 'LIMIT' },
  ])

  const [stopLoss, setStopLoss] = useState<string>('')
  const [riskMode, setRiskMode] = useState<'PERCENT' | 'USD'>('PERCENT')
  const [allowedMarginLossPercent, setAllowedMarginLossPercent] = useState<string>('')
  const [allowedMarginLossUsd, setAllowedMarginLossUsd] = useState<string>('')

  const isLong = direction === 'LONG'
  const isCustomAsset = selectedAsset.symbol === 'CUSTOM / EINFACH'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assetDropdownRef.current && !assetDropdownRef.current.contains(event.target as Node)) {
        setIsAssetDropdownOpen(false)
      }
      if (exchangeDropdownRef.current && !exchangeDropdownRef.current.contains(event.target as Node)) {
        setIsExchangeDropdownOpen(false)
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
    } catch {
      // Fallback
    }
  }

  useEffect(() => {
    fetchLivePrice(selectedAsset.symbol)
    if (selectedAsset.symbol === 'CUSTOM / EINFACH') return
    const interval = setInterval(() => {
      fetchLivePrice(selectedAsset.symbol)
    }, 3000)
    return () => clearInterval(interval)
  }, [selectedAsset])

  const validTranches = tranches.filter(t => (parseFloat(t.price) || 0) > 0 && (parseFloat(t.margin) || 0) > 0)
  const activeMargin = validTranches.reduce((sum, t) => sum + parseFloat(t.margin), 0)
  const avgEntryPrice = activeMargin > 0
    ? validTranches.reduce((sum, t) => sum + (parseFloat(t.price) * parseFloat(t.margin)), 0) / activeMargin
    : 0

  const totalMargin = tranches.reduce((sum, t) => sum + (parseFloat(t.margin) || 0), 0)

  const handleAddTranche = () => {
    setTranches(prev => [
      ...prev,
      { id: Date.now().toString(), price: '', margin: '', orderType: 'LIMIT' }
    ])
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

  const currentExchangeConfig = EXCHANGES.find(e => e.id === selectedExchangeId) || EXCHANGES[0]
  const makerRate = selectedExchangeId === 'custom' ? customFees.maker : currentExchangeConfig.makerFee
  const takerRate = selectedExchangeId === 'custom' ? customFees.taker : currentExchangeConfig.takerFee

  const blendedEntryFeeRatePct = activeMargin > 0
    ? validTranches.reduce((sum, t) => sum + (parseFloat(t.margin) * (t.orderType === 'LIMIT' ? makerRate : takerRate)), 0) / activeMargin
    : makerRate

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

  const rawLeverage = (isValidSetup && totalRiskPctWithFees > 0 && effectiveLossPercent > 0)
    ? effectiveLossPercent / totalRiskPctWithFees
    : 0

  const calculatedLeverage = Math.floor(rawLeverage)

  const maxLossUsd = riskMode === 'PERCENT' ? (totalMargin * numPercent) / 100 : numUsd
  const totalPositionSizeUsd = totalMargin * calculatedLeverage
  const estimatedFeesUsd = totalPositionSizeUsd * totalFeeRateDecimal

  const filteredAssets = POPULAR_ASSETS.filter(a => 
    a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderExchangeIcon = (id: string) => {
    switch (id) {
      case 'bitget':
        return (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#03AAC1" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        )
      case 'bybit':
        return (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="#F7A600" fillOpacity="0.15" />
            <path d="M7 7H12C13.6569 7 15 8.34315 15 10C15 10.9 14.5 11.7 13.8 12.2C14.8 12.7 15.5 13.7 15.5 15C15.5 16.6569 14.1569 18 12.5 18H7V7ZM9.5 9.2V11.3H11.8C12.4 11.3 12.9 10.8 12.9 10.25C12.9 9.7 12.4 9.2 11.8 9.2H9.5ZM9.5 13.5V15.8H12.3C12.95 15.8 13.45 15.3 13.45 14.65C13.45 14 12.95 13.5 12.3 13.5H9.5Z" fill="#F7A600" />
          </svg>
        )
      case 'bitunix':
        return (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="#3B82F6" fillOpacity="0.15" />
            <path d="M7 7H11.5L14 12L11.5 17H7L9.5 12L7 7Z" fill="#3B82F6" />
            <path d="M12.5 7H17L14.5 12L17 17H12.5L10 12L12.5 7Z" fill="#60A5FA" />
          </svg>
        )
      case 'binance':
        return (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="#F0B90B" fillOpacity="0.15" />
            <path d="M12 7L14.5 9.5L12 12L9.5 9.5L12 7ZM16.5 11.5L19 14L16.5 16.5L14 14L16.5 11.5ZM7.5 11.5L10 14L7.5 16.5L5 14L7.5 11.5ZM12 16L14.5 18.5L12 21L9.5 18.5L12 16ZM12 13.2L13.8 15L12 16.8L10.2 15L12 13.2Z" fill="#F0B90B" />
          </svg>
        )
      case 'okx':
        return (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="white" fillOpacity="0.15" />
            <rect x="6.5" y="6.5" width="4" height="4" fill="white" />
            <rect x="13.5" y="6.5" width="4" height="4" fill="white" />
            <rect x="10" y="10" width="4" height="4" fill="white" />
            <rect x="6.5" y="13.5" width="4" height="4" fill="white" />
            <rect x="13.5" y="13.5" width="4" height="4" fill="white" />
          </svg>
        )
      default:
        return <Sliders className="w-3.5 h-3.5 text-brand shrink-0" />
    }
  }

  const handleSaveCustomFees = (e: React.FormEvent) => {
    e.preventDefault()
    const m = parseFloat(tempMakerFee) || 0.02
    const t = parseFloat(tempTakerFee) || 0.06
    setCustomFees({ maker: m, taker: t })
    setSelectedExchangeId('custom')
    setIsCustomFeeModalOpen(false)
  }

  const handleDownloadTradeCard = async () => {
    if (!cardRef.current) return
    setIsExporting(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: '#0a0d14'
      })
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile) {
        setPreviewImage(dataUrl)
      } else {
        const link = document.createElement('a')
        link.download = `RISKIL_${selectedAsset.symbol}_${direction}_Setup.png`
        link.href = dataUrl
        link.click()
      }
    } catch (err) {
      console.error('Fehler beim Exportieren der Trade-Karte:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 text-slate-100 font-sans pb-20">
      
      {/* ================= HERO SECTION ================= */}
      <div className="text-center space-y-4 pt-10 pb-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-muted border border-brand-border text-brand text-xs font-mono font-semibold tracking-wide">
          <Zap className="w-3.5 h-3.5" />
          Krypto Perps Position & Leverage Tool
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Hebel & Positionsgröße <br className="hidden sm:inline" /> exakt berechnen.
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
          Berechne deinen idealen Hebel, Mischkurse über mehrere Tranchen und exportiere deine fertige Setup-Karte direkt als Bild.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400 font-mono pt-2">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Client-Side
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Ohne Registrierung
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Image Export Ready
          </span>
        </div>
      </div>

      {/* ================= CALCULATOR WRAPPER ================= */}
      <div className="space-y-5 sm:space-y-6">

        {/* HEADER CONTROLS */}
        <div className="bg-term-card border border-term-border p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shadow-xl">
          
          {/* ASSET & TICKER */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative inline-block" ref={assetDropdownRef}>
              <button
                type="button"
                onClick={() => setIsAssetDropdownOpen(prev => !prev)}
                className="flex items-center gap-2.5 bg-term-bg hover:bg-term-hover border border-term-border text-white px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
              >
                <div className={`w-2.5 h-2.5 rounded-full ${selectedAsset.iconColor}`} />
                <span className="font-bold text-xs tracking-wider">{selectedAsset.symbol}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isAssetDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAssetDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-term-bg border border-term-border rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-2.5 border-b border-term-border flex items-center gap-2 bg-term-card">
                    <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <input
                      type="text"
                      placeholder="Asset suchen..."
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
                        setSelectedAsset({ symbol: 'CUSTOM / EINFACH', name: 'Manuelle Eingabe', iconColor: 'bg-slate-400' })
                        setIsAssetDropdownOpen(false)
                        setSearchQuery('')
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                        selectedAsset.symbol === 'CUSTOM / EINFACH' ? 'bg-brand-muted text-brand font-bold' : 'text-slate-300 hover:bg-term-hover'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Calculator className="w-3.5 h-3.5 text-brand" />
                        <div className="text-left">
                          <div className="font-bold">Manuelle Eingabe</div>
                          <div className="text-[10px] text-slate-500 font-mono">Ohne API</div>
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
                            setIsAssetDropdownOpen(false)
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
              <span className="relative flex h-2 w-2 items-center justify-center">
                {!isCustomAsset && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isCustomAsset ? 'bg-slate-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span className="text-slate-500 font-medium">Index:</span>
              <span className="font-bold text-white">
                {currentPrice ? `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Manuell'}
              </span>
              {priceChange24h !== null && !isCustomAsset && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${priceChange24h >= 0 ? 'text-[#089981] bg-[#089981]/10' : 'text-[#F23645] bg-[#F23645]/10'}`}>
                  {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                </span>
              )}
            </div>
          </div>

          {/* BÖRSE & DIRECTION */}
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="relative inline-block" ref={exchangeDropdownRef}>
              <button
                type="button"
                onClick={() => setIsExchangeDropdownOpen(prev => !prev)}
                className="flex items-center gap-2 bg-term-bg hover:bg-term-hover border border-term-border text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-mono transition cursor-pointer shadow-sm"
              >
                {renderExchangeIcon(selectedExchangeId)}
                <span className="font-bold text-white">
                  {selectedExchangeId === 'custom' ? 'Custom Fees' : currentExchangeConfig.name}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  ({takerRate}%)
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {isExchangeDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-60 bg-term-bg border border-term-border rounded-2xl shadow-2xl z-50 p-1.5 space-y-1">
                  {EXCHANGES.map(ex => {
                    const isSelected = selectedExchangeId === ex.id
                    return (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => {
                          if (ex.id === 'custom') {
                            setTempMakerFee(customFees.maker.toString())
                            setTempTakerFee(customFees.taker.toString())
                            setIsCustomFeeModalOpen(true)
                          } else {
                            setSelectedExchangeId(ex.id)
                          }
                          setIsExchangeDropdownOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono transition cursor-pointer ${
                          isSelected ? 'bg-brand-muted text-brand font-bold' : 'text-slate-300 hover:bg-term-hover hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {renderExchangeIcon(ex.id)}
                          <span className="font-semibold">{ex.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <span>{ex.id === 'custom' ? `${customFees.taker}%` : `${ex.takerFee}%`}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand" />}
                        </div>
                      </button>
                    )
                  })}

                  <div className="pt-1 border-t border-term-border">
                    <button
                      type="button"
                      onClick={() => {
                        setTempMakerFee(customFees.maker.toString())
                        setTempTakerFee(customFees.taker.toString())
                        setIsCustomFeeModalOpen(true)
                        setIsExchangeDropdownOpen(false)
                      }}
                      className="w-full text-left px-3 py-2 text-[11px] text-brand hover:underline font-mono flex items-center gap-1.5 cursor-pointer"
                    >
                      <Settings className="w-3 h-3" /> Eigene Fees einstellen...
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1 p-1 bg-term-bg border border-term-border rounded-xl">
              <button
                type="button"
                onClick={() => setDirection('LONG')}
                className={`min-h-[38px] flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isLong ? 'bg-[#089981] text-white shadow-[0_0_12px_rgba(8,153,129,0.4)]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" /> LONG
              </button>
              <button
                type="button"
                onClick={() => setDirection('SHORT')}
                className={`min-h-[38px] flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  !isLong ? 'bg-[#F23645] text-white shadow-[0_0_12px_rgba(242,54,69,0.4)]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" /> SHORT
              </button>
            </div>
          </div>

        </div>

        {/* ENTRY TRANCHEN */}
        <div className="bg-term-card border border-term-border p-4 sm:p-5 rounded-2xl space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-slate-400">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand" />
              <span>EINSTIEGS-TRANCHEN (DCA)</span>
            </div>
            {currentPrice && (
              <button
                type="button"
                onClick={handleUseCurrentPrice}
                className="text-[11px] font-mono text-brand hover:underline transition cursor-pointer text-left sm:text-right"
              >
                Live-Kurs (${currentPrice.toFixed(2)}) als Entry 1 übernehmen
              </button>
            )}
          </div>

          <div className="space-y-3">
            {tranches.map((tranche, idx) => (
              <div key={tranche.id} className="bg-term-bg border border-term-border p-3.5 rounded-xl space-y-3 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3 items-center hover:border-slate-700 transition">
                <div className="flex items-center justify-between sm:col-span-2 text-xs font-mono font-bold text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand" />
                    Entry #{idx + 1}
                  </div>
                  {tranches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTranche(tranche.id)}
                      className="sm:hidden p-1.5 text-slate-500 hover:text-[#F23645] hover:bg-[#F23645]/10 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:contents">
                  <div className="sm:col-span-3 relative">
                    <input
                      type="number"
                      placeholder="Preis"
                      value={tranche.price}
                      onChange={(e) => handleTrancheChange(tranche.id, 'price', e.target.value)}
                      className="w-full min-h-[42px] bg-term-card border border-term-border focus:border-brand rounded-xl py-2 px-3 pr-7 text-xs font-mono font-bold text-white placeholder-slate-600 outline-none transition"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">$</span>
                  </div>

                  <div className="sm:col-span-3 relative">
                    <input
                      type="number"
                      placeholder="Marge / Kollateral"
                      value={tranche.margin}
                      onChange={(e) => handleTrancheChange(tranche.id, 'margin', e.target.value)}
                      className="w-full min-h-[42px] bg-term-card border border-term-border focus:border-brand rounded-xl py-2 px-3 pr-7 text-xs font-mono font-bold text-white placeholder-slate-600 outline-none transition"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">$</span>
                  </div>
                </div>

                <div className="sm:col-span-3 flex p-1 bg-term-card border border-term-border rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleTrancheChange(tranche.id, 'orderType', 'LIMIT')}
                    className={`flex-1 min-h-[34px] text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center ${
                      tranche.orderType === 'LIMIT' ? 'bg-brand text-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Limit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTrancheChange(tranche.id, 'orderType', 'MARKET')}
                    className={`flex-1 min-h-[34px] text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center ${
                      tranche.orderType === 'MARKET' ? 'bg-brand text-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Market
                  </button>
                </div>

                <div className="hidden sm:flex sm:col-span-1 justify-end">
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

          <button
            type="button"
            onClick={handleAddTranche}
            className="w-full min-h-[44px] py-3 border border-brand-border bg-brand-muted hover:bg-brand/20 text-brand hover:text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition duration-200 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 text-brand" />
            <span>Weitere Tranche hinzufügen (Kostenlos unbegrenzt)</span>
          </button>
        </div>

        {/* STOP LOSS & RISIKO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 bg-term-card border border-term-border p-4 sm:p-5 rounded-2xl shadow-xl">
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
                className="w-full min-h-[44px] bg-term-bg border border-[#F23645]/40 focus:border-[#F23645] rounded-xl py-2.5 px-3 pr-8 text-sm font-mono font-bold text-white placeholder-slate-600 outline-none transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">$</span>
            </div>

            <span className="text-[10px] text-slate-500 font-mono block">
              SL-Distanz zum Mischkurs: <span className="text-slate-300 font-bold">{rawSlDistancePercent > 0 ? `${rawSlDistancePercent.toFixed(2)}%` : '-'}</span>
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">Max. Verlust-Toleranz</label>
              <div className="flex bg-term-bg p-0.5 rounded-lg border border-term-border text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setRiskMode('PERCENT')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${riskMode === 'PERCENT' ? 'bg-brand text-black font-extrabold' : 'text-slate-400 hover:text-white'}`}
                >
                  % von Marge
                </button>
                <button
                  type="button"
                  onClick={() => setRiskMode('USD')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${riskMode === 'USD' ? 'bg-brand text-black font-extrabold' : 'text-slate-400 hover:text-white'}`}
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
                  className="w-full min-h-[44px] bg-term-bg border border-term-border focus:border-brand rounded-xl py-2.5 px-3 pr-8 text-sm font-mono font-bold text-white placeholder-slate-600 outline-none transition"
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
                  className="w-full min-h-[44px] bg-term-bg border border-term-border focus:border-brand rounded-xl py-2.5 px-3 pr-8 text-sm font-mono font-bold text-white placeholder-slate-600 outline-none transition"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">$</span>
              </div>
            )}

            <span className="text-[10px] text-slate-500 font-mono block">
              {riskMode === 'PERCENT'
                ? (totalMargin > 0 && numPercent > 0 ? `≈ $${maxLossUsd.toFixed(2)} Verlust bei Auslösung` : '-')
                : (totalMargin > 0 && numUsd > 0 ? `≈ ${((numUsd / totalMargin) * 100).toFixed(1)}% deiner Marge` : '-')}
            </span>
          </div>
        </div>

        {numStopLoss > 0 && avgEntryPrice > 0 && !isValidSetup && (
          <div className="flex items-center gap-2.5 text-xs text-[#F23645] bg-[#F23645]/10 border border-[#F23645]/30 p-3.5 sm:p-4 rounded-2xl shadow-lg">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>Ungültiges Setup: Stop Loss muss bei {isLong ? 'Long UNTER' : 'Short ÜBER'} dem Mischkurs (${avgEntryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}) liegen.</span>
          </div>
        )}

        {/* ================= TRADE PLAN CARD (EXPORTABLE) ================= */}
        <div className="space-y-4 pt-2">
          
          {/* ACTION BAR: DOWNLOAD BUTTON */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-term-card border border-term-border p-3.5 sm:p-4 rounded-2xl shadow-lg">
            <div className="space-y-0.5">
              <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <FileImage className="w-4 h-4 text-brand" />
                <span>Trade-Setup für dein Smartphone sichern</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Exportiert alle Einstiegslevel, SL und Positionsgrößen als gestochen scharfes PNG.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadTradeCard}
              disabled={isExporting || !isValidSetup}
              className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-mono font-extrabold transition-all flex items-center justify-center gap-2.5 shadow-lg shrink-0 cursor-pointer ${
                isValidSetup
                  ? 'bg-brand hover:bg-brand-hover text-black shadow-brand/20 active:scale-95'
                  : 'bg-term-bg border border-term-border text-slate-500 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>
                {isExporting 
                  ? 'Generiere Bild...' 
                  : isValidSetup 
                    ? 'Setup-Karte herunterladen (.PNG)' 
                    : 'Setup unvollständig'}
              </span>
            </button>
          </div>

          {/* DIESER BEREICH WIRD IN DAS BILD GERENDERT */}
          <div
            ref={cardRef}
            className="bg-term-card border border-brand-border/80 rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden"
          >
            {/* CARD HEADER */}
            <div className="flex justify-between items-start border-b border-term-border/80 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${selectedAsset.iconColor}`} />
                  <span className="text-lg sm:text-xl font-extrabold font-mono text-white tracking-wider">
                    {selectedAsset.symbol}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-black ${
                      isLong ? 'bg-[#089981]/20 text-[#089981] border border-[#089981]/40' : 'bg-[#F23645]/20 text-[#F23645] border border-[#F23645]/40'
                    }`}
                  >
                    {direction} {isValidSetup && calculatedLeverage > 0 ? `${calculatedLeverage}x` : ''}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-500">
                  Börse: <strong className="text-slate-300 font-semibold">{currentExchangeConfig.name}</strong> • Gebühren: <span className="text-slate-400">{takerRate}% Taker</span>
                </p>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-700/60 font-mono text-[10px] text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>READ-ONLY SYNC READY</span>
                </div>
              </div>
            </div>

            {/* KEY EXECUTION NUMBERS (4 CARDS) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
              <div className="bg-term-bg border border-term-border p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 font-medium uppercase">Mischkurs (Avg Entry)</span>
                <p className="text-base sm:text-lg font-mono font-bold text-white truncate">
                  {avgEntryPrice > 0 ? `$${avgEntryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                </p>
              </div>

              <div className="bg-term-bg border border-brand-border/60 p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-brand font-medium uppercase">Optimaler Hebel</span>
                <p className="text-base sm:text-lg font-mono font-extrabold text-brand truncate">
                  {isValidSetup && calculatedLeverage > 0 ? `${calculatedLeverage}x` : '-'}
                </p>
              </div>

              <div className="bg-term-bg border border-[#F23645]/30 p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-[#F23645] font-medium uppercase">Stop Loss Level</span>
                <p className="text-base sm:text-lg font-mono font-bold text-[#F23645] truncate">
                  {numStopLoss > 0 ? `$${numStopLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                </p>
              </div>

              <div className="bg-term-bg border border-term-border p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 font-medium uppercase">Max. Verlust (Risk)</span>
                <p className="text-base sm:text-lg font-mono font-bold text-[#F23645] truncate">
                  {maxLossUsd > 0 ? `-$${maxLossUsd.toFixed(2)}` : '-'}
                </p>
              </div>
            </div>

            {/* DETAIL SUMMARY: TRANCHEN & SIZING */}
            <div className="bg-term-bg border border-term-border rounded-xl p-3.5 space-y-3 font-mono text-xs">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-term-border/60 pb-2">
                <span>Einstiegs-Struktur ({validTranches.length} Tranchen aktiv)</span>
                <span className="text-slate-400 font-normal">
                  Gesamt-Marge: <strong className="text-white">${totalMargin.toFixed(2)}</strong>
                </span>
              </div>

              <div className="space-y-1.5">
                {validTranches.length > 0 ? (
                  validTranches.map((t, i) => (
                    <div key={t.id} className="flex justify-between items-center text-[11px] text-slate-400 py-0.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                        Tranche #{i + 1} ({t.orderType})
                      </span>
                      <span className="text-slate-200">
                        ${parseFloat(t.price).toLocaleString('en-US', { minimumFractionDigits: 2 })} • <strong>${parseFloat(t.margin).toFixed(2)}</strong> Marge
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-600 italic">Noch keine Tranchen eingetragen.</p>
                )}
              </div>

              <div className="pt-2 border-t border-term-border/60 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Positionswert:</span>
                  <span className="text-white font-bold">
                    {isValidSetup && totalPositionSizeUsd > 0 ? `$${totalPositionSizeUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">SL-Distanz:</span>
                  <span className="text-slate-300 font-bold">
                    {rawSlDistancePercent > 0 ? `${rawSlDistancePercent.toFixed(2)}%` : '-'}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <span className="text-slate-500 block">Börsengebühren:</span>
                  <span className="text-amber-400 font-bold">
                    {isValidSetup && estimatedFeesUsd > 0 ? `≈ -$${estimatedFeesUsd.toFixed(2)}` : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* FOOTER WATERMARK / BRANDING */}
            <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500 border-t border-term-border/50">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Geplant für <strong>RISKIL Live-Journaling</strong>
              </span>
              <span className="text-slate-500 font-semibold">riskil.app</span>
            </div>

          </div>
        </div>

        {/* ================= RISKIL CLOSED BETA CTA BANNER ================= */}
        <div className="mt-8 p-5 sm:p-6 bg-gradient-to-r from-term-card via-term-bg to-brand-muted/15 border border-brand-border rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-2xl">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-brand/20 border border-brand/40 text-brand text-[10px] font-mono font-bold uppercase">
                Closed Beta
              </span>
              <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Setup geplant. Hältst du dich im Live-Markt an deine Regeln?
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Die meisten Konten platzen durch verschobene Stops und emotionales Overleveraging. 
              <strong> RISKIL</strong> liest deine Live-Positionen über eine <strong>100% sichere Read-Only API (ohne Handelsrechte)</strong> automatisch aus, gleicht sie mit deinem Plan ab und deckt Regelbrüche in deinem Journal auf.
            </p>
          </div>

          <Link
            href="/register"
            className="w-full md:w-auto px-6 py-3.5 bg-brand hover:bg-brand-hover text-black font-extrabold text-xs font-mono rounded-xl transition shadow-xl shadow-brand/25 flex items-center justify-center gap-2.5 shrink-0 cursor-pointer active:scale-95"
          >
            <span>Early Access sichern</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

      {/* ================= MOBILE IMAGE PREVIEW MODAL ================= */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-term-card border border-term-border rounded-2xl w-full max-w-lg p-4 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-term-border pb-3">
              <span className="text-xs font-mono font-bold text-white">Trade-Karte bereit</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-center">
              <p className="text-[11px] font-mono text-emerald-400">
                Halte das Bild gedrückt, um es in deiner Galerie zu speichern.
              </p>
              <div className="rounded-xl overflow-hidden border border-term-border bg-black">
                <img src={previewImage} alt="Trade Setup" className="w-full h-auto object-contain" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="w-full py-3 bg-brand text-black font-extrabold text-xs font-mono rounded-xl cursor-pointer"
            >
              Fertig / Schließen
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: CUSTOM FEES POPUP ================= */}
      {isCustomFeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-term-card border border-term-border rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-term-border pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-brand" />
                <h3 className="text-sm font-bold text-white font-mono">Börsengebühren anpassen</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomFeeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-term-bg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomFees} className="space-y-4">
              <p className="text-xs text-slate-400">
                Gib die Maker- und Taker-Gebühren deiner Börse bzw. deines VIP-Levels in Prozent ein:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400">Maker Fee (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      value={tempMakerFee}
                      onChange={(e) => setTempMakerFee(e.target.value)}
                      className="w-full bg-term-bg border border-term-border focus:border-brand rounded-xl py-2 px-3 text-xs font-mono font-bold text-white outline-none"
                      placeholder="0.02"
                      required
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400">Taker Fee (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      value={tempTakerFee}
                      onChange={(e) => setTempTakerFee(e.target.value)}
                      className="w-full bg-term-bg border border-term-border focus:border-brand rounded-xl py-2 px-3 text-xs font-mono font-bold text-white outline-none"
                      placeholder="0.06"
                      required
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">%</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomFeeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-black font-extrabold text-xs rounded-xl transition shadow-md shadow-brand/20 cursor-pointer"
                >
                  Speichern & Anwenden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}