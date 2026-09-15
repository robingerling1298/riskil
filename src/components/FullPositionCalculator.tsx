'use client'

import { useState, useMemo } from 'react'
import { 
  ShieldAlert, 
  Target, 
  Percent, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Scale
} from 'lucide-react'

// Types
export interface TakeProfitTarget {
  id: string
  price: number
  percentage: number // Portion of position size to exit (e.g. 50%)
}

export interface FullTradeSetup {
  pair: string
  direction: 'LONG' | 'SHORT'
  accountBalance: number
  riskPercentage: number
  riskAmount: number
  entryPrice: number
  stopLoss: number
  leverage: number
  marginType: 'ISOLATED' | 'CROSS'
  makerFeeRate: number
  takerFeeRate: number
  
  // Calculated Output Properties
  positionSizeCoins: number
  positionSizeUSD: number
  requiredMargin: number
  liquidationPrice: number
  distToLiqPct: number
  isStopLossUnsafe: boolean
  
  priceDistanceSLPct: number
  riskRewardRatio: number
  breakEvenPrice: number
  totalGrossProfitUSD: number
  totalNetProfitUSD: number
  totalFeesUSD: number
  takeProfits: TakeProfitTarget[]
}

interface FullPositionCalculatorProps {
  onLogTrade?: (setup: any) => void
}

