'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Zap,
  Check,
  AlertTriangle,
  Layers,
  Target,
  BrainCircuit,
  Star,
  Activity,
  CheckSquare,
  Calculator,
  Clock,
  Plus,
  Trash2,
  SlidersHorizontal,
  FileSpreadsheet,
  KeyRound,
  CheckCircle2,
  X
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Reality Check Datensätze für reaktive Warnungen
// ---------------------------------------------------------------------------
const MENTAL_WARNINGS: Record<string, { type: 'danger' | 'warning' | 'positive'; count: number; winrate: number; pnl: string; text: string }> = {
  'FOMO': {
    type: 'danger',
    count: 14,
    winrate: 28,
    pnl: '-$1.420,00',
    text: 'Du jagst Kerzen hinterher. Historisch führt das bei dir zu massivem Slippage und Panik-Exits.'
  },
  'Frustriert (Revenge)': {
    type: 'danger',
    count: 9,
    winrate: 11,
    pnl: '-$2.180,50',
    text: 'Revenge-Trade detektiert. Wenn du frustriert bist, hebelst du statistisch 2.4x höher als dein Plan erlaubt.'
  },
  'Müde': {
    type: 'warning',
    count: 6,
    winrate: 33,
    pnl: '-$490,00',
    text: 'Konzentrationsmangel. Deine Invalidation-Reaktionszeit verdoppelt sich nachweislich.'
  },
  'Fokus': {
    type: 'positive',
    count: 38,
    winrate: 68,
    pnl: '+$3.840,20',
    text: 'Systematischer Flow-State. Deine statistische Edge greift nachweislich.'
  },
  'Überzeugt': {
    type: 'positive',
    count: 22,
    winrate: 63,
    pnl: '+$1.910,00',
    text: 'Hohe Konfluenzbasis. Behalte deine feste Stop-Loss-Marke trotzdem kompromisslos bei.'
  }
}

