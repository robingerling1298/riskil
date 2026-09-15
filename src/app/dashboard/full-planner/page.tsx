'use client'

import { useState } from 'react'
import FullPositionCalculator from '@/components/FullPositionCalculator'
import { LogTradeModal, TradeData } from '@/components/LogTradeModal'

export default function FullPlannerPage() {
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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Full Position Planner</h1>
        <p className="text-xs text-slate-400">Positionsgröße, Hebel, Liquidation und TPs in einer Pipeline.</p>
      </div>

      <FullPositionCalculator onLogTrade={handleLogTrade} />

      <LogTradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tradeData={tradeData}
      />
    </div>
  )
}
