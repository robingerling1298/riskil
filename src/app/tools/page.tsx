'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import {
  Zap,
  Target,
  Scale,
  ArrowRight,
  ShieldCheck,
  Eye,
  Sliders,
  Activity,
  Cpu,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  Sparkles
} from 'lucide-react'

interface ToolItem {
  id: string
  href: string
  title: string
  badge: string
  description: string
  icon: React.ElementType
  mockup: {
    tag: string
    sub: string
    stats: Array<{ label: string; value: string; highlight?: boolean }>
  }
}

const TOOLS: ToolItem[] = [
  {
    id: 'leverage-sizer',
    href: '/tools/leverage-calculator',
    title: 'Leverage & Risk Sizer',
    badge: '01 / SIZING',
    description: 'Calculate average entry prices across unlimited DCA tranches and mathematically round down leverage to match your exact max risk budget.',
    icon: Zap,
    mockup: {
      tag: 'BTCUSDT • SHORT 22x',
      sub: 'Avg Entry: $83,035.71',
      stats: [
        { label: 'Avg Entry', value: '$83,035.71' },
        { label: 'Stop Loss', value: '$83,500.00' },
        { label: 'Max Risk', value: '-$50.00' },
        { label: 'Safe Leverage', value: '22x', highlight: true }
      ]
    }
  },
  {
    id: 'tp-planner',
    href: '/tools/tp-planner',
    title: 'Take-Profit Scale-Out Planner',
    badge: '02 / EXITS',
    description: 'Simulate tiered profit-taking factoring in real-time exchange fees. Prevent premature exits on high-conviction swings and calculate residual margin carryovers.',
    icon: Target,
    mockup: {
      tag: 'BTCUSDT • SCALE-OUT',
      sub: 'Entry: $85,000.00',
      stats: [
        { label: 'TP1 (25% RoE)', value: '+$43.20' },
        { label: 'TP2 (50% RoE)', value: '+$86.40' },
        { label: 'Fee Impact', value: '-$0.82' },
        { label: 'Net Profit', value: '+$128.78', highlight: true }
      ]
    }
  },
  {
    id: 'full-matrix',
    href: '/tools/position-planner',
    title: 'Full Position Execution Matrix',
    badge: '03 / ALL-IN-ONE',
    description: 'The ultimate seamless workflow: DCA tranche scaling, strict stop-loss, and take-profit ladders combined in a synchronized dashboard with high-res PNG export.',
    icon: Scale,
    mockup: {
      tag: 'FULL SETUP MATRIX',
      sub: '3 Tranches • 3 Exits',
      stats: [
        { label: 'Total Margin', value: '$300.00' },
        { label: 'Max Loss', value: '-$50.00' },
        { label: 'Total Net', value: '+$132.42' },
        { label: 'R:R / CRV', value: '1 : 2.65', highlight: true }
      ]
    }
  }
]

