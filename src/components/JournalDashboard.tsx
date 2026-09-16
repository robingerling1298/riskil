'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Target, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  CheckCircle2, 
  BookOpen, 
  Check, 
  Send, 
  Lock, 
  Star, 
  SlidersHorizontal, 
  AlertTriangle, 
  ShieldCheck, 
  CheckSquare, 
  Square, 
  BrainCircuit, 
  Layers
} from 'lucide-react'
import { JournalAnalytics } from './JournalAnalytics'

const SETUP_CLASSES = ['Setup A: Perfekt', 'Setup B: Suboptimal', 'Setup C: Impulsiv / FOMO']
const MENTAL_STATES = ['Fokus', 'FOMO', 'Müde', 'Frustriert (Revenge)', 'Gelangweilt', 'Überzeugt']
const CONFLUENCES = ['Orderblock', 'Fibonacci', 'Imbalance', 'CVD-Divergenz', 'Liq-Cluster', 'Trendlinienbruch', 'Support/Resistance']
const RULE_TAG = '100% Plan-Konform'

const EXIT_REASONS = ['Take Profit (geplant)', 'Stop Loss (geplant)', 'Manueller Exit (Angst/Gier)', 'Trailing Stop', 'Zeitlimit']
const ERROR_TAGS = ['SL verschoben', 'Zu früh geschlossen', 'Gewinn zu früh mitgenommen', 'Hebel erhöht', 'Invalidation ignoriert']
const MOODS = [
  { label: 'Erleichtert', emoji: '😮‍💨' },
  { label: 'Wütend', emoji: '🤬' },
  { label: 'Euphorisch', emoji: '🤩' },
  { label: 'Gleichgültig', emoji: '😐' }
]

