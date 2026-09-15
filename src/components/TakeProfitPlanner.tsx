'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Crown,
  SlidersHorizontal,
  BarChart3,
  TrendingUp,
  PieChart,
  Zap,
  ChevronDown,
  PlusCircle,
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
import { TradeData } from '@/components/LogTradeModal'
import { useAuth } from '@/context/AuthContext'
import {
  useUserPreferences,
  EXCHANGES,
  ExchangeId,
} from '@/context/UserPreferencesContext'
import { supabase } from '@/lib/supabase/client'

interface TpStage {
  id: string
  mode: 'ROE' | 'PRICE'
  roePercent: string
  targetPrice: string
  closePercent: string
}

interface Preset {
  id: string
  label: string
  description: string
  isPro?: boolean
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
    description: '3 Stufen + Rest als Runner',
    isPro: true,
    stages: [
      { roePercent: '25', closePercent: '50' },
      { roePercent: '50', closePercent: '50' },
      { roePercent: '100', closePercent: '60' },
    ],
  },
]

const MAX_FREE_STAGES = 2

interface TakeProfitPlannerProps {
  onOpenPaywall?: () => void
  onLogTrade?: (data: TradeData) => void
}

export default function TakeProfitPlanner({
  onOpenPaywall,
  onLogTrade,
}: TakeProfitPlannerProps) {
  const { isPro } = useAuth()

  // --- Global User Preferences Context ---
  const { defaultExchange, defaultOrderType, getFeeForType } = useUserPreferences()

  const [positionType, setPositionType] = useState<'LONG' | 'SHORT'>('LONG')
  const [margin, setMargin] = useState<string>('')
  const [leverage, setLeverage] = useState<string>('')
  const [entryPrice, setEntryPrice] = useState<string>('')

  // --- Advanced Options / Fee States ---
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false)
  const [selectedExchange, setSelectedExchange] = useState<ExchangeId | 'custom'>(defaultExchange)

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

  const initialOrderKind = defaultOrderType === 'LIMIT' ? 'maker' : 'taker'
  const [entryOrderType, setEntryOrderType] = useState<'maker' | 'taker'>(initialOrderKind)
  const [exitOrderType, setExitOrderType] = useState<'maker' | 'taker'>('maker')

  const [customMakerFee, setCustomMakerFee] = useState<number>(0.02)
  const [customTakerFee, setCustomTakerFee] = useState<number>(0.06)

  // Standard-Initialisierung: 1. TP auf 10% ROE / 100% Verkauf der Restposition
  const [tpStages, setTpStages] = useState<TpStage[]>([
    {
      id: '1',
      mode: 'ROE',
      roePercent: '',
      targetPrice: '',
      closePercent: '',
    },
  ])

  const handleApplyPreset = (preset: Preset) => {
    if (preset.isPro && !isPro) {
      onOpenPaywall?.()
      return
    }

    if (!isPro && preset.stages.length > MAX_FREE_STAGES) {
      onOpenPaywall?.()
      return
    }

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
    if (!isPro && tpStages.length >= MAX_FREE_STAGES) {
      if (onOpenPaywall) onOpenPaywall()
      return
    }
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

  const handleTpStageChange = (
    id: string,
    field: keyof TpStage,
    value: string
  ) => {
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

  // ------------------ CALCULATION ENGINE ------------------
  const parsedMargin = parseFloat(margin) || 0
  const parsedLeverage = parseFloat(leverage) || 1
  const parsedEntry = parseFloat(entryPrice) || 0
  const positionSize = parsedMargin * parsedLeverage

  // Fee Rates ermitteln
  const currentExchangeConfig =
    selectedExchange !== 'custom' ? EXCHANGES[selectedExchange] : null

  // Dynamischer Name der ausgewählten Börse für den Header-Badge
  const displayExchangeName =
    selectedExchange === 'custom'
      ? 'Custom / Manuell'
      : currentExchangeConfig?.name || 'Bitget'

  const makerRate =
    selectedExchange === 'custom'
      ? customMakerFee
      : currentExchangeConfig
      ? currentExchangeConfig.makerFee
      : getFeeForType('LIMIT')

  const takerRate =
    selectedExchange === 'custom'
      ? customTakerFee
      : currentExchangeConfig
      ? currentExchangeConfig.takerFee
      : getFeeForType('MARKET')

  const entryFeeRate = (entryOrderType === 'maker' ? makerRate : takerRate) / 100
  const exitFeeRate = (exitOrderType === 'maker' ? makerRate : takerRate) / 100

  // Entry Fee Berechnung
  const entryFeeUSD = positionSize * entryFeeRate

  const preCalculatedStages = tpStages.map((stage) => {
    let targetPrice = 0
    let roePercent = 0

    if (stage.mode === 'ROE') {
      roePercent = parseFloat(stage.roePercent) || 0
      const priceChangePct = roePercent / parsedLeverage / 100
      targetPrice =
        positionType === 'LONG'
          ? parsedEntry * (1 + priceChangePct)
          : parsedEntry * (1 - priceChangePct)
    } else {
      targetPrice = parseFloat(stage.targetPrice) || 0
      if (parsedEntry > 0) {
        const diff =
          positionType === 'LONG'
            ? targetPrice - parsedEntry
            : parsedEntry - targetPrice
        roePercent = (diff / parsedEntry) * parsedLeverage * 100
      }
    }

    return {
      ...stage,
      targetPrice,
      roePercent,
    }
  })

  const sortedStages = [...preCalculatedStages].sort((a, b) => {
    if (positionType === 'LONG') {
      return a.targetPrice - b.targetPrice
    } else {
      return b.targetPrice - a.targetPrice
    }
  })

  let currentRemainingMargin = parsedMargin
  let totalGrossProfit = 0
  let totalExitFeesUSD = 0
  const processedStagesMap = new Map()

  sortedStages.forEach((stage) => {
    // DYNAMISCHE BERECHNUNG: Schließe X% von der VERBLEIBENDEN Marge
    const closePctOfRemaining = Math.min(100, Math.max(0, parseFloat(stage.closePercent) || 0)) / 100
    const currentTrancheMargin = currentRemainingMargin * closePctOfRemaining
    const trancheProfit = currentTrancheMargin * (stage.roePercent / 100)

    // Tranchen-Ausstiegsgebühr
    const trancheVolumeUSD = currentTrancheMargin * parsedLeverage
    const trancheUnits = parsedEntry > 0 ? trancheVolumeUSD / parsedEntry : 0
    const trancheExitVolumeUSD = trancheUnits * stage.targetPrice
    const trancheExitFee = trancheExitVolumeUSD * exitFeeRate

    totalGrossProfit += trancheProfit
    totalExitFeesUSD += trancheExitFee
    currentRemainingMargin = Math.max(0, currentRemainingMargin - currentTrancheMargin)

    const remainingMarginPct =
      parsedMargin > 0 ? (currentRemainingMargin / parsedMargin) * 100 : 0
    const totalClosedMarginPct =
      parsedMargin > 0 ? ((parsedMargin - currentRemainingMargin) / parsedMargin) * 100 : 0

    processedStagesMap.set(stage.id, {
      ...stage,
      calculatedTargetPrice: stage.targetPrice,
      calculatedRoe: stage.roePercent,
      trancheMargin: currentTrancheMargin,
      trancheProfit,
      trancheExitFee,
      netTrancheProfit: trancheProfit - trancheExitFee,
      remainingMargin: currentRemainingMargin,
      remainingMarginPct,
      totalClosedMarginPct,
    })
  })

  const calculatedStages = tpStages.map((stage) =>
    processedStagesMap.get(stage.id)
  )

  const totalFeesUSD = entryFeeUSD + totalExitFeesUSD
  const totalNetProfitUSD = totalGrossProfit - totalFeesUSD
  const totalNetRoe = parsedMargin > 0 ? (totalNetProfitUSD / parsedMargin) * 100 : 0
  const isMaxReached = !isPro && tpStages.length >= MAX_FREE_STAGES

  // ------------------ CHART DATA GENERATOR ------------------
  let accumProfit = 0
  const chartData = [
    {
      name: 'Einstieg',
      price: parsedEntry,
      gewinn: 0,
      restPosition: 100,
    },
    ...calculatedStages.map((s, idx) => {
      accumProfit += s?.netTrancheProfit || 0
      return {
        name: `TP #${idx + 1}`,
        price: s?.calculatedTargetPrice || 0,
        gewinn: parseFloat(accumProfit.toFixed(2)),
        restPosition: parseFloat((s?.remainingMarginPct || 0).toFixed(1)),
      }
    }),
  ]

  // First TP for Journal Log
  const firstTpPrice = calculatedStages[0]?.calculatedTargetPrice

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-2 sm:p-4 text-slate-200 font-sans tracking-normal">

      {/* 1. POSITION PARAMETER CARD */}
      <div className="relative p-6 bg-term-card border border-term-border rounded-3xl shadow-xl space-y-6">
        
        {/* KOPFZEILE MIT LOGO UND GROSSEM RECHTSBÜNDIGEM BÖRSEN-BADGE */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-term-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand/15 text-brand rounded-xl">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
              1. Position Parameter
            </h3>
          </div>

          {/* Vergrößertes, rechtsbündiges Börsen-Badge */}
          <div className="flex items-center gap-2.5 bg-term-bg px-4 py-2 rounded-xl border border-term-border shadow-sm ml-auto">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                selectedExchange === 'custom'
                  ? 'bg-amber-400'
                  : currentExchangeConfig?.logoColor || 'bg-brand'
              }`}
            />
            <span className="text-sm font-bold font-mono text-white">
              {displayExchangeName}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-brand/10 text-brand font-semibold border border-brand/20">
              {entryOrderType === 'maker'
                ? `Maker (${makerRate}%)`
                : `Taker (${takerRate}%)`}
            </span>
          </div>
        </div>

        {/* LONG / SHORT ORDER-TYP SWITCH (ANALOG ZU MARKET/LIMIT) */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Positions-Richtung</label>
          <div className="grid grid-cols-2 bg-term-bg p-1 border border-term-border rounded-2xl text-xs gap-1">
            <button
              type="button"
              onClick={() => setPositionType('LONG')}
              className={`py-2 rounded-xl font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                positionType === 'LONG'
                  ? 'bg-[#089981] text-white font-bold shadow-[0_0_12px_rgba(8,153,129,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-term-card/40'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>LONG</span>
            </button>

            <button
              type="button"
              onClick={() => setPositionType('SHORT')}
              className={`py-2 rounded-xl font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                positionType === 'SHORT'
                  ? 'bg-[#F23645] text-white font-bold shadow-[0_0_12px_rgba(242,54,69,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-term-card/40'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>SHORT</span>
            </button>
          </div>
        </div>

        {/* ORDER-TYP SWITCH IN VOLLER BREITE ÜBER DEN INPUTS */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Order-Typ Einstieg</label>
          <div className="grid grid-cols-2 bg-term-bg p-1 border border-term-border rounded-2xl text-xs gap-1">
            <button
              type="button"
              onClick={() => setEntryOrderType('maker')}
              className={`py-2 rounded-xl font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                entryOrderType === 'maker'
                  ? 'bg-brand text-black font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-term-card/40'
              }`}
            >
              <span>Limit Order</span>
              <span className="text-[10px] font-normal opacity-80">(Maker Fee: {makerRate}%)</span>
            </button>

            <button
              type="button"
              onClick={() => setEntryOrderType('taker')}
              className={`py-2 rounded-xl font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                entryOrderType === 'taker'
                  ? 'bg-brand text-black font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-term-card/40'
              }`}
            >
              <span>Market Order</span>
              <span className="text-[10px] font-normal opacity-80">(Taker Fee: {takerRate}%)</span>
            </button>
          </div>
        </div>

        {/* INPUT-GRID FÜR MARGE, HEBEL & EINSTIEGSKURS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Marge ($)</label>
            <div className="flex items-center bg-term-bg border border-term-border focus-within:border-brand focus-within:ring-1 focus-within:ring-brand rounded-xl px-3.5 py-2.5 transition">
              <input
                type="number"
                value={margin || ''}
                onChange={(e) => setMargin(e.target.value)}
                placeholder="200"
                className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-600"
              />
              <span className="text-xs font-bold text-brand ml-1.5">$</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Hebel (x)</label>
            <div className="flex items-center bg-term-bg border border-term-border focus-within:border-brand focus-within:ring-1 focus-within:ring-brand rounded-xl px-3.5 py-2.5 transition">
              <input
                type="number"
                value={leverage || ''}
                onChange={(e) => setLeverage(e.target.value)}
                placeholder="10"
                className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-600"
              />
              <span className="text-xs font-bold text-brand ml-1.5">x</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Einstiegskurs ($)</label>
            <div className="flex items-center bg-term-bg border border-term-border focus-within:border-brand focus-within:ring-1 focus-within:ring-brand rounded-xl px-3.5 py-2.5 transition">
              <input
                type="number"
                value={entryPrice || ''}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="85000"
                className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-600"
              />
              <span className="text-xs font-bold text-brand ml-1.5">$</span>
            </div>
          </div>
        </div>

        {/* ADVANCED OPTIONS ACCORDION */}
        <div className="border border-term-border rounded-2xl bg-term-bg/60 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-slate-300 hover:text-white hover:bg-term-card/50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-300">
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand" />
              <span>Erweiterte Optionen: Börsengebühren & Order-Typen Override</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isAdvancedOpen ? 'rotate-180 text-brand' : 'text-slate-500'
              }`}
            />
          </button>

          {isAdvancedOpen && (
            <div className="p-4 border-t border-term-border space-y-4 bg-term-card/80">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">
                  Börse / Plattform Preset Override
                </label>
                <select
                  value={selectedExchange}
                  onChange={(e) =>
                    setSelectedExchange(e.target.value as ExchangeId | 'custom')
                  }
                  className="w-full bg-term-bg border border-term-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand"
                >
                  {(Object.keys(EXCHANGES) as ExchangeId[]).map((exKey) => (
                    <option key={exKey} value={exKey}>
                      {EXCHANGES[exKey].name} ({EXCHANGES[exKey].makerFee}% Maker /{' '}
                      {EXCHANGES[exKey].takerFee}% Taker)
                    </option>
                  ))}
                  <option value="custom">Manuell (Custom Fees)</option>
                </select>
              </div>

              {selectedExchange === 'custom' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs text-slate-400">Maker Fee (%)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={customMakerFee}
                      onChange={(e) =>
                        setCustomMakerFee(parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-term-bg border border-term-border rounded-xl px-3 py-1.5 text-xs text-white mt-1 focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Taker Fee (%)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={customTakerFee}
                      onChange={(e) =>
                        setCustomTakerFee(parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-term-bg border border-term-border rounded-xl px-3 py-1.5 text-xs text-white mt-1 focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="block text-xs text-slate-400 mb-1.5">
                    Einstieg Order-Typ
                  </span>
                  <div className="flex bg-term-bg p-1 rounded-xl border border-term-border">
                    <button
                      type="button"
                      onClick={() => setEntryOrderType('maker')}
                      className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition ${
                        entryOrderType === 'maker'
                          ? 'bg-brand text-black font-bold shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Limit (Maker)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryOrderType('taker')}
                      className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition ${
                        entryOrderType === 'taker'
                          ? 'bg-brand text-black font-bold shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Market (Taker)
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-xs text-slate-400 mb-1.5">
                    Ausstieg (TPs) Order-Typ
                  </span>
                  <div className="flex bg-term-bg p-1 rounded-xl border border-term-border">
                    <button
                      type="button"
                      onClick={() => setExitOrderType('maker')}
                      className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition ${
                        exitOrderType === 'maker'
                          ? 'bg-brand text-black font-bold shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Limit (Maker)
                    </button>
                    <button
                      type="button"
                      onClick={() => setExitOrderType('taker')}
                      className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition ${
                        exitOrderType === 'taker'
                          ? 'bg-brand text-black font-bold shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Market (Taker)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-term-border flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">Gesamte Positionsgröße:</span>
          <span className="font-semibold text-white text-base">
            $
            {positionSize.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {/* STRATEGIE PRESETS BAR */}
      <details className="group border border-term-border rounded-2xl bg-term-card overflow-hidden">
        <summary className="flex items-center justify-between p-4 cursor-pointer list-none select-none hover:bg-term-bg/50 transition duration-150">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Schnell-Presets
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
        </summary>

        <div className="p-4 pt-0 border-t border-term-border/50 mt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="flex flex-col justify-between p-3 bg-term-bg hover:bg-term-card border border-term-border hover:border-brand/50 rounded-2xl transition duration-150 text-left cursor-pointer group/btn shadow-sm"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-white group-hover/btn:text-brand transition">
                    {p.label}
                  </span>
                  {p.isPro && !isPro && (
                    <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  {p.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </details>

      {/* 2. TAKE-PROFIT STAGES SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            2. Take-Profit Stufen ({tpStages.length}
            {!isPro ? `/${MAX_FREE_STAGES}` : ''})
          </h3>
          <span className="text-[11px] text-slate-400 hidden sm:block">
            Prozentualer Verkauf bezieht sich dynamisch auf die verbleibende Restposition
          </span>
        </div>

        <div className="space-y-4">
          {calculatedStages.map((stage, idx) => {
            if (!stage) return null
            const currentRoeVal =
              stage.mode === 'ROE'
                ? String(stage.roePercent)
                : String(Math.round(stage.calculatedRoe))
            const currentCloseVal = String(stage.closePercent)

            return (
              <div
                key={stage.id}
                className="p-5 bg-term-card border border-term-border rounded-2xl space-y-4 shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-term-border">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-brand/15 border border-brand/40 text-brand rounded-lg shrink-0">
                      TP #{idx + 1}
                    </span>

                    <div className="flex items-center bg-term-bg p-1 border border-term-border rounded-xl transition">
                      <div className="flex bg-term-card p-0.5 rounded-lg border border-term-border mr-2">
                        <button
                          type="button"
                          onClick={() => handleTpStageChange(stage.id, 'mode', 'ROE')}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                            stage.mode === 'ROE'
                              ? 'bg-brand text-black font-bold shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          % RoE
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTpStageChange(stage.id, 'mode', 'PRICE')}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                            stage.mode === 'PRICE'
                              ? 'bg-brand text-black font-bold shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          $ Kurs
                        </button>
                      </div>

                      <div className="flex items-center px-2 py-0.5 w-28 md:w-36">
                        <input
                          type="number"
                          placeholder={stage.mode === 'ROE' ? 'z.B. 25' : 'Zielpreis'}
                          value={
                            (stage.mode === 'ROE'
                              ? stage.roePercent
                              : stage.targetPrice) || ''
                          }
                          onChange={(e) =>
                            handleTpStageChange(
                              stage.id,
                              stage.mode === 'ROE' ? 'roePercent' : 'targetPrice',
                              e.target.value
                            )
                          }
                          className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-600"
                        />
                        <span className="text-xs font-bold text-brand ml-1 shrink-0">
                          {stage.mode === 'ROE' ? '%' : '$'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-term-bg p-1 border border-term-border rounded-xl transition">
                      <span className="text-xs text-slate-400 font-medium px-2 shrink-0">
                        Verkauf Restposition:
                      </span>
                      <div className="flex items-center px-2 py-0.5 w-24 md:w-28">
                        <input
                          type="number"
                          placeholder="50"
                          value={stage.closePercent || ''}
                          onChange={(e) =>
                            handleTpStageChange(
                              stage.id,
                              'closePercent',
                              e.target.value
                            )
                          }
                          className="w-full bg-transparent text-sm font-medium text-white outline-none text-right placeholder:text-slate-600"
                        />
                        <span className="text-xs font-bold text-brand ml-1 shrink-0">
                          %
                        </span>
                      </div>
                    </div>

                    {tpStages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTpStage(stage.id)}
                        className="p-2 text-slate-500 hover:text-[#F23645] hover:bg-[#F23645]/10 border border-transparent hover:border-[#F23645]/30 rounded-xl transition cursor-pointer"
                        title="Stufe entfernen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-term-bg border border-term-border p-3.5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">
                        Ziel % ROE{' '}
                        {stage.mode === 'PRICE' &&
                          `(${stage.calculatedRoe.toFixed(1)}%)`}
                      </span>
                      <div className="flex gap-1">
                        {['10', '25', '50', '100'].map((val) => {
                          const isActive = currentRoeVal === val
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleRoeSliderChange(stage.id, val)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition cursor-pointer ${
                                isActive
                                  ? 'border-brand bg-brand text-black font-extrabold shadow-sm'
                                  : 'border-term-border bg-term-card text-slate-400 hover:text-white'
                              }`}
                            >
                              {val}%
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="200"
                      value={
                        stage.mode === 'ROE'
                          ? parseFloat(stage.roePercent) || 0
                          : Math.max(0, stage.calculatedRoe)
                      }
                      onChange={(e) => handleRoeSliderChange(stage.id, e.target.value)}
                      className="w-full h-1.5 bg-term-border rounded-lg appearance-none cursor-pointer accent-brand"
                    />
                  </div>

                  <div className="bg-term-bg border border-term-border p-3.5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">
                        Verkauf % Restposition
                      </span>
                      <div className="flex gap-1">
                        {['25', '50', '75', '100'].map((val) => {
                          const isActive = currentCloseVal === val
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() =>
                                handleTpStageChange(
                                  stage.id,
                                  'closePercent',
                                  val
                                )
                              }
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition cursor-pointer ${
                                isActive
                                  ? 'border-[#089981] bg-[#089981] text-white shadow-sm'
                                  : 'border-term-border bg-term-card text-slate-400 hover:text-white'
                              }`}
                            >
                              {val}%
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={parseFloat(stage.closePercent) || 0}
                      onChange={(e) =>
                        handleTpStageChange(stage.id, 'closePercent', e.target.value)
                      }
                      className="w-full h-1.5 bg-term-border rounded-lg appearance-none cursor-pointer accent-[#089981]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-term-border grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div className="bg-term-bg/50 p-2.5 rounded-xl border border-term-border">
                    <span className="text-slate-400 block text-[10px] mb-0.5">
                      Zielpreis
                    </span>
                    <span className="font-semibold text-white">
                      $
                      {stage.calculatedTargetPrice.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="bg-term-bg/50 p-2.5 rounded-xl border border-term-border">
                    <span className="text-slate-400 block text-[10px] mb-0.5">
                      RoE Ertrag
                    </span>
                    <span
                      className={`font-semibold ${
                        stage.calculatedRoe >= 0
                          ? 'text-[#089981]'
                          : 'text-[#F23645]'
                      }`}
                    >
                      {stage.calculatedRoe >= 0 ? '+' : ''}
                      {stage.calculatedRoe.toFixed(2)}%
                    </span>
                  </div>

                  <div className="bg-term-bg/50 p-2.5 rounded-xl border border-term-border">
                    <span className="text-slate-400 block text-[10px] mb-0.5">
                      Netto-Tranche
                    </span>
                    <span
                      className={`font-semibold ${
                        stage.netTrancheProfit >= 0
                          ? 'text-[#089981]'
                          : 'text-[#F23645]'
                      }`}
                    >
                      {stage.netTrancheProfit >= 0 ? '+' : ''}$
                      {stage.netTrancheProfit.toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-term-bg/50 p-2.5 rounded-xl border border-term-border">
                    <span className="text-slate-400 block text-[10px] mb-0.5">
                      Marge freigesetzt
                    </span>
                    <span className="font-semibold text-brand">
                      ${stage.trancheMargin.toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-term-bg/50 p-2.5 rounded-xl border border-term-border">
                    <span className="text-slate-400 block text-[10px] mb-0.5">
                      Rest-Marge danach
                    </span>
                    <span className="font-semibold text-slate-300">
                      ${stage.remainingMargin.toFixed(2)} (
                      {stage.remainingMarginPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {!isMaxReached ? (
          <button
            type="button"
            onClick={handleAddTpStage}
            className="w-full py-3.5 border border-brand/40 bg-brand/10 hover:bg-brand/20 text-brand hover:text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold transition duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-brand" />
            Weiteren Take-Profit hinzufügen
          </button>
        ) : (
          <div className="p-4 bg-term-card border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.05)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  Free-Limit erreicht ({MAX_FREE_STAGES} Stufen)
                  <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Schalte unbegrenzte TP-Stufen & erweiterte Analytics frei.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenPaywall}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 fill-slate-950" />
              PRO Freischalten
            </button>
          </div>
        )}
      </div>

      {/* 3. TOTAL SUMMARY CARD */}
      <div className="p-6 bg-term-card border border-term-border rounded-3xl shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#089981]/15 text-[#089981] rounded-xl border border-[#089981]/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Kumulierter Netto-Gewinn
              </span>
              <span
                className={`text-xl font-bold ${
                  totalNetProfitUSD >= 0 ? 'text-[#089981]' : 'text-[#F23645]'
                }`}
              >
                {totalNetProfitUSD >= 0 ? '+' : ''}${totalNetProfitUSD.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-medium">
              Effektiver Netto-ROE
            </span>
            <span
              className={`text-xl font-bold ${
                totalNetRoe >= 0 ? 'text-[#089981]' : 'text-[#F23645]'
              }`}
            >
              {totalNetRoe >= 0 ? '+' : ''}
              {totalNetRoe.toFixed(2)}%
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-medium">
              Gebühren gesamt
            </span>
            <span className="text-xl font-bold text-[#F23645]">
              -${totalFeesUSD.toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-medium">
              Verbleibende Position
            </span>
            <span className="text-xl font-bold text-[#089981]">
              {calculatedStages.length > 0 &&
              calculatedStages[calculatedStages.length - 1]
                ? `${calculatedStages[calculatedStages.length - 1].remainingMarginPct.toFixed(
                    1
                  )}%`
                : '100%'}
            </span>
          </div>
        </div>

        {/* VISUAL PIPELINE BAR WEIGHED BY REALIZED PROFIT */}
        <div className="pt-4 border-t border-term-border space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-[#089981]" />
              Gewinn-Verteilung der Tranchen (Brutto)
            </span>
          </div>

          <div className="h-5 w-full bg-term-bg rounded-full p-0.5 border border-term-border flex relative">
            {calculatedStages.map((stage, idx) => {
              if (!stage) return null
              let barWidthPercent = 0
              if (totalGrossProfit > 0) {
                barWidthPercent = (stage.trancheProfit / totalGrossProfit) * 100
              } else {
                barWidthPercent = parsedMargin > 0 ? (stage.trancheMargin / parsedMargin) * 100 : 0
              }

              if (barWidthPercent <= 0) return null

              const colorPalettes = [
                {
                  bar: 'from-[#089981] to-[#10b981]',
                  text: 'text-[#089981]',
                  bgLight: 'bg-[#089981]/20',
                  border: 'border-[#089981]/40',
                },
                {
                  bar: 'from-[#00B4D8] to-[#0077B6]',
                  text: 'text-[#00B4D8]',
                  bgLight: 'bg-[#00B4D8]/20',
                  border: 'border-[#00B4D8]/40',
                },
                {
                  bar: 'from-[#7209B7] to-[#560FA0]',
                  text: 'text-[#B5179E]',
                  bgLight: 'bg-[#7209B7]/20',
                  border: 'border-[#7209B7]/40',
                },
                {
                  bar: 'from-[#F72585] to-[#B5179E]',
                  text: 'text-[#F72585]',
                  bgLight: 'bg-[#F72585]/20',
                  border: 'border-[#F72585]/40',
                },
              ]

              const colors = colorPalettes[idx % colorPalettes.length]
              const trancheClosePct = parseFloat(stage.closePercent) || 0

              const isLastStage = idx === calculatedStages.length - 1
              const remainingMarginPct =
                calculatedStages[calculatedStages.length - 1]
                  ?.remainingMarginPct || 0
              const roundedFullClass =
                isLastStage && remainingMarginPct <= 0.05
                  ? 'rounded-r-full'
                  : ''

              return (
                <div
                  key={stage.id}
                  style={{ width: `${barWidthPercent}%` }}
                  className={`group relative h-full bg-gradient-to-r ${colors.bar} border-r border-term-bg first:rounded-l-full ${roundedFullClass} flex items-center justify-center text-[10px] font-bold text-white cursor-pointer transition-all hover:brightness-125`}
                >
                  {barWidthPercent > 6 && `TP${idx + 1}`}

                  {/* HOVER TOOLTIP */}
                  <div className="pointer-events-none absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-50 w-56 p-3 bg-term-bg/95 backdrop-blur-md border border-term-border rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.8)] text-left">
                    <div className="flex items-center justify-between pb-1.5 border-b border-term-border mb-1.5">
                      <span className={`text-xs font-bold ${colors.text}`}>
                        TP #{idx + 1} Tranche
                      </span>
                      <span
                        className={`text-[10px] font-bold text-white ${colors.bgLight} px-1.5 py-0.5 rounded border ${colors.border}`}
                      >
                        {trancheClosePct}% Verkauf (Rest)
                      </span>
                    </div>

                    <div className="relative">
                      <div
                        className={`space-y-1 text-[11px] transition-all ${
                          !isPro ? 'blur-[3.5px] select-none opacity-60' : ''
                        }`}
                      >
                        <div className="flex justify-between text-slate-400">
                          <span>Zielkurs:</span>
                          <span className="font-semibold text-white">
                            $
                            {stage.calculatedTargetPrice.toLocaleString(
                              'en-US',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Netto-Gewinn:</span>
                          <span className="font-semibold text-[#089981]">
                            +${stage.netTrancheProfit.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Exit Fee:</span>
                          <span className="font-semibold text-[#F23645]">
                            -${stage.trancheExitFee.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {!isPro && (
                        <div className="absolute inset-0 flex items-center justify-center bg-term-bg/40 rounded-lg">
                          <span className="flex items-center gap-1 text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full shadow-lg border border-amber-500/30 tracking-wider uppercase">
                            <Crown className="w-3 h-3 fill-amber-400 text-amber-400" />{' '}
                            PRO Feature
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-term-border" />
                  </div>
                </div>
              )
            })}

            {(calculatedStages[calculatedStages.length - 1]?.remainingMarginPct ||
              0) > 0.05 && (
              <div className="group relative flex-1 bg-brand/25 hover:bg-brand/40 h-full rounded-r-full cursor-pointer transition-all">
                <div className="pointer-events-none absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-50 px-3 py-2 bg-term-bg border border-term-border rounded-xl shadow-xl text-left whitespace-nowrap">
                  <span className="text-xs font-semibold text-brand block">
                    Offene Restposition:{' '}
                    {calculatedStages[
                      calculatedStages.length - 1
                    ]?.remainingMarginPct.toFixed(1)}
                    %
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Verbleibt nach allen Take-Profits im Markt
                  </span>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-term-border" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* JOURNAL TRIGGER BUTTON */}
        {parsedEntry > 0 && parsedMargin > 0 && onLogTrade && (
          <button
            type="button"
            onClick={() =>
              onLogTrade({
                pair: 'BTC/USDT',
                direction: positionType,
                entryPrice: Number(parsedEntry.toFixed(2)),
                leverage: Number(parsedLeverage.toFixed(2)) || 1,
                margin: Number(parsedMargin.toFixed(2)),
                takeProfit:
                  firstTpPrice && firstTpPrice > 0
                    ? Number(firstTpPrice.toFixed(2))
                    : undefined,
              })
            }
            className="w-full flex items-center justify-center gap-2 bg-brand text-black font-extrabold py-3 px-4 rounded-xl text-xs hover:brightness-110 transition-all shadow-lg mt-4 cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>Trade zum Journal hinzufügen</span>
          </button>
        )}
      </div>

      {/* 4. VISUAL CHART CARD */}
      <div className="relative p-6 bg-term-card border border-term-border rounded-3xl space-y-4 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#089981]/15 text-[#089981] rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wide">
                Gewinn- & Positionsverlauf
              </h3>
              <p className="text-[11px] text-slate-400">
                Grün: Kumulierter Netto-Gewinn ($) | Marke: Rest-Position (%)
              </p>
            </div>
          </div>

          {!isPro && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
              <Crown className="w-3 h-3 fill-amber-400" /> PRO Feature
            </span>
          )}
        </div>

        {/* CHART CONTENT CONTAINER */}
        <div className="relative h-64 w-full pt-2">
          <div
            className={`h-full w-full transition-all duration-300 ${
              !isPro ? 'blur-sm select-none opacity-40' : ''
            }`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#089981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#089981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-term-border, #1C2434)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#089981"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="var(--color-brand, #2962FF)"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-term-bg, #07090E)',
                    borderColor: 'var(--color-term-border, #232D42)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="gewinn"
                  stroke="#089981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#profitGrad)"
                  name="Netto-Gewinn ($)"
                />
                <Line
                  yAxisId="right"
                  type="stepAfter"
                  dataKey="restPosition"
                  stroke="var(--color-brand, #2962FF)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--color-brand, #2962FF)' }}
                  name="Rest-Position (%)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {!isPro && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-term-bg/30 backdrop-blur-[2px]">
              <div className="p-5 bg-term-card/90 border border-amber-500/30 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.8)] text-center max-w-sm space-y-3">
                <div className="w-10 h-10 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                  <Crown className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                    Visuelle Ertrags-Analyse
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Schalte den Verlaufsgraphen frei, um den kumulierten
                    Netto-Gewinn und Restpositionen über alle Stufen hinweg zu
                    visualisieren.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenPaywall}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl transition shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 fill-slate-950" />
                  Jetzt PRO freischalten
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}