'use client'

import { useState } from 'react'
import RiskCalculator from '@/components/RiskCalculator'
import { LogTradeModal, TradeData } from '@/components/LogTradeModal'

export default function RiskPage() {
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
        <h1 className="text-xl font-bold text-white">Risiko-Rechner</h1>
        <p className="text-xs text-slate-400">Bestimme dein Kontorisiko und maximalen Verlust pro Trade.</p>
      </div>

      <RiskCalculator onLogTrade={handleLogTrade} />

      <LogTradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tradeData={tradeData}
      />
    </div>
  )
}
