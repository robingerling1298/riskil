'use client'

import { useState, useEffect, useMemo } from 'react'
import { Zap, BrainCircuit, Activity, Lock, X, ShieldAlert, CheckCircle2, Layers, SlidersHorizontal, AlertTriangle, Target, Settings2 } from 'lucide-react'
import TagManagerModal from '@/components/TagManagerModal'
import { useGlobalTags } from '@/context/CustomTagsContext'

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
  // Globaler Tag Context statt lokalem State
  const { customTags, updateTags, resetToDefaults } = useGlobalTags()
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false)

  const [activeTags, setActiveTags] = useState<Record<string, string[]>>(initialActiveTags)
  const [preTradeData, setPreTradeData] = useState<Record<string, { energy: number, conviction: number, locked: boolean, initialSize?: number, preNotes?: string }>>(initialPreTrades)
  
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({})
  const [justLockedSymbols, setJustLockedSymbols] = useState<Record<string, boolean>>({})
  const [liveWarnings, setLiveWarnings] = useState<Record<string, { tag: string, pnl: number, count: number, winrate: number } | null>>({})
  const [showWarningModal, setShowWarningModal] = useState<{ open: boolean, uniqueKey: string } | null>(null)

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
      <div className="p-5 sm:p-6 bg-[#0B0E14] border border-[#161A23] rounded-2xl flex flex-col items-center justify-center text-slate-500 space-y-3 shadow-sm">
        <Zap className="w-8 h-8 opacity-20" />
        <p className="text-xs font-medium uppercase tracking-wider">Keine offenen Positionen</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-0.5">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#089981]" /> Live Positions & Eröffnungsanalyse
        </h3>

        <button
          type="button"
          onClick={() => setIsTagManagerOpen(true)}
          className="px-2.5 py-1 bg-[#121622] hover:bg-[#161B26] border border-[#1E2536] hover:border-brand rounded-xl text-xs font-mono text-brand flex items-center gap-1.5 transition cursor-pointer"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Tags anpassen</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {positions.map((pos, idx) => {
          const rawSide = pos.side || pos.info?.posSide || pos.info?.holdSide || (Number(pos.contracts || pos.size || 0) >= 0 ? 'LONG' : 'SHORT')
          const side = String(rawSide).toUpperCase().includes('SHORT') ? 'SHORT' : 'LONG'
          const symbol = pos.symbol
          const marginCoin = pos.marginCoin || 'USDT'
          
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
            <div key={idx} className={`bg-[#0B0E14] border rounded-2xl transition-all duration-300 relative overflow-hidden ${hasWarning ? 'border-[#089981]/50 shadow-[0_0_20px_rgba(8,153,129,0.1)]' : 'border-[#161A23] hover:border-[#222938]'}`}>
              {hasWarning && <div className="absolute top-0 right-0 w-64 h-64 bg-[#089981]/5 rounded-full blur-3xl animate-pulse pointer-events-none" />}

              <div className="p-3.5 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 relative z-10 items-stretch">
                <div className={`${pData.locked && !showJustLockedBanner ? 'lg:col-span-4' : 'lg:col-span-5'} space-y-3 bg-[#07090E]/80 p-3.5 sm:p-4 rounded-xl border border-[#161A23] flex flex-col justify-between transition-all duration-300`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase font-mono ${isLong ? 'bg-[#089981]/15 text-[#089981] border border-[#089981]/30' : 'bg-[#F23645]/15 text-[#F23645] border border-[#F23645]/30'}`}>
                        {side} {leverage}x ({marginCoin})
                      </span>
                      <span className="font-bold text-white text-xs sm:text-sm font-mono">{symbol}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Live PnL</span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className={`font-mono font-black text-xl sm:text-2xl ${pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} <span className="text-xs font-normal">{marginCoin}</span>
                        </span>
                        <span className={`font-mono font-bold text-xs ${pnlPercent >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                          ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#161A23] grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-[#0B0E14] p-2 rounded-lg border border-[#161A23]/60">
                      <span className="text-slate-500 block text-[9px] uppercase">Entry Preis</span>
                      <span className="text-slate-200 font-bold">${entryPrice.toLocaleString()}</span>
                    </div>
                    <div className="bg-[#0B0E14] p-2 rounded-lg border border-[#161A23]/60">
                      <span className="text-slate-500 block text-[9px] uppercase">Marktkurs</span>
                      <span className="text-slate-200 font-bold">${markPrice ? markPrice.toLocaleString() : '-'}</span>
                    </div>
                    <div className="bg-[#0B0E14] p-2 rounded-lg border border-[#161A23]/60">
                      <span className="text-slate-500 block text-[9px] uppercase">Größe</span>
                      <span className="text-slate-200 font-bold truncate block">{absoluteSize}</span>
                    </div>
                    <div className="bg-[#0B0E14] p-2 rounded-lg border border-[#161A23]/60">
                      <span className="text-slate-500 block text-[9px] uppercase">Status</span>
                      <span className={pData.locked ? "text-[#089981] font-bold flex items-center gap-1" : "text-amber-400 font-bold flex items-center gap-1"}>
                        <Lock size={11} /> {pData.locked ? 'Active' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {selected.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selected.filter(t => !customTags.setup_classes.includes(t) && !customTags.mental_states.includes(t)).map((t: string) => (
                        <span key={t} className="px-2 py-0.5 bg-[#121622] border border-[#1E2536] text-[10px] rounded-md text-slate-400 font-mono">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`${pData.locked && !showJustLockedBanner ? 'lg:col-span-8' : 'lg:col-span-7'} space-y-4 flex flex-col justify-center transition-all duration-300`}>
                  {showJustLockedBanner ? (
                    <div className="flex flex-col items-center justify-center py-8 bg-[#089981]/10 border border-[#089981]/30 rounded-xl space-y-2 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300 h-full p-4 text-center">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#089981]/20 rounded-full blur-xl pointer-events-none" />
                      <Lock className="w-7 h-7 text-[#089981] animate-bounce" />
                      <p className="text-xs font-black text-[#089981] tracking-wide uppercase">Eröffnungsanalyse gesichert</p>
                      <p className="text-[11px] text-slate-300">Ehrlichkeits-Filter aktiv. Keine Änderungen mehr möglich.</p>
                    </div>
                  ) : isScaleIn ? (
                    <div className="flex flex-col items-center justify-center py-6 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-2 relative overflow-hidden h-full group p-4 text-center">
                      <button 
                        type="button"
                        onClick={() => setShowWarningModal({ open: true, uniqueKey })}
                        className="w-full sm:w-auto sm:absolute sm:top-3 sm:right-3 px-3 py-1.5 bg-[#161A23] hover:bg-[#222938] border border-[#222938] hover:border-slate-600 rounded-lg text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm mb-2 sm:mb-0"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                        <span>Parameter anpassen</span>
                      </button>
                      <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                      <Layers className="w-6 h-6 text-blue-400" />
                      <p className="text-xs font-bold text-blue-400">Scale-In / Limit-Order ausgeführt</p>
                      <p className="text-[11px] text-slate-400 max-w-xs">
                        Die Position wurde vergrößert. Die ursprüngliche Eröffnungsanalyse wird beibehalten.
                      </p>
                    </div>
                  ) : pData.locked ? (
                    <div className="flex flex-col items-center justify-center py-8 bg-[#07090E] border border-[#161A23] rounded-xl space-y-3 text-slate-400 h-full relative group p-4 text-center">
                      <button 
                        type="button"
                        onClick={() => setShowWarningModal({ open: true, uniqueKey })}
                        className="w-full sm:w-auto sm:absolute sm:top-3 sm:right-3 px-3 py-1.5 bg-[#161A23] hover:bg-[#222938] border border-[#222938] hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm mb-1 sm:mb-0"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#089981]" />
                        <span>Parameter anpassen</span>
                      </button>
                      <div className="w-8 h-8 rounded-full bg-[#089981]/15 text-[#089981] border border-[#089981]/30 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white tracking-wide">Trade läuft im Live-Modus</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Eröffnungsanalyse erfolgreich verriegelt.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] text-slate-400 mb-2 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                          <Target className="w-3.5 h-3.5 text-brand" /> 1. Setup-Klasse
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {customTags.setup_classes.map(cls => {
                            const isActive = selected.includes(cls)
                            const isC = cls.includes('Setup C') || cls.toLowerCase().includes('fomo') || cls.toLowerCase().includes('impulsiv')
                            return (
                              <button
                                key={cls}
                                type="button"
                                onClick={() => toggleTag(uniqueKey, cls, customTags.setup_classes)}
                                className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left flex items-center ${
                                  isActive
                                    ? isC 
                                      ? 'bg-[#F23645]/20 border-[#F23645]/50 text-[#F23645]'
                                      : 'bg-brand/20 border-brand/50 text-brand'
                                    : 'bg-[#121622] border-[#1E2536] text-slate-400 hover:border-brand/50 hover:text-slate-200'
                                }`}
                              >
                                {cls}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-slate-400 mb-2 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" /> 2. Mentale Verfassung
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {customTags.mental_states.map(state => {
                              const isActive = selected.includes(state)
                              const isToxic = state === 'FOMO' || state.includes('Frustriert') || state === 'Gelangweilt'
                              return (
                                <button
                                  key={state}
                                  type="button"
                                  onClick={() => toggleTag(uniqueKey, state, customTags.mental_states)}
                                  className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center ${
                                    isActive
                                      ? isToxic 
                                        ? 'bg-[#F23645]/20 border-[#F23645]/50 text-[#F23645] font-bold'
                                        : 'bg-blue-500/20 border-blue-500/50 text-blue-400 font-bold'
                                      : 'bg-[#121622] border-[#1E2536] text-slate-400 hover:border-blue-500/50 hover:text-slate-200'
                                  }`}
                                >
                                  {state}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] text-slate-400 mb-2 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                            <Layers className="w-3.5 h-3.5 text-amber-400" /> 3. Konfluenz-Faktoren
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {customTags.confluences.map(tag => {
                              const isActive = selected.includes(tag)
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => toggleTag(uniqueKey, tag)}
                                  className={`min-h-[34px] px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer flex items-center ${
                                    isActive
                                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold'
                                      : 'bg-[#121622] border-[#1E2536] text-slate-400 hover:border-amber-500/50 hover:text-slate-200'
                                  }`}
                                >
                                  #{tag}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>

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
                            className="w-full bg-[#121622] border border-[#1E2536] focus:border-brand rounded-xl p-3 text-xs text-white outline-none min-h-[70px]"
                          />
                        </div>

                        <div className="flex flex-col justify-center space-y-2">
                          <label className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                            <span className="uppercase tracking-wider">Conviction Score</span>
                            <span className={`font-mono font-bold text-sm ${pData.conviction >= 8 ? 'text-[#089981]' : pData.conviction >= 5 ? 'text-amber-400' : 'text-[#F23645]'}`}>
                              {pData.conviction || 5} / 10
                            </span>
                          </label>
                          <input 
                            type="range" min="1" max="10" 
                            value={pData.conviction || 5} 
                            onChange={(e) => handleSliderUpdate(uniqueKey, 'conviction', Number(e.target.value))}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[#161A23] accent-brand"
                          />
                          <div className="flex justify-between text-[10px] font-mono text-slate-500">
                            <span>Zweifel</span><span>Absolut sicher</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleLockPreTrade(uniqueKey, absoluteSize)}
                          disabled={!selected.some(t => customTags.setup_classes.includes(t)) || !selected.some(t => customTags.mental_states.includes(t))}
                          className="w-full min-h-[46px] py-3 bg-[#089981] hover:bg-[#067a67] disabled:bg-[#161A23] disabled:text-slate-600 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-[#089981]/20 disabled:shadow-none cursor-pointer active:scale-[0.99]"
                        >
                          <Lock className="w-4 h-4" /> Einstiegsanalyse sichern
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
                  <div className="flex-1 min-w-0">
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
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-[#089981]/10 rounded-md transition cursor-pointer shrink-0"
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
          <div className="bg-[#0D111A] border border-[#1A202C] rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl relative">
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

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setShowWarningModal(null)}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#161A23] hover:bg-[#222938] text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Abbrechen
              </button>
              <button 
                type="button"
                onClick={confirmUnlock}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Trotzdem anpassen
              </button>
            </div>
          </div>
        </div>
      )}

      <TagManagerModal
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        currentTags={customTags}
        onSaveTags={updateTags}
        onResetToDefaults={resetToDefaults}
      />
    </div>
  )
}