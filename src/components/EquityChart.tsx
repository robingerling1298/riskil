'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { TrendingUp } from 'lucide-react'

export interface ChartDataPoint {
  timestamp: number
  balance?: number
  pnl?: number
  tradePnl?: number
  fee?: number
  pair?: string
  trade?: string
  initial?: boolean
}

interface EquityChartProps {
  currentEquity?: number | null
  currency?: string
  unitMode?: 'BTC' | 'FIAT'
  historyData?: ChartDataPoint[]
  trades?: any[]
}

interface NormalizedPoint {
  timestamp: number
  val: number
  tradePnl?: number
  pair?: string
}

export default function EquityChart({
  currency = 'USD',
  unitMode = 'FIAT',
  historyData,
  trades
}: EquityChartProps) {
  
  // Normalisierte Datenreihe erzeugen: Funktioniert mit historyData (balance/pnl) ODER mit trades
  const chartData = useMemo<NormalizedPoint[]>(() => {
    // Fall 1: historyData wird übergeben (z.B. aus page.tsx)
    if (historyData && historyData.length > 0) {
      return historyData.map((d) => ({
        timestamp: d.timestamp,
        val: Number(d.pnl !== undefined ? d.pnl : d.balance ?? 0),
        tradePnl: d.tradePnl,
        pair: d.pair || d.trade
      }))
    }

    // Fall 2: trades werden übergeben
    if (trades && trades.length > 0) {
      const valid = trades.filter((t) => {
        const time = t.closed_at || t.timestamp || t.created_at
        return time !== undefined && time !== null && t.pnl !== undefined && t.pnl !== null
      })

      if (valid.length === 0) return []

      const sorted = [...valid].sort((a, b) => {
        const timeA = new Date(a.closed_at || a.timestamp || a.created_at || 0).getTime()
        const timeB = new Date(b.closed_at || b.timestamp || b.created_at || 0).getTime()
        return timeA - timeB
      })

      let running = 0
      const firstTime = new Date(sorted[0].closed_at || sorted[0].timestamp || sorted[0].created_at || 0).getTime()

      const points: NormalizedPoint[] = [
        {
          timestamp: firstTime - 60000,
          val: 0,
          tradePnl: 0,
          pair: 'Start'
        }
      ]

      for (const t of sorted) {
        const time = new Date(t.closed_at || t.timestamp || t.created_at || 0).getTime()
        const raw = Number(t.pnl || 0)
        const fee = Number(t.total_fees || t.fee || 0)
        const net = raw - fee
        running += net

        points.push({
          timestamp: time,
          val: Number(running.toFixed(4)),
          tradePnl: net,
          pair: t.pair || t.symbol || 'Trade'
        })
      }

      return points
    }

    return []
  }, [historyData, trades])

  // Gradient für Grün/Rot Split
  const gradientOffset = useMemo(() => {
    if (chartData.length === 0) return 0
    const vals = chartData.map((d) => d.val)
    const dataMax = Math.max(...vals)
    const dataMin = Math.min(...vals)

    if (dataMax <= 0) return 0
    if (dataMin >= 0) return 1

    return dataMax / (dataMax - dataMin)
  }, [chartData])

  const formatXAxis = (unixTime: number) => {
    return new Date(unixTime).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
  }

  const formatFullDate = (unixTime: number) => {
    return new Date(unixTime).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: NormalizedPoint = payload[0].payload
      const isPositive = data.val >= 0
      const formatted = unitMode === 'BTC'
        ? `${data.val.toFixed(6)} BTC`
        : `${isPositive ? '+' : ''}$${data.val.toFixed(2)} ${currency}`

      return (
        <div className="bg-[#0B0E14] border border-[#161A23] p-3 rounded-xl shadow-2xl space-y-1 min-w-[170px]">
          <div className="flex items-center justify-between gap-2 border-b border-[#161A23] pb-1">
            <span className="text-[10px] text-slate-400 font-bold">{data.pair || 'Performance'}</span>
            <span className="text-[10px] text-slate-500 font-mono">{formatFullDate(data.timestamp)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-3 pt-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Kumulierter PnL
            </span>
            <span className={`text-sm font-black font-mono ${isPositive ? 'text-[#089981]' : 'text-[#F23645]'}`}>
              {formatted}
            </span>
          </div>
          {data.tradePnl !== undefined && data.pair !== 'Start' && (
            <div className="flex items-baseline justify-between gap-3 text-[10px] text-slate-400 font-mono">
              <span>Trade Netto:</span>
              <span className={data.tradePnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>
                {data.tradePnl >= 0 ? '+' : ''}${data.tradePnl.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full h-[260px] mt-2 flex flex-col items-center justify-center bg-[#0B0E14]/40 border border-[#161A23] rounded-2xl text-slate-500">
        <TrendingUp className="w-8 h-8 opacity-20 mb-2" />
        <p className="text-xs font-medium text-slate-400">Keine Daten für Performance-Kurve vorhanden</p>
      </div>
    )
  }

  const lastVal = chartData[chartData.length - 1]?.val ?? 0

  return (
    <div className="w-full h-[260px] mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 12, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset={gradientOffset} stopColor="#089981" stopOpacity={0.28} />
              <stop offset={gradientOffset} stopColor="#F23645" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#F23645" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatXAxis}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
            dy={10}
            minTickGap={60}
          />

          <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} hide={true} />

          <ReferenceLine y={0} stroke="#1E2536" strokeDasharray="3 3" />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#222938', strokeWidth: 1, strokeDasharray: '4 4' }} />

          <Area
            type="monotone"
            dataKey="val"
            stroke={lastVal >= 0 ? '#089981' : '#F23645'}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#splitColor)"
            dot={false}
            activeDot={{
              r: 4.5,
              fill: lastVal >= 0 ? '#089981' : '#F23645',
              stroke: '#0B0E14',
              strokeWidth: 2
            }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}