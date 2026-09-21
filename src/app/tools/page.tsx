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
  Terminal,
  Activity,
  Layers,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Lock,
  Cpu,
  TrendingUp,
  BarChart3,
  Percent
} from 'lucide-react'

interface ToolItem {
  id: string
  href: string
  title: string
  badge: string
  pillText: string
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
    pillText: 'Strict Math.floor',
    description: 'Berechnet Mischkurse über unbegrenzte DCA-Tranchen und drosselt den Hebel mathematisch abgerundet auf den Punkt deines maximalen Risikobudgets.',
    icon: Zap,
    mockup: {
      tag: 'BTCUSDT • SHORT 22x',
      sub: 'Mischkurs: $83,035.71',
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
    pillText: 'Dynamic Margin',
    description: 'Simuliert gestaffelte Gewinnmitnahmen mit Echtzeit-Börsengebühren. Verhindert das vorzeitige Schließen profitabler Swings und kalkuliert Restmargenträger.',
    icon: Target,
    mockup: {
      tag: 'BTCUSDT • SCALE-OUT',
      sub: 'Einstieg: $85,000.00',
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
    pillText: 'Auto CRV Matrix',
    description: 'Der nahtlose Workflow: DCA-Einstiegsstaffelung, strikter Stop-Loss und Take-Profit Leiter in einem synchronisierten Dashboard mit hochauflösendem PNG-Export.',
    icon: Scale,
    mockup: {
      tag: 'FULL SETUP MATRIX',
      sub: '3 Tranchen • 3 Exits',
      stats: [
        { label: 'Total Marge', value: '$300.00' },
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
      {/* ================= DYNAMIC SPOTLIGHT LAYER ================= */}
      <div 
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 lg:opacity-100 -z-10"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(var(--color-brand-rgb, 41, 98, 255), 0.08), transparent 80%)`
        }}
      />

      {/* AMBIENT BRAND LIGHTING */}
      <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand/15 blur-[160px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-[45%] right-[-10%] w-[500px] h-[500px] bg-brand/10 blur-[180px] pointer-events-none -z-10 rounded-full" />

      {/* SUBTLE TERMINAL GRID PATTERN */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10"
        style={{
          backgroundImage: `linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 pt-16 sm:pt-28">
        
        {/* ================= HERO SECTION ================= */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-muted border border-brand-border shadow-lg backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
            </span>
            <span className="text-xs font-mono font-bold text-brand tracking-widest uppercase">
              Free Perps Terminal Suite
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            Keine Rechenfehler. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400">
              Kein Blind-Trading.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto font-normal">
            Hochpräzise Rechner für Krypto-Derivate. Berechne Mischkurse, strikte Hebel-Caps und Skalierungs-Exits vor dem Einstieg. 100 % client-side, ohne Anmeldung.
          </p>

          {/* BADGES ROW */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2 bg-term-card/60 px-3 py-1.5 rounded-xl border border-term-border">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Client-Side Engine</span>
            </div>
            <div className="flex items-center gap-2 bg-term-card/60 px-3 py-1.5 rounded-xl border border-term-border">
              <Cpu className="w-4 h-4 text-brand" />
              <span>Keine Registrierung</span>
            </div>
            <div className="flex items-center gap-2 bg-term-card/60 px-3 py-1.5 rounded-xl border border-term-border">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Echtzeit Kurse</span>
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
                {/* AMBIENT BRAND LIGHT PER CARD */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-brand/10 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="space-y-6 relative z-10">
                  
                  {/* TOP ROW */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-term-bg border border-term-border flex items-center justify-center text-brand shadow-inner group-hover:scale-105 group-hover:border-brand transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-term-bg border border-term-border text-slate-400 tracking-wider">
                      {tool.badge}
                    </span>
                  </div>

                  {/* TITLE & DESCRIPTION */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-white tracking-tight group-hover:text-brand transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  {/* INTERACTIVE MINI TERMINAL PREVIEW */}
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

                {/* ACTION BUTTON */}
                <div className="pt-8 relative z-10">
                  <Link
                    href={tool.href}
                    className="w-full py-3.5 px-4 rounded-xl bg-brand-muted hover:bg-brand text-brand hover:text-black border border-brand-border hover:border-brand text-xs font-mono font-black transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/40 cursor-pointer"
                  >
                    <span>Terminal öffnen</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>

              </div>
            )
          })}
        </div>

        {/* ================= WORKFLOW HIGHLIGHT: 3-STEP DISCIPLINE ================= */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-term-card to-[#060911] border border-term-border space-y-10 relative overflow-hidden shadow-2xl">
          
          <div className="max-w-xl space-y-2.5">
            <div className="text-xs font-mono font-bold text-brand uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>Der professionelle Workflow</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Pre-Trade Klarheit. In drei Zügen.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Die profitabelsten Trader überlassen nichts dem Zufall. Jeder Trade durchläuft vor der Platzierung an der Börse denselben mathematischen Filter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-term-bg border border-term-border space-y-3 relative group hover:border-brand-border transition duration-200">
              <span className="w-8 h-8 rounded-xl bg-brand-muted border border-brand-border text-brand font-mono font-black text-xs flex items-center justify-center">
                01
              </span>
              <h4 className="text-sm font-bold text-white font-mono">1. Entry DCA & Mischkurs</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Plane Limit-Tranchen im Voraus. Die Engine errechnet deinen volumengewichteten Break-Even-Einstieg inklusive aller anfallenden Maker-Gebühren.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-term-bg border border-term-border space-y-3 relative group hover:border-brand-border transition duration-200">
              <span className="w-8 h-8 rounded-xl bg-brand-muted border border-brand-border text-brand font-mono font-black text-xs flex items-center justify-center">
                02
              </span>
              <h4 className="text-sm font-bold text-white font-mono">2. Striktes Hebel-Sizing</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Keine kaufmännischen Rundungen: Der Hebel wird zwingend mit Math.floor abgerundet, damit du im Stop-Loss-Fall keinen Cent mehr verlierst als dein definiertes Limit.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-term-bg border border-term-border space-y-3 relative group hover:border-brand-border transition duration-200">
              <span className="w-8 h-8 rounded-xl bg-brand-muted border border-brand-border text-brand font-mono font-black text-xs flex items-center justify-center">
                03
              </span>
              <h4 className="text-sm font-bold text-white font-mono">3. Dynamic Scale-Out</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stufe deine Take-Profits prozentual von der verbleibenden Restposition ab, ermittle dein finales CRV und exportiere deine fertige Trade-Card als PNG.
              </p>
            </div>

          </div>

        </div>

        {/* ================= THE RISKIL READ-ONLY LIVE-JOURNAL ================= */}
        <div className="relative rounded-3xl p-8 sm:p-12 border border-brand-border bg-gradient-to-r from-term-card via-term-bg to-brand-muted/20 shadow-2xl overflow-hidden">
          
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-brand/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            
            <div className="space-y-3.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/20 border border-brand/40 text-brand font-mono text-[11px] font-bold uppercase">
                <Eye className="w-3.5 h-3.5" />
                <span>RISKIL Live-Journaling • 100% Read-Only API</span>
              </div>

              <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug">
                Setup geplant. <br />
                Hältst du dich im Live-Markt an deinen Plan?
              </h3>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Die meisten Konten platzen durch verschobene Stops und emotionales Eingreifen während der Trade läuft.
                <strong> RISKIL</strong> verbindet sich über eine <strong>100% sichere Read-Only API (garantiert ohne Handels- oder Ausführungsrechte)</strong> mit deiner Börse, trackt deine geschlossenen Positionen vollautomatisch und deckt Regelbrüche in deinem Journal schonungslos auf.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand hover:bg-brand-hover text-black font-mono font-black text-xs transition-all shadow-xl shadow-brand/25 flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
              >
                <span>Early Access sichern</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>

        </div>


      </div>

    </div>
  )
}