export function JournalDashboard({ trades = [], viewMode = 'journal' }: { trades?: any[], viewMode?: 'dashboard' | 'journal' }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [tradeList, setTradeList] = useState<any[]>(trades)
  
  const [localEntryNotes, setLocalEntryNotes] = useState<Record<string, string>>({})
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({})
  const [localRatings, setLocalRatings] = useState<Record<string, number>>({})

  const [filterSide, setFilterSide] = useState<string>('ALL')
  const [filterTag, setFilterTag] = useState<string>('ALL')

  const [editableTradeIds, setEditableTradeIds] = useState<Record<string, boolean>>({})
  const [showWarningModalForId, setShowWarningModalForId] = useState<string | null>(null)

  useEffect(() => {
    setTradeList(trades)
  }, [trades])

  const handleUpdateTrade = async (tradeId: string, field: string, value: any) => {
    const targetTrade = tradeList.find(t => t.id === tradeId)
    if (!targetTrade) return
    
    let payloadValue = value
    
    if (field === 'exit_tags') {
      const current = targetTrade.exit_tags || []
      payloadValue = current.includes(value) 
        ? current.filter((x: string) => x !== value) 
        : [...current, value]
    }

    setTradeList(prev => prev.map(t => t.id === tradeId ? { ...t, [field]: payloadValue } : t))

    try {
      await fetch('/api/exchange/trades/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId, [field]: payloadValue }) 
      })
    } catch (err) { console.error(err) }
  }

  const handleRatingChange = async (tradeId: string, ratingVal: number) => {
    setLocalRatings(prev => ({ ...prev, [tradeId]: ratingVal }))
    setTradeList(prev => prev.map(t => t.id === tradeId ? { ...t, trade_rating: ratingVal.toString() } : t))

    try {
      await fetch('/api/exchange/trades/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId, trade_rating: ratingVal.toString() }) 
      })
    } catch (err) { console.error(err) }
  }

  const saveTextareaToDb = async (tradeId: string, field: 'entry_notes' | 'notes', val: string) => {
    setTradeList(prev => prev.map(t => t.id === tradeId ? { ...t, [field]: val } : t))
    try {
      await fetch('/api/exchange/trades/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId, [field]: val }) 
      })
    } catch (err) { console.error(err) }
  }

  const handleSelectNoErrors = async (tradeId: string) => {
    const targetTrade = tradeList.find(t => t.id === tradeId)
    if (!targetTrade) return
    
    const current = targetTrade.exit_tags || []
    const cleaned = current.filter((x: string) => !ERROR_TAGS.includes(x))

    setTradeList(prev => prev.map(t => t.id === tradeId ? { ...t, exit_tags: cleaned } : t))

    try {
      await fetch('/api/exchange/trades/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId, exit_tags: cleaned }) 
      })
    } catch (err) { console.error(err) }
  }

  const handleUpdateExitReason = async (tradeId: string, value: string) => {
    const targetTrade = tradeList.find(t => t.id === tradeId)
    if (!targetTrade) return
    
    const current = targetTrade.exit_tags || []
    const filtered = current.filter((x: string) => !EXIT_REASONS.includes(x))
    const newTags = [...filtered, value]

    setTradeList(prev => prev.map(t => t.id === tradeId ? { ...t, exit_tags: newTags } : t))

    try {
      await fetch('/api/exchange/trades/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId, exit_tags: newTags }) 
      })
    } catch (err) { console.error(err) }
  }

  const handleUpdateEntryTag = async (tradeId: string, value: string, exclusiveGroup?: string[]) => {
    const targetTrade = tradeList.find(t => t.id === tradeId)
    if (!targetTrade) return
    
    let newTags = [...(targetTrade.entry_tags || [])]
    
    if (exclusiveGroup) {
      const isSelected = newTags.includes(value)
      newTags = newTags.filter((x: string) => !exclusiveGroup.includes(x))
      if (!isSelected) newTags.push(value)
    } else {
      if (newTags.includes(value)) {
        newTags = newTags.filter((x: string) => x !== value)
      } else {
        newTags.push(value)
      }
    }

    setTradeList(prev => prev.map(t => t.id === tradeId ? { ...t, entry_tags: newTags } : t))

    try {
      await fetch('/api/exchange/trades/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId, entry_tags: newTags }) 
      })
    } catch (err) { console.error(err) }
  }

  const handleTransferToJournal = async (tradeId: string) => {
    const targetTrade = tradeList.find(t => t.id === tradeId)
    if (!targetTrade) return

    const exitTags = targetTrade.exit_tags || []
    const entryTags = targetTrade.entry_tags || []

    const hasExitReason = exitTags.some((t: string) => EXIT_REASONS.includes(t))
    const hasRating = !!targetTrade.trade_rating
    const hasMood = !!targetTrade.mood

    // In der Inbox (Dashboard) ist die Einstiegsanalyse bereits vorab abgeschlossen
    const isEntryComplete = Boolean(
      targetTrade.is_locked || 
      (entryTags && entryTags.length > 0) || 
      viewMode === 'dashboard'
    )

    if (!hasExitReason || !hasRating || !hasMood || !isEntryComplete) {
      alert("Bitte fülle alle Pflichtfelder (Austrittsgrund, Emotion nach Exit und Management-Bewertung) aus.")
      return
    }

    setTradeList(prev => prev.map(t => t.id === tradeId ? { ...t, is_transferred: true, is_locked: true } : t))
    if (expandedId === tradeId) setExpandedId(null)

    try {
      const res = await fetch('/api/exchange/trades/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tradeId, 
          is_transferred: true,
          is_locked: true,
          exit_tags: targetTrade.exit_tags,
          entry_tags: targetTrade.entry_tags,
          trade_rating: targetTrade.trade_rating,
          conviction: targetTrade.conviction || 5,
          mood: targetTrade.mood,
          notes: targetTrade.notes,
          entry_notes: targetTrade.entry_notes
        }) 
      })
      if (!res.ok) throw new Error('Server-Update fehlgeschlagen')
    } catch (err) {
      console.error('Fehler beim Übertragen ins Journal:', err)
      setTradeList(prev => prev.map(t => t.id === tradeId ? { ...t, is_transferred: false } : t))
    }
  }

  const sortedTrades = [...tradeList].sort((a, b) => {
    const timeA = new Date(a.timestamp || a.created_at || 0).getTime()
    const timeB = new Date(b.timestamp || b.created_at || 0).getTime()
    return timeB - timeA
  })

  const filteredTrades = sortedTrades.filter(trade => {
    const side = trade.side?.toUpperCase() || ''
    const isLong = side === 'LONG' || side === 'BUY'
    const sideMatch = filterSide === 'ALL' || (isLong ? 'LONG' : 'SHORT') === filterSide
    
    const allTags = [...(trade.entry_tags || []), ...(trade.exit_tags || [])]
    const tagMatch = filterTag === 'ALL' || allTags.includes(filterTag)

    const isTransferred = !!trade.is_transferred

    let isViewMatch = true
    if (viewMode === 'dashboard') {
      isViewMatch = !isTransferred 
    } else if (viewMode === 'journal') {
      isViewMatch = isTransferred 
    }

    return sideMatch && tagMatch && isViewMatch
  })

  const allAvailableTags = Array.from(new Set(tradeList.flatMap(t => [...(t.entry_tags || []), ...(t.exit_tags || [])]))).sort()

  if (!tradeList || tradeList.length === 0) {
    return (
      <div className="mt-8 p-6 sm:p-8 bg-[#0B0E14] border border-[#161A23] rounded-2xl flex flex-col items-center justify-center text-slate-500">
        <Clock className="w-10 h-10 opacity-20 mb-3" />
        <p className="text-sm font-medium">Noch keine Trades in der Historie.</p>
      </div>
    )
  }

  return (
    <div className="mt-6 sm:mt-8 space-y-4">
      {viewMode === 'journal' && (
        <JournalAnalytics trades={tradeList.filter(t => t.is_transferred)} />
      )}

      {/* FILTER & HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-[#0B0E14] border border-[#161A23] p-3.5 sm:p-4 rounded-2xl shadow-sm">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          {viewMode === 'dashboard' ? (
            <><Clock className="w-3.5 h-3.5 text-amber-400" /> Post-Trade Inbox (Offen)</>
          ) : (
            <><Target className="w-3.5 h-3.5 text-[#089981]" /> Handelsjournal & Archiv</>
          )}
        </h2>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 text-xs">
            <select 
              className="bg-[#141824] border border-[#1E2536] rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-[#089981] font-medium"
              value={filterSide}
              onChange={(e) => setFilterSide(e.target.value)}
            >
              <option value="ALL">Alle Richtungen</option>
              <option value="LONG">Nur Long</option>
              <option value="SHORT">Nur Short</option>
            </select>
            
            <select 
              className="bg-[#141824] border border-[#1E2536] rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-[#089981] font-medium truncate"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
            >
              <option value="ALL">Alle Tags</option>
              {allAvailableTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
          <span className="text-[11px] text-slate-500 font-mono font-medium sm:border-l sm:border-[#1E2536] sm:pl-3 text-right sm:text-left">
            {filteredTrades.length} Trades
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {viewMode === 'dashboard' && filteredTrades.length === 0 && tradeList.length > 0 && (
          <div className="p-6 sm:p-8 bg-[#089981]/5 border border-[#089981]/20 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 bg-[#089981]/10 rounded-full flex items-center justify-center text-[#089981]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#089981]">Inbox leer! Alles ins Journal übertragen.</p>
              <p className="text-xs text-slate-400 mt-1">Hervorragende Disziplin. Keine offenen Post-Trade Analysen mehr ausstehend.</p>
            </div>
          </div>
        )}

        {viewMode === 'journal' && filteredTrades.length === 0 && tradeList.length > 0 && (
          <div className="p-6 sm:p-8 bg-[#0B0E14] border border-[#161A23] rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 bg-[#161A23] rounded-full flex items-center justify-center text-slate-500">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-300">Journal-Archiv ist noch leer</p>
              <p className="text-xs text-slate-500 mt-1">Fülle die Post-Trade Daten im Dashboard aus und klicke auf "Trade ins Journal übertragen".</p>
            </div>
          </div>
        )}

        {filteredTrades.map((trade, idx) => {
          const isLong = trade.side === 'LONG' || trade.side === 'BUY'
          const pnl = Number(trade.pnl || 0)
          const isWin = pnl >= 0
          const tradeDate = new Date(trade.timestamp || trade.created_at || Date.now())
          const isExpanded = expandedId === trade.id

          const entryTags: string[] = trade.entry_tags || []
          const exitTags: string[] = trade.exit_tags || []
          const currentMood = trade.mood || ''
          
          const ratingStr = localRatings[trade.id] !== undefined ? localRatings[trade.id].toString() : (trade.trade_rating || "0")
          const ratingNum = parseInt(ratingStr, 10) || 0

          const hasExitReason = exitTags.some(t => EXIT_REASONS.includes(t))
          const hasRating = !!trade.trade_rating
          const hasMood = !!trade.mood
          
          const wasLocked = Boolean(trade.is_locked || (entryTags && entryTags.length > 0))
          const isEntryComplete = wasLocked || viewMode === 'dashboard' || (
            entryTags.some(t => SETUP_CLASSES.includes(t)) && 
            entryTags.some(t => MENTAL_STATES.includes(t))
          )
          
          const isReadyToTransfer = hasExitReason && hasRating && hasMood && isEntryComplete
          const isUnlockedInJournal = !!editableTradeIds[trade.id]

          const entryPrice = Number(trade.entry_price || 0)
          const exitPrice = Number(trade.exit_price || 0)
          const sizeCoins = Number(trade.size || 0)
          const notionalUsd = entryPrice * sizeCoins
          const totalFees = Number(trade.total_fees || 0)

          let priceChangePct = 0
          if (entryPrice > 0 && exitPrice > 0) {
            priceChangePct = isLong
              ? ((exitPrice - entryPrice) / entryPrice) * 100
              : ((entryPrice - exitPrice) / entryPrice) * 100
          }

          const leverage = Number(trade.leverage || 10)
          const roePct = priceChangePct * leverage
          const baseAsset = (trade.pair || 'BTC').split('/')[0].replace(/USDT|USDC|USD/g, '')

          const setupClassTags = entryTags.filter(t => SETUP_CLASSES.includes(t))
          const mentalStateTags = entryTags.filter(t => MENTAL_STATES.includes(t))
          const confluenceTags = entryTags.filter(t => CONFLUENCES.includes(t))
          const otherEntryTags = entryTags.filter(t => !SETUP_CLASSES.includes(t) && !MENTAL_STATES.includes(t) && !CONFLUENCES.includes(t))

          const selectedErrors = exitTags.filter(t => ERROR_TAGS.includes(t))
          const hasNoErrors = selectedErrors.length === 0

          const currentEntryNote = localEntryNotes[trade.id] !== undefined ? localEntryNotes[trade.id] : (trade.entry_notes || '')
          const currentNotes = localNotes[trade.id] !== undefined ? localNotes[trade.id] : (trade.notes || '')

          return (
            <div 
              key={trade.id || idx} 
              className="bg-[#0B0E14] border border-[#161A23] hover:border-[#222938] rounded-2xl transition-all duration-200 overflow-hidden shadow-sm"
            >
              <div 
                onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                className="p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer select-none"
              >
                <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:min-w-[200px]">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border shrink-0 ${isLong ? 'bg-[#089981]/10 border-[#089981]/25 text-[#089981]' : 'bg-[#F23645]/10 border-[#F23645]/25 text-[#F23645]'}`}>
                      {isLong ? <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" /> : <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm tracking-wide font-mono">
                        {trade.pair || trade.symbol || 'Unknown Pair'}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono mt-0.5">
                        {tradeDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Mobil sichtbarer PnL Header */}
                  <div className="sm:hidden text-right">
                    <span className={`text-sm font-black font-mono tracking-tight block ${isWin ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                      {isWin ? '+' : ''}{pnl.toFixed(2)} USDT
                    </span>
                  </div>
                </div>

                <div className="flex-grow flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 sm:px-6 sm:border-l border-[#161A23] w-full sm:w-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {setupClassTags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-brand/10 border border-brand/20 text-[10px] text-brand font-mono">
                        {tag}
                      </span>
                    ))}
                    {exitTags.filter(t => EXIT_REASONS.includes(t)).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-mono">
                        Exit: {tag}
                      </span>
                    ))}
                    {!isReadyToTransfer && viewMode === 'dashboard' && (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-semibold font-mono">
                        Post-Analyse offen
                      </span>
                    )}
                  </div>
                </div>

                <div className="hidden sm:flex items-center justify-end gap-5 min-w-[140px] pt-3 sm:pt-0">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Realized PnL</span>
                    <span className={`text-base font-black font-mono tracking-tight ${isWin ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                      {isWin ? '+' : ''}{pnl.toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#141824] text-slate-400 border border-[#1E2536]">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-[#080B10] border-t border-[#161A23] p-4 sm:p-6 space-y-6 animate-in fade-in duration-200 relative">
                  
                  {viewMode === 'journal' && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#141824] gap-2.5">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <ShieldCheck className="w-4 h-4 text-[#089981]" />
                        <span>Verifizierte Journal-Dokumentation</span>
                      </div>
                      {isUnlockedInJournal ? (
                        <button 
                          type="button"
                          onClick={() => setEditableTradeIds(prev => ({ ...prev, [trade.id]: false }))}
                          className="w-full sm:w-auto px-3.5 py-2 bg-[#089981] hover:bg-[#067a67] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#089981]/20"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Änderungen speichern & verriegeln</span>
                        </button>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => setShowWarningModalForId(trade.id)}
                          className="w-full sm:w-auto px-3.5 py-2 bg-[#141824] hover:bg-[#1C2333] border border-[#1E2536] hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                          <span>Parameter anpassen</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* PARAMETER TILES */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    <div className="p-3 bg-[#0D111A] border border-[#161B26] rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Entry & Exit</span>
                      <div className="text-xs font-mono font-bold text-slate-200 truncate">
                        ${entryPrice ? entryPrice.toLocaleString('de-DE') : '-'} 
                        <span className="text-slate-500 mx-1">→</span>
                        ${exitPrice ? exitPrice.toLocaleString('de-DE') : '-'}
                      </div>
                    </div>

                    <div className="p-3 bg-[#0D111A] border border-[#161B26] rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Delta (ROE)</span>
                      <div className="flex items-baseline gap-1.5 truncate">
                        <span className={`text-xs font-mono font-black ${priceChangePct >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                          {priceChangePct >= 0 ? '+' : ''}{priceChangePct.toFixed(2)}%
                        </span>
                        <span className={`text-[10px] font-mono font-bold ${roePct >= 0 ? 'text-[#089981]/80' : 'text-[#F23645]/80'}`}>
                          ({roePct >= 0 ? '+' : ''}{roePct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#0D111A] border border-[#161B26] rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Volumen</span>
                      <div className="text-xs font-mono font-bold text-slate-200 truncate">
                        {sizeCoins > 0 ? `${sizeCoins} ${baseAsset}` : '-'}
                      </div>
                    </div>

                    <div className="p-3 bg-[#0D111A] border border-[#161B26] rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Gebühren</span>
                      <div className="text-xs font-mono font-bold text-[#F23645] truncate">
                        -${totalFees.toFixed(3)} USDT
                      </div>
                    </div>
                  </div>

                  {/* ERÖFFNUNGSANALYSE - NUR IM HANDELSJOURNAL SICHTBAR */}
                  {viewMode === 'journal' && (
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#089981]">
                        <Lock className="w-3 h-3" /> Eröffnungsanalyse {!isUnlockedInJournal ? '(Verriegelt)' : ''}
                      </span>

                      {!isUnlockedInJournal ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="p-3.5 bg-[#0D111A] border border-[#161B26] rounded-xl space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                              <Target className="w-3 h-3 text-brand" /> 1. Setup-Klasse
                            </span>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {setupClassTags.length > 0 ? setupClassTags.map(tag => (
                                <span key={tag} className="px-2.5 py-1 bg-brand/10 text-brand border border-brand/20 rounded-lg text-[10px] font-semibold font-mono">
                                  {tag}
                                </span>
                              )) : <span className="text-[10px] text-slate-600 font-mono">- Keine Angabe -</span>}
                            </div>
                          </div>

                          <div className="p-3.5 bg-[#0D111A] border border-[#161B26] rounded-xl space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                              <BrainCircuit className="w-3 h-3 text-purple-400" /> 2. Mentale Verfassung
                            </span>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {mentalStateTags.length > 0 ? mentalStateTags.map(tag => (
                                <span key={tag} className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-[10px] font-semibold font-mono">
                                  {tag}
                                </span>
                              )) : <span className="text-[10px] text-slate-600 font-mono">- Keine Angabe -</span>}
                            </div>
                          </div>

                          <div className="p-3.5 bg-[#0D111A] border border-[#161B26] rounded-xl space-y-1.5 md:col-span-2">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                              <Layers className="w-3 h-3 text-amber-400" /> 3. Konfluenz-Faktoren
                            </span>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {confluenceTags.length > 0 ? confluenceTags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-[10px] font-mono">
                                  #{tag}
                                </span>
                              )) : <span className="text-[10px] text-slate-600 font-mono">- Keine Angabe -</span>}
                              {otherEntryTags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[10px] font-mono">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="p-3.5 bg-[#0D111A] border border-[#161B26] rounded-xl space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Conviction Score</span>
                            <div className="flex items-baseline gap-2 pt-1">
                              <span className={`text-2xl font-black font-mono ${trade.conviction >= 8 ? 'text-[#089981]' : trade.conviction >= 5 ? 'text-amber-400' : 'text-[#F23645]'}`}>
                                {trade.conviction || 5}/10
                              </span>
                            </div>
                          </div>

                          {trade.entry_notes && (
                            <div className="p-3.5 bg-[#0D111A] border border-[#161B26] rounded-xl space-y-1.5 md:col-span-3">
                              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Eröffnungsnotiz</span>
                              <p className="text-xs text-slate-300 leading-relaxed bg-[#161A23] p-2.5 rounded-lg border border-[#222938]">
                                {trade.entry_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 sm:p-5 bg-[#0D111A] border border-[#1E2536] rounded-2xl space-y-5">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">1. Setup-Klasse</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {SETUP_CLASSES.map(cls => {
                                const isActive = entryTags.includes(cls)
                                const isC = cls.includes('Setup C')
                                return (
                                  <button
                                    key={cls}
                                    type="button"
                                    onClick={() => handleUpdateEntryTag(trade.id, cls, SETUP_CLASSES)}
                                    className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                                      isActive
                                        ? isC 
                                          ? 'bg-[#F23645]/20 text-[#F23645] border-[#F23645]/50'
                                          : 'bg-brand/20 text-brand border-brand/50'
                                        : 'bg-[#141824] border-[#1E2536] text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {cls}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">2. Mentale Verfassung</span>
                            <div className="flex flex-wrap gap-2">
                              {MENTAL_STATES.map(state => {
                                const isActive = entryTags.includes(state)
                                const isToxic = state === 'FOMO' || state.includes('Frustriert') || state === 'Gelangweilt'
                                return (
                                  <button
                                    key={state}
                                    type="button"
                                    onClick={() => handleUpdateEntryTag(trade.id, state, MENTAL_STATES)}
                                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                      isActive
                                        ? isToxic 
                                          ? 'bg-[#F23645]/20 text-[#F23645] border-[#F23645]/50'
                                          : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                                        : 'bg-[#141824] border-[#1E2536] text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {state}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">3. Konfluenz-Faktoren</span>
                            <div className="flex flex-wrap gap-2">
                              {CONFLUENCES.map(tag => {
                                const isActive = entryTags.includes(tag)
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleUpdateEntryTag(trade.id, tag)}
                                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                      isActive
                                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                                        : 'bg-[#141824] border-[#1E2536] text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    #{tag}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#161B26]">
                            <div>
                              <label className="text-[10px] text-slate-500 mb-1.5 font-medium flex items-center justify-between uppercase tracking-wider">
                                Eröffnungsnotiz (Optional)
                              </label>
                              <textarea
                                value={currentEntryNote}
                                onChange={(e) => setLocalEntryNotes(prev => ({ ...prev, [trade.id]: e.target.value }))}
                                onBlur={() => saveTextareaToDb(trade.id, 'entry_notes', currentEntryNote)}
                                placeholder="Erwartungshaltung, Setup-Besonderheiten..."
                                className="w-full bg-[#141824] border border-[#1E2536] focus:border-[#089981] rounded-xl p-3 text-xs text-white outline-none min-h-[70px]"
                              />
                            </div>

                            <div className="flex flex-col justify-center space-y-2">
                              <label className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                                <span className="uppercase tracking-wider">Conviction Score</span>
                                <span className={`font-mono font-bold text-sm ${trade.conviction >= 8 ? 'text-[#089981]' : trade.conviction >= 5 ? 'text-amber-400' : 'text-[#F23645]'}`}>
                                  {trade.conviction || 5}/10
                                </span>
                              </label>
                              <input 
                                type="range" min="1" max="10" 
                                value={trade.conviction || 5} 
                                onChange={(e) => handleUpdateTrade(trade.id, 'conviction', Number(e.target.value))}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[#161A23] accent-brand"
                              />
                              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                <span>Zweifel</span><span>Absolut sicher</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* POST-TRADE ANALYSE */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" /> Post-Trade Analyse {viewMode === 'journal' && !isUnlockedInJournal ? '(Verriegelt)' : ''}
                    </span>

                    {viewMode === 'journal' && !isUnlockedInJournal ? (
                      <div className="grid grid-cols-1 gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3.5 bg-[#0D111A] border border-[#161B26] rounded-xl space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Austrittsgrund</span>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {exitTags.filter(t => EXIT_REASONS.includes(t)).map(tag => (
                                <span key={tag} className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-semibold font-mono">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="p-3.5 bg-[#0D111A] border border-[#161B26] rounded-xl space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Emotion nach Exit</span>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {trade.mood ? (() => {
                                const moodObj = MOODS.find(m => m.label === trade.mood)
                                return (
                                  <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-[10px] font-semibold font-mono flex items-center gap-1.5">
                                    <span className="text-sm">{moodObj?.emoji}</span> {trade.mood}
                                  </span>
                                )
                              })() : <span className="text-[10px] text-slate-600 font-mono">-</span>}
                            </div>
                          </div>

                          <div className="p-3.5 bg-[#0D111A] border border-[#161B26] rounded-xl space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Management Rating</span>
                            <div className="flex items-center gap-1 pt-1.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} className={`w-4 h-4 ${star <= ratingNum ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-[#222938]'}`} />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3.5 bg-[#0D111A] border border-[#161B26] rounded-xl space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Fehler & Regelbrüche</span>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {selectedErrors.map(tag => (
                                <span key={tag} className="px-2.5 py-1 bg-[#F23645]/10 text-[#F23645] border border-[#F23645]/20 rounded-lg text-[10px] font-semibold font-mono">
                                  {tag}
                                </span>
                              ))}
                              {hasNoErrors && (
                                <span className="text-[10px] text-[#089981] font-mono bg-[#089981]/10 px-2.5 py-1 rounded-lg border border-[#089981]/20 font-bold">
                                  ✓ Kein Fehler
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="p-3.5 bg-[#0D111A] border border-[#161B26] rounded-xl space-y-1.5 flex flex-col justify-center">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ausführungs-Disziplin</span>
                            <div className="flex items-center gap-2 pt-1">
                              {exitTags.includes(RULE_TAG) ? (
                                <span className="px-2.5 py-1 bg-[#089981]/10 text-[#089981] border border-[#089981]/20 rounded-lg text-[10px] font-semibold font-mono flex items-center gap-1">
                                  <CheckSquare className="w-3.5 h-3.5" /> 100% Plan-Konform
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-600 font-mono">- Keine Angabe -</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {trade.notes && (
                          <div className="p-3.5 bg-[#0D111A] border border-[#161B26] rounded-xl space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Learnings & Notizen</span>
                            <p className="text-xs text-slate-300 leading-relaxed bg-[#161A23] p-3 rounded-lg border border-[#222938]">
                              {trade.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 sm:p-5 bg-[#0D111A] border border-[#1E2536] rounded-2xl space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">1. Austrittsgrund (Exit Trigger)</span>
                            <div className="flex flex-wrap gap-2">
                              {EXIT_REASONS.map(tag => {
                                const active = exitTags.includes(tag)
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleUpdateExitReason(trade.id, tag)}
                                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left flex items-center ${
                                      active ? 'bg-blue-600/20 text-blue-400 border-blue-500/50' : 'bg-[#141824] border-[#1E2536] text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {active && <Check className="w-3.5 h-3.5 inline mr-1" />} {tag}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">2. Emotion nach Exit</span>
                            <div className="grid grid-cols-2 gap-2">
                              {MOODS.map(m => {
                                const active = currentMood === m.label
                                return (
                                  <button
                                    key={m.label}
                                    type="button"
                                    onClick={() => handleUpdateTrade(trade.id, 'mood', m.label)}
                                    className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                                      active ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'bg-[#141824] border-[#1E2536] text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    <span className="text-base">{m.emoji}</span>
                                    <span>{m.label}</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#161B26]">
                          <div>
                            <span className="text-[10px] font-semibold text-[#F23645] uppercase tracking-wider block mb-2">Fehler-Kategorisierung (Multi-Select)</span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                key="no-error"
                                type="button"
                                onClick={() => handleSelectNoErrors(trade.id)}
                                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                  hasNoErrors 
                                    ? 'bg-[#089981]/20 text-[#089981] border-[#089981]/50' 
                                    : 'bg-[#141824] border-[#1E2536] text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {hasNoErrors && <Check className="w-3.5 h-3.5 inline" />} Kein Fehler
                              </button>

                              {ERROR_TAGS.map(tag => {
                                const active = exitTags.includes(tag)
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleUpdateTrade(trade.id, 'exit_tags', tag)}
                                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center ${
                                      active ? 'bg-[#F23645]/20 text-[#F23645] border-[#F23645]/50' : 'bg-[#141824] border-[#1E2536] text-slate-400 hover:border-[#F23645]/50 hover:text-slate-200'
                                    }`}
                                  >
                                    {tag}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Ausführungs-Disziplin</span>
                            <div 
                              onClick={() => handleUpdateTrade(trade.id, 'exit_tags', RULE_TAG)}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                                exitTags.includes(RULE_TAG)
                                  ? 'bg-[#089981]/10 border-[#089981]/30' 
                                  : 'bg-[#141824] border-[#1E2536] hover:border-slate-600'
                              }`}
                            >
                              {exitTags.includes(RULE_TAG) ? <CheckSquare className="w-5 h-5 text-[#089981]" /> : <Square className="w-5 h-5 text-slate-500" />}
                              <div>
                                <p className={`text-xs font-bold ${exitTags.includes(RULE_TAG) ? 'text-[#089981]' : 'text-slate-300'}`}>100% Plan-Konform</p>
                                <p className="text-[10px] text-slate-500">Regeln vollständig eingehalten</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#161B26]">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                              Management-Bewertung
                            </span>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => handleRatingChange(trade.id, star)}
                                  className="p-1.5 transition-transform hover:scale-125 cursor-pointer"
                                >
                                  <Star className={`w-6 h-6 sm:w-7 sm:h-7 ${star <= ratingNum ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-[#222938]'}`} />
                                </button>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1.5">Wie sauber hast du diesen Trade gemanagt?</p>
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                              Learnings (Optional)
                            </span>
                            <textarea
                              value={currentNotes}
                              onChange={(e) => setLocalNotes(prev => ({ ...prev, [trade.id]: e.target.value }))}
                              onBlur={() => saveTextareaToDb(trade.id, 'notes', currentNotes)}
                              placeholder="Was machst du beim nächsten Mal anders?"
                              className="w-full bg-[#141824] border border-[#1E2536] focus:border-[#089981] rounded-xl p-3 text-xs text-white outline-none min-h-[70px]"
                            />
                          </div>
                        </div>

                        {viewMode === 'dashboard' && !trade.is_transferred && (
                          <div className="pt-4 border-t border-[#161B26]">
                            <button
                              type="button"
                              onClick={() => handleTransferToJournal(trade.id)}
                              disabled={!isReadyToTransfer}
                              className="w-full min-h-[46px] py-3.5 bg-[#089981] hover:bg-[#067a67] disabled:bg-[#141824] disabled:text-slate-600 text-white font-extrabold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-[#089981]/20 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <Send className="w-4 h-4" />
                              <span>Trade ins Journal übertragen</span>
                            </button>
                            {!isReadyToTransfer && (
                              <p className="text-[11px] text-amber-400/80 text-center mt-2 font-medium">
                                Bitte Austrittsgrund, Emotion nach Exit und Management-Bewertung ausfüllen.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )
        })}
      </div>

      {showWarningModalForId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0D111A] border border-[#1A202C] rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center gap-3 text-amber-400 pb-2 border-b border-[#161B26]">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Archivierten Trade anpassen?</h4>
                <p className="text-[11px] text-slate-400">Verfälschung vergangener Verhaltensmuster</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Das nachträgliche Anpassen von vergangenem Verhalten verfälscht deine Statistiken und führt zu <strong>Hindsight Bias (Rückschaufehler)</strong>. Sei ehrlich zu dir selbst.
            </p>
            <p className="text-xs text-slate-400">
              Möchtest du diesen archivierten Trade wirklich zur Bearbeitung freischalten?
            </p>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setShowWarningModalForId(null)}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#161A23] hover:bg-[#222938] text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Abbrechen
              </button>
              <button 
                type="button"
                onClick={() => {
                  setEditableTradeIds(prev => ({ ...prev, [showWarningModalForId]: true }))
                  setShowWarningModalForId(null)
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Ich bin mir sicher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}