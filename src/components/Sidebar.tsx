'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  BookOpen,
  Layers, 
  Calculator, 
  Target, 
  ShieldAlert,
  Settings,
  Menu,
  X,
  Brain,
  LucideCalculator
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Journal', href: '/dashboard/journal', icon: Brain },
  { label: 'Positionsplaner', href: '/dashboard/full-planner', icon: Layers },
  { label: 'Hebel-Rechner', href: '/dashboard/leverage', icon: LucideCalculator },
  { label: 'Take Profit Planer', href: '/dashboard/tp-planner', icon: Target },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const isProfileActive = pathname === '/dashboard/profile'

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-term-bg/95 backdrop-blur-md border-b border-term-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-term-card border border-term-border"
            aria-label="Navigation öffnen"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center font-black text-black text-xs shadow-md">
              RM
            </div>
            <span className="text-sm font-bold text-white tracking-wide">
              RiskManager
            </span>
          </div>
        </div>
      </div>

      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        />
      )}

      {/* SIDEBAR (Desktop Hover + Mobile Drawer) */}
      <aside
        className={`group fixed top-0 left-0 z-50 h-screen bg-term-bg/95 backdrop-blur-md border-r border-term-border p-3 flex flex-col justify-between transition-all duration-300 ease-in-out shadow-2xl overflow-hidden
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'}
          md:translate-x-0 md:w-16 md:hover:w-64
        `}
      >
        <div className="space-y-6 pt-14 md:pt-0">
          {/* LOGO / HEADER */}
          <div className="flex items-center gap-3 px-1.5 py-1 min-w-max">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center font-black text-black text-sm shrink-0 shadow-lg shadow-brand-border">
              RSKL
            </div>
            <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
              <h2 className="text-sm font-bold text-white tracking-wide whitespace-nowrap">
                RISKIL <span className="text-[10px] text-brand font-mono">v3.4</span>
              </h2>
              <p className="text-[10px] text-slate-500 whitespace-nowrap">Live Trading Journal</p>
            </div>
          </div>

          {/* NAV LINKS */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3.5 px-2.5 py-2.5 rounded-xl text-xs font-semibold transition-all min-w-max ${
                    isActive
                      ? 'bg-brand text-black font-bold shadow-md shadow-brand-border'
                      : 'text-slate-400 hover:text-white hover:bg-term-hover'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* FOOTER BEREICH (Einstellungen & Status) */}
        <div className="space-y-3 pt-2 border-t border-term-border">
          {/* PROFIL & EINSTELLUNGEN LINK */}
          <Link
            href="/dashboard/profile"
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center gap-3.5 px-2.5 py-2.5 rounded-xl text-xs font-semibold transition-all min-w-max ${
              isProfileActive
                ? 'bg-brand text-black font-bold shadow-md shadow-brand-border'
                : 'text-slate-400 hover:text-white hover:bg-term-hover'
            }`}
          >
            <Settings size={18} className="shrink-0" />
            <span className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Konto & Einstellungen
            </span>
          </Link>

          {/* SYSTEM STATUS */}
          <div className="flex items-center gap-3 px-1.5 py-1 min-w-max text-[11px] text-slate-500">
            <div className="w-2.5 h-2.5 rounded-full bg-brand shrink-0 animate-pulse" />
            <span className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              System Bereit
            </span>
          </div>
        </div>
      </aside>
    </>
  )
}