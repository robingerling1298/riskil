'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
      {/* MOBILE TOP BAR (Native Safe-Area-Styles, z-[60] garantiert über allem) */}
      <div 
        className="md:hidden fixed top-0 left-0 right-0 z-[60] bg-[#0B0E14]/95 backdrop-blur-md border-b border-[#161A23] px-4 flex items-center justify-between"
        style={{
          height: 'calc(4rem + env(safe-area-inset-top, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-[#141824] border border-[#1E2536] transition-colors cursor-pointer"
            aria-label="Navigation öffnen"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 shadow-md">
              <Image 
                src="/icon.svg" 
                alt="Riskil Logo" 
                width={28} 
                height={28} 
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <span className="text-sm font-bold text-white tracking-wide">
              RISKIL
            </span>
          </div>
        </div>
      </div>

      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 z-[65] bg-black/70 backdrop-blur-sm"
        />
      )}

      {/* SIDEBAR (Desktop Hover + Mobile Drawer) */}
      <aside
        className={`group fixed top-0 left-0 z-[70] h-screen bg-[#0B0E14]/95 backdrop-blur-md border-r border-[#161A23] p-3 flex flex-col justify-between transition-all duration-300 ease-in-out shadow-2xl overflow-hidden
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'}
          md:translate-x-0 md:w-16 md:hover:w-64
        `}
        style={{
          paddingTop: isMobileOpen ? 'calc(1rem + env(safe-area-inset-top, 0px))' : undefined,
          paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="space-y-6 pt-12 md:pt-0">
          {/* LOGO / HEADER */}
          <div className="flex items-center gap-3 px-1.5 py-1 min-w-max">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-lg shadow-brand-border">
              <Image 
                src="/icon.svg" 
                alt="Riskil Logo" 
                width={40} 
                height={40} 
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
              <h2 className="text-sm font-bold text-white tracking-wide whitespace-nowrap">
                RISKIL <span className="text-[10px] text-brand font-mono">v3.4</span>
              </h2>
              <p className="text-[10px] text-slate-500 whitespace-nowrap">Engineering Discipline.</p>
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

        {/* FOOTER BEREICH */}
        <div className="space-y-3 pt-2 border-t border-[#161A23]">
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