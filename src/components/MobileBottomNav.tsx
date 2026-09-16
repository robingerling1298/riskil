'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, Calculator, Target, PlusCircle } from 'lucide-react'

export default function MobileBottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Live', icon: Activity },
    { href: '/dashboard/journal', label: 'Journal', icon: Target },
    { href: '/dashboard/full-planner', label: 'Planen', icon: PlusCircle, isCta: true },
    { href: '/dashboard/calculator', label: 'Hebel', icon: Calculator },
  ]

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#07090E]/95 backdrop-blur-xl border-t border-[#161A23] pb-safe px-3 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          if (item.isCta) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-12 h-12 rounded-full bg-[#089981] text-white flex items-center justify-center shadow-[0_0_20px_rgba(8,153,129,0.4)] active:scale-95 transition">
                  <Icon size={24} />
                </div>
                <span className="text-[10px] font-bold text-[#089981] mt-1 font-mono">{item.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                isActive ? 'text-[#089981]' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={18} />
              <span className={`text-[10px] font-mono mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}