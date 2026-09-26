'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  fetchPlannedSetups, 
  deletePlannedSetup,
  updatePlannedSetupNameDb,
  updatePlannedSetupAnalysisDb
} from '@/lib/supabase/plannedSetups'
import { useJournalStore, PlannedSetup } from '@/lib/supabase/useJournalStore'
import { createClient } from '@/lib/supabase/client'
import TagManagerModal from '@/components/TagManagerModal'
import { useGlobalTags } from '@/context/CustomTagsContext'
import { 
  Trash2, 
  Clock, 
  RefreshCw, 
  Tag, 
  Search, 
  Check, 
  Edit2, 
  ChevronDown, 
  Brain, 
  Sliders, 
  X, 
  Target, 
  ArrowRight, 
  Link2, 
  AlertCircle, 
  Settings2 
} from 'lucide-react'

interface ParsedLivePosition {
  uniqueKey: string
  symbol: string
  side: 'LONG' | 'SHORT'
  marginCoin: string
  size: number
  entryPrice: number
  markPrice: number
  leverage: number
  pnl: number
}

export default function PlannedPipeline() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [searchFilter, setSearchFilter] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [expandedSetupId, setExpandedSetupId] = useState<string | null>(null)
  const [isLinkingId, setIsLinkingId] = useState<string | null>(null)

  // Globaler Tag Context statt lokalem State
  const { customTags, updateTags, resetToDefaults } = useGlobalTags()
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false)

  // Pre-Trade Modal State
  const [analysisModalSetup, setAnalysisModalSetup] = useState<PlannedSetup | null>(null)
  const [tempGrade, setTempGrade] = useState<'A+' | 'B' | 'C'>('A+')
  const [tempMindset, setTempMindset] = useState('Fokus')
  const [tempConfluences, setTempConfluences] = useState<string[]>([])
  const [tempNotes, setTempNotes] = useState('')
  const [convictionScore, setConvictionScore] = useState<number>(8)
  const [tempInvalidation, setTempInvalidation] = useState('')

  // Live Positions & Link Modal State
  const [matchingSetup, setMatchingSetup] = useState<PlannedSetup | null>(null)
  const [livePositions, setLivePositions] = useState<ParsedLivePosition[]>([])
  const [isLoadingLive, setIsLoadingLive] = useState(false)
  const [noPositionNotice, setNoPositionNotice] = useState<string | null>(null)

  const plannedSetups = useJournalStore((state) => state.plannedSetups)
  const removePlannedSetup = useJournalStore((state) => state.removePlannedSetup)
  const updatePlannedSetupName = useJournalStore((state) => state.updatePlannedSetupName)
  const updatePlannedSetupAnalysis = useJournalStore((state) => state.updatePlannedSetupAnalysis)

  const loadSetups = async () => {
    setLoading(true)
    const { data, error } = await fetchPlannedSetups()
    if (!error && data) {
      useJournalStore.setState({ plannedSetups: data })
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSetups()
  }, [])

  const handleDelete = async (id: string) => {
    removePlannedSetup(id)
    await deletePlannedSetup(id)
  }

  const handleStartRename = (setup: PlannedSetup) => {
    setEditingId(setup.id)
    setEditingName(setup.name || '')
  }

  const handleSaveRename = async (id: string) => {
    const trimmed = editingName.trim()
    updatePlannedSetupName(id, trimmed)
    setEditingId(null)
    await updatePlannedSetupNameDb(id, trimmed)
  }

  const handleOpenAnalysisModal = (setup: PlannedSetup) => {
    setAnalysisModalSetup(setup)
    setTempGrade(setup.setupGrade || 'A+')
    setTempMindset(setup.mindset || customTags.mental_states[0] || 'Fokus')
    setTempConfluences(setup.confluences || [])
    setTempNotes(setup.notes || '')
    setTempInvalidation(setup.invalidationCondition || '')
  }

  const handleSaveAnalysis = async () => {
    if (!analysisModalSetup) return

    const analysis = {
      setupGrade: tempGrade,
      mindset: tempMindset,
      confluences: tempConfluences,
      invalidationCondition: tempInvalidation.trim(),
      notes: tempNotes.trim(),
    }

    updatePlannedSetupAnalysis(analysisModalSetup.id, analysis)
    await updatePlannedSetupAnalysisDb(analysisModalSetup.id, analysis)
    setAnalysisModalSetup(null)
  }

  const handleEditInPlanner = (setup: PlannedSetup) => {
    const params = new URLSearchParams()
    if (setup.name) params.set('name', setup.name)
    params.set('asset', setup.pair)
    params.set('dir', setup.direction)
    if (setup.stopLoss) params.set('sl', setup.stopLoss.toString())
    if (setup.tranches[0]?.price) params.set('p1', setup.tranches[0].price.toString())
    if (setup.tranches[0]?.margin) params.set('m1', setup.tranches[0].margin.toString())
    if (setup.takeProfits[0]?.roePercent) params.set('tp1_roe', setup.takeProfits[0].roePercent.toString())
    if (setup.takeProfits[0]?.closePercent) params.set('tp1_close', setup.takeProfits[0].closePercent.toString())

    router.push(`/dashboard/full-planner?${params.toString()}`)
  }

  const handleInitiateLinking = async (setup: PlannedSetup) => {
    setIsLoadingLive(true)
    try {
      const res = await fetch('/api/exchange/live')
      const json = await res.json()

      const rawPositions: any[] = json?.openPositions || []

      const parsedList: ParsedLivePosition[] = rawPositions.map((pos: any) => {
        const rawSide = pos.side || pos.info?.posSide || pos.info?.holdSide || (Number(pos.contracts || pos.size || 0) >= 0 ? 'LONG' : 'SHORT')
        const side: 'LONG' | 'SHORT' = String(rawSide).toUpperCase().includes('SHORT') ? 'SHORT' : 'LONG'
        const symbol = pos.symbol
        const marginCoin = pos.marginCoin || 'USDT'
        const uniqueKey = `${symbol}-${side}-${marginCoin}`
        const size = Math.abs(Number(pos.contracts || pos.size || pos.info?.size || 0))
        const entryPrice = Number(pos.entryPrice || pos.info?.averageOpenPrice || 0)
        const markPrice = Number(pos.markPrice || pos.info?.markPrice || 0)
        const leverage = Number(pos.leverage || pos.info?.leverage || 1)
        const pnl = Number(pos.unrealizedPnl || pos.info?.unrealizedPL || 0)

        return {
          uniqueKey,
          symbol,
          side,
          marginCoin,
          size,
          entryPrice,
          markPrice,
          leverage,
          pnl
        }
      })

      if (parsedList.length === 0) {
        setNoPositionNotice(setup.pair)
      } else {
        setLivePositions(parsedList)
        setMatchingSetup(setup)
      }
    } catch (err) {
      console.error('Error fetching live positions:', err)
      setNoPositionNotice(setup.pair)
    } finally {
      setIsLoadingLive(false)
    }
  }

  const handleConfirmLink = async (setup: PlannedSetup, pos: ParsedLivePosition) => {
    setIsLinkingId(setup.id)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const gradeTag = setup.setupGrade === 'A+' 
      ? 'Setup A: Perfekt' 
      : setup.setupGrade === 'B' 
        ? 'Setup B: Suboptimal' 
        : 'Setup C: Impulsiv / FOMO'

    const mindsetTag = setup.mindset || 'Fokus'
    const cleanConfluences = (setup.confluences || []).map(c => c.replace('#', ''))
    const allTags = [gradeTag, mindsetTag, ...cleanConfluences]

    const fullPreNotes = [
      setup.name ? `[Plan: ${setup.name}]` : null,
      setup.notes ? setup.notes : null,
      setup.invalidationCondition ? `Invalidation: ${setup.invalidationCondition}` : null
    ].filter(Boolean).join(' • ')

    try {
      await fetch('/api/exchange/active-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbol: pos.uniqueKey, 
          tags: allTags,
          energy: 85,
          conviction: convictionScore,
          preNotes: fullPreNotes,
          locked: true,
          initialSize: pos.size || 0
        }),
      })

      if (user) {
        await supabase.from('trades').upsert({
          user_id: user.id,
          pair: pos.symbol,
          direction: pos.side,
          entry_price: pos.entryPrice || setup.avgEntryPrice,
          leverage: pos.leverage,
          margin: setup.totalMargin,
          stop_loss: setup.stopLoss || null,
          take_profits: setup.takeProfits?.map(t => t.targetPrice) || [],
          confluences: allTags,
          mindset: mindsetTag,
          note: fullPreNotes,
          status: 'ACTIVE',
          pre_trade: {
            grade: setup.setupGrade || 'A+',
            mindset: mindsetTag,
            conviction: convictionScore,
            confluences: setup.confluences || [],
            invalidationCondition: setup.invalidationCondition || null,
            notes: setup.notes || null,
            plannedAt: setup.createdAt,
          },
          planned_setup_id: setup.id
        })
      }

      await handleDelete(setup.id)
      setMatchingSetup(null)
      router.push('/dashboard')
    } catch (err) {
      console.error('Failed to link position:', err)
      alert('Error linking setup to position.')
    } finally {
      setIsLinkingId(null)
    }
  }

  const toggleConfluence = (item: string) => {
    setTempConfluences(prev => 
      prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]
    )
  }

  const filteredSetups = (plannedSetups || []).filter((s) => {
    const term = searchFilter.toLowerCase()
    const matchesPair = (s.pair || '').toLowerCase().includes(term)
    const matchesName = (s.name || '').toLowerCase().includes(term)
    return matchesPair || matchesName
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand" />
            Planned Setups Pipeline
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Pre-trade strategy orders standing by. Will only enter execution when matched to an open position.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by setup or pair..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-term-bg border border-term-border rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-brand w-48 sm:w-60"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsTagManagerOpen(true)}
            className="p-2 bg-term-bg hover:bg-term-hover border border-term-border rounded-xl text-slate-400 hover:text-brand transition cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            title="Tags & Setups konfigurieren"
          >
            <Settings2 className="w-4 h-4 text-brand" />
            <span className="hidden sm:inline">Tags</span>
          </button>

          <button
            type="button"
            onClick={loadSetups}
            className="p-2 bg-term-bg hover:bg-term-hover border border-term-border rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            title="Refresh Pipeline"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand' : ''}`} />
          </button>
        </div>
      </div>

      {loading && plannedSetups.length === 0 ? (
        <div className="p-8 text-center bg-term-card border border-term-border rounded-2xl text-slate-500 font-mono text-xs">
          Loading pipeline setups...
        </div>
      ) : filteredSetups.length === 0 ? (
        <div className="p-8 text-center bg-term-card border border-term-border rounded-2xl space-y-2">
          <p className="text-xs font-mono text-slate-400 font-bold">
            {plannedSetups.length === 0 ? 'No planned setups in queue.' : 'No setups match your filter.'}
          </p>
          <p className="text-[11px] font-mono text-slate-500">
            {plannedSetups.length === 0 
              ? 'Formulate your entries and risk tolerance in the Full Position Planner, then commit it here.'
              : 'Clear your search query to see all standing setups.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSetups.map((setup) => {
            const isLong = setup.direction === 'LONG'
            const isEditingThis = editingId === setup.id
            const isExpanded = expandedSetupId === setup.id

            return (
              <div
                key={setup.id}
                className="bg-term-card border border-term-border hover:border-slate-700 p-5 rounded-2xl space-y-4 shadow-xl transition relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5 w-full max-w-xs">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(setup.id)
                                if (e.key === 'Escape') setEditingId(null)
                              }}
                              className="bg-[#090d16] border border-brand text-xs font-mono font-bold text-white px-2.5 py-1 rounded-lg outline-none w-full shadow-inner"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRename(setup.id)}
                              className="p-1.5 bg-brand text-black rounded-lg cursor-pointer hover:bg-brand-hover shrink-0"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartRename(setup)}
                            className="group inline-flex items-center gap-1.5 text-left text-xs font-mono font-bold text-brand hover:underline cursor-pointer"
                          >
                            <Tag className="w-3.5 h-3.5 text-brand shrink-0" />
                            <span className="truncate max-w-[200px] sm:max-w-[240px]">
                              {setup.name && setup.name.trim() !== '' ? setup.name : 'Unnamed Setup (Click to edit)'}
                            </span>
                            <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-brand opacity-60 group-hover:opacity-100 transition shrink-0 ml-0.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-extrabold font-mono text-white text-base">
                          {setup.pair}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-black ${
                            isLong
                              ? 'bg-[#089981]/20 text-[#089981] border border-[#089981]/40'
                              : 'bg-[#F23645]/20 text-[#F23645] border border-[#F23645]/40'
                          }`}
                        >
                          {setup.direction} {setup.leverage}x
                        </span>
                        {setup.setupGrade && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border ${
                            setup.setupGrade === 'A+' 
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                              : setup.setupGrade === 'B' 
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                                : 'bg-[#F23645]/20 text-[#F23645] border-[#F23645]/40'
                          }`}>
                            Grade {setup.setupGrade}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditInPlanner(setup)}
                        className="p-1.5 text-slate-400 hover:text-brand hover:bg-term-bg rounded-xl transition cursor-pointer"
                        title="Re-open in position planner"
                      >
                        <Sliders className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(setup.id)}
                        className="p-1.5 text-slate-500 hover:text-[#F23645] hover:bg-[#F23645]/10 rounded-xl transition cursor-pointer"
                        title="Discard Setup"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#090d16] p-3 rounded-xl border border-slate-800 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Avg Entry</span>
                      <span className="font-bold text-white">${setup.avgEntryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Stop Loss</span>
                      <span className="font-bold text-[#F23645]">
                        {setup.stopLoss ? `$${setup.stopLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Target CRV</span>
                      <span className="font-bold text-brand">{setup.crv ? `1 : ${setup.crv}` : '-'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-term-bg border border-term-border text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-brand shrink-0" />
                      <span className="text-slate-400">Mindset:</span>
                      <span className="text-slate-200 font-semibold">{setup.mindset || 'Unchecked'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenAnalysisModal(setup)}
                      className="text-xs font-bold text-brand hover:underline cursor-pointer flex items-center gap-1"
                    >
                      Pre-Trade Check <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setExpandedSetupId(isExpanded ? null : setup.id)}
                      className="w-full flex items-center justify-between text-xs font-mono text-slate-400 hover:text-white p-2 bg-[#090d16] rounded-xl border border-slate-800 transition cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 font-bold">
                        <Target className="w-3.5 h-3.5 text-brand" />
                        Execution Structure ({setup.tranches?.length || 1} Entries • {setup.takeProfits?.length || 0} TPs)
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="space-y-3 p-3.5 bg-[#060911] rounded-xl border border-slate-800/80 text-xs font-mono animate-in fade-in duration-150">
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">DCA Tranches</span>
                          {setup.tranches?.map((t, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-slate-300 bg-term-bg p-2 rounded-lg border border-term-border">
                              <span>Entry #{idx + 1} ({t.orderType})</span>
                              <span className="font-bold">${t.price.toLocaleString('en-US')} • <strong className="text-brand">${t.margin.toFixed(2)}</strong></span>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-1.5 pt-1 border-t border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Take-Profit Targets</span>
                          {setup.takeProfits && setup.takeProfits.length > 0 ? (
                            setup.takeProfits.map((tp, idx) => (
                              <div key={idx} className="flex justify-between text-[11px] text-slate-300 bg-term-bg p-2 rounded-lg border border-term-border">
                                <span className="text-emerald-400 font-bold">TP #{idx + 1} (${tp.targetPrice.toLocaleString('en-US')})</span>
                                <span>+{tp.roePercent}% <span className="text-slate-500">({tp.closePercent}% close)</span></span>
                              </div>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-600 italic">No TP targets configured.</span>
                          )}
                        </div>

                        {setup.invalidationCondition && (
                          <div className="pt-1 border-t border-slate-800 text-[11px]">
                            <span className="text-amber-400 font-bold block text-[10px] uppercase">Invalidation Rule 🛑:</span>
                            <p className="text-slate-300 italic">{setup.invalidationCondition}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-term-border flex items-center justify-between gap-3">
                  <div className="text-[10px] font-mono text-slate-500">
                    Planned Margin: <strong className="text-white">${setup.totalMargin.toFixed(2)}</strong> • Max Risk: <span className="text-[#F23645]">-${setup.maxLossUsd?.toFixed(2) || '0.00'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInitiateLinking(setup)}
                    disabled={isLoadingLive || isLinkingId === setup.id}
                    className="px-4 py-2 bg-brand hover:bg-brand-hover text-black font-mono font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-brand/20 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Link2 className="w-4 h-4" />
                    <span>{isLoadingLive ? 'Checking Exchange...' : 'Link to Active Position'}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ================= MODAL 1: PRE-TRADE STRATEGY & PSYCHOLOGY ================= */}
      {analysisModalSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0b101b] border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                <Brain className="w-4 h-4" />
                <span>PRE-TRADE STRATEGY & PSYCHOLOGY CHECK 🧠</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTagManagerOpen(true)}
                  className="px-2.5 py-1 bg-term-bg hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono text-brand flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Tags bearbeiten</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAnalysisModalSetup(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-6 font-sans">
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider block">
                  1. SETUP QUALITY GRADE
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTempGrade('A+')}
                    className={`py-3 px-3 rounded-xl text-xs font-semibold border transition text-left cursor-pointer ${
                      tempGrade === 'A+' 
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10' 
                        : 'bg-[#060911] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Setup A: Textbook Clean 💎
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempGrade('B')}
                    className={`py-3 px-3 rounded-xl text-xs font-semibold border transition text-left cursor-pointer ${
                      tempGrade === 'B' 
                        ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10' 
                        : 'bg-[#060911] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Setup B: Suboptimal / Delayed ⚖️
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempGrade('C')}
                    className={`py-3 px-3 rounded-xl text-xs font-semibold border transition text-left cursor-pointer ${
                      tempGrade === 'C' 
                        ? 'bg-[#F23645]/15 border-[#F23645] text-[#F23645] shadow-md shadow-[#F23645]/10' 
                        : 'bg-[#060911] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Setup C: Impulsive / FOMO ⚠️
                  </button>
                </div>
              </div>

              {/* DYNAMISCHE MENTALE VERFASSUNGEN */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider block">
                  2. PRE-TRADE MENTAL STATE (RIGHT NOW)
                </span>
                <div className="flex flex-wrap gap-2">
                  {customTags.mental_states.map((state) => {
                    const isSelected = tempMindset === state
                    return (
                      <button
                        key={state}
                        type="button"
                        onClick={() => setTempMindset(state)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-slate-700/60 border-slate-500 text-white font-bold shadow-sm'
                            : 'bg-[#060911] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <span>{state}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* DYNAMISCHE KONFLUENZEN */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider block">
                  3. CONFLUENCE VALIDATIONS (HARD RULES)
                </span>
                <div className="flex flex-wrap gap-2">
                  {customTags.confluences.map((tag) => {
                    const active = tempConfluences.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleConfluence(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition cursor-pointer flex items-center gap-1.5 ${
                          active
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 font-bold'
                            : 'bg-[#060911] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <span>#{tag}</span>
                        {active && <Check className="w-3 h-3 text-emerald-400" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-7 space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider block">
                    SETUP HYPOTHESIS & CONTEXT (OPTIONAL)
                  </span>
                  <textarea
                    placeholder="Why this level? What market dynamics validate this idea?..."
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-[#060911] border border-slate-800 focus:border-slate-600 rounded-xl p-3 text-xs text-white placeholder-slate-600 outline-none resize-none font-mono"
                  />
                </div>

                <div className="md:col-span-5 space-y-2 bg-[#060911] p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-[11px] font-semibold tracking-wider text-slate-400">CONVICTION SCORE</span>
                    <span className="text-sm font-bold text-amber-400">{convictionScore}/10 🎯</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={convictionScore}
                    onChange={(e) => setConvictionScore(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Hesitant</span>
                    <span>High Conviction</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider block">
                  INVALIDATION CRITERIA (WHEN IS THIS SETUP PROVEN WRONG?)
                </span>
                <input
                  type="text"
                  placeholder="e.g. 15m candle closes below key S/R level or absorption fails..."
                  value={tempInvalidation}
                  onChange={(e) => setTempInvalidation(e.target.value)}
                  className="w-full bg-[#060911] border border-slate-800 focus:border-slate-600 rounded-xl p-3 text-xs text-white placeholder-slate-600 outline-none font-mono"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAnalysisModalSetup(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAnalysis}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Save Pre-Trade Strategy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ECHTE BÖRSEN-POSITION VERLINKEN ================= */}
      {matchingSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0b101b] border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-white font-mono text-xs font-bold uppercase tracking-wider">
                <Link2 className="w-4 h-4 text-brand" />
                <span>LINK SETUP TO ACTIVE EXCHANGE POSITION</span>
              </div>
              <button
                type="button"
                onClick={() => setMatchingSetup(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-sans">
                Active positions detected on Bitget. Attach this plan to transfer all pre-trade parameters:
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {livePositions.map((pos, idx) => {
                  const cleanPosSymbol = pos.symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
                  const cleanSetupSymbol = matchingSetup.pair.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
                  const isMatchingAsset = cleanPosSymbol.includes(cleanSetupSymbol) || cleanSetupSymbol.includes(cleanPosSymbol)
                  const isLong = pos.side === 'LONG'

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleConfirmLink(matchingSetup, pos)}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                        isMatchingAsset
                          ? 'bg-brand/10 border-brand/50 hover:border-brand text-white'
                          : 'bg-[#060911] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{pos.symbol}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isLong ? 'text-emerald-400 bg-emerald-500/10' : 'text-[#F23645] bg-[#F23645]/10'
                          }`}>
                            {pos.side} {pos.leverage}x
                          </span>
                          {isMatchingAsset && (
                            <span className="text-[10px] text-brand font-bold bg-brand/20 px-1.5 py-0.5 rounded">
                              Asset Match
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Entry: ${pos.entryPrice ? pos.entryPrice.toLocaleString('en-US') : '-'} • Size: {pos.size} {pos.symbol.replace('USDT', '')}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-mono text-brand font-bold">
                        <span>Attach & Lock Plan</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: NOTICE WENN KEINE POSITION GEFUNDEN ================= */}
      {noPositionNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0b101b] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" />
                <span>NO LIVE EXCHANGE POSITION FOUND</span>
              </div>
              <button
                type="button"
                onClick={() => setNoPositionNotice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-sans text-xs text-slate-300 leading-relaxed">
              <p>
                Could not find an active contract on Bitget for <span className="font-mono text-white font-bold">{noPositionNotice}</span>.
              </p>
              <p className="text-slate-400 text-[11px]">
                Make sure your limit order was filled and check the browser console for details on the exchange response.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setNoPositionNotice(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: TAG-MANAGER ================= */}
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