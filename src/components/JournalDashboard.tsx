'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Target, 
  ChevronDown, 
  ChevronUp, 
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
      <div className="mt-8 p-12 bg-[#05070A] border border-[#161C26] rounded-2xl flex flex-col items-center justify-center text-slate-500 shadow-2xl">
        <Clock className="w-10 h-10 opacity-20 mb-3 text-slate-500" />
        <p className="text-xs font-mono font-medium tracking-wide">Noch keine Trades in der Historie.</p>
      </div>
    )
  }

  return (
    <div className="mt-6 sm:mt-8 space-y-6 font-sans">
      {viewMode === 'journal' && (
        <JournalAnalytics trades={tradeList.filter(t => t.is_transferred)} />
      )}

      {/* FILTER & HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-[#05070A] border border-[#161C26] p-4 rounded-2xl shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#089981] animate-pulse" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            {viewMode === 'dashboard' ? 'Post-Trade Inbox (Aktiv ausstehend)' : 'Execution Ledger & Archive'}
          </h2>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 text-xs font-mono">
            <select 
              className="bg-[#0A0E17] border border-[#161C26] rounded-xl px-3.5 py-2 text-slate-300 focus:outline-none focus:border-[#089981] font-medium transition"
              value={filterSide}
              onChange={(e) => setFilterSide(e.target.value)}
            >
              <option value="ALL">Alle Richtungen</option>
              <option value="LONG">Nur Long</option>
              <option value="SHORT">Nur Short</option>
            </select>
            
            <select 
              className="bg-[#0A0E17] border border-[#161C26] rounded-xl px-3.5 py-2 text-slate-300 focus:outline-none focus:border-[#089981] font-medium truncate transition"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
            >
              <option value="ALL">Alle Tags</option>
              {allAvailableTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
          <span className="text-[11px] text-slate-400 font-mono font-bold sm:border-l sm:border-[#161C26] sm:pl-3.5 text-right sm:text-left flex items-center justify-end sm:justify-start">
            {filteredTrades.length} Einträge
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {viewMode === 'dashboard' && filteredTrades.length === 0 && tradeList.length > 0 && (
          <div className="p-8 bg-[#089981]/10 border border-[#089981]/30 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 shadow-xl">
            <div className="w-12 h-12 bg-[#089981]/20 rounded-full flex items-center justify-center text-[#089981] shadow-lg shadow-[#089981]/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Inbox leer! Alles ins Journal übertragen.</p>
              <p className="text-xs text-slate-400 mt-1 font-mono">Hervorragende Disziplin. Keine offenen Post-Trade Analysen mehr ausstehend.</p>
            </div>
          </div>
        )}

        {viewMode === 'journal' && filteredTrades.length === 0 && tradeList.length > 0 && (
          <div className="p-8 bg-[#05070A] border border-[#161C26] rounded-2xl flex flex-col items-center justify-center text-center space-y-3 shadow-xl">
            <div className="w-12 h-12 bg-[#0A0E17] rounded-full flex items-center justify-center text-slate-400 border border-[#161C26]">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Journal-Archiv ist noch leer</p>
              <p className="text-xs text-slate-400 mt-1 font-mono">Fülle die Post-Trade Daten im Dashboard aus und klicke auf "Trade ins Journal übertragen".</p>
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
              className={`bg-[#05070A] border rounded-xl transition-all duration-200 overflow-hidden shadow-lg ${
                isExpanded ? 'border-[#089981] shadow-[0_0_20px_rgba(8,153,129,0.12)]' : 'border-[#161C26] hover:border-slate-700'
              }`}
            >
              <div 
                onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                className="px-4 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer select-none"
              >
                <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:min-w-[220px]">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
                      isLong ? 'bg-[#089981]/15 border-[#089981]/40 text-[#089981]' : 'bg-[#F23645]/15 border-[#F23645]/40 text-[#F23645]'
                    }`}>
                      {isLong ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm font-mono tracking-wide">
                          {trade.pair || trade.symbol || 'Unknown Pair'}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${isLong ? 'text-[#089981] bg-[#089981]/10' : 'text-[#F23645] bg-[#F23645]/10'}`}>
                          {isLong ? 'LONG' : 'SHORT'} {leverage}x
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {tradeDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Mobil sichtbarer PnL Header */}
                  <div className="sm:hidden text-right">
                    <span className={`text-xs font-black font-mono tracking-tight block ${isWin ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                      {isWin ? '+' : ''}{pnl.toFixed(2)} USDT
                    </span>
                  </div>
                </div>

                <div className="flex-grow flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2.5 sm:px-4 sm:border-l border-[#161C26] w-full sm:w-auto">
                  <div className="flex flex-wrap gap-1">
                    {setupClassTags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-[10px] text-emerald-400 font-mono font-semibold">
                        {tag}
                      </span>
                    ))}
                    {exitTags.filter(t => EXIT_REASONS.includes(t)).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-[10px] text-blue-400 font-mono font-semibold">
                        Exit: {tag}
                      </span>
                    ))}
                    {!isReadyToTransfer && viewMode === 'dashboard' && (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded font-bold font-mono">
                        Post-Analyse offen
                      </span>
                    )}
                  </div>
                </div>

                <div className="hidden sm:flex items-center justify-end gap-4 min-w-[140px] pt-1 sm:pt-0">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-0.5 font-mono">Realized PnL</span>
                    <span className={`text-sm font-black font-mono tracking-tight ${isWin ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                      {isWin ? '+' : ''}{pnl.toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#0A0E17] text-slate-400 border border-[#161C26] shadow-sm">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-[#030406] border-t border-[#161C26] p-4 sm:p-6 space-y-5 animate-in fade-in duration-200 relative">
                  
                  {viewMode === 'journal' && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#161C26] gap-3">
                      <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                        <ShieldCheck className="w-4 h-4 text-[#089981]" />
                        <span>Verifizierte Journal-Dokumentation</span>
                      </div>
                      {isUnlockedInJournal ? (
                        <button 
                          type="button"
                          onClick={() => setEditableTradeIds(prev => ({ ...prev, [trade.id]: false }))}
                          className="w-full sm:w-auto px-3.5 py-2 bg-[#089981] hover:bg-[#067a67] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#089981]/20 font-mono"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Änderungen speichern & verriegeln</span>
                        </button>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => setShowWarningModalForId(trade.id)}
                          className="w-full sm:w-auto px-3.5 py-2 bg-[#0A0E17] hover:bg-[#161C26] border border-[#161C26] hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 transition cursor-pointer shadow-md font-mono"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                          <span>Parameter anpassen</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* PARAMETER TILES */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-[#05070A] border border-[#161C26] rounded-xl space-y-0.5 shadow-sm">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono">Entry & Exit</span>
                      <div className="text-xs font-mono font-bold text-white truncate">
                        ${entryPrice ? entryPrice.toLocaleString('de-DE') : '-'} 
                        <span className="text-slate-600 mx-1">→</span>
                        ${exitPrice ? exitPrice.toLocaleString('de-DE') : '-'}
                      </div>
                    </div>

                    <div className="p-3 bg-[#05070A] border border-[#161C26] rounded-xl space-y-0.5 shadow-sm">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono">Delta (ROE)</span>
                      <div className="flex items-baseline gap-1.5 truncate">
                        <span className={`text-xs font-mono font-black ${priceChangePct >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                          {priceChangePct >= 0 ? '+' : ''}{priceChangePct.toFixed(2)}%
                        </span>
                        <span className={`text-[10px] font-mono font-bold ${roePct >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                          ({roePct >= 0 ? '+' : ''}{roePct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#05070A] border border-[#161C26] rounded-xl space-y-0.5 shadow-sm">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono">Volumen</span>
                      <div className="text-xs font-mono font-bold text-white truncate">
                        {sizeCoins > 0 ? `${sizeCoins} ${baseAsset}` : '-'}
                      </div>
                    </div>

                    <div className="p-3 bg-[#05070A] border border-[#161C26] rounded-xl space-y-0.5 shadow-sm">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono">Gebühren</span>
                      <div className="text-xs font-mono font-bold text-[#F23645] truncate">
                        -${totalFees.toFixed(3)} USDT
                      </div>
                    </div>
                  </div>

                  {/* ERÖFFNUNGSANALYSE - NUR IM HANDELSJOURNAL SICHTBAR */}
                  {viewMode === 'journal' && (
                    <div className="space-y-3 bg-[#05070A] border border-[#161C26] p-4 rounded-xl shadow-lg">
                      <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-[#089981] font-mono">
                        <Lock className="w-3.5 h-3.5" /> Eröffnungsanalyse {!isUnlockedInJournal ? '(Verriegelt)' : ''}
                      </span>

                      {!isUnlockedInJournal ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="p-3 bg-[#0A0E17] border border-[#161C26] rounded-xl space-y-1.5 shadow-sm">
                            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1 font-mono">
                              <Target className="w-3 h-3 text-brand" /> 1. Setup-Klasse
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {setupClassTags.length > 0 ? setupClassTags.map(tag => (
                                <span key={tag} className="px-2.5 py-0.5 bg-brand/15 text-brand border border-brand/30 rounded text-[11px] font-bold font-mono">
                                  {tag}
                                </span>
                              )) : <span className="text-[11px] text-slate-600 font-mono">- Keine Angabe -</span>}
                            </div>
                          </div>

                          <div className="p-3 bg-[#0A0E17] border border-[#161C26] rounded-xl space-y-1.5 shadow-sm">
                            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1 font-mono">
                              <BrainCircuit className="w-3 h-3 text-purple-400" /> 2. Mentale Verfassung
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {mentalStateTags.length > 0 ? mentalStateTags.map(tag => (
                                <span key={tag} className="px-2.5 py-0.5 bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded text-[11px] font-bold font-mono">
                                  {tag}
                                </span>
                              )) : <span className="text-[11px] text-slate-600 font-mono">- Keine Angabe -</span>}
                            </div>
                          </div>

                          <div className="p-3 bg-[#0A0E17] border border-[#161C26] rounded-xl space-y-1.5 shadow-sm md:col-span-2">
                            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1 font-mono">
                              <Layers className="w-3 h-3 text-amber-400" /> 3. Konfluenz-Faktoren
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {confluenceTags.length > 0 ? confluenceTags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded text-[10px] font-mono font-semibold">
                                  #{tag}
                                </span>
                              )) : <span className="text-[11px] text-slate-600 font-mono">- Keine Angabe -</span>}
                              {otherEntryTags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono font-semibold border border-slate-700">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="p-3 bg-[#0A0E17] border border-[#161C26] rounded-xl space-y-1 shadow-sm">
                            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono">Conviction Score</span>
                            <div className="flex items-baseline gap-2 pt-0.5 font-mono">
                              <span className={`text-lg font-black ${trade.conviction >= 8 ? 'text-[#089981]' : trade.conviction >= 5 ? 'text-amber-400' : 'text-[#F23645]'}`}>
                                {trade.conviction || 5}/10
                              </span>
                            </div>
                          </div>

                          {trade.entry_notes && (
                            <div className="p-3 bg-[#0A0E17] border border-[#161C26] rounded-xl space-y-1 md:col-span-3 shadow-sm">
                              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono">Eröffnungsnotiz</span>
                              <p className="text-xs text-slate-300 leading-relaxed bg-[#05070A] p-2.5 rounded-lg border border-[#161C26] font-mono">
                                {trade.entry_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-[#0A0E17] border border-[#161C26] rounded-xl space-y-4 shadow-inner">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">1. Setup-Klasse</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {SETUP_CLASSES.map(cls => {
                                const isActive = entryTags.includes(cls)
                                const isC = cls.includes('Setup C')
                                return (
                                  <button
                                    key={cls}
                                    type="button"
                                    onClick={() => handleUpdateEntryTag(trade.id, cls, SETUP_CLASSES)}
                                    className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                                      isActive
                                        ? isC 
                                          ? 'bg-[#F23645]/20 text-[#F23645] border-[#F23645]/60 shadow-md'
                                          : 'bg-brand/20 text-brand border-brand/60 shadow-md'
                                        : 'bg-[#05070A] border-[#161C26] text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {cls}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">2. Mentale Verfassung</span>
                            <div className="flex flex-wrap gap-2">
                              {MENTAL_STATES.map(state => {
                                const isActive = entryTags.includes(state)
                                const isToxic = state === 'FOMO' || state.includes('Frustriert') || state === 'Gelangweilt'
                                return (
                                  <button
                                    key={state}
                                    type="button"
                                    onClick={() => handleUpdateEntryTag(trade.id, state, MENTAL_STATES)}
                                    className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                      isActive
                                        ? isToxic 
                                          ? 'bg-[#F23645]/20 text-[#F23645] border-[#F23645]/60 shadow-md'
                                          : 'bg-blue-500/20 text-blue-400 border-blue-500/60 shadow-md'
                                        : 'bg-[#05070A] border-[#161C26] text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {state}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">3. Konfluenz-Faktoren</span>
                            <div className="flex flex-wrap gap-1.5">
                              {CONFLUENCES.map(tag => {
                                const isActive = entryTags.includes(tag)
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleUpdateEntryTag(trade.id, tag)}
                                    className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer font-mono ${
                                      isActive
                                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/60 shadow-sm'
                                        : 'bg-[#05070A] border-[#161C26] text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    #{tag}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[#161C26]">
                            <div>
                              <label className="text-[10px] text-slate-400 mb-1.5 font-bold flex items-center justify-between uppercase tracking-wider font-mono">
                                Eröffnungsnotiz (Optional)
                              </label>
                              <textarea
                                value={currentEntryNote}
                                onChange={(e) => setLocalEntryNotes(prev => ({ ...prev, [trade.id]: e.target.value }))}
                                onBlur={() => saveTextareaToDb(trade.id, 'entry_notes', currentEntryNote)}
                                placeholder="Erwartungshaltung, Setup-Besonderheiten..."
                                className="w-full bg-[#05070A] border border-[#161C26] focus:border-[#089981] rounded-xl p-3 text-xs text-white outline-none min-h-[70px] font-mono shadow-inner"
                              />
                            </div>

                            <div className="flex flex-col justify-center space-y-2">
                              <label className="text-[10px] text-slate-400 font-bold flex items-center justify-between font-mono">
                                <span className="uppercase tracking-wider">Conviction Score</span>
                                <span className={`font-mono font-bold text-sm ${trade.conviction >= 8 ? 'text-[#089981]' : trade.conviction >= 5 ? 'text-amber-400' : 'text-[#F23645]'}`}>
                                  {trade.conviction || 5}/10
                                </span>
                              </label>
                              <input 
                                type="range" min="1" max="10" 
                                value={trade.conviction || 5} 
                                onChange={(e) => handleUpdateTrade(trade.id, 'conviction', Number(e.target.value))}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#05070A] border border-[#161C26] accent-brand"
                              />
                              <div className="flex justify-between text-[10px] text-slate-500 font-mono font-semibold">
                                <span>Zweifel</span><span>Absolut sicher</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* POST-TRADE ANALYSE */}
                  <div className="space-y-3 bg-[#05070A] border border-[#161C26] p-4 rounded-xl shadow-lg">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Target className="w-3.5 h-3.5" /> Post-Trade Analyse {viewMode === 'journal' && !isUnlockedInJournal ? '(Verriegelt)' : ''}
                    </span>

                    {viewMode === 'journal' && !isUnlockedInJournal ? (
                      <div className="grid grid-cols-1 gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3 bg-[#0A0E17] border border-[#161C26] rounded-xl space-y-1.5 shadow-sm">
                            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono">Austrittsgrund</span>
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {exitTags.filter(t => EXIT_REASONS.includes(t)).map(tag => (
                                <span key={tag} className="px-2.5 py-0.5 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded text-[11px] font-bold font-mono">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="p-3 bg-[#0A0E17] border border-[#161C26] rounded-xl space-y-1.5 shadow-sm">
                            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono">Emotion nach Exit</span>
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {trade.mood ? (() => {
                                const moodObj = MOODS.find(m => m.label === trade.mood)
                                return (
                                  <span className="px-2.5 py-0.5 bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded text-[11px] font-bold font-mono flex items-center gap-1.5">
                                    <span>{moodObj?.emoji}</span> {trade.mood}
                                  </span>
                                )
                              })() : <span className="text-[11px] text-slate-500 font-mono">-</span>}
                            </div>
                          </div>

                          <div className="p-3 bg-[#0A0E17] border border-[#161C26] rounded-xl space-y-1.5 shadow-sm">
                            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono">Management Rating</span>
                            <div className="flex items-center gap-1 pt-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} className={`w-3.5 h-3.5 ${star <= ratingNum ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-[#222938]'}`} />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-[#0A0E17] border border-[#161C26] rounded-xl space-y-1.5 shadow-sm">
                            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono">Fehler & Regelbrüche</span>
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {selectedErrors.map(tag => (
                                <span key={tag} className="px-2.5 py-0.5 bg-[#F23645]/15 text-[#F23645] border border-[#F23645]/30 rounded text-[11px] font-bold font-mono">
                                  {tag}
                                </span>
                              ))}
                              {hasNoErrors && (
                                <span className="text-[11px] text-[#089981] font-mono bg-[#089981]/15 px-2.5 py-0.5 rounded border border-[#089981]/30 font-bold">
                                  ✓ Kein Fehler
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="p-3 bg-[#0A0E17] border border-[#161C26] rounded-xl space-y-1.5 shadow-sm flex flex-col justify-center">
                            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono">Ausführungs-Disziplin</span>
                            <div className="flex items-center gap-2 pt-0.5">
                              {exitTags.includes(RULE_TAG) ? (
                                <span className="px-2.5 py-0.5 bg-[#089981]/15 text-[#089981] border border-[#089981]/30 rounded text-[11px] font-bold font-mono flex items-center gap-1">
                                  <CheckSquare className="w-3.5 h-3.5" /> 100% Plan-Konform
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-500 font-mono">- Keine Angabe -</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {trade.notes && (
                          <div className="p-3 bg-[#0A0E17] border border-[#161C26] rounded-xl space-y-1.5 shadow-sm">
                            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono">Learnings & Notizen</span>
                            <p className="text-xs text-slate-300 leading-relaxed bg-[#05070A] p-3 rounded-lg border border-[#161C26] font-mono">
                              {trade.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-[#0A0E17] border border-[#161C26] rounded-xl space-y-4 shadow-inner">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">1. Austrittsgrund (Exit Trigger)</span>
                            <div className="flex flex-wrap gap-2">
                              {EXIT_REASONS.map(tag => {
                                const active = exitTags.includes(tag)
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleUpdateExitReason(trade.id, tag)}
                                    className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left flex items-center ${
                                      active ? 'bg-blue-600/25 text-blue-400 border-blue-500/60 shadow-md' : 'bg-[#05070A] border-[#161C26] text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {active && <Check className="w-3.5 h-3.5 inline mr-1" />} {tag}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">2. Emotion nach Exit</span>
                            <div className="grid grid-cols-2 gap-2">
                              {MOODS.map(m => {
                                const active = currentMood === m.label
                                return (
                                  <button
                                    key={m.label}
                                    type="button"
                                    onClick={() => handleUpdateTrade(trade.id, 'mood', m.label)}
                                    className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                                      active ? 'bg-purple-500/25 text-purple-400 border-purple-500/60 shadow-md' : 'bg-[#05070A] border-[#161C26] text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    <span className="text-sm">{m.emoji}</span>
                                    <span>{m.label}</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 border-t border-[#161C26]">
                          <div>
                            <span className="text-[10px] font-bold text-[#F23645] uppercase tracking-wider block mb-2 font-mono">Fehler-Kategorisierung (Multi-Select)</span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                key="no-error"
                                type="button"
                                onClick={() => handleSelectNoErrors(trade.id)}
                                className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                  hasNoErrors 
                                    ? 'bg-[#089981]/25 text-[#089981] border-[#089981]/60 shadow-md' 
                                    : 'bg-[#05070A] border-[#161C26] text-slate-400 hover:text-slate-200'
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
                                    className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center ${
                                      active ? 'bg-[#F23645]/25 text-[#F23645] border-[#F23645]/60 shadow-md' : 'bg-[#05070A] border-[#161C26] text-slate-400 hover:border-[#F23645]/50 hover:text-slate-200'
                                    }`}
                                  >
                                    {tag}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">Ausführungs-Disziplin</span>
                            <div 
                              onClick={() => handleUpdateTrade(trade.id, 'exit_tags', RULE_TAG)}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                                exitTags.includes(RULE_TAG)
                                  ? 'bg-[#089981]/15 border-[#089981]/40 shadow-md' 
                                  : 'bg-[#05070A] border-[#161C26] hover:border-slate-600'
                              }`}
                            >
                              {exitTags.includes(RULE_TAG) ? <CheckSquare className="w-4 h-4 text-[#089981]" /> : <Square className="w-4 h-4 text-slate-500" />}
                              <div>
                                <p className={`text-xs font-bold font-mono ${exitTags.includes(RULE_TAG) ? 'text-[#089981]' : 'text-slate-200'}`}>100% Plan-Konform</p>
                                <p className="text-[10px] text-slate-400 font-mono">Regeln vollständig eingehalten</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 border-t border-[#161C26]">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                              Management-Bewertung
                            </span>
                            <div className="flex items-center gap-1.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => handleRatingChange(trade.id, star)}
                                  className="p-1 transition-transform hover:scale-125 cursor-pointer"
                                >
                                  <Star className={`w-5 h-5 ${star <= ratingNum ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-[#222938]'}`} />
                                </button>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-mono">Wie sauber hast du diesen Trade gemanagt?</p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                              Learnings (Optional)
                            </span>
                            <textarea
                              value={currentNotes}
                              onChange={(e) => setLocalNotes(prev => ({ ...prev, [trade.id]: e.target.value }))}
                              onBlur={() => saveTextareaToDb(trade.id, 'notes', currentNotes)}
                              placeholder="Was machst du beim nächsten Mal anders?"
                              className="w-full bg-[#05070A] border border-[#161C26] focus:border-[#089981] rounded-xl p-3 text-xs text-white outline-none min-h-[70px] font-mono shadow-inner"
                            />
                          </div>
                        </div>

                        {viewMode === 'dashboard' && !trade.is_transferred && (
                          <div className="pt-3 border-t border-[#161C26]">
                            <button
                              type="button"
                              onClick={() => handleTransferToJournal(trade.id)}
                              disabled={!isReadyToTransfer}
                              className="w-full min-h-[44px] py-3 bg-[#089981] hover:bg-[#067a67] disabled:bg-[#05070A] disabled:text-slate-600 text-white font-mono font-extrabold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-[#089981]/20 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <Send className="w-4 h-4" />
                              <span>Trade ins Journal übertragen</span>
                            </button>
                            {!isReadyToTransfer && (
                              <p className="text-[11px] text-amber-400/90 text-center mt-2 font-mono font-medium">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#05070A] border border-[#161C26] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl relative font-sans">
            <div className="flex items-center gap-3 text-amber-400 pb-3 border-b border-[#161C26]">
              <div className="p-2 bg-amber-500/15 rounded-xl border border-amber-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Archivierten Trade anpassen?</h4>
                <p className="text-[11px] text-slate-400 font-mono">Verfälschung vergangener Verhaltensmuster</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Das nachträgliche Anpassen von vergangenem Verhalten verfälscht deine Statistiken und führt zu <strong>Hindsight Bias (Rückschaufehler)</strong>. Sei ehrlich zu dir selbst.
            </p>
            <p className="text-xs text-slate-400 font-mono">
              Möchtest du diesen archivierten Trade wirklich zur Bearbeitung freischalten?
            </p>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setShowWarningModalForId(null)}
                className="w-full sm:w-auto px-4 py-2 bg-[#0A0E17] hover:bg-[#161C26] text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer font-mono"
              >
                Abbrechen
              </button>
              <button 
                type="button"
                onClick={() => {
                  setEditableTradeIds(prev => ({ ...prev, [showWarningModalForId]: true }))
                  setShowWarningModalForId(null)
                }}
                className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20 font-mono"
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