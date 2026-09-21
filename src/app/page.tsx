'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Lock,
  Zap,
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
  KeyRound,
  CheckCircle2,
  Share2,
  PlusSquare,
  MoreVertical,
  Download,
  Apple,
  Smartphone,
  Send,
  X,
  Sparkles,
  Mail,
  Loader2,
  FileImage,
  Scale
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Reality Check Datensätze für reaktive Warnungen (Trading Desk Terminology)
// ---------------------------------------------------------------------------
const MENTAL_WARNINGS: Record<string, { type: 'danger' | 'warning' | 'positive'; count: number; winrate: number; pnl: string; text: string }> = {
  'FOMO': {
    type: 'danger',
    count: 14,
    winrate: 28,
    pnl: '-$1,420.00',
    text: 'You are chasing green candles. Historically, this triggers severe slippage and emotional panic exits.'
  },
  'Frustrated (Revenge)': {
    type: 'danger',
    count: 9,
    winrate: 11,
    pnl: '-$2,180.50',
    text: 'Revenge trade detected. When trading tilted, you statistically exceed your max allowable leverage by 2.4x.'
  },
  'Fatigued': {
    type: 'warning',
    count: 6,
    winrate: 33,
    pnl: '-$490.00',
    text: 'Lack of cognitive focus. Your reaction time to trade invalidations historically doubles.'
  },
  'Focused': {
    type: 'positive',
    count: 38,
    winrate: 68,
    pnl: '+$3,840.20',
    text: 'Systematic execution state. Your statistical edge is actively playing out.'
  },
  'High Conviction': {
    type: 'positive',
    count: 22,
    winrate: 63,
    pnl: '+$1,910.00',
    text: 'High confluence baseline. Do not loosen your pre-determined stop-loss level under any circumstances.'
  }
}

// ---------------------------------------------------------------------------
// Installations-Schritte für PWA Guide
// ---------------------------------------------------------------------------
type Platform = 'ios' | 'android'

interface GuideStep {
  title: string
  desc: string
  icon: any
  badge: string
}

const iosSteps: GuideStep[] = [
  {
    title: 'Tap the Share button',
    desc: 'In Safari, tap the Share icon located at the bottom navigation bar (square with upward arrow).',
    icon: Share2,
    badge: 'Step 1',
  },
  {
    title: 'Select “Add to Home Screen”',
    desc: 'Scroll down in the action sheet and tap “Add to Home Screen” next to the plus icon.',
    icon: PlusSquare,
    badge: 'Step 2',
  },
  {
    title: 'Confirm Installation',
    desc: 'Tap “Add” in the top-right corner. RISKIL will now launch in standalone fullscreen mode without browser chrome.',
    icon: CheckCircle2,
    badge: 'Step 3',
  },
]

const androidSteps: GuideStep[] = [
  {
    title: 'Open Chrome Menu',
    desc: 'In Chrome, tap the three vertical dots (⋮) in the top-right corner next to the address bar.',
    icon: MoreVertical,
    badge: 'Step 1',
  },
  {
    title: 'Tap “Install app”',
    desc: 'Select “Install app” or “Add to Home screen” with the download monitor icon.',
    icon: Download,
    badge: 'Step 2',
  },
  {
    title: 'Confirm & Launch',
    desc: 'Confirm the system prompt by tapping “Install”. The WebAPK is automatically placed in your app drawer.',
    icon: CheckCircle2,
    badge: 'Step 3',
  },
]

