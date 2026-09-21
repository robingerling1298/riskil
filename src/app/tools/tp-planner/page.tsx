'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toPng } from 'html-to-image'
import {
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Search,
  Check,
  Calculator,
  Target,
  Settings,
  ArrowRight,
  Sliders,
  X,
  Zap,
  ShieldCheck,
  Download,
  FileImage,
  TrendingUp,
  Share2,
  Copy
} from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface TpStage {
  id: string
  mode: 'ROE' | 'PRICE'
  roePercent: string
  targetPrice: string
  closePercent: string
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
  { id: 'hyperliquid', name: 'Hyperliquid (VIP0)', makerFee: 0.01, takerFee: 0.035 },
  { id: 'bitget', name: 'Bitget (VIP0)', makerFee: 0.02, takerFee: 0.06 },
  { id: 'bybit', name: 'Bybit (VIP0)', makerFee: 0.02, takerFee: 0.055 },
  { id: 'binance', name: 'Binance (VIP0)', makerFee: 0.02, takerFee: 0.05 },
  { id: 'okx', name: 'OKX (VIP0)', makerFee: 0.02, takerFee: 0.05 },
  { id: 'custom', name: 'Custom Fees', makerFee: 0.02, takerFee: 0.06 }
]

const POPULAR_ASSETS: AssetOption[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', iconColor: 'bg-amber-500' },
  { symbol: 'ETHUSDT', name: 'Ethereum', iconColor: 'bg-indigo-500' },
  { symbol: 'SOLUSDT', name: 'Solana', iconColor: 'bg-purple-500' },
  { symbol: 'HYPEUSDT', name: 'Hyperliquid', iconColor: 'bg-emerald-400' },
  { symbol: 'XRPUSDT', name: 'Ripple', iconColor: 'bg-blue-400' },
  { symbol: 'BNBUSDT', name: 'Binance Coin', iconColor: 'bg-yellow-500' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', iconColor: 'bg-yellow-600' },
  { symbol: 'AVAXUSDT', name: 'Avalanche', iconColor: 'bg-red-500' },
]

interface Preset {
  id: string
  label: string
  description: string
  stages: Array<{ roePercent: string; closePercent: string }>
}

const PRESETS: Preset[] = [
  {
    id: 'scalp',
    label: '⚡ Quick Scalp',
    description: '70% TP1 (15% ROE) / 30% TP2 (30% ROE)',
    stages: [
      { roePercent: '15', closePercent: '70' },
      { roePercent: '30', closePercent: '100' },
    ],
  },
  {
    id: 'balanced',
    label: '⚖️ 50/50 Standard',
    description: '50% TP1 (25% ROE) / 50% TP2 (50% ROE)',
    stages: [
      { roePercent: '25', closePercent: '50' },
      { roePercent: '50', closePercent: '100' },
    ],
  },
  {
    id: 'moonshot',
    label: '🚀 Moonshot Runner',
    description: '3 Tiers + 40% Runner in Market',
    stages: [
      { roePercent: '25', closePercent: '50' },
      { roePercent: '50', closePercent: '50' },
      { roePercent: '100', closePercent: '60' },
    ],
  },
]

export default function FreeTakeProfitPlanner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedExchangeId, setSelectedExchangeId] = useState<string>('hyperliquid')
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
  const [copySuccess, setCopySuccess] = useState<boolean>(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const assetDropdownRef = useRef<HTMLDivElement>(null)
  const exchangeDropdownRef = useRef<HTMLDivElement>(null)

  const [positionType, setPositionType] = useState<'LONG' | 'SHORT'>('LONG')
  const [margin, setMargin] = useState<string>('')
  const [leverage, setLeverage] = useState<string>('')
  const [entryPrice, setEntryPrice] = useState<string>('')
  const [entryOrderType, setEntryOrderType] = useState<'maker' | 'taker'>('maker')

  const [tpStages, setTpStages] = useState<TpStage[]>([
    {
      id: '1',
      mode: 'ROE',
      roePercent: '',
      targetPrice: '',
      closePercent: '',
    },
  ])

  const isLong = positionType === 'LONG'
  const isCustomAsset = selectedAsset.symbol === 'CUSTOM / MANUAL'

  // URL State einlesen
  useEffect(() => {
    const assetParam = searchParams.get('asset')
    if (assetParam) {
      const found = POPULAR_ASSETS.find(a => a.symbol === assetParam)
      if (found) setSelectedAsset(found)
    }
    const dirParam = searchParams.get('dir')
    if (dirParam === 'LONG' || dirParam === 'SHORT') setPositionType(dirParam)

    const marginParam = searchParams.get('m')
    if (marginParam) setMargin(marginParam)

    const levParam = searchParams.get('lev')
    if (levParam) setLeverage(levParam)

    const entryParam = searchParams.get('entry')
    if (entryParam) setEntryPrice(entryParam)

    const tp1Roe = searchParams.get('tp1_roe')
    const tp1Close = searchParams.get('tp1_close')
    if (tp1Roe || tp1Close) {
      setTpStages([{
        id: '1',
        mode: 'ROE',
        roePercent: tp1Roe || '',
        targetPrice: '',
        closePercent: tp1Close || ''
      }])
    }
  }, [searchParams])

  // URL State schreiben
  const updateShareUrl = () => {
    const params = new URLSearchParams()
    params.set('asset', selectedAsset.symbol)
    params.set('dir', positionType)
    if (margin) params.set('m', margin)
    if (leverage) params.set('lev', leverage)
    if (entryPrice) params.set('entry', entryPrice)
    if (tpStages[0]?.roePercent) params.set('tp1_roe', tpStages[0].roePercent)
    if (tpStages[0]?.closePercent) params.set('tp1_close', tpStages[0].closePercent)

    router.replace(`?${params.toString()}`, { scroll: false })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      updateShareUrl()
    }, 400)
    return () => clearTimeout(timer)
  }, [selectedAsset, positionType, margin, leverage, entryPrice, tpStages])

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
    if (symbol === 'CUSTOM / MANUAL') {
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
    if (selectedAsset.symbol === 'CUSTOM / MANUAL') return
    const interval = setInterval(() => {
      fetchLivePrice(selectedAsset.symbol)
    }, 3000)
    return () => clearInterval(interval)
  }, [selectedAsset])

  const handleUseCurrentPrice = () => {
    if (currentPrice) {
      setEntryPrice(currentPrice.toString())
    }
  }

  const handleApplyPreset = (preset: Preset) => {
    const newStages: TpStage[] = preset.stages.map((s, idx) => ({
      id: `${Date.now()}-${idx}`,
      mode: 'ROE',
      roePercent: s.roePercent,
      targetPrice: '',
      closePercent: s.closePercent,
    }))
    setTpStages(newStages)
  }

  const handleAddTpStage = () => {
    setTpStages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        mode: 'ROE',
        roePercent: '',
        targetPrice: '',
        closePercent: '',
      },
    ])
  }

  const handleRemoveTpStage = (id: string) => {
    if (tpStages.length <= 1) return
    setTpStages((prev) => prev.filter((stage) => stage.id !== id))
  }

  const handleTpStageChange = (id: string, field: keyof TpStage, value: string) => {
    setTpStages((prev) =>
      prev.map((stage) => {
        if (stage.id !== id) return stage
        if (field === 'mode') {
          return { ...stage, mode: value as 'ROE' | 'PRICE' }
        }
        return { ...stage, [field]: value }
      })
    )
  }

  const handleRoeSliderChange = (id: string, value: string) => {
    setTpStages((prev) =>
      prev.map((stage) => {
        if (stage.id !== id) return stage
        return {
          ...stage,
          mode: 'ROE',
          roePercent: value,
        }
      })
    )
  }

  // --- CALCULATION ENGINE ---
  const parsedMargin = parseFloat(margin) || 0
  const parsedLeverage = Math.floor(parseFloat(leverage) || 1)
  const parsedEntry = parseFloat(entryPrice) || 0
  const positionSize = parsedMargin * parsedLeverage

  const currentExchangeConfig = EXCHANGES.find(e => e.id === selectedExchangeId) || EXCHANGES[0]
  const makerRate = selectedExchangeId === 'custom' ? customFees.maker : currentExchangeConfig.makerFee
  const takerRate = selectedExchangeId === 'custom' ? customFees.taker : currentExchangeConfig.takerFee

  const entryFeeRate = (entryOrderType === 'maker' ? makerRate : takerRate) / 100
  const exitFeeRate = makerRate / 100
  const entryFeeUSD = positionSize * entryFeeRate

  let runningRemainingMargin = parsedMargin
  let totalGrossProfit = 0
  let totalExitFeesUSD = 0

  const calculatedStages = tpStages.map((stage) => {
    const rawRoe = parseFloat(stage.roePercent) || 0
    const rawPrice = parseFloat(stage.targetPrice) || 0
    const hasInput = stage.mode === 'ROE' ? rawRoe > 0 : rawPrice > 0

    let targetPrice = 0
    let roePercent = 0

    if (hasInput && parsedEntry > 0 && parsedLeverage > 0) {
      if (stage.mode === 'ROE') {
        roePercent = rawRoe
        const priceChangePct = (roePercent / parsedLeverage) / 100
        targetPrice = isLong ? parsedEntry * (1 + priceChangePct) : parsedEntry * (1 - priceChangePct)
      } else {
        targetPrice = rawPrice
        const priceDiff = isLong ? (targetPrice - parsedEntry) : (parsedEntry - targetPrice)
        roePercent = (priceDiff / parsedEntry) * parsedLeverage * 100
      }
    }

    const isDirectionValid = targetPrice > 0 && (isLong ? targetPrice > parsedEntry : targetPrice < parsedEntry)
    const closePctOfRemaining = Math.min(100, Math.max(0, parseFloat(stage.closePercent) || 0)) / 100
    const trancheMargin = runningRemainingMargin * closePctOfRemaining
    const trancheProfit = trancheMargin * (roePercent / 100)

    const trancheVolumeUSD = trancheMargin * parsedLeverage
    const trancheUnits = parsedEntry > 0 ? trancheVolumeUSD / parsedEntry : 0
    const trancheExitVolumeUSD = trancheUnits * targetPrice
    const trancheExitFee = trancheExitVolumeUSD * exitFeeRate

    if (hasInput && isDirectionValid && trancheMargin > 0 && parsedLeverage > 0) {
      totalGrossProfit += trancheProfit
      totalExitFeesUSD += trancheExitFee
      runningRemainingMargin = Math.max(0, runningRemainingMargin - trancheMargin)
    }

    const remainingMarginPct = parsedMargin > 0 ? (runningRemainingMargin / parsedMargin) * 100 : 0

    return {
      ...stage,
      hasInput,
      calculatedTargetPrice: targetPrice,
      calculatedRoe: roePercent,
      isDirectionValid,
      trancheMargin,
      trancheProfit,
      trancheExitFee,
      netTrancheProfit: hasInput && isDirectionValid ? (trancheProfit - trancheExitFee) : 0,
      remainingMargin: runningRemainingMargin,
      remainingMarginPct,
    }
  })

  const totalFeesUSD = entryFeeUSD + totalExitFeesUSD
  const totalNetProfitUSD = totalGrossProfit - totalFeesUSD
  const totalNetRoe = parsedMargin > 0 ? (totalNetProfitUSD / parsedMargin) * 100 : 0

  const isValidSetup = parsedMargin > 0 && parsedLeverage > 0 && parsedEntry > 0 && tpStages.some(s => {
    const rVal = parseFloat(s.roePercent) || 0
    const pVal = parseFloat(s.targetPrice) || 0
    return s.mode === 'ROE' ? rVal > 0 : (isLong ? pVal > parsedEntry : pVal > 0 && pVal < parsedEntry)
  })

  let accumProfit = 0
  const chartData = [
    {
      name: 'Entry',
      price: parsedEntry,
      gewinn: 0,
      restPosition: 100,
    },
    ...calculatedStages
      .filter(s => s.hasInput && s.isDirectionValid)
      .map((s, idx) => {
        accumProfit += s.netTrancheProfit
        return {
          name: `TP #${idx + 1}`,
          price: s.calculatedTargetPrice,
          gewinn: parseFloat(accumProfit.toFixed(2)),
          restPosition: parseFloat(s.remainingMarginPct.toFixed(1)),
        }
      }),
  ]

  const filteredAssets = POPULAR_ASSETS.filter(a =>
    a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderExchangeIcon = (id: string) => {
    switch (id) {
      case 'hyperliquid':
        return (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="#10B981" fillOpacity="0.2" />
            <path d="M12 4L19 12L12 20L5 12L12 4Z" fill="#10B981" />
          </svg>
        )
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

      if (navigator.canShare && navigator.share) {
        try {
          const blob = await (await fetch(dataUrl)).blob()
          const file = new File([blob], `RISKIL_${selectedAsset.symbol}_${positionType}_TP.png`, { type: 'image/png' })
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `${selectedAsset.symbol} ${positionType} Take-Profit Plan`,
              text: `Planned via RISKIL Free TP Planner`
            })
            setIsExporting(false)
            return
          }
        } catch (shareErr) {
          // Fallback
        }
      }

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile) {
        setPreviewImage(dataUrl)
      } else {
        const link = document.createElement('a')
        link.download = `RISKIL_${selectedAsset.symbol}_${positionType}_TP_Plan.png`
        link.href = dataUrl
        link.click()
      }
    } catch (err) {
      console.error('Error exporting TP card:', err)
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 text-slate-100 font-sans pb-20">
      
      {/* ================= HERO SECTION (SAUBER OHNE BUTTONS) ================= */}
      <div className="text-center space-y-4 pt-10 pb-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-muted border border-brand-border text-brand text-xs font-mono font-semibold tracking-wide">
          <Target className="w-3.5 h-3.5" />
          Crypto Perps Take-Profit & Scale-Out Planner
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Plan Profits & Tiered Exits <br className="hidden sm:inline" /> with Precision.
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
          Scale out partial profits, factor in real-time exchange fees, and secure gains systematically without manual miscalculations.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400 font-mono pt-2">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Client-Side
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> No Registration Required
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
          <div className="flex flex-wrap items-center gap-3">
            {/* ASSET SELECTOR */}
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
                      placeholder="Search asset..."
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
                        setSelectedAsset({ symbol: 'CUSTOM / MANUAL', name: 'Manual Input', iconColor: 'bg-slate-400' })
                        setIsAssetDropdownOpen(false)
                        setSearchQuery('')
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                        selectedAsset.symbol === 'CUSTOM / MANUAL' ? 'bg-brand-muted text-brand font-bold' : 'text-slate-300 hover:bg-term-hover'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Calculator className="w-3.5 h-3.5 text-brand" />
                        <div className="text-left">
                          <div className="font-bold">Manual Input</div>
                          <div className="text-[10px] text-slate-500 font-mono">Without API</div>
                        </div>
                      </div>
                      {selectedAsset.symbol === 'CUSTOM / MANUAL' && <Check className="w-3.5 h-3.5 text-brand" />}
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

            {/* LIVE TICKER */}
            <div className="flex items-center gap-2.5 bg-term-bg border border-term-border px-3.5 py-2.5 rounded-xl font-mono text-xs shadow-inner">
              <span className="relative flex h-2 w-2 items-center justify-center">
                {!isCustomAsset && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isCustomAsset ? 'bg-slate-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span className="text-slate-500 font-medium">Index:</span>
              <span className="font-bold text-white">
                {currentPrice ? `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Manual'}
              </span>
              {priceChange24h !== null && !isCustomAsset && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${priceChange24h >= 0 ? 'text-[#089981] bg-[#089981]/10' : 'text-[#F23645] bg-[#F23645]/10'}`}>
                  {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                </span>
              )}
            </div>
          </div>

          {/* EXCHANGE & DIRECTION */}
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
                      <Settings className="w-3 h-3" /> Set custom fees...
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1 p-1 bg-term-bg border border-term-border rounded-xl">
              <button
                type="button"
                onClick={() => setPositionType('LONG')}
                className={`min-h-[38px] flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isLong ? 'bg-[#089981] text-white shadow-[0_0_12px_rgba(8,153,129,0.4)]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" /> LONG
              </button>
              <button
                type="button"
                onClick={() => setPositionType('SHORT')}
                className={`min-h-[38px] flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  !isLong ? 'bg-[#F23645] text-white shadow-[0_0_12px_rgba(242,54,69,0.4)]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" /> SHORT
              </button>
            </div>
          </div>
        </div>

        {/* 1. POSITION PARAMETERS */}
        <div className="bg-term-card border border-term-border p-4 sm:p-5 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand" />
              1. Position Parameters
            </span>
            {currentPrice && (
              <button
                type="button"
                onClick={handleUseCurrentPrice}
                className="text-[11px] font-mono text-brand hover:underline transition cursor-pointer"
              >
                Use live price (${currentPrice.toFixed(2)}) as entry
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 font-mono">Margin ($)</label>
              <div className="relative">
                <input
                  type="number"
                  value={margin}
                  onChange={(e) => setMargin(e.target.value)}
                  placeholder="Enter margin"
                  className="w-full min-h-[44px] bg-[#0d131f] border border-slate-700/80 focus:border-brand rounded-xl py-2.5 px-3 pr-7 text-sm font-mono font-bold text-white placeholder-slate-600 outline-none transition shadow-inner"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">$</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 font-mono">Leverage (Integer)</label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={leverage}
                  onChange={(e) => setLeverage(e.target.value)}
                  placeholder="Leverage e.g. 10"
                  className="w-full min-h-[44px] bg-[#0d131f] border border-slate-700/80 focus:border-brand rounded-xl py-2.5 px-3 pr-7 text-sm font-mono font-bold text-white placeholder-slate-600 outline-none transition shadow-inner"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">x</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 font-mono">Entry Price ($)</label>
              <div className="relative">
                <input
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="Entry price"
                  className="w-full min-h-[44px] bg-[#0d131f] border border-slate-700/80 focus:border-brand rounded-xl py-2.5 px-3 pr-7 text-sm font-mono font-bold text-white placeholder-slate-600 outline-none transition shadow-inner"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">$</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-term-border/70 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
            <div>
              <span>Entry Order Type: </span>
              <button
                type="button"
                onClick={() => setEntryOrderType(prev => prev === 'maker' ? 'taker' : 'maker')}
                className="text-white font-bold underline decoration-dotted ml-1 cursor-pointer"
              >
                {entryOrderType === 'maker' ? `Limit (${makerRate}%)` : `Market (${takerRate}%)`}
              </button>
            </div>
            <div>
              <span>Total Position Size: </span>
              <span className="text-white font-extrabold text-sm">${positionSize.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* STRATEGY PRESETS */}
        <details className="group bg-term-card border border-term-border rounded-2xl overflow-hidden shadow-md transition-all">
          <summary className="flex items-center justify-between p-3.5 sm:p-4 cursor-pointer list-none select-none hover:bg-term-bg/60 transition">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 group-hover:text-amber-400 transition">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Scale-Out Quick Presets (Optional)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">Click to expand</span>
              <ChevronDown className="w-4 h-4 text-slate-500 transition-transform duration-200 group-open:rotate-180 group-open:text-amber-400" />
            </div>
          </summary>

          <div className="p-3.5 sm:p-4 pt-1 border-t border-term-border/60 bg-[#070b13]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="flex flex-col justify-between p-3 bg-term-bg hover:bg-term-card border border-slate-800 hover:border-amber-400/50 rounded-xl transition text-left cursor-pointer group/btn shadow-sm"
                >
                  <span className="text-xs font-bold text-white group-hover/btn:text-amber-400 transition font-mono">
                    {p.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 leading-relaxed">
                    {p.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </details>

        {/* 2. TAKE PROFIT STAGES */}
        <div className="bg-term-card border border-term-border p-4 sm:p-5 rounded-2xl space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              2. Take-Profit Tiers ({tpStages.length} active tiers)
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Closes scale dynamically off the remaining open position size
            </span>
          </div>

          <div className="space-y-4">
            {calculatedStages.map((stage, idx) => {
              if (!stage) return null
              const currentRoeVal = stage.mode === 'ROE' ? String(stage.roePercent) : String(Math.round(stage.calculatedRoe))
              const currentCloseVal = String(stage.closePercent)

              return (
                <div
                  key={stage.id}
                  className="p-4 sm:p-5 bg-[#090d16] border border-slate-800 rounded-2xl space-y-4 shadow-xl hover:border-slate-700 transition"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pb-3 border-b border-slate-800/80">
                    
                    <div className="md:col-span-4 flex items-center gap-2">
                      <span className="text-xs font-mono font-black px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 rounded-lg shrink-0">
                        TP #{idx + 1}
                      </span>

                      <div className="flex bg-[#05070c] p-1 border border-slate-800 rounded-xl text-xs font-mono flex-1">
                        <button
                          type="button"
                          onClick={() => handleTpStageChange(stage.id, 'mode', 'ROE')}
                          className={`flex-1 py-1 rounded-lg transition cursor-pointer font-bold ${
                            stage.mode === 'ROE' ? 'bg-brand text-black shadow-md' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          % RoE
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTpStageChange(stage.id, 'mode', 'PRICE')}
                          className={`flex-1 py-1 rounded-lg transition cursor-pointer font-bold ${
                            stage.mode === 'PRICE' ? 'bg-brand text-black shadow-md' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          $ Price
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-4 relative">
                      <input
                        type="number"
                        placeholder={stage.mode === 'ROE' ? 'Target RoE in %' : 'Target price in $'}
                        value={(stage.mode === 'ROE' ? stage.roePercent : stage.targetPrice) || ''}
                        onChange={(e) =>
                          handleTpStageChange(
                            stage.id,
                            stage.mode === 'ROE' ? 'roePercent' : 'targetPrice',
                            e.target.value
                          )
                        }
                        className="w-full min-h-[42px] bg-[#0d1424] border border-slate-700 focus:border-brand rounded-xl py-2 px-3 pr-7 text-xs font-mono font-extrabold text-white placeholder-slate-500 outline-none transition shadow-inner"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-slate-400">
                        {stage.mode === 'ROE' ? '%' : '$'}
                      </span>
                    </div>

                    <div className="md:col-span-4 flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          placeholder="Close in %"
                          value={stage.closePercent || ''}
                          onChange={(e) => handleTpStageChange(stage.id, 'closePercent', e.target.value)}
                          className="w-full min-h-[42px] bg-[#0d1424] border border-slate-700 focus:border-emerald-400 rounded-xl py-2 px-3 pr-7 text-xs font-mono font-extrabold text-white text-right placeholder-slate-500 outline-none transition shadow-inner"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-emerald-400">%</span>
                      </div>

                      {tpStages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTpStage(stage.id)}
                          className="p-2 text-slate-500 hover:text-[#F23645] hover:bg-[#F23645]/10 rounded-xl transition cursor-pointer shrink-0"
                          title="Remove tier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SLIDERS & PILLS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5 bg-[#060911] p-3 rounded-xl border border-slate-800">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-400 font-medium">RoE Quick Select {stage.mode === 'PRICE' && stage.calculatedRoe !== 0 && `(${stage.calculatedRoe.toFixed(1)}%)`}</span>
                        <div className="flex gap-1">
                          {['10', '25', '50', '100'].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleRoeSliderChange(stage.id, val)}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
                                currentRoeVal === val ? 'bg-brand text-black font-extrabold shadow-sm' : 'bg-[#0d131f] border border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {val}%
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="200"
                        value={stage.mode === 'ROE' ? parseFloat(stage.roePercent) || 0 : Math.max(0, stage.calculatedRoe)}
                        onChange={(e) => handleRoeSliderChange(stage.id, e.target.value)}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand"
                      />
                    </div>

                    <div className="space-y-1.5 bg-[#060911] p-3 rounded-xl border border-slate-800">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-400 font-medium">Close Position %</span>
                        <div className="flex gap-1">
                          {['25', '50', '75', '100'].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleTpStageChange(stage.id, 'closePercent', val)}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
                                currentCloseVal === val ? 'bg-emerald-400 text-black font-extrabold shadow-sm' : 'bg-[#0d131f] border border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {val}%
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={parseFloat(stage.closePercent) || 0}
                        onChange={(e) => handleTpStageChange(stage.id, 'closePercent', e.target.value)}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                    </div>
                  </div>

                  {/* DETAIL BOXES */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                    <div className="bg-[#060911] p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Target Price</span>
                      <span className="font-bold text-white">
                        {stage.calculatedTargetPrice > 0 ? `$${stage.calculatedTargetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                      </span>
                    </div>

                    <div className="bg-[#060911] p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Net Profit</span>
                      <span className={`font-bold ${stage.netTrancheProfit >= 0 ? 'text-emerald-400' : 'text-[#F23645]'}`}>
                        {stage.netTrancheProfit > 0 ? `+$${stage.netTrancheProfit.toFixed(2)}` : '-'}
                      </span>
                    </div>

                    <div className="bg-[#060911] p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Released Margin</span>
                      <span className="font-bold text-brand">
                        {stage.trancheMargin > 0 ? `$${stage.trancheMargin.toFixed(2)}` : '-'}
                      </span>
                    </div>

                    <div className="bg-[#060911] p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Remaining Position</span>
                      <span className="font-bold text-slate-300">
                        {parsedMargin > 0 ? `${stage.remainingMarginPct.toFixed(1)}%` : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={handleAddTpStage}
            className="w-full min-h-[44px] py-3 border border-brand-border bg-brand-muted hover:bg-brand/20 text-brand hover:text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition duration-200 shadow-md cursor-pointer font-mono"
          >
            <Plus className="w-4 h-4 text-brand" />
            <span>Add another Take-Profit tier</span>
          </button>
        </div>

        {/* 3. VISUAL CHART BLOCK */}
        <div className="bg-term-card border border-term-border rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-term-border pb-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Profit & Remaining Position Progression</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Green: Net Profit ($) • Blue: Open Margin (%)</span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tpProfitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#089981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#089981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} fontStretch="condensed" />
                <YAxis yAxisId="left" stroke="#089981" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0d14',
                    borderColor: '#222f49',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <Area yAxisId="left" type="monotone" dataKey="gewinn" stroke="#089981" strokeWidth={2.5} fillOpacity={1} fill="url(#tpProfitGrad)" name="Net Profit ($)" />
                <Line yAxisId="right" type="stepAfter" dataKey="restPosition" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4, fill: '#38bdf8' }} name="Open Position (%)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ================= TRADE EXECUTION CARD (EXPORTABLE) ================= */}
        <div className="space-y-4 pt-2">
          
          {/* ACTION BAR: SHARE & DOWNLOAD BUTTONS (HIER GEHÖRT ES HIN) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-term-card border border-term-border p-3.5 sm:p-4 rounded-2xl shadow-lg">
            <div className="space-y-0.5">
              <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <FileImage className="w-4 h-4 text-brand" />
                <span>Share Setup & Save Trade Card</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Directly share the rendered PNG via Web Share API or copy the permalink.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-term-bg hover:bg-term-hover border border-term-border text-xs font-mono font-bold text-slate-200 hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Copy className="w-3.5 h-3.5 text-brand" />
                <span>{copySuccess ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTradeCard}
                disabled={isExporting || !isValidSetup}
                className={`min-h-[40px] px-5 py-2 rounded-xl text-xs font-mono font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                  isValidSetup
                    ? 'bg-brand hover:bg-brand-hover text-black shadow-brand/20 active:scale-95'
                    : 'bg-term-bg border border-term-border text-slate-500 cursor-not-allowed'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>
                  {isExporting 
                    ? 'Generating...' 
                    : isValidSetup 
                      ? 'Share / Export (.PNG)' 
                      : 'Incomplete'}
                </span>
              </button>
            </div>
          </div>

          {/* DIESER BEREICH WIRD ALS BILD GESPEICHERT */}
          <div
            ref={cardRef}
            className="bg-term-card border border-brand-border/80 rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden"
          >
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
                    {positionType} {parsedLeverage > 0 ? `${parsedLeverage}x` : ''}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-500">
                  Exchange: <strong className="text-slate-300 font-semibold">{currentExchangeConfig.name}</strong> • Fees: <span className="text-slate-400">{makerRate}% Maker</span>
                </p>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-700/60 font-mono text-[10px] text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>READ-ONLY SYNC READY</span>
                </div>
              </div>
            </div>

            {/* 4 SUMMARY METRICS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
              <div className="bg-term-bg border border-term-border p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 font-medium uppercase">Total Net Profit</span>
                <p className={`text-base sm:text-lg font-mono font-bold truncate ${totalNetProfitUSD >= 0 ? 'text-emerald-400' : 'text-[#F23645]'}`}>
                  {totalNetProfitUSD >= 0 ? '+' : ''}${totalNetProfitUSD.toFixed(2)}
                </p>
              </div>

              <div className="bg-term-bg border border-brand-border/60 p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-brand font-medium uppercase">Effective Net RoE</span>
                <p className="text-base sm:text-lg font-mono font-extrabold text-brand truncate">
                  {totalNetRoe >= 0 ? '+' : ''}{totalNetRoe.toFixed(1)}%
                </p>
              </div>

              <div className="bg-term-bg border border-term-border p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 font-medium uppercase">Estimated Fees</span>
                <p className="text-base sm:text-lg font-mono font-bold text-[#F23645] truncate">
                  -${totalFeesUSD.toFixed(2)}
                </p>
              </div>

              <div className="bg-term-bg border border-term-border p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 font-medium uppercase">Market Runner</span>
                <p className="text-base sm:text-lg font-mono font-bold text-slate-300 truncate">
                  {calculatedStages.length > 0 && calculatedStages[calculatedStages.length - 1]
                    ? `${calculatedStages[calculatedStages.length - 1].remainingMarginPct.toFixed(1)}%`
                    : '100%'}
                </p>
              </div>
            </div>

            {/* TP STEPS OVERVIEW */}
            <div className="bg-term-bg border border-term-border rounded-xl p-3.5 space-y-2 font-mono text-xs">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-term-border/60 pb-2">
                <span>Planned Take-Profit Tiers</span>
                <span className="text-slate-400 font-normal">
                  Entry: <strong className="text-white">${parsedEntry > 0 ? parsedEntry.toLocaleString('en-US') : '-'}</strong>
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                {calculatedStages.map((s, idx) => {
                  if (!s) return null
                  return (
                    <div key={s.id} className="flex justify-between items-center text-[11px] text-slate-300 py-0.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Target #{idx + 1} ({s.calculatedTargetPrice > 0 ? `$${s.calculatedTargetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'})
                      </span>
                      <span>
                        +{s.calculatedRoe.toFixed(1)}% RoE • <strong className="text-emerald-400">+{s.netTrancheProfit > 0 ? `$${s.netTrancheProfit.toFixed(2)}` : '$0.00'}</strong> ({s.closePercent || 0}% closed)
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* FOOTER WATERMARK */}
            <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500 border-t border-term-border/50">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Free Calculator → <strong>riskil.app/tools</strong>
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
                Exits Planned. Do You Actually Take Profits Live?
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Most traders fail to secure profits in time, letting green trades slide back into the red.
              <strong> RISKIL</strong> automates your pre-lock discipline before you enter. Secure free early access now.
            </p>
          </div>

          <a
            href="https://riskil.app"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand hover:bg-brand-hover text-black font-mono font-black text-xs transition-all shadow-xl shadow-brand/25 flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
          >
            <span>Secure Early Access</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

      </div>

      {/* ================= MOBILE IMAGE PREVIEW MODAL ================= */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-term-card border border-term-border rounded-2xl w-full max-w-lg p-4 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-term-border pb-3">
              <span className="text-xs font-mono font-bold text-white">Trade Card Ready</span>
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
                Long-press the image to save it to your camera roll.
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
              Done / Close
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
                <h3 className="text-sm font-bold text-white font-mono">Customize Exchange Fees</h3>
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
                Enter your exchange or VIP tier maker and taker fee percentages:
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-black font-extrabold text-xs rounded-xl transition shadow-md shadow-brand/20 cursor-pointer"
                >
                  Save & Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}