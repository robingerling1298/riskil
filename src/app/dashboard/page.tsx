'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Layers, Calculator, Target, ShieldAlert, TrendingUp, Plus, ArrowUpRight, Zap, Activity, Link2, CheckCircle2, Bitcoin } from 'lucide-react'

import { useJournalStore } from '@/lib/supabase/useJournalStore'
import { JournalDashboard } from '@/components/JournalDashboard'
import ConnectExchangeModal from '@/components/ConnectExchangeModal'
import EquityChart from '@/components/EquityChart'
import ActivePositions from '@/components/ActivePositions'
import { supabase } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [connectedExchange, setConnectedExchange] = useState<string | null>(null)

  const [unitMode, setUnitMode] = useState<'BTC' | 'FIAT'>('BTC')
  const [btcPrice, setBtcPrice] = useState<number>(65000)

  const [liveData, setLiveData] = useState<{ 
    equity: number; 
    currency?: string;
    openPositions: any[]; 
    snapshots?: { timestamp: string, equity: number }[];
    activeTags?: Record<string, string[]>;
    activePreTrades?: Record<string, { energy: number; conviction: number; locked: boolean }>;
  } | null>(null)

  const [dbTrades, setDbTrades] = useState<any[]>([])
  const failCountRef = useRef(0)

  // Schneller Startabruf (Trades, Verbindung und letzter Snapshot aus Supabase)
  const fetchSupabaseInitialData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [tradesRes, settingsRes, snapshotRes] = await Promise.all([
        supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false }),
        supabase
          .from('user_settings')
          .select('selected_exchange, api_key')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('portfolio_snapshots')
          .select('equity, currency, timestamp')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle()
      ])

      if (!tradesRes.error && tradesRes.data) {
        setDbTrades(tradesRes.data)
      }

      if (settingsRes.data?.api_key) {
        const ex = settingsRes.data.selected_exchange || 'bitget'
        setConnectedExchange(ex.charAt(0).toUpperCase() + ex.slice(1))
      }

      const latestSnapshot = snapshotRes.data
      if (latestSnapshot) {
        setLiveData((prev) => prev || {
          equity: Number(latestSnapshot.equity),
          currency: latestSnapshot.currency || 'USD',
          openPositions: [],
          snapshots: [],
        })
      }
    } catch (err) {
      console.error('Fehler beim initialen Laden der Supabase-Daten:', err)
    }
  }, [])

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch('/api/exchange/live')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
           failCountRef.current = 0
           setLiveData(data)
           setConnectedExchange('Bitget')

           // Neue geschlossene Trades direkt in den State übernehmen
           if (data.dbTrades) {
             setDbTrades(data.dbTrades)
           }

           const btcPos = data.openPositions?.find((p: any) => p.symbol?.includes('BTC'))
           const currentBtc = Number(btcPos?.markPrice || btcPos?.entryPrice || 0)
           if (currentBtc > 0) setBtcPrice(currentBtc)
        } else {
           handleConnectionDrop()
        }
      } else {
        handleConnectionDrop()
      }
    } catch (err) {
      console.error('Fehler beim Abrufen der Live-Daten:', err)
      handleConnectionDrop()
    }
  }, [])

  const handleConnectionDrop = () => {
    failCountRef.current += 1
    if (failCountRef.current >= 3) {
      setConnectedExchange(null)
      setLiveData(null)
    }
  }

  useEffect(() => {
    fetchSupabaseInitialData()
    fetchLive()
    const interval = setInterval(fetchLive, 5000) // 5s Intervall
    return () => clearInterval(interval)
  }, [fetchLive, fetchSupabaseInitialData])

  useEffect(() => {
    async function loadFallbackBtcPrice() {
      try {
        const res = await fetch('https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT')
        const json = await res.json()
        const price = Number(json.result?.list?.[0]?.lastPrice || 0)
        if (price > 0) setBtcPrice(price)
      } catch {}
    }
    loadFallbackBtcPrice()
  }, [])

  const closedDbTrades = useMemo(() => {
    return dbTrades.filter((t: any) => t.status === 'CLOSED' && t.pnl !== undefined && t.pnl !== null)
  }, [dbTrades])

  // Maximal 10 noch nicht dokumentierte Trades in der Inbox
  const inboxTrades = useMemo(() => {
    return closedDbTrades.filter((t: any) => !t.is_transferred).slice(0, 10)
  }, [closedDbTrades])
  
