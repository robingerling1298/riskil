'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ArrowUpRight, ArrowDownRight, ShieldAlert, Sparkles, Save, Check } from 'lucide-react'

interface RiskCalculatorProps {
  isPro: boolean
  onLogTrade?: (data: any) => void
}

export default function RiskCalculator({ isPro, onLogTrade }: RiskCalculatorProps) {
  // Trade Direction: LONG | SHORT
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG')

  // Inputs
  const [accountSize, setAccountSize] = useState<number>(10000)
  const [riskMode, setRiskMode] = useState<'PERCENT' | 'USD'>('PERCENT')
  const [riskPercent, setRiskPercent] = useState<number>(1)
  const [riskAmountUsd, setRiskAmountUsd] = useState<number>(100)
  
  const [entryPrice, setEntryPrice] = useState<number>(60000)
  const [stopLoss, setStopLoss] = useState<number>(58500)
  const [takeProfit, setTakeProfit] = useState<number>(64500)

  // Status
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)


  // 1. Risikobetrag berechnen
  const calculatedRiskAmount = riskMode === 'PERCENT' 
    ? (accountSize * riskPercent) / 100 
    : riskAmountUsd

  // 2. Preisabstand & Entfernungen
  const isLong = direction === 'LONG'
  const slDistance = isLong ? entryPrice - stopLoss : stopLoss - entryPrice
  const tpDistance = isLong ? takeProfit - entryPrice : entryPrice - takeProfit

  // Validierung: SL muss auf der richtigen Seite liegen
  const isValidSetup = slDistance > 0 && entryPrice > 0

  // 3. Positionsgröße in Coins/Units
  const positionSizeUnits = isValidSetup ? calculatedRiskAmount / slDistance : 0

  // 4. Positionswert in USD (Notional Value)
  const positionSizeUsd = positionSizeUnits * entryPrice

  // 5. Erwarteter Gewinn & RRR (Risk-Reward Ratio)
  const expectedProfit = isValidSetup && tpDistance > 0 ? positionSizeUnits * tpDistance : 0
  const rrr = calculatedRiskAmount > 0 ? expectedProfit / calculatedRiskAmount : 0

  // 6. Empfohlener Mindesthebel (Damit die Position ohne Over-Leveraging eröffnet werden kann)
  const minLeverage = accountSize > 0 ? Math.ceil(positionSizeUsd / accountSize) : 1

  // Speichern ins Cloud-Journal
  const handleSaveToCloud = async () => {
    if (!isPro || !isValidSetup) return

    setIsSaving(true)
    setSaveSuccess(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('calculations').insert({
      user_id: user.id,
      symbol: 'BTC/USDT',
      account_size: accountSize,
      risk_percentage: riskMode === 'PERCENT' ? riskPercent : (riskAmountUsd / accountSize) * 100,
      entry_price: entryPrice,
      stop_loss: stopLoss,
      position_size: positionSizeUnits,
    })

    setIsSaving(false)

    if (!error) {
      setSaveSuccess(true)
      if (onLogTrade) {
        onLogTrade({ entryPrice, stopLoss, positionSize: positionSizeUnits })
      }
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  return (
    <div className="bg-[#0E1117] border border-[#1E222D] rounded-2xl p-5 md:p-6 shadow-2xl space-y-6 text-slate-100">
      
      {/* Top Controls: Long / Short Switcher & Symbol Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#1E222D]">
        <div className="flex items-center gap-2">
          <div className="bg-[#181C26] border border-[#2A2E3D] px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide text-slate-300 font-mono">
            BTC / USDT
          </div>
          <span className="text-xs text-slate-500 font-mono">Spot & Futures</span>
        </div>

        {/* Direction Toggle */}
        <div className="grid grid-cols-2 p-1 bg-[#141722] border border-[#2A2E3D] rounded-xl w-full sm:w-auto">
          <button
            onClick={() => {
              setDirection('LONG')
              if (stopLoss >= entryPrice) setStopLoss(entryPrice * 0.98)
              if (takeProfit <= entryPrice) setTakeProfit(entryPrice * 1.05)
            }}
            className={`flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              isLong
                ? 'bg-[#089981] text-white shadow-lg shadow-[#089981]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            LONG
          </button>
          <button
            onClick={() => {
              setDirection('SHORT')
              if (stopLoss <= entryPrice) setStopLoss(entryPrice * 1.02)
              if (takeProfit >= entryPrice) setTakeProfit(entryPrice * 0.95)
            }}
            className={`flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              !isLong
                ? 'bg-[#F23645] text-white shadow-lg shadow-[#F23645]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            SHORT
          </button>
        </div>
      </div>

      {/* Input Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Kontogröße & Risiko */}
        <div className="bg-[#141722] border border-[#1E222D] p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-slate-400">Kontogröße</label>
            <span className="text-xs font-mono text-slate-500">USD</span>
          </div>
          <input
            type="number"
            value={accountSize}
            onChange={(e) => setAccountSize(Number(e.target.value))}
            className="w-full bg-[#0A0C10] border border-[#2A2E3D] focus:border-[#2962FF] rounded-lg p-2.5 text-lg font-mono font-semibold text-white outline-none transition"
          />

          <div className="pt-2 border-t border-[#1E222D]/60 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-400">Risiko</label>
              <div className="flex bg-[#0A0C10] p-0.5 rounded-md border border-[#2A2E3D] text-[10px] font-mono">
                <button
                  onClick={() => setRiskMode('PERCENT')}
                  className={`px-2 py-0.5 rounded ${riskMode === 'PERCENT' ? 'bg-[#2962FF] text-white' : 'text-slate-400'}`}
                >
                  %
                </button>
                <button
                  onClick={() => setRiskMode('USD')}
                  className={`px-2 py-0.5 rounded ${riskMode === 'USD' ? 'bg-[#2962FF] text-white' : 'text-slate-400'}`}
                >
                  $
                </button>
              </div>
            </div>
            
            {riskMode === 'PERCENT' ? (
              <div className="w-28">
                <input
                  type="number"
                  step="0.1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  className="w-full bg-[#0A0C10] border border-[#2A2E3D] focus:border-[#2962FF] rounded-lg p-1.5 text-right font-mono font-semibold text-sm text-white outline-none"
                />
              </div>
            ) : (
              <div className="w-28">
                <input
                  type="number"
                  value={riskAmountUsd}
                  onChange={(e) => setRiskAmountUsd(Number(e.target.value))}
                  className="w-full bg-[#0A0C10] border border-[#2A2E3D] focus:border-[#2962FF] rounded-lg p-1.5 text-right font-mono font-semibold text-sm text-white outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Einstieg, Stop Loss & Take Profit */}
        <div className="bg-[#141722] border border-[#1E222D] p-4 rounded-xl space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Einstieg</label>
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full bg-[#0A0C10] border border-[#2A2E3D] focus:border-[#2962FF] rounded-lg p-2 text-xs font-mono font-semibold text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#F23645] mb-1">Stop Loss</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="w-full bg-[#0A0C10] border border-[#F23645]/40 focus:border-[#F23645] rounded-lg p-2 text-xs font-mono font-semibold text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#089981] mb-1">Take Profit</label>
              <input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(Number(e.target.value))}
                className="w-full bg-[#0A0C10] border border-[#089981]/40 focus:border-[#089981] rounded-lg p-2 text-xs font-mono font-semibold text-white outline-none"
              />
            </div>
          </div>

          {!isValidSetup && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#F23645] pt-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Ungültiges Setup: Stop Loss muss bei {isLong ? 'Long unter' : 'Short über'} Einstieg liegen.
            </div>
          )}
        </div>
      </div>

      {/* Output Display (Hero Results Card) */}
      <div className="bg-[#0A0C10] border border-[#1E222D] rounded-xl p-5 space-y-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
          Kalkulierte Execution
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Positionsgröße</span>
            <p className="text-xl font-mono font-bold text-blue-400">
              {isValidSetup ? positionSizeUnits.toFixed(4) : '0.0000'} <span className="text-xs font-normal text-slate-400">BTC</span>
            </p>
            <p className="text-[10px] font-mono text-slate-500">
              ≈ ${isValidSetup ? positionSizeUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Max. Risiko</span>
            <p className="text-xl font-mono font-bold text-[#F23645]">
              -${calculatedRiskAmount.toFixed(2)}
            </p>
            <p className="text-[10px] font-mono text-slate-500">
              {accountSize > 0 ? ((calculatedRiskAmount / accountSize) * 100).toFixed(2) : 0}% vom Konto
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Ziel-Gewinn</span>
            <p className="text-xl font-mono font-bold text-[#089981]">
              +${isValidSetup ? expectedProfit.toFixed(2) : '0.00'}
            </p>
            <p className="text-[10px] font-mono text-slate-500">
              Chancen-Risiko: <span className="text-amber-400 font-semibold">{isValidSetup ? rrr.toFixed(2) : '0.00'} RRR</span>
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Empf. Hebel</span>
            <p className="text-xl font-mono font-bold text-amber-400">
              {isValidSetup ? `${minLeverage}x` : '1x'}
            </p>
            <p className="text-[10px] font-mono text-slate-500">Min. Leverage</p>
          </div>
        </div>
      </div>

      {/* Action Area: Cloud Sync & Pro Bar */}
      <div>
        {isPro ? (
          <button
            onClick={handleSaveToCloud}
            disabled={isSaving || !isValidSetup}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 ${
              saveSuccess 
                ? 'bg-[#089981] text-white' 
                : 'bg-[#2962FF] hover:bg-[#1E51E6] text-white shadow-lg shadow-[#2962FF]/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                Setup erfolgreich im Cloud Journal gespeichert!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isSaving ? 'Speichert Setup...' : 'Setup im Cloud Journal protokollieren'}
              </>
            )}
          </button>
        ) : (
          <div className="p-4 bg-[#141722] border border-[#2A2E3D] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Upgrade auf Pro für Cloud Sync</p>
                <p className="text-[11px] text-slate-400">Protokolliere all deine Rechnungen automatisch im Journal.</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-lg transition whitespace-nowrap">
              Jetzt Pro testen
            </button>
          </div>
        )}
      </div>

    </div>
  )
}