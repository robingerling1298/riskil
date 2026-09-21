'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, Target, Scale, LayoutGrid, ArrowLeft } from 'lucide-react'

const NAV_TABS = [
  {
    href: '/tools/leverage-calculator',
    label: 'Leverage & Risk Sizer',
    shortLabel: 'Leverage',
    icon: Zap,
  },
  {
    href: '/tools/tp-planner',
    label: 'Take-Profit Planner',
    shortLabel: 'TP Planner',
    icon: Target,
  },
  {
    href: '/tools/position-planner',
    label: 'Full Position Matrix',
    shortLabel: 'Full Matrix',
    icon: Scale,
  },
]

export default function ToolsNavigation() {
  const pathname = usePathname()

  return (
    <div className="w-full max-w-4xl mx-auto pt-6 pb-2">
      <div className="flex items-center justify-between gap-3 bg-term-card/80 border border-term-border p-1.5 rounded-2xl backdrop-blur-xl shadow-lg">
        
        {/* ZURÜCK ZUR TOOLS-ÜBERSICHT */}
        <Link
          href="/tools"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-term-bg border border-transparent hover:border-term-border transition shrink-0 cursor-pointer"
          title="Zurück zum Tools Hub"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-brand" />
          <span className="hidden sm:inline">Home</span>
        </Link>

        {/* RECHNER-TABS */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.href

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-200 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-brand text-black shadow-md shadow-brand/20'
                    : 'text-slate-400 hover:text-white hover:bg-term-bg'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.shortLabel}</span>
              </Link>
            )
          })}
        </nav>

        {/* LOGO LINK */}
        <div className="hidden sm:flex items-center pr-2 shrink-0">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
            RISKIL<span className="text-brand">.APP</span>
          </span>
        </div>

      </div>
    </div>
  )
}