export default function ToolsLandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [pwaOS, setPwaOS] = useState<'ios' | 'android'>('ios')

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#05070B] text-slate-100 selection:bg-brand selection:text-black relative overflow-hidden font-sans pb-28"
    >
      {/* SPOTLIGHT LAYER */}
      <div 
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 lg:opacity-100 -z-10"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(var(--color-brand-rgb, 41, 98, 255), 0.08), transparent 80%)`
        }}
      />

      <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand/15 blur-[160px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-[45%] right-[-10%] w-[500px] h-[500px] bg-brand/10 blur-[180px] pointer-events-none -z-10 rounded-full" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 pt-16 sm:pt-28">
        
        {/* HERO SECTION */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-muted border border-brand-border shadow-lg backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
            </span>
            <span className="text-xs font-mono font-bold text-brand tracking-widest uppercase">
              Free Perps Calculator Suite • PWA Ready
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Zero Math Errors. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-400">
              Straight to Your Homescreen.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto font-normal">
            High-precision terminal tools for crypto derivatives. Install the calculators as a native PWA on your smartphone in seconds. Blazing fast and offline-ready.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2 bg-term-card/60 px-3 py-1.5 rounded-xl border border-term-border">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Client-Side Engine</span>
            </div>
            <div className="flex items-center gap-2 bg-term-card/60 px-3 py-1.5 rounded-xl border border-term-border">
              <Cpu className="w-4 h-4 text-brand" />
              <span>Native App Experience</span>
            </div>
          </div>

        </div>

        {/* ================= BENTO TOOL SUITE GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            const isHovered = hoveredId === tool.id

            return (
              <div
                key={tool.id}
                onMouseEnter={() => setHoveredId(tool.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 border ${
                  isHovered 
                    ? 'border-brand-border bg-[#0b101c] shadow-[0_20px_50px_rgba(0,0,0,0.8)] -translate-y-1.5' 
                    : 'border-term-border/80 bg-term-card/50 hover:border-term-border'
                } backdrop-blur-2xl overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-44 h-44 bg-brand/10 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-term-bg border border-term-border flex items-center justify-center text-brand shadow-inner group-hover:scale-105 group-hover:border-brand transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-term-bg border border-term-border text-slate-400 tracking-wider">
                      {tool.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-white tracking-tight group-hover:text-brand transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#05070c] border border-term-border/80 rounded-2xl font-mono text-xs space-y-2.5 shadow-inner">
                    <div className="flex items-center justify-between pb-2 border-b border-term-border/50 text-[10px]">
                      <span className="text-slate-300 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                        {tool.mockup.tag}
                      </span>
                      <span className="text-slate-500">{tool.mockup.sub}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {tool.mockup.stats.map((s, idx) => (
                        <div key={idx} className="bg-term-card/80 p-2 rounded-xl border border-term-border/60 space-y-0.5">
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block truncate">{s.label}</span>
                          <span className={`font-bold block truncate ${s.highlight ? 'text-brand' : 'text-slate-200'}`}>
                            {s.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-8 relative z-10">
                  <Link
                    href={tool.href}
                    className="w-full py-3.5 px-4 rounded-xl bg-brand-muted hover:bg-brand text-brand hover:text-black border border-brand-border hover:border-brand text-xs font-mono font-black transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/40 cursor-pointer"
                  >
                    <span>Launch Terminal</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* ================= PWA INTERACTIVE SIMULATOR ================= */}
        <div className="relative rounded-3xl p-8 sm:p-12 border border-term-border bg-gradient-to-b from-term-card via-[#080d1a] to-[#05070a] shadow-2xl overflow-hidden">
          
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* LEFT DESCRIPTION */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/20 border border-brand/40 text-brand font-mono text-[11px] font-bold uppercase">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Progressive Web App (PWA)</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Built Like a Native App. <br />
                Zero App Store Friction.
              </h2>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Engineered as a full-fledged PWA. Install any calculator directly onto your iPhone or Android home screen in two clicks – standalone, lightning-fast, and completely free of browser chrome.
              </p>

              {/* OS SWITCHER TABS */}
              <div className="flex bg-term-bg p-1 rounded-xl border border-term-border w-fit font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setPwaOS('ios')}
                  className={`px-4 py-2 rounded-lg font-bold transition cursor-pointer ${
                    pwaOS === 'ios' ? 'bg-brand text-black shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  iOS (Safari)
                </button>
                <button
                  type="button"
                  onClick={() => setPwaOS('android')}
                  className={`px-4 py-2 rounded-lg font-bold transition cursor-pointer ${
                    pwaOS === 'android' ? 'bg-brand text-black shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Android (Chrome)
                </button>
              </div>

              <div className="space-y-3 pt-2 font-mono text-xs text-slate-300">
                {pwaOS === 'ios' ? (
                  <>
                    <div className="flex items-center gap-3 bg-term-bg p-3 rounded-xl border border-term-border">
                      <span className="w-6 h-6 rounded-lg bg-brand/20 text-brand font-bold flex items-center justify-center shrink-0">1</span>
                      <span>Open any <strong>RISKIL calculator</strong> in Safari.</span>
                    </div>
                    <div className="flex items-center gap-3 bg-term-bg p-3 rounded-xl border border-term-border">
                      <span className="w-6 h-6 rounded-lg bg-brand/20 text-brand font-bold flex items-center justify-center shrink-0">2</span>
                      <span className="flex items-center gap-1.5">Tap the <strong>Share button</strong> at the bottom <Share className="w-3.5 h-3.5 text-brand" />.</span>
                    </div>
                    <div className="flex items-center gap-3 bg-term-bg p-3 rounded-xl border border-term-border">
                      <span className="w-6 h-6 rounded-lg bg-brand/20 text-brand font-bold flex items-center justify-center shrink-0">3</span>
                      <span className="flex items-center gap-1.5">Select <strong>"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 text-brand" />.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 bg-term-bg p-3 rounded-xl border border-term-border">
                      <span className="w-6 h-6 rounded-lg bg-brand/20 text-brand font-bold flex items-center justify-center shrink-0">1</span>
                      <span>Open any <strong>RISKIL calculator</strong> in Chrome.</span>
                    </div>
                    <div className="flex items-center gap-3 bg-term-bg p-3 rounded-xl border border-term-border">
                      <span className="w-6 h-6 rounded-lg bg-brand/20 text-brand font-bold flex items-center justify-center shrink-0">2</span>
                      <span>Tap the <strong>three-dot menu</strong> in the top right.</span>
                    </div>
                    <div className="flex items-center gap-3 bg-term-bg p-3 rounded-xl border border-term-border">
                      <span className="w-6 h-6 rounded-lg bg-brand/20 text-brand font-bold flex items-center justify-center shrink-0">3</span>
                      <span>Select <strong>"Install App"</strong> or "Add to Home screen".</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT MOCKUP PHONE ANIMATION */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="relative w-[280px] sm:w-[310px] h-[580px] bg-[#0c101d] border-[8px] border-[#1e273d] rounded-[48px] shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between p-4">
                
                {/* PHONE NOTCH / DYNAMIC ISLAND */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-[#121624] absolute right-3" />
                </div>

                {/* SIMULATED APP HEADER */}
                <div className="pt-8 pb-3 px-2 flex items-center justify-between border-b border-term-border/60 z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-brand flex items-center justify-center text-black font-black text-xs font-mono">R</div>
                    <span className="font-mono text-xs font-bold text-white tracking-wider">RISKIL TOOLS</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">PWA Active</span>
                </div>

                {/* SIMULATED TERMINAL CONTENT INSIDE PHONE */}
                <div className="flex-1 py-4 space-y-3 font-mono text-[11px] overflow-hidden">
                  <div className="bg-term-bg p-3 rounded-2xl border border-term-border space-y-2">
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>BTCUSDT PERP</span>
                      <span className="text-emerald-400">LIVE</span>
                    </div>
                    <div className="text-sm font-extrabold text-white">$83,500.00</div>
                    <div className="w-full bg-term-card h-1.5 rounded-full overflow-hidden">
                      <div className="bg-brand w-3/4 h-full rounded-full animate-pulse" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-term-bg p-2.5 rounded-xl border border-term-border">
                      <span className="text-[9px] text-slate-500 block">Leverage Sizer</span>
                      <span className="text-xs font-bold text-brand">22x SAFE</span>
                    </div>
                    <div className="bg-term-bg p-2.5 rounded-xl border border-term-border">
                      <span className="text-[9px] text-slate-500 block">CRV Matrix</span>
                      <span className="text-xs font-bold text-emerald-400">1 : 2.65</span>
                    </div>
                  </div>

                  <div className="p-3 bg-brand-muted/20 border border-brand-border rounded-2xl text-[10px] text-slate-300 space-y-1">
                    <div className="font-bold text-brand flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Offline Ready Cache
                    </div>
                    <p className="text-slate-400 text-[9px]">Instantly loads without latency.</p>
                  </div>
                </div>

                {/* SIMULATED IOS SHARE SHEET / FLOATING PROMPT ANIMATION */}
                {pwaOS === 'ios' ? (
                  <div className="absolute bottom-0 left-0 right-0 bg-[#141b2d]/95 backdrop-blur-xl border-t border-slate-700/80 p-5 rounded-t-3xl space-y-3 z-20 animate-in slide-in-from-bottom duration-300">
                    <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto" />
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-700/60">
                      <div className="w-10 h-10 rounded-xl bg-brand text-black flex items-center justify-center font-black font-mono text-sm">R</div>
                      <div>
                        <div className="text-xs font-bold text-white">RISKIL Sizer</div>
                        <div className="text-[10px] text-slate-400">Tools Web App</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-brand font-bold bg-brand-muted/40 p-2.5 rounded-xl border border-brand-border">
                      <PlusSquare className="w-4 h-4 shrink-0" />
                      <span>Add to Home Screen</span>
                    </div>
                  </div>
                ) : (
                  <div className="absolute bottom-4 left-4 right-4 bg-[#141b2d] border border-slate-700 p-3.5 rounded-2xl shadow-2xl flex items-center justify-between z-20 font-mono text-xs animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-brand text-black flex items-center justify-center font-black">R</div>
                      <div>
                        <div className="font-bold text-white text-[11px]">Install App?</div>
                        <div className="text-[9px] text-slate-400">Add to home screen</div>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 bg-brand text-black font-black text-[10px] rounded-lg">Install</span>
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>

        {/* WORKFLOW HIGHLIGHT */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-term-card to-[#060911] border border-term-border space-y-10 relative overflow-hidden shadow-2xl">
          <div className="max-w-xl space-y-2.5">
            <div className="text-xs font-mono font-bold text-brand uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>The Professional Workflow</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Pre-Trade Clarity. In Three Steps.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Profitable traders leave nothing to chance. Every position runs through the exact same mathematical filter before hitting the exchange order book.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-term-bg border border-term-border space-y-3 relative group hover:border-brand-border transition duration-200">
              <span className="w-8 h-8 rounded-xl bg-brand-muted border border-brand-border text-brand font-mono font-black text-xs flex items-center justify-center">01</span>
              <h4 className="text-sm font-bold text-white font-mono">1. Entry DCA & Break-Even</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Plan limit tranches in advance. The engine computes your volume-weighted break-even entry including all maker fees.</p>
            </div>
            <div className="p-6 rounded-2xl bg-term-bg border border-term-border space-y-3 relative group hover:border-brand-border transition duration-200">
              <span className="w-8 h-8 rounded-xl bg-brand-muted border border-brand-border text-brand font-mono font-black text-xs flex items-center justify-center">02</span>
              <h4 className="text-sm font-bold text-white font-mono">2. Strict Leverage Sizing</h4>
              <p className="text-xs text-slate-400 leading-relaxed">No commercial round-ups: Leverage is strictly rounded down using Math.floor to ensure you never lose a cent beyond your target risk.</p>
            </div>
            <div className="p-6 rounded-2xl bg-term-bg border border-term-border space-y-3 relative group hover:border-brand-border transition duration-200">
              <span className="w-8 h-8 rounded-xl bg-brand-muted border border-brand-border text-brand font-mono font-black text-xs flex items-center justify-center">03</span>
              <h4 className="text-sm font-bold text-white font-mono">3. Dynamic Scale-Out</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Scale take-profits proportionally off the remaining position size, determine your final CRV, and export your trade card as a high-res PNG.</p>
            </div>
          </div>
        </div>

        {/* CLOSED BETA CTA BANNER */}
        <div className="relative rounded-3xl p-8 sm:p-12 border border-brand-border bg-gradient-to-r from-term-card via-term-bg to-brand-muted/20 shadow-2xl overflow-hidden">
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-brand/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-3.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/20 border border-brand/40 text-brand font-mono text-[11px] font-bold uppercase">
                <Eye className="w-3.5 h-3.5" />
                <span>RISKIL Live-Journaling • 100% Read-Only API</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug">
                Setup Planned. <br />
                Do You Stick to Your Plan Live?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Most accounts blow up due to shifting stops and emotional meddling mid-trade.
                <strong> RISKIL</strong> connects via a <strong>100% secure Read-Only API (guaranteed zero trading or execution rights)</strong> to your exchange, automatically tracks closed positions, and ruthlessly exposes rule breaks in your journal.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
              <a
                href="https://riskil.app"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand hover:bg-brand-hover text-black font-mono font-black text-xs transition-all shadow-xl shadow-brand/25 flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
              >
                <span>Secure Early Access</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}