import React from 'react'
import Link from 'next/link'
import ToolsNavigation from './navigation'
import { MessageSquare, Send } from 'lucide-react'

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

      {/* GLOBAL TOOLS FOOTER WITH DEV-CONTACT */}
      <footer className="w-full max-w-6xl mx-auto border-t border-term-border/80 py-12 mt-20 space-y-8">
        
        {/* SUPPORT / FEEDBACK BANNER */}
        <div className="bg-term-card border border-term-border rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono font-bold text-white">
              <MessageSquare className="w-4 h-4 text-brand" />
              <span>Questions, bugs, or feature requests?</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              The tools are free – if you have feedback or ideas, reach out to me directly here:
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* TELEGRAM BUTTON */}
            <a
              href="https://t.me/robingerling"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-term-bg hover:bg-term-hover border border-term-border text-xs font-mono font-bold text-slate-200 hover:text-white transition shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-brand" />
              <span>Telegram</span>
            </a>

            {/* X / TWITTER BUTTON WITH NATIVE SVG */}
            <a
              href="https://x.com/robingerling"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-term-bg hover:bg-term-hover border border-term-border text-xs font-mono font-bold text-slate-200 hover:text-white transition shadow-sm cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current text-sky-400" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>Twitter / X</span>
            </a>
          </div>
        </div>

        {/* LOWER FOOTER SECTION (LINKS & COPYRIGHT) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500 border-t border-term-border/50 pt-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand" />
            <span className="text-slate-300 font-bold tracking-wider">RISKIL TOOLS</span>
            <span>•</span>
            <span>Client-Side Crypto Perps Engine</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <Link href="/tools/leverage-calculator" className="hover:text-white transition">Leverage Sizer</Link>
            <Link href="/tools/tp-planner" className="hover:text-white transition">TP Planner</Link>
            <Link href="/tools/position-planner" className="hover:text-white transition">Full Matrix</Link>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <Link href="/impressum" className="hover:text-white transition">Imprint</Link>
            <Link href="/datenschutz" className="hover:text-white transition">Privacy</Link>
            <Link href="/agb" className="hover:text-white transition">Terms</Link>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span className="text-slate-500">riskil.app</span>
          </div>
        </div>

      </footer>
    </div>
  )
}