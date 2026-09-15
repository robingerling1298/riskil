'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export interface ChartDataPoint {
  timestamp: number
  balance: number
  trade?: string
  initial?: boolean
}

interface EquityChartProps {
  currentEquity?: number | null
  currency?: string
  unitMode?: 'BTC' | 'FIAT'
  historyData: ChartDataPoint[]
}

export default function EquityChart({ currentEquity, currency = 'USD', unitMode = 'BTC', historyData }: EquityChartProps) {
  
  const formatXAxis = (unixTime: number) => {
    return new Date(unixTime).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
  }

  const formatFullDate = (unixTime: number) => {
    return new Date(unixTime).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const isBtc = unitMode === 'BTC'
      const formattedBalance = isBtc 
        ? `${Number(data.balance).toFixed(6)} BTC`
        : `$${Number(data.balance).toFixed(2)} ${currency}`

      return (
        <div className="bg-[#0B0E14] border border-[#161A23] p-3 rounded-xl shadow-2xl space-y-1">
          <p className="text-[10px] text-slate-500 font-mono">
            {formatFullDate(data.timestamp)}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Portfolio Gesamtwert
            </span>
            <span className="text-sm font-black text-[#089981] font-mono">
              {formattedBalance}
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-[260px] mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={historyData} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#089981" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#089981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          
          <XAxis 
            dataKey="timestamp" 
            type="number" 
            domain={['dataMin', 'dataMax']} 
            tickFormatter={formatXAxis}
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#64748b", fontSize: 11 }}
            dy={10}
            minTickGap={60}
          />
          
          <YAxis 
  domain={[
    (dataMin: number) => (dataMin > 0 ? Number((dataMin * 0.995).toFixed(6)) : dataMin),
    (dataMax: number) => Number((dataMax * 1.005).toFixed(6))
  ]}
  axisLine={false}
  tickLine={false}
  hide={true}
/>
          
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: '#222938', strokeWidth: 1, strokeDasharray: '4 4' }} 
          />
          
          <Area 
            type="monotone" 
            dataKey="balance" 
            stroke="#089981" 
            strokeWidth={2.2}
            fillOpacity={1} 
            fill="url(#colorBalance)" 
            dot={false} 
            activeDot={{ r: 4.5, fill: '#089981', stroke: '#0B0E14', strokeWidth: 2 }} 
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}