'use client'

import React from 'react'
import { useTheme } from 'next-themes'
import { useUserPreferences, EXCHANGES, ExchangeId, OrderType } from '@/context/UserPreferencesContext'
import { Sun, Moon, Zap, ShieldCheck } from 'lucide-react'

export default function SettingsBar() {
  const { theme, setTheme } = useTheme()
  const { defaultExchange, setDefaultExchange, defaultOrderType, setDefaultOrderType, activeFee } = useUserPreferences()

  return (
    <div className="bg-slate-900/80 dark:bg-[#0B0D14]/90 backdrop-blur-md border border-slate-200 dark:border-[#1E2230] p-3 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl mb-6">
      
      {/* EXCHANGES QUICK SELECT */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          Börse:
        </span>
        <div className="flex bg-slate-100 dark:bg-[#06080D] p-1 rounded-xl border border-slate-200 dark:border-[#1E2230] gap-1">
          {(Object.keys(EXCHANGES) as ExchangeId[]).map((exKey) => {
            const ex = EXCHANGES[exKey]
            const isSelected = defaultExchange === exKey
            return (
              <button
                key={exKey}
                type="button"
                onClick={() => setDefaultExchange(exKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${ex.logoColor}`} />
                {ex.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* ORDER TYPE & THEME TOGGLE */}
      <div className="flex items-center gap-3">
        {/* ORDER TYPE TOGGLE */}
        <div className="flex bg-slate-100 dark:bg-[#06080D] p-1 rounded-xl border border-slate-200 dark:border-[#1E2230]">
          <button
            type="button"
            onClick={() => setDefaultOrderType('LIMIT')}
            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
              defaultOrderType === 'LIMIT'
                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            LIMIT ({EXCHANGES[defaultExchange].makerFee}%)
          </button>
          <button
            type="button"
            onClick={() => setDefaultOrderType('MARKET')}
            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
              defaultOrderType === 'MARKET'
                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            MARKET ({EXCHANGES[defaultExchange].takerFee}%)
          </button>
        </div>

        {/* LIGHT / DARK MODE TOGGLE */}
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 bg-slate-100 dark:bg-[#06080D] hover:bg-slate-200 dark:hover:bg-[#141824] border border-slate-200 dark:border-[#1E2230] rounded-xl text-slate-700 dark:text-amber-400 transition cursor-pointer shadow-md"
          title="Theme wechseln"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-800" />}
        </button>
      </div>

    </div>
  )
}