export default function LandingPage() {
  // Modal State für Closed Beta Bewerbung
  const [showBetaModal, setShowBetaModal] = useState(false)
  const [betaEmail, setBetaEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [betaSubmitted, setBetaSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

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
  const [selectedSetup, setSelectedSetup] = useState('Setup A: A+ Model')
  const [selectedMental, setSelectedMental] = useState('FOMO')
  const [selectedConfluences, setSelectedConfluences] = useState<string[]>(['Orderblock', 'CVD Divergence'])
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
  const [exitReason, setExitReason] = useState('Take Profit (Planned)')
  const [exitMood, setExitMood] = useState('Relieved')
  const [isPlanCompliant, setIsPlanCompliant] = useState(true)
  const [rating, setRating] = useState(4)

  // 4. Hebelrechner State (Modul 3 mit % und $ Umschalter)
  const [tranches, setTranches] = useState([
    { id: '1', price: 64500, margin: 150 }
  ])
  const [riskMode, setRiskMode] = useState<'PERCENT' | 'USD'>('PERCENT')
  const [calcRiskPct, setCalcRiskPct] = useState(1.5)
  const [calcRiskUsd, setCalcRiskUsd] = useState(3.75)
  const [calcSl, setCalcSl] = useState(63800)

  // 5. PWA Guide State
  const [platform, setPlatform] = useState<Platform>('ios')
  const [activeStep, setActiveStep] = useState(0)

  const activeSteps = platform === 'ios' ? iosSteps : androidSteps

  const switchPlatform = (next: Platform) => {
    setPlatform(next)
    setActiveStep(0)
  }

  const activeMargin = tranches.reduce((sum, t) => sum + (Number(t.margin) || 0), 0)
  const avgEntryPrice = activeMargin > 0
    ? tranches.reduce((sum, t) => sum + (Number(t.price) * Number(t.margin)), 0) / activeMargin
    : 0

  const handlePercentChange = (val: number) => {
    setCalcRiskPct(val)
    if (activeMargin > 0) {
      setCalcRiskUsd(Number(((activeMargin * val) / 100).toFixed(2)))
    }
  }

  const handleUsdChange = (val: number) => {
    setCalcRiskUsd(val)
    if (activeMargin > 0) {
      setCalcRiskPct(Number(((val / activeMargin) * 100).toFixed(2)))
    }
  }

  const slDistPct = avgEntryPrice > 0 ? Math.abs((avgEntryPrice - calcSl) / avgEntryPrice) * 100 : 0
  const roundtripFeePct = 0.08
  const totalRiskPct = slDistPct + roundtripFeePct
  const effectiveLossPercent = riskMode === 'PERCENT' ? calcRiskPct : (activeMargin > 0 ? (calcRiskUsd / activeMargin) * 100 : 0)
  const optimalLeverage = totalRiskPct > 0 ? Math.min(50, Math.max(1, (effectiveLossPercent * 10) / totalRiskPct)) : 1
  const maxLossUsd = riskMode === 'PERCENT' ? (activeMargin * calcRiskPct) / 100 : calcRiskUsd
  const totalNotionalUsd = activeMargin * optimalLeverage

  const addTranche = () => {
    if (tranches.length >= 2) return
    setTranches(prev => [...prev, { id: '2', price: 64100, margin: 100 }])
  }

  const removeTranche = (id: string) => {
    setTranches(prev => prev.filter(t => t.id !== id))
  }

  const activeWarning = MENTAL_WARNINGS[selectedMental] || MENTAL_WARNINGS['FOMO']

  // Whitelist Handler via Resend & Supabase Backend-Route
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!betaEmail || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: betaEmail.trim().toLowerCase() }),
      })

      let data: any = {}
      try {
        data = await res.json()
      } catch (jsonErr) {
        // Falls der Server kein JSON zurückgibt
      }

      if (!res.ok) {
        if (res.status === 409) {
          setSubmitError('You are already registered on the whitelist!')
        } else {
          setSubmitError(data?.error || `Submission failed (${res.status})`)
        }
        setIsSubmitting(false)
        return
      }

      setBetaSubmitted(true)
      setTimeout(() => {
        setBetaSubmitted(false)
        setShowBetaModal(false)
        setBetaEmail('')
        setIsSubmitting(false)
      }, 2200)
    } catch (err: any) {
      console.error('Waitlist submission error:', err)
      setSubmitError(err?.message || 'Network error. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-200 font-sans selection:bg-[#089981]/30 relative overflow-x-hidden">
      
      {/* ZERO-COST AMBIENT GLOWS */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[550px] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(circle 450px at 50% 10%, rgba(8, 153, 129, 0.12), transparent 70%)'
        }}
      />
      <div 
        className="hidden lg:block absolute top-[1500px] left-0 w-[500px] h-[500px] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(circle 300px at 20% 50%, rgba(8, 153, 129, 0.06), transparent 70%)'
        }}
      />

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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBetaModal(true)}
              className="text-xs font-bold text-slate-400 hover:text-white transition px-3 py-1.5 cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => setShowBetaModal(true)}
              className="group inline-flex items-center gap-1.5 rounded-xl bg-[#089981] px-4 py-2 text-xs font-black text-white hover:bg-[#0AAE93] transition shadow-[0_0_15px_rgba(8,153,129,0.25)] cursor-pointer"
            >
              <span>Request Beta Access</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121622] border border-[#1E2536] text-[11px] font-mono text-[#089981]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#089981] animate-pulse" />
          <span>Zero Spreadsheets. Zero Excuses. Pure Risk Architecture.</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.08]">
          Stop closing trades based on emotion.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#089981] via-emerald-400 to-[#0AAE93]">
            Systematize your edge.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Sync your exchange via 100% read-only API. Lock your trade setup and thesis <strong className="text-slate-200">at entry</strong> to eliminate hindsight bias, and calculate exact leverage factoring in real roundtrip fees.
        </p>

        {/* MULTI-EXCHANGE SUPPORT BADGES */}
        <div className="pt-1 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono">
          <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] mr-1">Supported:</span>
          {['Bitget', 'OKX', 'Bybit', 'Binance'].map((exchange) => (
            <span 
              key={exchange} 
              className="bg-[#0D111A] border border-[#1E2536] px-2.5 py-1 rounded-lg text-slate-300 flex items-center gap-1.5 shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#089981]" />
              {exchange}
            </span>
          ))}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            onClick={() => setShowBetaModal(true)}
            className="w-full sm:w-auto px-8 py-4 bg-[#089981] hover:bg-[#067a67] text-white text-xs font-black rounded-xl transition shadow-[0_0_28px_rgba(8,153,129,0.35)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Apply for Closed Beta</span>
            <ArrowRight size={14} />
          </button>
          <a
            href="#live-station-1"
            className="w-full sm:w-auto px-6 py-4 bg-[#0D111A] hover:bg-[#141824] border border-[#1A202C] hover:border-[#222938] text-slate-300 hover:text-white text-xs font-bold rounded-xl transition flex items-center justify-center"
          >
            Explore Terminal Modules ↓
          </a>
        </div>

        {/* SECURITY PROMISE BAR */}
        <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-left">
          <div className="bg-[#0B0E14] border border-[#161A23] p-3.5 rounded-xl flex items-center gap-3">
            <KeyRound size={18} className="text-[#089981] shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-white">100% Read-Only</div>
              <div className="text-[10px] text-slate-500">Zero trade routing or withdrawal access</div>
            </div>
          </div>
          <div className="bg-[#0B0E14] border border-[#161A23] p-3.5 rounded-xl flex items-center gap-3">
            <Lock size={18} className="text-[#089981] shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-white">AES-256-GCM</div>
              <div className="text-[10px] text-slate-500">Hardware-grade credential encryption</div>
            </div>
          </div>
          <div className="bg-[#0B0E14] border border-[#161A23] p-3.5 rounded-xl flex items-center gap-3">
            <Activity size={18} className="text-[#089981] shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-white">Real-Time Sync</div>
              <div className="text-[10px] text-slate-500">No manual CSV uploads or logs</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FREE TOOLS BENTO GRID PREVIEW INJECTION */}
      {/* ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="relative rounded-3xl border border-[#089981]/40 bg-gradient-to-b from-[#0B0E14] via-[#080d1a] to-[#05070a] p-6 sm:p-10 shadow-2xl overflow-hidden group">
          
          <div className="absolute top-0 right-1/3 w-96 h-96 bg-[#089981]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-8">
            
            {/* Header intro */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#161A23]">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#089981]/15 border border-[#089981]/30 text-[#089981] font-mono text-[10px] font-bold uppercase">
                  <Calculator size={13} />
                  <span>Instant Access • No Login Required • PWA Ready</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Free Perps Calculator Suite. Built for Speed.
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Need instant pre-trade numbers without setting up an API? Use our standalone client-side terminal tools right in your browser or install them on your home screen.
                </p>
              </div>

              <div className="shrink-0">
                <a
                  href="https://go.riskil.app/tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#089981] hover:bg-[#067a67] text-white font-black text-xs rounded-xl transition shadow-[0_0_25px_rgba(8,153,129,0.35)] cursor-pointer active:scale-95"
                >
                  <span>Open Free Tools Terminal</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>

            {/* Bento Grid Preview Cards (3 Tools) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Tool 1: Leverage Sizer */}
              <div className="bg-[#07090E] border border-[#161A23] hover:border-[#089981]/50 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#089981]/10 border border-[#089981]/30 flex items-center justify-center text-[#089981]">
                      <Zap size={18} />
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#121622] text-slate-400 font-bold">
                      01 / SIZING
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Leverage & Risk Sizer</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Computes blended DCA entries over unlimited tranches and mathematically rounds down leverage to fit your exact dollar risk budget.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#0B0E14] border border-[#161A23] rounded-xl font-mono text-[11px] space-y-2">
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>BTCUSDT • SHORT</span>
                    <span className="text-[#089981] font-bold">22x SAFE</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#07090E] p-1.5 rounded border border-[#161A23]">
                      <span className="text-[9px] text-slate-500 block">Avg Entry</span>
                      <span className="font-bold text-slate-200">$83,035</span>
                    </div>
                    <div className="bg-[#07090E] p-1.5 rounded border border-[#161A23]">
                      <span className="text-[9px] text-slate-500 block">Max Risk</span>
                      <span className="font-bold text-[#F23645]">-$50.00</span>
                    </div>
                  </div>
                </div>

                <a
                  href="https://go.riskil.app/tools/leverage-calculator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-[#121622] hover:bg-[#089981] text-slate-300 hover:text-white rounded-xl text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Launch Sizer</span>
                  <ArrowRight size={12} />
                </a>
              </div>

              {/* Tool 2: TP Planner */}
              <div className="bg-[#07090E] border border-[#161A23] hover:border-[#089981]/50 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Target size={18} />
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#121622] text-slate-400 font-bold">
                      02 / EXITS
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Take-Profit Scale-Out Planner</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Simulates tiered profit-taking with live exchange fees. Prevents premature closes on high-conviction swings with residual margin tracking.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#0B0E14] border border-[#161A23] rounded-xl font-mono text-[11px] space-y-2">
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>BTCUSDT • SCALE-OUT</span>
                    <span className="text-emerald-400 font-bold">3 TIERS</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#07090E] p-1.5 rounded border border-[#161A23]">
                      <span className="text-[9px] text-slate-500 block">TP1 (25% RoE)</span>
                      <span className="font-bold text-emerald-400">+$43.20</span>
                    </div>
                    <div className="bg-[#07090E] p-1.5 rounded border border-[#161A23]">
                      <span className="text-[9px] text-slate-500 block">Net Profit</span>
                      <span className="font-bold text-white">+$128.78</span>
                    </div>
                  </div>
                </div>

                <a
                  href="https://go.riskil.app/tools/tp-planner"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-[#121622] hover:bg-[#089981] text-slate-300 hover:text-white rounded-xl text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Launch TP Planner</span>
                  <ArrowRight size={12} />
                </a>
              </div>

              {/* Tool 3: Full Matrix */}
              <div className="bg-[#07090E] border border-[#161A23] hover:border-[#089981]/50 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <FileImage size={18} />
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#121622] text-slate-400 font-bold">
                      03 / EXPORT & PNG
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Full Execution Matrix</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      The seamless workflow combining DCA entries, strict stop loss, and TP ladders into a synchronized dashboard with high-res PNG trade card export.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#0B0E14] border border-[#161A23] rounded-xl font-mono text-[11px] space-y-2">
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>SETUP MATRIX</span>
                    <span className="text-purple-400 font-bold">PNG READY</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#07090E] p-1.5 rounded border border-[#161A23]">
                      <span className="text-[9px] text-slate-500 block">Total Margin</span>
                      <span className="font-bold text-white">$300.00</span>
                    </div>
                    <div className="bg-[#07090E] p-1.5 rounded border border-[#161A23]">
                      <span className="text-[9px] text-slate-500 block">CRV Ratio</span>
                      <span className="font-bold text-emerald-400">1 : 2.65</span>
                    </div>
                  </div>
                </div>

                <a
                  href="https://go.riskil.app/tools/position-planner"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-[#121622] hover:bg-[#089981] text-slate-300 hover:text-white rounded-xl text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Launch Full Matrix</span>
                  <ArrowRight size={12} />
                </a>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* STATION 1: LIVE POSITIONS & PRE-TRADE LOCK */}
      {/* ========================================================================= */}
      <section id="live-station-1" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-[#161A23] space-y-8">
        
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#089981] font-bold uppercase tracking-wider">
            <Activity size={14} />
            <span>Module 01 • Open Positions & Pre-Trade Lock</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Live positions meet psychological integrity filters.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Trades rarely fail because of chart mechanics — they fail due to the trader&apos;s mental state at entry. RISKIL forces you to record setup quality and emotional state <strong className="text-slate-200">while the trade is live</strong> and freezes it. Zero rationalizing after the fact.
          </p>
        </div>

        {/* INTERAKTIVE MOCKUP KARTE */}
        <div className="rounded-3xl border border-[#1E2536] bg-[#0B0E14] shadow-2xl p-4 sm:p-6 space-y-5 relative">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#161A23] gap-2">
            <div className="flex items-center gap-2.5 font-mono text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#089981] animate-pulse" />
              <span className="font-bold text-white">Live Orderbook Sync: Connected</span>
              <span className="text-slate-500 hidden sm:inline">| Bitget, OKX, Bybit, Binance</span>
            </div>
            <span className="text-[11px] font-mono text-[#089981] bg-[#089981]/10 px-3 py-0.5 rounded-md border border-[#089981]/20">
              Interactive Simulation: Test the triggers
            </span>
          </div>

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
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Live PnL (Net)</span>
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
                  <span className="text-slate-500 text-[10px] uppercase block">Entry Price</span>
                  <span className="text-slate-200 font-bold">$64,230.50</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Live Mark Price</span>
                  <span className="text-white font-bold transition-all duration-200">${liveMarkPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Size</span>
                  <span className="text-slate-200 font-bold">0.052 BTC</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Integrity State</span>
                  <span className={isLocked ? "text-[#089981] font-bold flex items-center gap-1" : "text-amber-400 font-bold flex items-center gap-1"}>
                    <Lock size={11} /> {isLocked ? 'Locked' : 'Pending Lock'}
                  </span>
                </div>
              </div>
            </div>

            {/* Rechte Seite: Entweder Erfassungsmaske ODER echte Lock-Kachel */}
            <div className="lg:col-span-7 bg-[#0B0E14] border border-[#161B26] p-5 rounded-xl flex flex-col justify-center min-h-[300px]">
              {isLocked ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center relative animate-in fade-in zoom-in-95 duration-200 w-full h-full">
                  <button 
                    type="button"
                    onClick={() => setShowWarningModal(true)}
                    className="absolute top-0 right-0 px-2.5 py-1.5 bg-[#161A23] hover:bg-[#222938] border border-[#222938] hover:border-slate-600 rounded-xl text-[10px] font-semibold text-slate-300 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-[#089981]" />
                    <span>Adjust Thesis</span>
                  </button>

                  <div className="w-10 h-10 rounded-full bg-[#089981]/15 text-[#089981] border border-[#089981]/30 flex items-center justify-center shadow-lg shadow-[#089981]/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white tracking-wide">Position Running in Active Terminal</p>
                    <p className="text-xs text-slate-400 mt-0.5">Pre-trade thesis locked and immutable.</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#089981]/15 text-[#089981] border border-[#089981]/30 text-[10px] font-mono">
                      {selectedSetup}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-mono">
                      State: {selectedMental}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono">
                      Conviction: {conviction}/10
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5 flex items-center gap-1">
                      <Target size={12} className="text-[#089981]" /> 1. Select Setup Quality
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {['Setup A: A+ Model', 'Setup B: Suboptimal', 'Setup C: Impulsive / FOMO'].map((s) => (
                        <button
                          key={s}
                          type="button"
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
                      <BrainCircuit size={12} className="text-purple-400" /> 2. Psychological State
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Focused', 'FOMO', 'Fatigued', 'Frustrated (Revenge)', 'High Conviction'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setSelectedMental(m)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                            selectedMental === m
                              ? m === 'FOMO' || m.includes('Frustrated')
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
                      <Layers size={12} className="text-amber-400" /> 3. Confluence Triggers
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Orderblock', 'Fibonacci Retracement', 'Imbalance / FVG', 'CVD Divergence', 'Liquidity Sweep'].map((c) => {
                        const active = selectedConfluences.includes(c)
                        return (
                          <button
                            key={c}
                            type="button"
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
                        <span>Conviction Level: {conviction}/10</span>
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
                      type="button"
                      onClick={() => setIsLocked(true)}
                      className="px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer bg-[#089981] hover:bg-[#067a67] text-white shadow-lg shadow-[#089981]/25"
                    >
                      <Lock size={13} />
                      <span>Lock Pre-Trade Thesis</span>
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
                <span>Historical Reality Check: Tag #{selectedMental}</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-black/40 border border-white/10">
                  {activeWarning.count} trades logged
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {activeWarning.text} Your historical win rate sits at <strong className="text-white">{activeWarning.winrate}%</strong> with a net performance of <strong className={activeWarning.type === 'positive' ? 'text-[#089981]' : 'text-[#F23645]'}>{activeWarning.pnl}</strong>.
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
            <span>Module 02 • Post-Trade Inbox & Audit Integrity</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            No closed trade enters the archive without an audit.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Closed trades route automatically into your <strong className="text-slate-200">Post-Trade Inbox</strong>. They are withheld from your verified analytics until exit rationale, execution discipline, and post-trade mindset are documented with complete honesty.
          </p>
        </div>

        {/* INBOX MOCKUP */}
        <div className="rounded-3xl border border-[#1E2536] bg-[#0B0E14] shadow-2xl p-5 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#161A23] gap-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              1 Trade Pending Review in Inbox
            </div>
            <span className="text-[11px] font-mono text-slate-400">Realized Net Profit: +$284.50 USDT</span>
          </div>

          <div className="bg-[#07090E] border border-[#161A23] rounded-2xl p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Austrittsgrund */}
              <div className="bg-[#0B0E14] border border-[#161B26] p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">1. Exit Reason</span>
                <div className="flex flex-col gap-1.5">
                  {['Take Profit (Planned)', 'Stop Loss (Planned)', 'Manual Close (Fear / Tilt)'].map((ex) => (
                    <button
                      key={ex}
                      type="button"
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
                <span className="text-[10px] font-bold uppercase text-slate-500 block">2. Post-Trade Emotion</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Relieved', emoji: '😮‍💨' },
                    { label: 'Angry / Tilted', emoji: '🤬' },
                    { label: 'Euphoric', emoji: '🤩' },
                    { label: 'Neutral', emoji: '😐' }
                  ].map((m) => (
                    <button
                      key={m.label}
                      type="button"
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
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">3. Execution Quality</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setRating(s)} className="cursor-pointer">
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
                  <span className="text-xs font-bold">100% Plan Compliant</span>
                </div>
              </div>

            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono border-t border-[#161A23]">
              <span className="text-slate-500">All mandatory fields satisfied • Integrity Check: Passed</span>
              <button
                type="button"
                className="px-6 py-2.5 rounded-xl bg-[#089981] hover:bg-[#067a67] text-white font-bold transition shadow-md shadow-[#089981]/20 cursor-pointer"
              >
                Commit Trade to Journal →
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
            <span>Module 03 • Mathematical Risk Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Stop distance & roundtrip fees dictate leverage — never greed.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Generic leverage calculators ignore taker and liquidation slippage. RISKIL determines your maximum allowable leverage based on your strict dollar loss tolerance and automatically accounts for maker/taker fee erosion.
          </p>
        </div>

        {/* RECHNER INTERAKTIV */}
        <div className="rounded-3xl border border-[#1E2536] bg-[#0B0E14] shadow-2xl p-5 sm:p-8 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#161A23] gap-2">
            <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#089981]" />
              Multi-Tranche DCA Engine (Bitget, OKX, Bybit, Binance Tiered Taker/Maker Built-In)
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
              Demo: 2 Tranches • Production: Unlimited DCA Steps
            </span>
          </div>

          {/* Tranchen-Liste */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase font-mono">
              <span>Entry Tranches ({tranches.length}/2)</span>
              <span className="text-[11px] text-slate-500">Blended average price calculated dynamically</span>
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
                    placeholder="Price"
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
                    placeholder="Margin"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-mono">$</span>
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  {tranches.length > 1 && (
                    <button
                      type="button"
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
                type="button"
                onClick={addTranche}
                className="w-full py-2.5 border border-dashed border-[#1E2536] hover:border-[#089981]/50 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Add 2nd DCA Tranche (Simulate Scale-In)
              </button>
            )}
          </div>

          {/* Stop Loss & Risk Parameter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-[#07090E] border border-[#161A23] p-4 rounded-xl space-y-2">
              <label className="text-xs font-bold text-[#F23645] uppercase tracking-wider flex items-center justify-between">
                <span>Stop Loss ($)</span>
                <span className="text-[10px] font-mono text-slate-500">Distance: {slDistPct.toFixed(2)}%</span>
              </label>
              <input
                type="number"
                value={calcSl}
                onChange={(e) => setCalcSl(Number(e.target.value))}
                className="w-full bg-[#0B0E14] border border-[#F23645]/40 rounded-xl py-2 px-3 text-sm font-mono text-white outline-none focus:border-[#F23645]"
              />
            </div>

            <div className="bg-[#07090E] border border-[#161A23] p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Max Portfolio Margin Risk
                </label>
                <div className="flex bg-[#0B0E14] p-0.5 rounded-lg border border-[#1E2536] text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setRiskMode('PERCENT')}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      riskMode === 'PERCENT' ? 'bg-[#089981] text-white font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    % of Margin
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskMode('USD')}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      riskMode === 'USD' ? 'bg-[#089981] text-white font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    $ Amount
                  </button>
                </div>
              </div>

              {riskMode === 'PERCENT' ? (
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={calcRiskPct}
                    onChange={(e) => handlePercentChange(Number(e.target.value))}
                    className="w-full bg-[#0B0E14] border border-[#1E2536] rounded-xl py-2 px-3 pr-8 text-sm font-mono text-white outline-none focus:border-[#089981]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-500">%</span>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    value={calcRiskUsd}
                    onChange={(e) => handleUsdChange(Number(e.target.value))}
                    className="w-full bg-[#0B0E14] border border-[#1E2536] rounded-xl py-2 px-3 pr-8 text-sm font-mono text-white outline-none focus:border-[#089981]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-500">$</span>
                </div>
              )}

              <span className="text-[10px] font-mono text-slate-500 block">
                {riskMode === 'PERCENT'
                  ? `≈ $${maxLossUsd.toFixed(2)} of $${activeMargin.toFixed(2)} margin`
                  : `≈ ${effectiveLossPercent.toFixed(1)}% of total margin`}
              </span>
            </div>
          </div>

          {/* ERGEBNIS MATRIX */}
          <div className="pt-4 border-t border-[#161A23] grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-mono">
            <div className="bg-[#07090E] border border-[#161A23] p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Blended Entry Price</span>
              <span className="text-base sm:text-lg font-black text-white">${avgEntryPrice.toFixed(2)}</span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Weighted average fill</span>
            </div>

            <div className="bg-[#07090E] border border-[#089981]/50 p-4 rounded-xl shadow-[0_0_15px_rgba(8,153,129,0.1)]">
              <span className="text-[10px] text-[#089981] uppercase block font-bold">Optimal Leverage</span>
              <span className="text-xl sm:text-2xl font-black text-[#089981]">{optimalLeverage.toFixed(1)}x</span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Roundtrip fees included</span>
            </div>

            <div className="bg-[#07090E] border border-[#161A23] p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Total Margin</span>
              <span className="text-base sm:text-lg font-black text-white">${activeMargin.toFixed(2)}</span>
              <span className="text-[9px] text-[#F23645] block mt-0.5">SL Realized: -${maxLossUsd.toFixed(2)}</span>
            </div>

            <div className="bg-[#07090E] border border-[#161A23] p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Position Size</span>
              <span className="text-base sm:text-lg font-black text-slate-200">${totalNotionalUsd.toFixed(0)}</span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Notional exposure</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* PWA INSTALLATION GUIDE (iOS & Android) */}
      {/* ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-[#161A23]">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-[11px] font-mono tracking-widest text-[#089981] uppercase bg-[#089981]/10 px-3.5 py-1 rounded-full border border-[#089981]/25 font-bold">
            Mobile Terminal Experience
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            On your home screen in 10 seconds.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            No app store download required. Fullscreen Progressive Web App with zero browser address bar friction.
          </p>

          {/* OS SELECTOR SWITCH */}
          <div className="flex justify-center pt-2">
            <div className="bg-[#0B0E14] p-1.5 rounded-2xl border border-[#161A23] flex gap-1.5 shadow-inner">
              <button
                type="button"
                onClick={() => switchPlatform('ios')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  platform === 'ios'
                    ? 'bg-[#141824] text-white border border-[#1E2536] shadow-lg shadow-black/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Apple size={16} /> Apple iOS
              </button>

              <button
                type="button"
                onClick={() => switchPlatform('android')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  platform === 'android'
                    ? 'bg-[#141824] text-white border border-[#1E2536] shadow-lg shadow-black/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone size={16} /> Android (Chrome)
              </button>
            </div>
          </div>
        </div>

        {/* INTERACTIVE GUIDE CONTAINER */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#0B0E14] border border-[#161A23] rounded-3xl p-6 md:p-10 shadow-2xl">
          {/* STEP CARDS (LINKS) */}
          <div className="md:col-span-6 space-y-3.5">
            {activeSteps.map((step, idx) => {
              const Icon = step.icon
              const isCurrent = activeStep === idx

              return (
                <div
                  key={step.title}
                  onClick={() => setActiveStep(idx)}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 flex items-start gap-4 ${
                    isCurrent
                      ? 'bg-[#121622] border-[#089981]/50 shadow-lg shadow-[#089981]/5'
                      : 'bg-[#07090E] border-[#161A23] hover:border-slate-700 opacity-60 hover:opacity-90'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold transition-colors ${
                      isCurrent
                        ? 'bg-[#089981] text-white shadow-md shadow-[#089981]/30'
                        : 'bg-[#161A23] text-slate-400'
                    }`}
                  >
                    <Icon size={19} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#089981] uppercase font-bold">
                      {step.badge}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{step.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* PHONE VISUALIZER (RECHTS) */}
          <div className="md:col-span-6 flex justify-center py-4">
            <div className="relative w-[280px] h-[480px] bg-[#07090E] border-[6px] border-[#1A1F2C] rounded-[40px] shadow-2xl overflow-hidden flex flex-col justify-between">
              {/* NOTCH / DYNAMIC ISLAND */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#161A23] rounded-full z-20" />

              {/* SIMULATED APP HEADER */}
              <div className="pt-8 px-4 flex items-center justify-between border-b border-[#161A23]/60 pb-3 bg-[#0B0E14]/60">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-[#089981] flex items-center justify-center text-[10px] font-black text-white">
                    R
                  </div>
                  <span className="text-[11px] font-bold text-white tracking-wide">RISKIL</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#089981] animate-pulse" />
              </div>

              {/* SIMULATED APP CONTENT */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-center">
                <div className="bg-[#121622] p-3 rounded-xl border border-[#161A23] space-y-1">
                  <div className="h-2 w-12 bg-slate-700 rounded" />
                  <div className="h-4 w-24 bg-[#089981]/80 rounded" />
                </div>

                <div className="bg-[#121622] p-3 rounded-xl border border-[#161A23] space-y-2">
                  <div className="h-2 w-20 bg-slate-700 rounded" />
                  <div className="h-16 w-full bg-[#0B0E14] rounded-lg border border-[#161A23] flex items-center justify-center text-[10px] text-slate-500 font-mono">
                    Performance Analytics
                  </div>
                </div>
              </div>

              {/* ANIMATED ACTION OVERLAY */}
              <AnimatePresence mode="wait">
                {platform === 'ios' ? (
                  <motion.div
                    key={`ios-${activeStep}`}
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 25 }}
                    transition={{ duration: 0.18 }}
                    className="bg-[#121622]/95 backdrop-blur-md border-t border-[#1E2536] p-4 text-center rounded-b-[34px]"
                  >
                    {activeStep === 0 && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#089981]/20 text-[#089981] flex items-center justify-center animate-bounce">
                          <Share2 size={20} />
                        </div>
                        <span className="text-xs font-bold text-white">1. Tap Share at the bottom</span>
                      </div>
                    )}
                    {activeStep === 1 && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#089981] text-white flex items-center justify-center shadow-lg shadow-[#089981]/30">
                          <PlusSquare size={20} />
                        </div>
                        <span className="text-xs font-bold text-white">2. Select “Add to Home Screen”</span>
                      </div>
                    )}
                    {activeStep === 2 && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#089981] text-white flex items-center justify-center shadow-lg shadow-[#089981]/30">
                          <CheckCircle2 size={20} />
                        </div>
                        <span className="text-xs font-bold text-white">3. Tap “Add” in top-right</span>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`android-${activeStep}`}
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 25 }}
                    transition={{ duration: 0.18 }}
                    className="bg-[#121622]/95 backdrop-blur-md border-t border-[#1E2536] p-4 text-center rounded-b-[34px]"
                  >
                    {activeStep === 0 && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#089981]/20 text-[#089981] flex items-center justify-center animate-pulse">
                          <MoreVertical size={20} />
                        </div>
                        <span className="text-xs font-bold text-white">1. Tap menu (⋮) in top right</span>
                      </div>
                    )}
                    {activeStep === 1 && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#089981] text-white flex items-center justify-center shadow-lg shadow-[#089981]/30">
                          <Download size={20} />
                        </div>
                        <span className="text-xs font-bold text-white">2. Select “Install app”</span>
                      </div>
                    )}
                    {activeStep === 2 && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#089981] text-white flex items-center justify-center shadow-lg shadow-[#089981]/30">
                          <CheckCircle2 size={20} />
                        </div>
                        <span className="text-xs font-bold text-white">3. Confirm & Launch</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* HINDSIGHT BIAS MODAL */}
      {/* ========================================================================= */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0D111A] border border-[#1A202C] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center gap-3 text-amber-400 pb-2 border-b border-[#161B26]">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Unlock & Adjust Trade Thesis?</h4>
                <p className="text-[11px] text-slate-400">Breach of journal integrity protocol</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Modifying your setup parameters after order fill induces <strong>hindsight bias</strong> and compromises your statistical edge. Do not rationalize what the market is doing.
            </p>
            <p className="text-xs text-slate-400">
              Are you sure you want to unlock this pre-trade entry analysis?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setShowWarningModal(false)}
                className="px-4 py-2 bg-[#161A23] hover:bg-[#222938] text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => {
                  setIsLocked(false)
                  setShowWarningModal(false)
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Override & Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CLOSED BETA ACCESS APPLICATION MODAL */}
      {/* ========================================================================= */}
      {showBetaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0B0E14] border border-[#1E2536] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            
            {/* Ambient Background Glow */}
            <div 
              className="absolute -top-24 -right-24 w-60 h-60 pointer-events-none -z-10"
              style={{
                background: 'radial-gradient(circle, rgba(8, 153, 129, 0.25) 0%, transparent 70%)'
              }}
            />

            {/* Close Button */}
            <button
              onClick={() => setShowBetaModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#141824] hover:bg-[#1E2536] text-slate-400 hover:text-white transition cursor-pointer border border-[#1E2536]"
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div className="space-y-2 pr-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#089981]/10 border border-[#089981]/30 text-[10px] font-mono text-[#089981] font-bold uppercase tracking-wider">
                <Sparkles size={12} />
                <span>Private Closed Beta Rolling Out</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Apply for Terminal Access
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We manually onboard derivatives traders to ensure zero execution friction and custom API security verification. Choose your preferred fast-track channel below:
              </p>
            </div>

            {/* FAST TRACK DIRECT BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              {/* X / Twitter Direct Application */}
              <a
                href="https://x.com/robingerling"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 rounded-2xl bg-[#07090E] border border-[#1E2536] hover:border-[#089981]/60 transition-all flex flex-col justify-between gap-3 shadow-lg hover:shadow-[#089981]/10"
              >
                <div className="flex items-center justify-between">
                  {/* Minimal X Logo */}
                  <div className="w-9 h-9 rounded-xl bg-[#141824] flex items-center justify-center text-white border border-[#222938]">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span className="text-[10px] font-mono text-[#089981] font-bold">Fast-Track ⚡</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-[#089981] transition flex items-center gap-1">
                    <span>DM on X (Twitter)</span>
                    <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">@robingerling (Instant invite)</div>
                </div>
              </a>

              {/* Telegram Direct Application */}
              <a
                href="https://t.me/robingerling"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 rounded-2xl bg-[#07090E] border border-[#1E2536] hover:border-[#38BDF8]/60 transition-all flex flex-col justify-between gap-3 shadow-lg hover:shadow-[#38BDF8]/10"
              >
                <div className="flex items-center justify-between">
                  {/* Telegram Icon */}
                  <div className="w-9 h-9 rounded-xl bg-[#0284c7]/15 text-[#38BDF8] flex items-center justify-center border border-[#0284c7]/30">
                    <Send size={16} className="-ml-0.5 mt-0.5" />
                  </div>
                  <span className="text-[10px] font-mono text-[#38BDF8] font-bold">Direct Desk 💬</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-[#38BDF8] transition flex items-center gap-1">
                    <span>Message on Telegram</span>
                    <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Direct chat with the founder</div>
                </div>
              </a>

            </div>

            {/* SEPARATOR */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#161A23] w-full" />
              <span className="bg-[#0B0E14] px-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                or request via email
              </span>
            </div>

            {/* EMAIL WAITLIST INPUT */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  disabled={isSubmitting || betaSubmitted}
                  value={betaEmail}
                  onChange={(e) => setBetaEmail(e.target.value)}
                  placeholder="Enter your active trading email..."
                  className="w-full bg-[#07090E] border border-[#1E2536] rounded-xl py-3 pl-10 pr-4 text-xs font-mono text-white outline-none focus:border-[#089981] transition shadow-inner placeholder:text-slate-600 disabled:opacity-50"
                />
              </div>

              {submitError && (
                <div className="p-2.5 rounded-xl bg-[#F23645]/10 border border-[#F23645]/30 text-[11px] font-mono text-[#F23645] flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || betaSubmitted}
                className="w-full py-3 bg-[#089981] hover:bg-[#067a67] disabled:bg-[#089981]/50 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#089981]/25"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Adding to Whitelist...</span>
                  </>
                ) : betaSubmitted ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Application Submitted! We&apos;ll whitelist you soon.</span>
                  </>
                ) : (
                  <>
                    <span>Submit Whitelist Request</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <span className="text-[10px] font-mono text-slate-500">
                🔒 Zero Spam. Read-Only derivatives API access only.
              </span>
            </div>

          </div>
        </div>
      )}

      {/* FINAL CTA SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center space-y-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#0D111A] to-[#07090E] border border-[#1E2536] space-y-5 shadow-2xl relative overflow-hidden">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Eliminate random execution variance.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Test the live terminal risk engine. No credit card, no password — verify your email and experience mathematical execution.
          </p>
          <button
            onClick={() => setShowBetaModal(true)}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#089981] hover:bg-[#067a67] text-white text-xs font-black rounded-xl transition shadow-[0_0_28px_rgba(8,153,129,0.35)] cursor-pointer"
          >
            <span>Launch Free Access</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#161A23] py-8 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Zap size= {14} className="text-[#089981]" />
            <span>© {new Date().getFullYear()} RISKIL. Engineering Discipline.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-slate-300 transition">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-slate-300 transition">Privacy Policy</Link>
            <Link href="/imprint" className="hover:text-slate-300 transition">Legal Notice</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}