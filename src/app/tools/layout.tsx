import React from 'react'
import Link from 'next/link'
import ToolsNavigation from './navigation'

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#05070B] text-slate-100 flex flex-col justify-between px-3 sm:px-6">
      <div>
        <ToolsNavigation />
        <main>{children}</main>
      </div>

      {/* GLOBALER TOOLS FOOTER */}
      <footer className="w-full max-w-5xl mx-auto border-t border-term-border/80 py-8 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand" />
          <span className="text-slate-300 font-bold tracking-wider">RISKIL TOOLS</span>
          <span>•</span>
          <span>Client-Side Trading Terminal</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
          <Link href="/impressum" className="hover:text-white transition">
            Impressum
          </Link>
          <span className="text-slate-700">•</span>
          <Link href="/datenschutz" className="hover:text-white transition">
            Datenschutz
          </Link>
          <span className="text-slate-700">•</span>
          <Link href="/agb" className="hover:text-white transition">
            AGB & Disclaimer
          </Link>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="text-slate-500 hidden sm:inline">riskil.app</span>
        </div>
      </footer>
    </div>
  )
}