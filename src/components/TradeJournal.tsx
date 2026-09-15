'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { BookOpen, RefreshCw, Lock, Zap } from 'lucide-react'

interface JournalTrade {
  id: string
  created_at: string
  exchange: string
  symbol: string
  direction: 'LONG' | 'SHORT'
  avg_entry_price: number
  avg_exit_price: number
  total_volume_usd: number
  gross_pnl: number
  net_pnl: number
  total_fees: number
  opened_at: string
  closed_at: string
  holding_time_seconds: number
}

export default function TradeJournal({ isPro }: { isPro: boolean }) {
  const [trades, setTrades] = useState<JournalTrade[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTrades = async () => {
    if (!isPro) {
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('journal_trades')
      .select('*')
      .order('closed_at', { ascending: false })

    if (!error && data) {
      setTrades(data as JournalTrade[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTrades()

    if (!isPro) return

    // Live WebSocket Sync mit der exportierten Supabase-Instanz
    const channel = supabase
      .channel('live_journal_trades')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'journal_trades' },
        (payload: { new: Record<string, any> }) => {
          const newTrade = payload.new as JournalTrade
          setTrades((prev) => [newTrade, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isPro])

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    return `${hrs}h ${mins % 60}m`
  }

  if (!isPro) {
    return (
      <div className="bg-[#0E1117] border border-[#1E222D] rounded-2xl p-6 text-center space-y-3 text-slate-400">
        <div className="inline-flex p-3 bg-[#141722] border border-[#2A2E3D] rounded-xl text-slate-500 mb-1">
          <Lock className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-white">Automated Exchange Journal (Pro)</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Verbinde deine Börsen für automatisches Live-Merging, Fee-Audits und PnL-Tracking in Echtzeit.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#0E1117] border border-[#1E222D] rounded-2xl p-5 md:p-6 space-y-4 text-slate-100 shadow-xl">
      <div className="flex justify-between items-center pb-3 border-b border-[#1E222D]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#2962FF]" />
          <h3 className="text-sm font-bold tracking-wide">Live Auto-Journal</h3>
          <span className="flex items-center gap-1 text-[10px] font-semibold bg-[#089981]/10 text-[#089981] border border-[#089981]/20 px-2 py-0.5 rounded-full ml-1">
            <Zap className="w-2.5 h-2.5 fill-current" /> Auto-Sync
          </span>
        </div>
        <button 
          onClick={fetchTrades}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </button>
      </div>

      {loading ? (
        <p className="text-xs font-mono text-slate-500 py-6 text-center">Lade Historie...</p>
      ) : trades.length === 0 ? (
        <p className="text-xs font-mono text-slate-500 py-6 text-center">Noch keine geschlossenen Trades im Journal erfasst.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="text-slate-500 border-b border-[#1E222D] text-[10px] uppercase tracking-wider">
              <tr>
                <th className="pb-3">Schließung</th>
                <th className="pb-3">Pair / Börse</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Avg Entry / Exit</th>
                <th className="pb-3">Dauer</th>
                <th className="pb-3">Fees</th>
                <th className="pb-3 text-right">Net PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E222D]/60 text-slate-300">
              {trades.map((trade) => {
                const isWin = trade.net_pnl >= 0
                return (
                  <tr key={trade.id} className="hover:bg-[#141722]/50 transition">
                    <td className="py-3 text-slate-500">
                      {new Date(trade.closed_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 font-semibold text-white">
                      <span className="text-[10px] text-slate-500 uppercase block">{trade.exchange}</span>
                      {trade.symbol}
                    </td>
                    <td className="py-3">
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded ${
                        trade.direction === 'LONG'
                          ? 'bg-[#089981]/15 text-[#089981] border border-[#089981]/30'
                          : 'bg-[#F23645]/15 text-[#F23645] border border-[#F23645]/30'
                      }`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="text-slate-200">${Number(trade.avg_entry_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      <div className="text-slate-500 text-[10px]">${Number(trade.avg_exit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </td>
                    <td className="py-3 text-slate-400">
                      {formatDuration(trade.holding_time_seconds)}
                    </td>
                    <td className="py-3 text-slate-500">
                      -${Number(trade.total_fees).toFixed(2)}
                    </td>
                    <td className={`py-3 text-right font-bold ${isWin ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                      {isWin ? '+' : ''}${Number(trade.net_pnl).toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}