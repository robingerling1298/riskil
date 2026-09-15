'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Zap, BrainCircuit, Activity, Lock, X, ShieldAlert, CheckCircle2, Layers, SlidersHorizontal, AlertTriangle, Target } from 'lucide-react'

const SETUP_CLASSES = ['Setup A: Perfekt', 'Setup B: Suboptimal', 'Setup C: Impulsiv / FOMO']
const MENTAL_STATES = ['Fokus', 'FOMO', 'Müde', 'Frustriert (Revenge)', 'Gelangweilt', 'Überzeugt']
const CONFLUENCES = ['Orderblock', 'Fibonacci', 'Imbalance', 'CVD-Divergenz', 'Liq-Cluster', 'Trendlinienbruch', 'Support/Resistance']

interface ActivePositionsProps {
  positions: any[]
  userTier?: string
  initialActiveTags?: Record<string, string[]>
  initialPreTrades?: Record<string, { energy: number, conviction: number, locked: boolean, initialSize?: number, preNotes?: string }>
  historicalTrades?: any[]
}

export default function ActivePositions({ 
  positions, 
  userTier = 'FREE', 
  initialActiveTags = {}, 
  initialPreTrades = {},
  historicalTrades = [] 
}: ActivePositionsProps) {
  
  const [activeTags, setActiveTags] = useState<Record<string, string[]>>(initialActiveTags)
  const [preTradeData, setPreTradeData] = useState<Record<string, { energy: number, conviction: number, locked: boolean, initialSize?: number, preNotes?: string }>>(initialPreTrades)
  
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({})
  const [justLockedSymbols, setJustLockedSymbols] = useState<Record<string, boolean>>({})
  const [liveWarnings, setLiveWarnings] = useState<Record<string, { tag: string, pnl: number, count: number, winrate: number } | null>>({})
  const [showWarningModal, setShowWarningModal] = useState<{ open: boolean, uniqueKey: string } | null>(null)

  // 💥 Verhindert das Überschreiben deiner Klicks durch das Hintergrund-Polling:
  // Server-Updates werden nur eingespielt, wenn der Key lokal noch gar nicht existiert oder bereits gelockt ist.
  useEffect(() => {
    if (initialActiveTags && Object.keys(initialActiveTags).length > 0) {
      setActiveTags(prev => {
        const next = { ...prev }
        Object.entries(initialActiveTags).forEach(([k, tags]) => {
          if (!next[k] || preTradeData[k]?.locked) {
            next[k] = tags
          }
        })
        return next
      })
    }

    if (initialPreTrades && Object.keys(initialPreTrades).length > 0) {
      setPreTradeData(prev => {
        const next = { ...prev }
        Object.entries(initialPreTrades).forEach(([k, data]) => {
          if (!next[k] || next[k].locked || data.locked) {
            next[k] = { ...data, preNotes: localNotes[k] !== undefined ? localNotes[k] : data.preNotes }
          }
        })
        return next
      })
    }
  }, [initialActiveTags, initialPreTrades])

  const tagStats = useMemo(() => {
    const stats: Record<string, { pnl: number; count: number; wins: number }> = {}
    historicalTrades.forEach(trade => {
      const pnl = Number(trade.pnl || 0)
      const isWin = pnl >= 0
      const tags = trade.entry_tags || []
      
      tags.forEach((tag: string) => {
        if (!stats[tag]) stats[tag] = { pnl: 0, count: 0, wins: 0 }
        stats[tag].pnl += pnl
        stats[tag].count += 1
        if (isWin) stats[tag].wins += 1
      })
    })
    return stats
  }, [historicalTrades])

  const toggleTag = async (uniqueKey: string, tag: string, exclusiveGroup?: string[]) => {
    const isLocked = preTradeData[uniqueKey]?.locked
    if (isLocked) return

    let current = [...(activeTags[uniqueKey] || [])]

    if (exclusiveGroup) {
      const isCurrentlySelected = current.includes(tag)
      current = current.filter(t => !exclusiveGroup.includes(t))
      if (!isCurrentlySelected) current.push(tag)
    } else {
      if (current.includes(tag)) {
        current = current.filter(t => t !== tag)
      } else {
        current.push(tag)
      }
    }

    // Sofort im lokalen UI verankern – bleibt ohne Verzögerung ausgewählt
    setActiveTags(prev => ({ ...prev, [uniqueKey]: current }))

    if (current.includes(tag)) {
      const stats = tagStats[tag]
      if (stats && stats.pnl < 0 && stats.count > 1) {
        const winrate = (stats.wins / stats.count) * 100
        setLiveWarnings(prev => ({
          ...prev,
          [uniqueKey]: { tag, pnl: stats.pnl, count: stats.count, winrate }
        }))
      }
    } else {
      setLiveWarnings(prev => ({ ...prev, [uniqueKey]: null }))
    }

    try {
      await fetch('/api/exchange/active-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: uniqueKey, tags: current }),
      })
    } catch (err) { console.error(err) }
  }

  const handleSliderUpdate = async (uniqueKey: string, field: 'energy' | 'conviction', value: number) => {
    const isLocked = preTradeData[uniqueKey]?.locked
    if (isLocked) return
    
    const currentData = preTradeData[uniqueKey] || { energy: 80, conviction: 5, locked: false, preNotes: '' }
    const updatedData = { ...currentData, [field]: value }

    setPreTradeData(prev => ({ ...prev, [uniqueKey]: updatedData }))

    try {
      await fetch('/api/exchange/active-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbol: uniqueKey, 
          energy: updatedData.energy,
          conviction: updatedData.conviction
        }),
      })
    } catch (err) { console.error(err) }
  }

  const saveNoteToDb = async (uniqueKey: string) => {
    const note = localNotes[uniqueKey] || ''
    try {
      await fetch('/api/exchange/active-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: uniqueKey, preNotes: note }),
      })
    } catch (err) { console.error(err) }
  }

  const handleLockPreTrade = async (uniqueKey: string, currentSize: number) => {
    const currentSymbolData = preTradeData[uniqueKey] || { energy: 80, conviction: 5, locked: false, preNotes: '' }
    const finalNote = localNotes[uniqueKey] !== undefined ? localNotes[uniqueKey] : currentSymbolData.preNotes
    const updatedData = { ...currentSymbolData, preNotes: finalNote, locked: true, initialSize: currentSize }

    setPreTradeData(prev => ({ ...prev, [uniqueKey]: updatedData }))

    setJustLockedSymbols(prev => ({ ...prev, [uniqueKey]: true }))
    setTimeout(() => {
      setJustLockedSymbols(prev => ({ ...prev, [uniqueKey]: false }))
    }, 3500)
    
    try {
      await fetch('/api/exchange/active-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbol: uniqueKey, 
          tags: activeTags[uniqueKey] || [],
          energy: updatedData.energy,
          conviction: updatedData.conviction,
          preNotes: updatedData.preNotes,
          locked: true,
          initialSize: currentSize
        }),
      })
    } catch (err) { console.error(err) }
  }

  const confirmUnlock = async () => {
    if (!showWarningModal) return
    const { uniqueKey } = showWarningModal
    setShowWarningModal(null)
    
    const unlockedData = { energy: 80, conviction: 5, locked: false, initialSize: 0, preNotes: localNotes[uniqueKey] || '' }
    setPreTradeData(prev => ({ ...prev, [uniqueKey]: unlockedData }))
    
    try {
      await fetch('/api/exchange/active-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbol: uniqueKey, 
          tags: activeTags[uniqueKey] || [],
          energy: 80,
          conviction: 5,
          preNotes: unlockedData.preNotes,
          locked: false,
          initialSize: 0
        }),
      })
    } catch (err) { console.error(err) }
  }

  if (!positions || positions.length === 0) {
    return (
      <div className="p-6 bg-[#0B0E14] border border-[#161A23] rounded-2xl flex flex-col items-center justify-center text-slate-500 space-y-3 shadow-sm">
        <Zap className="w-8 h-8 opacity-20" />
        <p className="text-xs font-medium uppercase tracking-wider">Keine offenen Positionen</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <Activity className="w-3 h-3 text-[#089981]" /> Live Positions & Eröffnungsanalyse
      </h3>

      <div className="grid grid-cols-1 gap-4">
        {positions.map((pos, idx) => {
          const rawSide = pos.side || pos.info?.posSide || pos.info?.holdSide || (Number(pos.contracts || pos.size || 0) >= 0 ? 'LONG' : 'SHORT')
          const side = String(rawSide).toUpperCase().includes('SHORT') ? 'SHORT' : 'LONG'
          const symbol = pos.symbol
          const marginCoin = pos.marginCoin || 'USDT'
          
          // Eindeutige Kennung je Markt, Richtung und Margin
          const uniqueKey = `${symbol}-${side}-${marginCoin}`

          const pnl = Number(pos.unrealizedPnl || pos.info?.unrealizedPL || 0)
          const entryPrice = Number(pos.entryPrice || pos.info?.averageOpenPrice || 0)
          const markPrice = Number(pos.markPrice || pos.info?.markPrice || 0)
          const size = Number(pos.contracts || pos.size || pos.info?.size || 0)
          const absoluteSize = Math.abs(size)
          const leverage = Number(pos.leverage || pos.info?.leverage || 1)
          
          const initialMargin = (absoluteSize * entryPrice) / leverage
          const pnlPercent = initialMargin > 0 ? (pnl / initialMargin) * 100 : 0

          const isLong = side === 'LONG'
          const selected = activeTags[uniqueKey] || []
          const currentWarning = liveWarnings[uniqueKey]
          const hasWarning = !!currentWarning
          
          const pData = preTradeData[uniqueKey] || { energy: 80, conviction: 5, locked: false, initialSize: 0, preNotes: '' }
          const currentLocalNote = localNotes[uniqueKey] !== undefined ? localNotes[uniqueKey] : (pData.preNotes || '')

          const initialDbSize = pData.initialSize || 0
          const isScaleIn = pData.locked && initialDbSize > 0 && absoluteSize > (initialDbSize * 1.001)
          const showJustLockedBanner = justLockedSymbols[uniqueKey]

          return (
            <div key={idx} className={`bg-[#0B0E14] border rounded-xl transition-all duration-300 relative overflow-hidden ${hasWarning ? 'border-[#089981]/50 shadow-[0_0_20px_rgba(8,153,129,0.1)]' : 'border-[#161A23] hover:border-[#222938]'}`}>
              {hasWarning && <div className="absolute top-0 right-0 w-64 h-64 bg-[#089981]/5 rounded-full blur-3xl animate-pulse pointer-events-none" />}

              <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10 items-stretch">
                {/* METRICS PANEL */}
                <div className={`${pData.locked && !showJustLockedBanner ? 'lg:col-span-4' : 'lg:col-span-5'} space-y-3 bg-[#07090E]/60 p-4 rounded-xl border border-[#161A23] flex flex-col justify-between transition-all duration-300`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${isLong ? 'bg-[#089981]/10 text-[#089981] border border-[#089981]/20' : 'bg-[#F23645]/10 text-[#F23645] border border-[#F23645]/20'}`}>
                        {side} {leverage}x ({marginCoin})
                      </span>
                      <span className="font-bold text-slate-200 text-xs font-mono">{symbol}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Live PnL</span>
                      <div className="flex items-baseline gap-2">
                        <span className={`font-mono font-black text-lg ${pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} <span className="text-xs font-normal">{marginCoin}</span>
                        </span>
                        <span className={`font-mono font-bold text-xs ${pnlPercent >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                          ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#161A23] grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Entry Preis</span>
                      <span className="text-slate-200 font-bold">${entryPrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Marktkurs</span>
                      <span className="text-slate-200 font-bold">${markPrice ? markPrice.toLocaleString() : '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Größe</span>
                      <span className="text-slate-200 font-bold">{absoluteSize}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Status</span>
                      <span className={pData.locked ? "text-[#089981] font-bold flex items-center gap-1" : "text-amber-400 font-bold flex items-center gap-1"}>
                        <Lock size={10} /> {pData.locked ? 'Active' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {selected.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {selected.filter(t => !SETUP_CLASSES.includes(t) && !MENTAL_STATES.includes(t)).map((t: string) => (
                        <span key={t} className="px-1.5 py-0.5 bg-[#161A23] text-[9px] rounded text-slate-400 font-mono">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* ERÖFFNUNGSANALYSE PANEL */}
                <div className={`${pData.locked && !showJustLockedBanner ? 'lg:col-span-8' : 'lg:col-span-7'} space-y-5 flex flex-col justify-center transition-all duration-300`}>
                  {showJustLockedBanner ? (
                    <div className="flex flex-col items-center justify-center py-8 bg-[#089981]/10 border border-[#089981]/30 rounded-xl space-y-2 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300 h-full">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#089981]/20 rounded-full blur-xl pointer-events-none" />
                      <Lock className="w-7 h-7 text-[#089981] animate-bounce" />
                      <p className="text-xs font-black text-[#089981] tracking-wide uppercase">Eröffnungsanalyse gesichert</p>
                      <p className="text-[10px] text-slate-300">Ehrlichkeits-Filter aktiv. Keine Änderungen mehr möglich.</p>
                    </div>
                  ) : isScaleIn ? (
                    <div className="flex flex-col items-center justify-center py-6 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-2 relative overflow-hidden h-full group">
                      <button 
                        onClick={() => setShowWarningModal({ open: true, uniqueKey })}
                        className="absolute top-3 right-3 px-2.5 py-1 bg-[#161A23]/80 hover:bg-[#222938] border border-[#222938] hover:border-slate-600 rounded-lg text-[10px] font-semibold text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-blue-400" />
                        <span>Parameter anpassen</span>
                      </button>
                      <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                      <Layers className="w-5 h-5 text-blue-400" />
                      <p className="text-xs font-bold text-blue-400">Scale-In / Limit-Order ausgeführt</p>
                      <p className="text-[10px] text-slate-400 text-center max-w-xs">
                        Die Position wurde vergrößert. Die ursprüngliche Eröffnungsanalyse wird beibehalten.
                      </p>
                    </div>
                  ) : pData.locked ? (
                    <div className="flex flex-col items-center justify-center py-8 bg-[#07090E] border border-[#161A23] rounded-2xl space-y-2 text-slate-400 h-full relative group">
                      <button 
                        onClick={() => setShowWarningModal({ open: true, uniqueKey })}
                        className="absolute top-3 right-3 px-2.5 py-1 bg-[#161A23]/80 hover:bg-[#222938] border border-[#222938] hover:border-slate-600 rounded-lg text-[10px] font-semibold text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-[#089981]" />
                        <span>Parameter anpassen</span>
                      </button>
                      <div className="w-7 h-7 rounded-full bg-[#089981]/15 text-[#089981] border border-[#089981]/30 flex items-center justify-center mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-white tracking-wide">Trade läuft im Live-Modus</p>
                      <p className="text-[10px] text-slate-500">Eröffnungsanalyse erfolgreich verriegelt.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* 1. Setup Klasse */}
                      <div>
                        <p className="text-[10px] text-slate-500 mb-1.5 font-medium flex items-center gap-1.5 uppercase tracking-wider">
                          <Target className="w-3 h-3" /> 1. Setup-Klasse
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {SETUP_CLASSES.map(cls => {
                            const isActive = selected.includes(cls)
                            const isC = cls.includes('Setup C')
                            return (
                              <button
                                key={cls}
                                type="button"
                                onClick={() => toggleTag(uniqueKey, cls, SETUP_CLASSES)}
                                className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all duration-200 cursor-pointer text-left ${
                                  isActive
                                    ? isC 
                                      ? 'bg-[#F23645]/15 border-[#F23645]/40 text-[#F23645]'
                                      : 'bg-brand/15 border-brand/40 text-brand'
                                    : 'bg-[#161A23] border-[#222938] text-slate-400 hover:border-brand/50 hover:text-slate-200'
                                }`}
                              >
                                {cls}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 2. Mental State */}
                        <div>
                          <p className="text-[10px] text-slate-500 mb-1.5 font-medium flex items-center gap-1.5 uppercase tracking-wider">
                            <BrainCircuit className="w-3 h-3" /> 2. Mentale Verfassung
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {MENTAL_STATES.map(state => {
                              const isActive = selected.includes(state)
                              const isToxic = state === 'FOMO' || state.includes('Frustriert') || state === 'Gelangweilt'
                              return (
                                <button
                                  key={state}
                                  type="button"
                                  onClick={() => toggleTag(uniqueKey, state, MENTAL_STATES)}
                                  className={`px-2.5 py-1 rounded-md border text-[10px] font-medium transition-all duration-200 cursor-pointer ${
                                    isActive
                                      ? isToxic 
                                        ? 'bg-[#F23645]/15 border-[#F23645]/40 text-[#F23645]'
                                        : 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                                      : 'bg-[#161A23] border-[#222938] text-slate-400 hover:border-blue-500/50 hover:text-slate-200'
                                  }`}
                                >
                                  {state}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* 3. Confluences */}
                        <div>
                          <p className="text-[10px] text-slate-500 mb-1.5 font-medium flex items-center gap-1.5 uppercase tracking-wider">
                            <Layers className="w-3 h-3" /> 3. Konfluenz-Faktoren
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {CONFLUENCES.map(tag => {
                              const isActive = selected.includes(tag)
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => toggleTag(uniqueKey, tag)}
                                  className={`px-2 py-1 rounded-md border text-[10px] font-medium transition-all duration-200 cursor-pointer ${
                                    isActive
                                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                                      : 'bg-[#161A23] border-[#222938] text-slate-400 hover:border-amber-500/50 hover:text-slate-200'
                                  }`}
                                >
                                  {tag}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* 4. Eröffnungsnotiz & Conviction */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#161A23]">
                        <div>
                          <label className="text-[10px] text-slate-500 mb-1.5 font-medium flex items-center justify-between uppercase tracking-wider">
                            Eröffnungsnotiz (Optional)
                          </label>
                          <textarea
                            value={currentLocalNote}
                            onChange={(e) => setLocalNotes(prev => ({ ...prev, [uniqueKey]: e.target.value }))}
                            onBlur={() => saveNoteToDb(uniqueKey)}
                            placeholder="Erwartungshaltung, Besonderheiten..."
                            className="w-full bg-[#161A23] border border-[#222938] focus:border-brand rounded-xl p-2.5 text-xs text-white outline-none min-h-[60px]"
                          />
                        </div>

                        <div className="flex flex-col justify-center">
                          <label className="text-[10px] text-slate-500 mb-1 font-medium flex items-center justify-between">
                            <span className="uppercase tracking-wider">Conviction Score</span>
                            <span className={`font-mono font-bold ${pData.conviction >= 8 ? 'text-[#089981]' : pData.conviction >= 5 ? 'text-amber-400' : 'text-[#F23645]'}`}>
                              {pData.conviction || 5} / 10
                            </span>
                          </label>
                          <input 
                            type="range" min="1" max="10" 
                            value={pData.conviction || 5} 
                            onChange={(e) => handleSliderUpdate(uniqueKey, 'conviction', Number(e.target.value))}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer mt-1 bg-[#161A23] accent-brand"
                          />
                          <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                            <span>Zweifel</span><span>Absolut sicher</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleLockPreTrade(uniqueKey, absoluteSize)}
                          disabled={!selected.some(t => SETUP_CLASSES.includes(t)) || !selected.some(t => MENTAL_STATES.includes(t))}
                          className="w-full py-3 bg-[#089981] hover:bg-[#067a67] disabled:bg-[#161A23] disabled:text-slate-600 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-[#089981]/20 disabled:shadow-none cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" /> Einstiegsanalyse sichern
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {hasWarning && currentWarning && (
                <div className="border-t border-[#089981]/20 bg-[#089981]/10 p-3.5 sm:px-5 flex items-start gap-3 animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="p-1.5 bg-[#089981]/20 rounded-lg shrink-0 mt-0.5 border border-[#089981]/30">
                    <ShieldAlert className="w-4 h-4 text-[#089981]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-black text-[#089981] flex items-center gap-2 uppercase tracking-wide">
                      Historischer Reality Check
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Deine letzten <strong className="text-white">{currentWarning.count} Trades</strong> mit dem Tag <span className="bg-[#089981]/20 px-1 py-0.5 rounded text-[#089981] font-mono">#{currentWarning.tag}</span> endeten mit einer Winrate von <strong className="text-white">{currentWarning.winrate.toFixed(0)}%</strong> und einem Verlust von <strong className="text-[#F23645]">${Math.abs(currentWarning.pnl).toFixed(2)}</strong>. 
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setLiveWarnings(prev => ({ ...prev, [uniqueKey]: null }))} 
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-[#089981]/10 rounded-md transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0D111A] border border-[#1A202C] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center gap-3 text-amber-400 pb-2 border-b border-[#161B26]">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Parameter nachträglich anpassen?</h4>
                <p className="text-[11px] text-slate-400">Verfälschung der Journal-Integrität</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Das nachträgliche Anpassen deiner Parameter während des Trades führt zu <strong>Hindsight Bias (Rückschaufehler)</strong> und verfälscht deine statistischen Auswertungen.
            </p>
            <p className="text-xs text-slate-400">
              Möchtest du die gelockte Eröffnungsanalyse für diesen Trade wirklich wieder freigeben?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setShowWarningModal(null)}
                className="px-4 py-2 bg-[#161A23] hover:bg-[#222938] text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Abbrechen
              </button>
              <button 
                type="button"
                onClick={confirmUnlock}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Trotzdem anpassen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}