// src/lib/chartUtils.ts

export interface ChartDataPoint {
  timestamp: number
  pnl: number
  tradePnl?: number
  fee?: number
  pair?: string
}

export function buildCumulativePnlSeries(trades: any[]): ChartDataPoint[] {
  if (!trades || trades.length === 0) return []

  // 1. Nur valide Trades mit Abschlussdatum und PnL
  const closedTrades = trades.filter(t => {
    const time = t.closed_at || t.timestamp || t.created_at
    return time !== undefined && time !== null && t.pnl !== undefined && t.pnl !== null
  })

  if (closedTrades.length === 0) return []

  // 2. Streng chronologisch aufsteigend sortieren
  const sorted = [...closedTrades].sort((a, b) => {
    const timeA = new Date(a.closed_at || a.timestamp || a.created_at || 0).getTime()
    const timeB = new Date(b.closed_at || b.timestamp || b.created_at || 0).getTime()
    return timeA - timeB
  })

  let runningPnL = 0
  const firstTime = new Date(sorted[0].closed_at || sorted[0].timestamp || sorted[0].created_at || 0).getTime()

  // 3. Startpunkt auf der Null-Linie kurz vor dem ersten Trade
  const points: ChartDataPoint[] = [
    {
      timestamp: firstTime - 60000,
      pnl: 0,
      tradePnl: 0,
      fee: 0,
      pair: 'Start'
    }
  ]

  // 4. Kumulieren
  for (const trade of sorted) {
    const time = new Date(trade.closed_at || trade.timestamp || trade.created_at || 0).getTime()
    const rawPnl = Number(trade.pnl || 0)
    const fees = Number(trade.total_fees || trade.fee || 0)
    const netPnl = rawPnl - fees

    runningPnL += netPnl

    points.push({
      timestamp: time,
      pnl: Number(runningPnL.toFixed(4)),
      tradePnl: netPnl,
      fee: fees,
      pair: trade.pair || trade.symbol || 'Trade'
    })
  }

  return points
}