'use client'

import { useState } from 'react'
import TakeProfitPlanner from '@/components/TakeProfitPlanner'
import { LogTradeModal, TradeData } from '@/components/LogTradeModal'
import { Target, Sparkles } from 'lucide-react'

export default function TpPlannerPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tradeData, setTradeData] = useState<TradeData>({
    pair: 'BTC/USDT',
    direction: 'LONG',
    entryPrice: 0,
    leverage: 1,
    margin: 0,
  })

  const handleLogTrade = (data: TradeData) => {
    setTradeData(data)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* SUBTLE & CLEAN PAGE HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            {/* Ruhige, neutrale Icon-Badge */}
            <div className="p-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-400 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Take-Profit Planner
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60">
                  <Sparkles className="w-2.5 h-2.5 text-brand" /> PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-normal">
                Plane mehrstufige Ausstiegsziele, berechne Gebühren & Max-ROE in Echtzeit.
              </p>
            </div>
          </div>
        </header>

        {/* MAIN PLANNER COMPONENT */}
        <main>
          <TakeProfitPlanner onLogTrade={handleLogTrade} />
        </main>

        <LogTradeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tradeData={tradeData}
        />
      </div>
    </div>
  )
}