export default function FullPositionCalculator({ onLogTrade }: FullPositionCalculatorProps) {
  // --- Basic Inputs ---
  const [pair, setPair] = useState('BTC/USDT')
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG')
  const [accountBalance, setAccountBalance] = useState<number>(10000)
  const [riskPercentage, setRiskPercentage] = useState<number>(1)
  const [entryPrice, setEntryPrice] = useState<number>(65000)
  const [stopLoss, setStopLoss] = useState<number>(63500)
  const [leverage, setLeverage] = useState<number>(10)
  const [marginType, setMarginType] = useState<'ISOLATED' | 'CROSS'>('ISOLATED')

  // --- Fees Settings ---
  const [makerFee, setMakerFee] = useState<number>(0.02) // 0.02%
  const [takerFee, setTakerFee] = useState<number>(0.05) // 0.05%

  // --- Multi-TP Targets ---
  const [takeProfits, setTakeProfits] = useState<TakeProfitTarget[]>([
    { id: '1', price: 68000, percentage: 50 },
    { id: '2', price: 71000, percentage: 50 },
  ])

  // --- Quick Presets ---
  const handleApplyPreset = (type: 'CONSERVATIVE' | 'RUNNER' | 'SCALED') => {
    if (!entryPrice || entryPrice <= 0) return
    const isLong = direction === 'LONG'
    const delta = isLong ? entryPrice * 0.03 : -entryPrice * 0.03

    if (type === 'CONSERVATIVE') {
      setTakeProfits([
        { id: '1', price: Math.round(entryPrice + delta * 1), percentage: 60 },
        { id: '2', price: Math.round(entryPrice + delta * 2), percentage: 40 },
      ])
    } else if (type === 'RUNNER') {
      setTakeProfits([
        { id: '1', price: Math.round(entryPrice + delta * 1), percentage: 40 },
        { id: '2', price: Math.round(entryPrice + delta * 2), percentage: 30 },
        { id: '3', price: Math.round(entryPrice + delta * 3.5), percentage: 30 },
      ])
    } else if (type === 'SCALED') {
      setTakeProfits([
        { id: '1', price: Math.round(entryPrice + delta * 0.8), percentage: 25 },
        { id: '2', price: Math.round(entryPrice + delta * 1.5), percentage: 25 },
        { id: '3', price: Math.round(entryPrice + delta * 2.5), percentage: 25 },
        { id: '4', price: Math.round(entryPrice + delta * 3.8), percentage: 25 },
      ])
    }
  }

  // --- Calculations Engine ---
  const calculations = useMemo(() => {
    const riskUSD = (accountBalance * riskPercentage) / 100
    const isLong = direction === 'LONG'

    // Distance to Stop Loss
    const priceDiffSL = Math.abs(entryPrice - stopLoss)
    const priceDiffSLPct = entryPrice > 0 ? (priceDiffSL / entryPrice) * 100 : 0

    // Position Sizing
    let positionSizeCoins = 0
    let positionSizeUSD = 0
    if (priceDiffSLPct > 0) {
      positionSizeUSD = riskUSD / (priceDiffSLPct / 100)
      positionSizeCoins = positionSizeUSD / entryPrice
    }

    const requiredMargin = leverage > 0 ? positionSizeUSD / leverage : 0

    // Estimated Liquidation Price (Approx. accounting for MMR ~0.5%)
    const mmr = 0.005
    let liqPrice = 0
    if (isLong) {
      liqPrice = entryPrice * (1 - 1 / leverage + mmr)
    } else {
      liqPrice = entryPrice * (1 + 1 / leverage - mmr)
    }
    if (liqPrice < 0) liqPrice = 0

    const distToLiqPct = entryPrice > 0 ? (Math.abs(entryPrice - liqPrice) / entryPrice) * 100 : 0

    // Check if Stop Loss is hit AFTER Liquidation (Danger!)
    const isStopLossUnsafe = isLong ? stopLoss <= liqPrice : stopLoss >= liqPrice

    // Fees Calculation
    const entryFeeUSD = positionSizeUSD * (takerFee / 100)

    // Multi-TP Calculations
    let totalGrossProfitUSD = 0
    let exitFeesUSD = 0
    let totalExitWeightPct = 0

    const tpResults = takeProfits.map((tp) => {
      const exitSizeUSD = positionSizeUSD * (tp.percentage / 100)
      const exitSizeCoins = positionSizeCoins * (tp.percentage / 100)
      const priceChangePct = isLong
        ? (tp.price - entryPrice) / entryPrice
        : (entryPrice - tp.price) / entryPrice

      const grossProfitUSD = exitSizeUSD * priceChangePct
      const feeUSD = exitSizeUSD * (makerFee / 100)

      totalGrossProfitUSD += grossProfitUSD
      exitFeesUSD += feeUSD
      totalExitWeightPct += tp.percentage

      const rrRatioTP = priceDiffSLPct > 0 ? (priceChangePct * 100) / priceDiffSLPct : 0

      return {
        ...tp,
        grossProfitUSD,
        netProfitUSD: grossProfitUSD - feeUSD,
        rrRatio: rrRatioTP,
      }
    })

    const totalFeesUSD = entryFeeUSD + exitFeesUSD
    const totalNetProfitUSD = totalGrossProfitUSD - totalFeesUSD

    // Blended Risk/Reward Ratio
    const blendedRR = riskUSD > 0 ? totalNetProfitUSD / riskUSD : 0

    // Break-Even Price Calculation (Including Fees)
    const roundtripFeePct = (takerFee + makerFee) / 100
    const breakEvenPrice = isLong
      ? entryPrice * (1 + roundtripFeePct)
      : entryPrice * (1 - roundtripFeePct)

    return {
      riskUSD,
      priceDiffSLPct,
      positionSizeUSD,
      positionSizeCoins,
      requiredMargin,
      liqPrice,
      distToLiqPct,
      isStopLossUnsafe,
      entryFeeUSD,
      totalFeesUSD,
      totalGrossProfitUSD,
      totalNetProfitUSD,
      blendedRR,
      breakEvenPrice,
      totalExitWeightPct,
      tpResults,
    }
  }, [
    accountBalance,
    riskPercentage,
    entryPrice,
    stopLoss,
    leverage,
    direction,
    takeProfits,
    makerFee,
    takerFee,
  ])

  // --- Handlers for TP Table ---
  const handleAddTP = () => {
    const nextId = (takeProfits.length + 1).toString()
    const lastPrice = takeProfits.length > 0 ? takeProfits[takeProfits.length - 1].price : entryPrice
    const step = direction === 'LONG' ? entryPrice * 0.02 : -entryPrice * 0.02
    setTakeProfits([...takeProfits, { id: nextId, price: Math.round(lastPrice + step), percentage: 0 }])
  }

  const handleRemoveTP = (id: string) => {
    setTakeProfits(takeProfits.filter((tp) => tp.id !== id))
  }

  const handleUpdateTP = (id: string, field: 'price' | 'percentage', value: number) => {
    setTakeProfits(
      takeProfits.map((tp) => (tp.id === id ? { ...tp, [field]: value } : tp))
    )
  }

  const handleLogClick = () => {
    if (onLogTrade) {
      onLogTrade({
        pair,
        direction,
        entryPrice,
        stopLoss,
        leverage,
        margin: calculations.requiredMargin,
        positionSizeUSD: calculations.positionSizeUSD,
        riskAmount: calculations.riskUSD,
        riskPercentage,
        riskRewardRatio: calculations.blendedRR,
        takeProfits: takeProfits.map((tp) => ({
          targetPrice: tp.price,
          percentage: tp.percentage,
        })),
      })
    }
  }

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* HEADER PRESETS & STRATEGY SELECTION */}
      <div className="bg-term-bg border border-term-border rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* DIRECTION TOGGLE */}
          <div className="bg-term-card p-1 rounded-xl border border-term-border flex items-center">
            <button
              onClick={() => setDirection('LONG')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                direction === 'LONG'
                  ? 'bg-[#089981] text-white shadow-lg shadow-[#089981]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp size={16} /> LONG
            </button>
            <button
              onClick={() => setDirection('SHORT')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                direction === 'SHORT'
                  ? 'bg-[#F23645] text-white shadow-lg shadow-[#F23645]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingDown size={16} /> SHORT
            </button>
          </div>

          {/* PAIR INPUT */}
          <div className="relative">
            <input
              type="text"
              value={pair}
              onChange={(e) => setPair(e.target.value.toUpperCase())}
              className="bg-term-card border border-term-border focus:border-brand rounded-xl px-3.5 py-2 text-xs font-bold text-white w-32 focus:outline-none"
              placeholder="z.B. BTC/USDT"
            />
          </div>
        </div>

        {/* QUICK TP STRATEGY PRESETS */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider hidden sm:inline">
            TP-Presets:
          </span>
          <button
            onClick={() => handleApplyPreset('CONSERVATIVE')}
            className="px-3 py-1.5 rounded-lg bg-term-card hover:bg-term-hover border border-term-border text-[11px] font-semibold text-slate-300 transition"
          >
            Konservativ (60/40)
          </button>
          <button
            onClick={() => handleApplyPreset('RUNNER')}
            className="px-3 py-1.5 rounded-lg bg-term-card hover:bg-term-hover border border-term-border text-[11px] font-semibold text-slate-300 transition"
          >
            Runner (40/30/30)
          </button>
          <button
            onClick={() => handleApplyPreset('SCALED')}
            className="px-3 py-1.5 rounded-lg bg-term-card hover:bg-term-hover border border-term-border text-[11px] font-semibold text-slate-300 transition"
          >
            4-Step Scale
          </button>
        </div>
      </div>

      {/* MAIN GRID: INPUTS vs ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: PARAMETER INPUTS (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-term-bg border border-term-border rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Zap size={15} className="text-brand" /> Trade-Parameter
            </h3>

            {/* Account Balance & Risk % */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Kontogröße ($)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(Number(e.target.value))}
                    className="w-full bg-term-card border border-term-border rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-brand"
                  />
                  <DollarSign size={13} className="absolute right-3 top-2.5 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Risiko (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={riskPercentage}
                    onChange={(e) => setRiskPercentage(Number(e.target.value))}
                    className="w-full bg-term-card border border-term-border rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-brand"
                  />
                  <Percent size={13} className="absolute right-3 top-2.5 text-slate-500" />
                </div>
              </div>
            </div>

            {/* Entry Price & Stop Loss */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Entry Preis ($)</label>
                <input
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(Number(e.target.value))}
                  className="w-full bg-term-card border border-term-border rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Stop-Loss ($)</label>
                <input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  className="w-full bg-term-card border border-term-border rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#F23645]"
                />
              </div>
            </div>

            {/* Leverage Slider */}
            <div className="space-y-2 pt-2 border-t border-term-border">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Hebelwirkungsklassifizierung</span>
                <span className="font-bold text-brand">{leverage}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="125"
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full accent-[#00E676] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1x</span>
                <span>25x</span>
                <span>50x</span>
                <span>100x</span>
                <span>125x</span>
              </div>
            </div>

            {/* Margin Type & Fees Accordion */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Margin Modus</label>
                <select
                  value={marginType}
                  onChange={(e: any) => setMarginType(e.target.value)}
                  className="w-full bg-term-card border border-term-border rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                >
                  <option value="ISOLATED">Isolated</option>
                  <option value="CROSS">Cross</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Gebühren (Taker / Maker %)</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={takerFee}
                    onChange={(e) => setTakerFee(Number(e.target.value))}
                    className="w-1/2 bg-term-card border border-term-border rounded-xl px-2 py-2 text-xs text-center text-slate-300"
                    placeholder="Taker"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={makerFee}
                    onChange={(e) => setMakerFee(Number(e.target.value))}
                    className="w-1/2 bg-term-card border border-term-border rounded-xl px-2 py-2 text-xs text-center text-slate-300"
                    placeholder="Maker"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DANGER WARNING CARD IF SL IS BELOW/ABOVE LIQUIDATION */}
          {calculations.isStopLossUnsafe && (
            <div className="bg-[#2A1015] border border-[#F23645]/40 rounded-2xl p-4 flex items-start gap-3 text-[#F23645]">
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold">Liquidations-Gefahr!</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Dein Stop-Loss liegt außerhalb deines Liquidationspreises (${calculations.liqPrice.toFixed(1)}). 
                  Senke den Hebel oder passe den Stop-Loss an!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: METRICS & TP BUILDER (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* TOP METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-term-bg border border-term-border rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Positionsgröße</span>
              <p className="text-sm font-bold text-white">${calculations.positionSizeUSD.toLocaleString('de-DE', { maximumFractionDigits: 0 })}</p>
              <p className="text-[10px] text-slate-400 font-mono">{calculations.positionSizeCoins.toFixed(4)} Units</p>
            </div>

            <div className="bg-term-bg border border-term-border rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Benötigte Marge</span>
              <p className="text-sm font-bold text-brand">${calculations.requiredMargin.toLocaleString('de-DE', { maximumFractionDigits: 1 })}</p>
              <p className="text-[10px] text-slate-400 font-mono">{leverage}x Effective</p>
            </div>

            <div className="bg-term-bg border border-term-border rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Maximales Risiko</span>
              <p className="text-sm font-bold text-[#F23645]">-${calculations.riskUSD.toFixed(1)}</p>
              <p className="text-[10px] text-slate-400 font-mono">-{calculations.priceDiffSLPct.toFixed(2)}% Distance</p>
            </div>

            <div className="bg-term-bg border border-term-border rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Blended R:R</span>
              <p className={`text-sm font-bold ${calculations.blendedRR >= 2 ? 'text-[#089981]' : calculations.blendedRR >= 1 ? 'text-amber-400' : 'text-[#F23645]'}`}>
                1 : {calculations.blendedRR.toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">Net Profit vs Risk</p>
            </div>
          </div>

          {/* LIQUIDATION & BREAK-EVEN ANALYSIS BANNER */}
          <div className="bg-term-bg border border-term-border rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-term-card text-amber-400 border border-term-border">
                <ShieldAlert size={18} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Est. Liquidation Price</span>
                <p className="text-xs font-bold text-amber-400">${calculations.liqPrice.toFixed(1)}</p>
                <p className="text-[10px] text-slate-400">{calculations.distToLiqPct.toFixed(2)}% vom Entry entfernt</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-term-card text-slate-300 border border-term-border">
                <Scale size={18} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Break-Even (Inkl. Fees)</span>
                <p className="text-xs font-bold text-white">${calculations.breakEvenPrice.toFixed(1)}</p>
                <p className="text-[10px] text-slate-400">Gebühren gesamt: ~${calculations.totalFeesUSD.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* MULTI-TP TARGETS BUILDER */}
          <div className="bg-term-bg border border-term-border rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Target size={15} className="text-[#089981]" /> Take-Profit Targets
              </h3>
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-mono ${calculations.totalExitWeightPct === 100 ? 'text-[#089981]' : 'text-amber-400'}`}>
                  Export Split: {calculations.totalExitWeightPct}% / 100%
                </span>
                <button
                  onClick={handleAddTP}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand hover:bg-brand-hover text-black font-extrabold text-[11px] transition"
                >
                  <Plus size={13} strokeWidth={3} /> TP
                </button>
              </div>
            </div>

            {/* TP LIST TABLE */}
            <div className="space-y-2">
              {takeProfits.map((tp, idx) => {
                const result = calculations.tpResults[idx]
                return (
                  <div
                    key={tp.id}
                    className="bg-term-card border border-term-border rounded-xl p-3 grid grid-cols-12 gap-2 items-center text-xs"
                  >
                    <span className="col-span-1 font-bold text-slate-500">#{idx + 1}</span>

                    {/* Price Input */}
                    <div className="col-span-4">
                      <input
                        type="number"
                        value={tp.price}
                        onChange={(e) => handleUpdateTP(tp.id, 'price', Number(e.target.value))}
                        className="w-full bg-term-bg border border-term-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#089981]"
                        placeholder="Zielpreis"
                      />
                    </div>

                    {/* % Exit Input */}
                    <div className="col-span-3 relative">
                      <input
                        type="number"
                        value={tp.percentage}
                        onChange={(e) => handleUpdateTP(tp.id, 'percentage', Number(e.target.value))}
                        className="w-full bg-term-bg border border-term-border rounded-lg px-2.5 py-1.5 text-xs text-white pr-6 focus:outline-none focus:border-[#089981]"
                        placeholder="%"
                      />
                      <span className="absolute right-2 top-1.5 text-slate-500 text-[10px]">%</span>
                    </div>

                    {/* Net Gain & R:R output */}
                    <div className="col-span-3 text-right">
                      <span className="block font-bold text-[#089981]">
                        +${result?.netProfitUSD.toFixed(1) || '0.0'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        R:R 1:{result?.rrRatio.toFixed(1) || '0.0'}
                      </span>
                    </div>

                    {/* Delete button */}
                    <div className="col-span-1 text-right">
                      <button
                        onClick={() => handleRemoveTP(tp.id)}
                        className="p-1 text-slate-500 hover:text-[#F23645] transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* TOTAL NET PROFIT SUMMARY */}
            <div className="pt-3 border-t border-term-border flex justify-between items-center text-xs">
              <span className="text-slate-400">Erwarteter Netto-Gewinn (nach Gebühren):</span>
              <span className="text-base font-extrabold text-[#089981]">
                +${calculations.totalNetProfitUSD.toFixed(2)} (
                {accountBalance > 0 ? ((calculations.totalNetProfitUSD / accountBalance) * 100).toFixed(2) : 0}%)
              </span>
            </div>
          </div>

          {/* ACTION BUTTON: LOG TO JOURNAL */}
          <button
            onClick={handleLogClick}
            className="w-full py-3.5 rounded-2xl bg-brand hover:bg-brand-hover text-black font-extrabold text-xs tracking-wide shadow-xl shadow-brand-border flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
          >
            <CheckCircle2 size={16} strokeWidth={2.5} /> Vollständiges Setup ins Journal eintragen
          </button>
        </div>
      </div>
    </div>
  )
}