// Dynamische KPIs über alle Trades (MUSS BLEIBEN)
  const netPnlDb = closedDbTrades.reduce((acc, t: any) => acc + Number(t.pnl), 0)
  const winningTrades = closedDbTrades.filter((t: any) => Number(t.pnl) > 0).length
  const winrate = closedDbTrades.length > 0 ? ((winningTrades / closedDbTrades.length) * 100).toFixed(1) : '0.0'

  const activeCurrency = liveData?.currency || 'USD'
  const isBtcMode = unitMode === 'BTC'

  const displayEquity = isBtcMode && btcPrice > 0 
    ? (liveData?.equity ?? 0) / btcPrice 
    : (liveData?.equity ?? 0)

  const displayNetPnl = isBtcMode && btcPrice > 0 
    ? netPnlDb / btcPrice 
    : netPnlDb

  // Chart greift direkt auf echte Börsen-Snapshots zu – unabhängig von Trades
  const chartHistoryData = useMemo(() => {
    const currentLiveEquity = Number(liveData?.equity || 0)
    const snapshots = liveData?.snapshots || []

    if (currentLiveEquity <= 0 && snapshots.length === 0) return []

    const now = Date.now()
    const isBtc = isBtcMode && btcPrice > 0

    // 1. Echte Snapshots aus Supabase aufbereiten
    const points: { timestamp: number; balance: number }[] = snapshots.map((s: any) => {
      const rawEq = Number(s.equity || 0)
      const balanceVal = isBtc 
        ? Number((rawEq / btcPrice).toFixed(6)) 
        : Number(rawEq.toFixed(2))

      return {
        timestamp: new Date(s.timestamp).getTime(),
        balance: balanceVal,
      }
    })

    // Chronologisch sortieren
    points.sort((a, b) => a.timestamp - b.timestamp)

    // 2. Aktuellen Live-Stand als Endpunkt berechnen
    const currentVal = isBtc 
      ? Number((currentLiveEquity / btcPrice).toFixed(6)) 
      : Number(currentLiveEquity.toFixed(2))

    // Wenn noch keine Historie existiert: Flache Linie über die letzte Stunde
    if (points.length === 0) {
      return [
        { timestamp: now - (60 * 60 * 1000), balance: currentVal },
        { timestamp: now, balance: currentVal }
      ]
    }

    // Wenn nur ein einzelner Snapshot vorliegt: Vorlauf-Punkt erzeugen
    if (points.length === 1) {
      points.unshift({
        timestamp: points[0].timestamp - (15 * 60 * 1000),
        balance: points[0].balance
      })
    }

    // Aktuellen Live-Punkt anfügen
    points.push({ timestamp: now, balance: currentVal })

    return points
  }, [liveData, isBtcMode, btcPrice])

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 text-slate-200 font-sans">
      
      {/* Header */}
      <div className="relative p-6 sm:p-7 bg-[#0B0E14] border border-[#161A23] rounded-2xl shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#089981]/10 text-[#089981] border border-[#089981]/20">
              Dashboard
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <span className={`w-2 h-2 rounded-full ${connectedExchange ? 'bg-[#089981] animate-pulse' : 'bg-slate-500'}`} /> 
              Terminal {connectedExchange ? `(${connectedExchange})` : '(nicht verbunden)'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Live Übersicht
          </h1>
          <p className="text-xs text-slate-400 max-w-lg">
            Tracke deine Setups und führe ganz einfach dein Live-Journal
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 z-10 shrink-0">
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#161A23] hover:bg-[#1c222e] border border-[#222938] hover:border-[#089981]/50 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Link2 size={16} className={connectedExchange ? "text-[#089981]" : "text-slate-400"} />
            <span>{connectedExchange ? `${connectedExchange} verwalten` : 'Börse verbinden'}</span>
          </button>
          <Link
            href="/dashboard/full-planner"
            className="px-4 py-2.5 rounded-xl bg-[#089981] hover:bg-[#067a67] text-white font-bold text-xs shadow-lg shadow-[#089981]/15 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} /> Neuen Trade planen
          </Link>
        </div>
      </div>

      {/* Status Alert & Einheit-Toggle */}
      <div className="p-3.5 bg-[#089981]/5 border border-[#089981]/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${connectedExchange ? 'text-[#089981]' : 'text-slate-500'}`} />
          <div className="flex flex-wrap items-center gap-2">
            <span>
              {connectedExchange 
                ? <>Live-Sync aktiv für <strong>{connectedExchange}</strong>.</> 
                : 'Keine Börse verbunden. Nutze die API Einbindung.'}
            </span>
            {liveData && (
              <span className="text-[11px] text-[#089981] font-mono font-bold">
                Portfolio:{' '}
                {isBtcMode 
                  ? `${displayEquity.toFixed(6)} BTC`
                  : `$${liveData.equity.toFixed(2)} ${activeCurrency}`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mr-1">Anzeige:</span>
          <div className="flex bg-[#0B0E14] p-1 border border-[#161A23] rounded-xl text-xs font-mono">
            <button
              type="button"
              onClick={() => setUnitMode('BTC')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                isBtcMode 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bitcoin className="w-3.5 h-3.5" />
              <span>BTC</span>
            </button>
            <button
              type="button"
              onClick={() => setUnitMode('FIAT')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                !isBtcMode 
                  ? 'bg-[#089981]/20 text-[#089981] border border-[#089981]/40 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {activeCurrency}
            </button>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="space-y-2 pt-2 pb-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-[#089981]" /> Portfolio & Trades Verlauf
          </span>
        </div>

        <EquityChart 
          currentEquity={liveData?.equity ?? null} 
          currency={activeCurrency}
          unitMode={unitMode}
          historyData={chartHistoryData} 
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#0B0E14] border border-[#161A23] rounded-xl p-4">
          <div className="flex justify-between items-center text-slate-500 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Geöffnete Positionen</span>
            <Activity className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <p className="text-xl font-bold text-white font-mono">
            {liveData ? liveData.openPositions.length : 0}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Live aus Exchange</span>
        </div>

        <div className="bg-[#0B0E14] border border-[#161A23] rounded-xl p-4">
          <div className="flex justify-between items-center text-slate-500 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Winrate (Gesamt)</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#089981]" />
          </div>
          <p className="text-xl font-bold text-[#089981] font-mono">{winrate}%</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {winningTrades} Wins / {closedDbTrades.length - winningTrades} Losses
          </span>
        </div>

        <div className="bg-[#0B0E14] border border-[#161A23] rounded-xl p-4">
          <div className="flex justify-between items-center text-slate-500 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Net PnL (Gesamt)</span>
            <span className="text-[10px] font-bold text-slate-500 font-mono">
              {isBtcMode ? 'BTC' : activeCurrency}
            </span>
          </div>
          <p className={`text-xl font-bold font-mono ${netPnlDb >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
            {isBtcMode 
              ? `${displayNetPnl >= 0 ? '+' : ''}${displayNetPnl.toFixed(6)} ₿`
              : `${displayNetPnl >= 0 ? '+' : ''}$${displayNetPnl.toFixed(2)}`}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Gesynct & Realisiert</span>
        </div>

        <div className="bg-[#0B0E14] border border-[#161A23] rounded-xl p-4">
          <div className="flex justify-between items-center text-slate-500 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Erfasste Trades</span>
            <Zap className="w-3.5 h-3.5 text-amber-400/80" />
          </div>
          <p className="text-xl font-bold text-amber-400/90 font-mono">{closedDbTrades.length}</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Gesamt in Datenbank</span>
        </div>
      </div>

      {/* Active Positions & Journal Inbox */}
      <ActivePositions 
        positions={liveData?.openPositions || []} 
        initialActiveTags={liveData?.activeTags || {}}
        initialPreTrades={liveData?.activePreTrades || {}}
        historicalTrades={closedDbTrades}
        userTier="FREE" 
      />

      <JournalDashboard trades={inboxTrades} viewMode="dashboard" />

      <ConnectExchangeModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onSuccess={() => fetchLive()}
      />
    </div>
  )
}