export default function LandingPage() {
  // 1. Live Ticker & Fluktuation
  const [liveMarkPrice, setLiveMarkPrice] = useState(65340.50)
  const [livePnl, setLivePnl] = useState(342.80)
  const [pnlPulse, setPnlPulse] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.48) * 16
      setLiveMarkPrice(prev => Number((prev + delta).toFixed(2)))
      setLivePnl(prev => Number((prev + delta * 0.052).toFixed(2)))
      setPnlPulse(true)
      setTimeout(() => setPnlPulse(false), 800)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  // 2. Eröffnungsanalyse State & Locking Logik
  const [selectedSetup, setSelectedSetup] = useState('Setup A: Perfekt')
  const [selectedMental, setSelectedMental] = useState('FOMO')
  const [selectedConfluences, setSelectedConfluences] = useState<string[]>(['Orderblock', 'CVD-Divergenz'])
  const [conviction, setConviction] = useState(8)
  const [isLocked, setIsLocked] = useState(false)
  const [showWarningModal, setShowWarningModal] = useState(false)

  const toggleConfluence = (tag: string) => {
    if (isLocked) return
    setSelectedConfluences(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  // 3. Post-Trade Inbox State (Modul 2)
  const [exitReason, setExitReason] = useState('Take Profit (geplant)')
  const [exitMood, setExitMood] = useState('Erleichtert')
  const [isPlanCompliant, setIsPlanCompliant] = useState(true)
  const [rating, setRating] = useState(4)

  // 4. Hebelrechner State (Modul 3)
  const [tranches, setTranches] = useState([
    { id: '1', price: 64500, margin: 150 }
  ])
  const [calcRiskPct, setCalcRiskPct] = useState(1.5)
  const [calcSl, setCalcSl] = useState(63800)

  const activeMargin = tranches.reduce((sum, t) => sum + (Number(t.margin) || 0), 0)
  const avgEntryPrice = activeMargin > 0
    ? tranches.reduce((sum, t) => sum + (Number(t.price) * Number(t.margin)), 0) / activeMargin
    : 0

  const slDistPct = avgEntryPrice > 0 ? Math.abs((avgEntryPrice - calcSl) / avgEntryPrice) * 100 : 0
  const roundtripFeePct = 0.08
  const totalRiskPct = slDistPct + roundtripFeePct
  const optimalLeverage = totalRiskPct > 0 ? Math.min(50, Math.max(1, (calcRiskPct * 10) / totalRiskPct)) : 1
  const maxLossUsd = (activeMargin * calcRiskPct) / 100
  const totalNotionalUsd = activeMargin * optimalLeverage

  const addTranche = () => {
    if (tranches.length >= 2) return
    setTranches(prev => [...prev, { id: '2', price: 64100, margin: 100 }])
  }

  const removeTranche = (id: string) => {
    setTranches(prev => prev.filter(t => t.id !== id))
  }

  const activeWarning = MENTAL_WARNINGS[selectedMental] || MENTAL_WARNINGS['FOMO']

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-200 font-sans selection:bg-[#089981]/30 relative overflow-x-hidden">
      
      {/* BACKGROUND AMBIENT GLOWS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#089981]/10 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute top-[1600px] -left-40 w-[600px] h-[600px] bg-[#089981]/5 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* NAVIGATION */}
      <nav className="border-b border-[#161A23] bg-[#07090E]/90 backdrop-blur-2xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#089981]/15 border border-[#089981]/30 flex items-center justify-center text-[#089981] shadow-[0_0_15px_rgba(8,153,129,0.2)]">
              <Zap size={18} />
            </div>
            <span className="text-base font-black tracking-wider text-white">
              RISK<span className="text-[#089981]">IL</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 rounded-full border border-[#1E2536] bg-[#0B0E14] px-4 py-1 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#089981] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#089981]" />
            </span>
            <span className="text-slate-400">Execution-Terminal</span>
            <span className="text-slate-600">|</span>
            <span className="text-[#089981] font-bold">Bitget Direct Sync</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="text-xs font-bold text-slate-400 hover:text-white transition px-3 py-1.5"
            >
              Anmelden
            </Link>
            <Link
              href="/auth"
              className="group inline-flex items-center gap-1.5 rounded-xl bg-[#089981] px-4 py-2 text-xs font-black text-white hover:bg-[#0AAE93] transition shadow-[0_0_15px_rgba(8,153,129,0.25)] cursor-pointer"
            >
              <span>Demo testen</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121622] border border-[#1E2536] text-[11px] font-mono text-[#089981]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#089981] animate-pulse" />
          <span>Kein Excel. Kein Selbstbetrug. Reines Risikomanagement.</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.08]">
          Hör auf, deine Trades nach Gefühl zu schließen.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#089981] via-emerald-400 to-[#0AAE93]">
            Sichere dein System.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Verbinde deine Börse per Read-Only API. Dokumentiere deine Gedanken <strong className="text-slate-200">beim Entry</strong>, verriegele sie gegen Hindsight Bias und berechne deinen Hebel exakt nach Gebühren.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/auth"
            className="w-full sm:w-auto px-8 py-4 bg-[#089981] hover:bg-[#067a67] text-white text-xs font-black rounded-xl transition shadow-[0_0_28px_rgba(8,153,129,0.35)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Demo starten (Kein Passwort nötig)</span>
            <ArrowRight size={14} />
          </Link>
          <a
            href="#live-station-1"
            className="w-full sm:w-auto px-6 py-4 bg-[#0D111A] hover:bg-[#141824] border border-[#1A202C] hover:border-[#222938] text-slate-300 hover:text-white text-xs font-bold rounded-xl transition flex items-center justify-center"
          >
            Tool-Features ausprobieren ↓
          </a>
        </div>

        {/* SECURITY PROMISE BAR */}
        <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-left">
          <div className="bg-[#0B0E14] border border-[#161A23] p-3.5 rounded-xl flex items-center gap-3">
            <KeyRound size={18} className="text-[#089981] shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-white">100% Read-Only</div>
              <div className="text-[10px] text-slate-500">Null Zugriff auf dein Geld</div>
            </div>
          </div>
          <div className="bg-[#0B0E14] border border-[#161A23] p-3.5 rounded-xl flex items-center gap-3">
            <Lock size={18} className="text-[#089981] shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-white">AES-256-GCM</div>
              <div className="text-[10px] text-slate-500">Hardware-grade Verschlüsselung</div>
            </div>
          </div>
          <div className="bg-[#0B0E14] border border-[#161A23] p-3.5 rounded-xl flex items-center gap-3">
            <Activity size={18} className="text-[#089981] shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-white">Sekunden-Sync</div>
              <div className="text-[10px] text-slate-500">Keine manuellen CSV-Dateien</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* STATION 1: LIVE POSITIONS & ERÖFFNUNGSANALYSE */}
      {/* ========================================================================= */}
      <section id="live-station-1" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-[#161A23] space-y-8">
        
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#089981] font-bold uppercase tracking-wider">
            <Activity size={14} />
            <span>Station 01 • Offene Positionen & Vorab-Lock</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Offene Positionen & der psychologische Ehrlichkeits-Filter.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Trades scheitern fast nie am Chart, sondern an der mentalen Verfassung beim Einstieg. Riskil zwingt dich dazu, deine Setup-Klasse und Emotion <strong className="text-slate-200">während des laufenden Trades</strong> festzuhalten und zu verriegeln. Wer hinterher Ausreden sucht, scheitert am System.
          </p>
        </div>

        {/* INTERAKTIVE MOCKUP KARTE */}
        <div className="rounded-3xl border border-[#1E2536] bg-[#0B0E14] shadow-2xl p-4 sm:p-6 space-y-5 relative">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#161A23] gap-2">
            <div className="flex items-center gap-2.5 font-mono text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#089981] animate-pulse" />
              <span className="font-bold text-white">Live-Orderbook Sync: Aktiv</span>
              <span className="text-slate-500 hidden sm:inline">| Bitget API</span>
            </div>
            <span className="text-[11px] font-mono text-[#089981] bg-[#089981]/10 px-3 py-0.5 rounded-md border border-[#089981]/20">
              Interaktive Simulation: Klicke die Buttons
            </span>
          </div>

          {/* Trade Card Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-[#07090E] border border-[#161B26] rounded-2xl p-4 sm:p-6">
            
            {/* Linke Seite: Live Metrics */}
            <div className="lg:col-span-5 bg-[#0B0E14] border border-[#161B26] p-5 rounded-xl space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-[#089981]/15 text-[#089981] border border-[#089981]/30">
                    LONG 10x (USDT)
                  </span>
                  <span className="font-mono font-bold text-white text-xs">BTC / USDT Perp</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Live PnL (Netto)</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-3xl font-mono font-black transition-colors duration-300 ${pnlPulse ? 'text-emerald-300' : 'text-[#089981]'}`}>
                      +{livePnl.toFixed(2)} USDT
                    </span>
                    <span className="text-xs font-mono font-bold text-[#089981]">
                      (+{(livePnl / 20).toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#161A23] grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Entry Kurs</span>
                  <span className="text-slate-200 font-bold">$64.230,50</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Live Marktkurs</span>
                  <span className="text-white font-bold transition-all duration-200">${liveMarkPrice.toLocaleString('de-DE')}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Größe</span>
                  <span className="text-slate-200 font-bold">0.052 BTC</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Status</span>
                  <span className={isLocked ? "text-[#089981] font-bold flex items-center gap-1" : "text-amber-400 font-bold flex items-center gap-1"}>
                    <Lock size={11} /> {isLocked ? 'Verriegelt' : 'Ausstehend'}
                  </span>
                </div>
              </div>
            </div>

            {/* Rechte Seite: Entweder Erfassungsmaske ODER echte Lock-Kachel */}
            <div className="lg:col-span-7 bg-[#0B0E14] border border-[#161B26] p-5 rounded-xl flex flex-col justify-center min-h-[300px]">
              {isLocked ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center relative animate-in fade-in zoom-in-95 duration-200 w-full h-full">
                  <button 
                    onClick={() => setShowWarningModal(true)}
                    className="absolute top-0 right-0 px-2.5 py-1.5 bg-[#161A23] hover:bg-[#222938] border border-[#222938] hover:border-slate-600 rounded-xl text-[10px] font-semibold text-slate-300 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-[#089981]" />
                    <span>Parameter anpassen</span>
                  </button>

                  <div className="w-10 h-10 rounded-full bg-[#089981]/15 text-[#089981] border border-[#089981]/30 flex items-center justify-center shadow-lg shadow-[#089981]/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white tracking-wide">Trade läuft im Live-Modus</p>
                    <p className="text-xs text-slate-400 mt-0.5">Eröffnungsanalyse erfolgreich verriegelt.</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#089981]/15 text-[#089981] border border-[#089981]/30 text-[10px] font-mono">
                      {selectedSetup}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-mono">
                      Mental: {selectedMental}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono">
                      Score: {conviction}/10
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5 flex items-center gap-1">
                      <Target size={12} className="text-[#089981]" /> 1. Setup-Klasse wählen
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {['Setup A: Perfekt', 'Setup B: Suboptimal', 'Setup C: Impulsiv / FOMO'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSetup(s)}
                          className={`px-2.5 py-2 rounded-xl text-[10px] font-bold border transition text-left cursor-pointer ${
                            selectedSetup === s
                              ? s.includes('Setup C')
                                ? 'bg-[#F23645]/20 text-[#F23645] border-[#F23645]/50'
                                : 'bg-[#089981]/20 text-[#089981] border-[#089981]/50 shadow-sm'
                              : 'bg-[#121622] border-[#1E2536] text-slate-400 hover:text-white'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5 flex items-center gap-1">
                      <BrainCircuit size={12} className="text-purple-400" /> 2. Mentale Verfassung
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Fokus', 'FOMO', 'Müde', 'Frustriert (Revenge)', 'Überzeugt'].map((m) => (
                        <button
                          key={m}
                          onClick={() => setSelectedMental(m)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                            selectedMental === m
                              ? m === 'FOMO' || m.includes('Frustriert')
                                ? 'bg-[#F23645]/25 text-[#F23645] border-[#F23645]/60 font-bold'
                                : 'bg-blue-500/25 text-blue-400 border-blue-500/60 font-bold'
                              : 'bg-[#121622] border-[#1E2536] text-slate-400 hover:text-white'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5 flex items-center gap-1">
                      <Layers size={12} className="text-amber-400" /> 3. Konfluenz-Faktoren
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Orderblock', 'Fibonacci', 'Imbalance', 'CVD-Divergenz', 'Liq-Cluster'].map((c) => {
                        const active = selectedConfluences.includes(c)
                        return (
                          <button
                            key={c}
                            onClick={() => toggleConfluence(c)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition cursor-pointer ${
                              active
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                                : 'bg-[#121622] border-[#1E2536] text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            #{c}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#161B26] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] uppercase font-mono font-bold text-slate-400">
                        <span>Conviction: {conviction}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={conviction}
                        onChange={(e) => setConviction(Number(e.target.value))}
                        className="w-32 h-1 bg-slate-800 rounded-lg accent-[#089981] cursor-pointer"
                      />
                    </div>

                    <button
                      onClick={() => setIsLocked(true)}
                      className="px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer bg-[#089981] hover:bg-[#067a67] text-white shadow-lg shadow-[#089981]/25"
                    >
                      <Lock size={13} />
                      <span>Einstiegsanalyse sichern</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* DYNAMISCHER REALITY CHECK BANNER */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 flex items-start gap-3.5 ${
            activeWarning.type === 'danger'
              ? 'bg-[#F23645]/10 border-[#F23645]/30'
              : activeWarning.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-[#089981]/10 border-[#089981]/30'
          }`}>
            <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
              activeWarning.type === 'danger' ? 'bg-[#F23645]/20 text-[#F23645]' : activeWarning.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-[#089981]/20 text-[#089981]'
            }`}>
              <AlertTriangle size={18} />
            </div>
            <div className="text-xs space-y-1">
              <div className="font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <span>Historischer Reality Check: Tag #{selectedMental}</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-black/40 border border-white/10">
                  {activeWarning.count} Trades erfasst
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {activeWarning.text} Deine historische Winrate liegt bei <strong className="text-white">{activeWarning.winrate}%</strong> mit einem Netto-Ergebnis von <strong className={activeWarning.type === 'positive' ? 'text-[#089981]' : 'text-[#F23645]'}>{activeWarning.pnl}</strong>.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* STATION 2: DIE POST-TRADE INBOX */}
      {/* ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-[#161A23] space-y-8">
        
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#089981] font-bold uppercase tracking-wider">
            <Clock size={14} />
            <span>Station 02 • Post-Trade Inbox & Archiv-Integrität</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Kein geschlossener Trade landet unanalysiert im Archiv.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Geschlossene Positionen fließen automatisch in deine <strong className="text-slate-200">Post-Trade Inbox</strong>. Sie werden erst für deine Gesamtstatistik freigeschaltet, wenn Austrittsgrund, Emotion und Disziplin ehrlich dokumentiert wurden.
          </p>
        </div>

        {/* INBOX MOCKUP */}
        <div className="rounded-3xl border border-[#1E2536] bg-[#0B0E14] shadow-2xl p-5 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#161A23] gap-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              1 Trade in der Post-Trade Inbox (Dokumentation ausstehend)
            </div>
            <span className="text-[11px] font-mono text-slate-400">Realisierter Net-Profit: +$284,50 USDT</span>
          </div>

          <div className="bg-[#07090E] border border-[#161A23] rounded-2xl p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Austrittsgrund */}
              <div className="bg-[#0B0E14] border border-[#161B26] p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">1. Austrittsgrund</span>
                <div className="flex flex-col gap-1.5">
                  {['Take Profit (geplant)', 'Stop Loss (geplant)', 'Manueller Exit (Angst)'].map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setExitReason(ex)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border text-left transition cursor-pointer ${
                        exitReason === ex ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 font-bold' : 'bg-[#121622] border-[#1E2536] text-slate-400'
                      }`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emotion nach Exit */}
              <div className="bg-[#0B0E14] border border-[#161B26] p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">2. Emotion nach Exit</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Erleichtert', emoji: '😮‍💨' },
                    { label: 'Wütend', emoji: '🤬' },
                    { label: 'Euphorisch', emoji: '🤩' },
                    { label: 'Gleichgültig', emoji: '😐' }
                  ].map((m) => (
                    <button
                      key={m.label}
                      onClick={() => setExitMood(m.label)}
                      className={`px-2.5 py-2 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                        exitMood === m.label ? 'bg-purple-500/20 text-purple-400 border-purple-500/50 font-bold' : 'bg-[#121622] border-[#1E2536] text-slate-400'
                      }`}
                    >
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Disziplin & Rating */}
              <div className="bg-[#0B0E14] border border-[#161B26] p-4 rounded-xl space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">3. Management Rating</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setRating(s)} className="cursor-pointer">
                        <Star size={16} className={s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div 
                  onClick={() => setIsPlanCompliant(!isPlanCompliant)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer select-none transition ${
                    isPlanCompliant ? 'bg-[#089981]/15 border-[#089981]/40 text-[#089981]' : 'bg-[#121622] border-[#1E2536] text-slate-400'
                  }`}
                >
                  <CheckSquare size={16} />
                  <span className="text-xs font-bold">100% Plan-Konform</span>
                </div>
              </div>

            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono border-t border-[#161A23]">
              <span className="text-slate-500">Alle Pflichtfelder erfüllt • Integritäts-Check: Bestanden</span>
              <button
                type="button"
                className="px-6 py-2.5 rounded-xl bg-[#089981] hover:bg-[#067a67] text-white font-bold transition shadow-md shadow-[#089981]/20 cursor-pointer"
              >
                Trade ins Journal übertragen →
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* STATION 3: MATHEMATISCHER HEBEL- & DCA-RECHNER */}
      {/* ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-[#161A23] space-y-8">
        
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#089981] font-bold uppercase tracking-wider">
            <Calculator size={14} />
            <span>Station 03 • Mathematische Risk-Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Stop-Loss Distanz & Gebühren bestimmen den Hebel – nicht deine Gier.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Standard-Hebelrechner ignorieren Börsengebühren. Riskil errechnet deinen exakten Hebel anhand deines maximalen Dollar-Verlusts und zieht Maker- und Taker-Roundtrips automatisch mit ein.
          </p>
        </div>

        {/* RECHNER INTERAKTIV */}
        <div className="rounded-3xl border border-[#1E2536] bg-[#0B0E14] shadow-2xl p-5 sm:p-8 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#161A23] gap-2">
            <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#089981]" />
              Multi-Tranchen DCA-Berechnung (Bitget Taker/Maker integriert)
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
              Demo: 2 Tranchen • Vollversion: Unbegrenzte Einstiege
            </span>
          </div>

          {/* Tranchen-Liste */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase font-mono">
              <span>Einstiegs-Tranchen ({tranches.length}/2)</span>
              <span className="text-[11px] text-slate-500">Mischkurs wird dynamisch errechnet</span>
            </div>

            {tranches.map((tranche, idx) => (
              <div key={tranche.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[#07090E] border border-[#161A23] p-3.5 rounded-xl items-center">
                <div className="sm:col-span-3 text-xs font-mono font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#089981]" />
                  Entry #{idx + 1}
                </div>

                <div className="sm:col-span-4 relative">
                  <input
                    type="number"
                    value={tranche.price}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setTranches(prev => prev.map(t => t.id === tranche.id ? { ...t, price: val } : t))
                    }}
                    className="w-full bg-[#0B0E14] border border-[#1E2536] rounded-xl py-2 px-3 text-xs font-mono text-white outline-none focus:border-[#089981]"
                    placeholder="Kurs"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-mono">$</span>
                </div>

                <div className="sm:col-span-4 relative">
                  <input
                    type="number"
                    value={tranche.margin}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setTranches(prev => prev.map(t => t.id === tranche.id ? { ...t, margin: val } : t))
                    }}
                    className="w-full bg-[#0B0E14] border border-[#1E2536] rounded-xl py-2 px-3 text-xs font-mono text-white outline-none focus:border-[#089981]"
                    placeholder="Marge"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-mono">$</span>
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  {tranches.length > 1 && (
                    <button
                      onClick={() => removeTranche(tranche.id)}
                      className="p-2 text-slate-500 hover:text-[#F23645] transition cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {tranches.length < 2 && (
              <button
                onClick={addTranche}
                className="w-full py-2.5 border border-dashed border-[#1E2536] hover:border-[#089981]/50 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> 2. DCA-Tranche hinzufügen (Simulieren)
              </button>
            )}
          </div>

          {/* Stop Loss & Risk Parameter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-[#07090E] border border-[#161A23] p-4 rounded-xl space-y-2">
              <label className="text-xs font-bold text-[#F23645] uppercase tracking-wider flex items-center justify-between">
                <span>Stop Loss ($)</span>
                <span className="text-[10px] font-mono text-slate-500">Abstand: {slDistPct.toFixed(2)}%</span>
              </label>
              <input
                type="number"
                value={calcSl}
                onChange={(e) => setCalcSl(Number(e.target.value))}
                className="w-full bg-[#0B0E14] border border-[#F23645]/40 rounded-xl py-2 px-3 text-sm font-mono text-white outline-none focus:border-[#F23645]"
              />
            </div>

            <div className="bg-[#07090E] border border-[#161A23] p-4 rounded-xl space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Max. Margen-Verlust in %</span>
                <span className="text-[10px] font-mono text-slate-500">≈ ${maxLossUsd.toFixed(2)} Verlust</span>
              </label>
              <input
                type="number"
                step="0.5"
                value={calcRiskPct}
                onChange={(e) => setCalcRiskPct(Number(e.target.value))}
                className="w-full bg-[#0B0E14] border border-[#1E2536] rounded-xl py-2 px-3 text-sm font-mono text-white outline-none focus:border-[#089981]"
              />
            </div>
          </div>

          {/* ERGEBNIS MATRIX */}
          <div className="pt-4 border-t border-[#161A23] grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-mono">
            <div className="bg-[#07090E] border border-[#161A23] p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Mischkurs (Avg Entry)</span>
              <span className="text-base sm:text-lg font-black text-white">${avgEntryPrice.toFixed(2)}</span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Gewichteter Einstieg</span>
            </div>

            <div className="bg-[#07090E] border border-[#089981]/50 p-4 rounded-xl shadow-[0_0_15px_rgba(8,153,129,0.1)]">
              <span className="text-[10px] text-[#089981] uppercase block font-bold">Optimaler Hebel</span>
              <span className="text-xl sm:text-2xl font-black text-[#089981]">{optimalLeverage.toFixed(1)}x</span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Inkl. Roundtrip Fees</span>
            </div>

            <div className="bg-[#07090E] border border-[#161A23] p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Gesamte Marge</span>
              <span className="text-base sm:text-lg font-black text-white">${activeMargin.toFixed(2)}</span>
              <span className="text-[9px] text-[#F23645] block mt-0.5">SL-Loss: -${maxLossUsd.toFixed(2)}</span>
            </div>

            <div className="bg-[#07090E] border border-[#161A23] p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Positionswert</span>
              <span className="text-base sm:text-lg font-black text-slate-200">${totalNotionalUsd.toFixed(0)}</span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Notional Exposure</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* HINDSIGHT BIAS MODAL (DEZENTER BACKDROP-BLUR & SAUBERER TEXT) */}
      {/* ========================================================================= */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150">
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
              Das nachträgliche Anpassen deiner Parameter während des Trades führt zu <strong>Hindsight Bias (Rückschaufehler)</strong> und verfälscht deine statistischen Auswertungen. Sei ehrlich zu dir selbst.
            </p>
            <p className="text-xs text-slate-400">
              Möchtest du die gelockte Eröffnungsanalyse für diesen Trade wirklich wieder freigeben?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setShowWarningModal(false)}
                className="px-4 py-2 bg-[#161A23] hover:bg-[#222938] text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Abbrechen
              </button>
              <button 
                type="button"
                onClick={() => {
                  setIsLocked(false)
                  setShowWarningModal(false)
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Trotzdem anpassen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL CTA SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center space-y-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#0D111A] to-[#07090E] border border-[#1E2536] space-y-5 shadow-2xl relative overflow-hidden">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Schluss mit Zufallsergebnissen.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Teste das Terminal kostenlos. Kein Passwort, keine Kreditkarte – verifiziere einfach deine E-Mail und leg los.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#089981] hover:bg-[#067a67] text-white text-xs font-black rounded-xl transition shadow-[0_0_28px_rgba(8,153,129,0.35)] cursor-pointer"
          >
            <span>Kostenlosen Zugang starten</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#161A23] py-8 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Zap size={14} className="text-[#089981]" />
            <span>© {new Date().getFullYear()} Riskil. Engineering Discipline.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/agb" className="hover:text-slate-300 transition">AGB</Link>
            <Link href="/datenschutz" className="hover:text-slate-300 transition">Datenschutz</Link>
            <Link href="/impressum" className="hover:text-slate-300 transition">Impressum</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}