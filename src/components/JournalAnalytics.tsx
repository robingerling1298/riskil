import { 
  TrendingUp, 
  BrainCircuit, 
  AlertTriangle, 
  Target, 
  Zap,
  ShieldAlert,
  Activity
} from 'lucide-react'

const ERROR_TAGS = ['SL verschoben', 'Zu früh geschlossen', 'Gewinner zu früh beschnitten', 'Hebel erhöht', 'Invalidation ignoriert']

export function JournalAnalytics({ trades = [] }: { trades: any[] }) { 
  if (!trades || trades.length < 3) return null;

  // 1. Core Analytics Aggregation
  let longWins = 0, longTotal = 0, shortWins = 0, shortTotal = 0;
  let totalGrossLoss = 0; 

  const tagPerformance: Record<string, { pnl: number; count: number; wins: number }> = {}; 
  const moodPerformance: Record<string, { pnl: number; count: number }> = {};
  
  const setupPerformance = {
    'Setup A: Perfekt': { wins: 0, count: 0 },
    'Setup B: Suboptimal': { wins: 0, count: 0 },
    'Setup C: Impulsiv / FOMO': { wins: 0, count: 0 }
  }

  const errorFrequency: Record<string, number> = {};
  let totalErrors = 0;

  // Toxic Combo Tracker
  const comboStats: Record<string, { pnl: number; count: number; wins: number; tag: string; mood: string }> = {};

  trades.forEach(trade => { 
    const pnl = Number(trade.pnl || 0); 
    const isWin = pnl >= 0; 
    const side = trade.side?.toUpperCase(); 
    const mood = trade.mood; 
    const entryTags = trade.entry_tags || [];
    const exitTags = trade.exit_tags || [];

    if (!isWin) totalGrossLoss += Math.abs(pnl);

    // Directional (Original)
    if (side === 'LONG' || side === 'BUY') { 
      longTotal++; if (isWin) longWins++; 
    } else if (side === 'SHORT' || side === 'SELL') { 
      shortTotal++; if (isWin) shortWins++; 
    }

    // Mood (Original & Neu)
    if (mood) { 
      if (!moodPerformance[mood]) moodPerformance[mood] = { pnl: 0, count: 0 }; 
      moodPerformance[mood].pnl += pnl; 
      moodPerformance[mood].count += 1; 
    }

    // Tags & Combos (Original)
    entryTags.forEach((tag: string) => { 
      if (!tagPerformance[tag]) tagPerformance[tag] = { pnl: 0, count: 0, wins: 0 }; 
      tagPerformance[tag].pnl += pnl; 
      tagPerformance[tag].count += 1; 
      if (isWin) tagPerformance[tag].wins += 1;

      // Setup-Winrate (Neu)
      if (setupPerformance[tag as keyof typeof setupPerformance]) {
        setupPerformance[tag as keyof typeof setupPerformance].count++;
        if (isWin) setupPerformance[tag as keyof typeof setupPerformance].wins++;
      }

      // Combo Tracking (Nur Setup + Emotion)
      if (mood && tag.includes('Setup')) {
        const comboKey = `${tag}|${mood}`;
        if (!comboStats[comboKey]) comboStats[comboKey] = { pnl: 0, count: 0, wins: 0, tag, mood };
        comboStats[comboKey].pnl += pnl;
        comboStats[comboKey].count += 1;
        if (isWin) comboStats[comboKey].wins += 1;
      }
    }); 

    // Fehler-Frequenz (Neu)
    exitTags.forEach((tag: string) => {
      if (ERROR_TAGS.includes(tag)) {
        errorFrequency[tag] = (errorFrequency[tag] || 0) + 1;
        totalErrors++;
      }
    });
  });

  // 2. Auswertung (Original)
  const sortedTags = Object.entries(tagPerformance).sort((a, b) => b[1].pnl - a[1].pnl); 
  const bestSetup = sortedTags.length > 0 && sortedTags[0][1].pnl > 0 ? sortedTags[0] : null; 
  const worstSetup = sortedTags.length > 0 && sortedTags[sortedTags.length - 1][1].pnl < 0 ? sortedTags[sortedTags.length - 1] : null;

  const longWinrate = longTotal > 0 ? ((longWins / longTotal) * 100).toFixed(0) : '0'; 
  const shortWinrate = shortTotal > 0 ? ((shortWins / shortTotal) * 100).toFixed(0) : '0';

  const sortedCombos = Object.values(comboStats)
    .filter(c => c.pnl < 0 && c.count > 1)
    .sort((a, b) => a.pnl - b.pnl);
  
  const toxicCombo = sortedCombos.length > 0 ? sortedCombos[0] : null;
  const toxicImpactPercent = toxicCombo && totalGrossLoss > 0 
    ? ((Math.abs(toxicCombo.pnl) / totalGrossLoss) * 100).toFixed(0) 
    : 0;

  return ( 
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
      {/* TOXIC COMBO ALERT (Original) */}
      {toxicCombo && (
        <div className="md:col-span-3 relative bg-[#0B0E14]/80 backdrop-blur-xl border border-[#F23645]/30 rounded-2xl p-5 overflow-hidden group shadow-[0_0_25px_rgba(242,54,69,0.1)] transition-all hover:border-[#F23645]/60 hover:shadow-[0_0_35px_rgba(242,54,69,0.15)]">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#F23645]/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-[#F23645]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-[#F23645]/10 border border-[#F23645]/20 rounded-xl shrink-0 mt-1">
                <ShieldAlert className="w-6 h-6 text-[#F23645]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
                  TOXIC COMBO GEFUNDEN
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[#F23645]/20 text-[#F23645] border border-[#F23645]/30">
                    Account Bleeder
                  </span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  Reality Check: Wenn du das Setup <strong className="text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{toxicCombo.tag}</strong> mit der Emotion <strong className="text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{toxicCombo.mood}</strong> kombinierst, liegt deine Winrate bei <strong className="text-[#F23645] font-mono">{((toxicCombo.wins / toxicCombo.count) * 100).toFixed(0)}%</strong>. 
                  Dieses destruktive Muster hat dich in {toxicCombo.count} Trades insgesamt <strong className="text-[#F23645] font-mono font-bold">${Math.abs(toxicCombo.pnl).toFixed(2)}</strong> gekostet.
                </p>
              </div>
            </div>

            <div className="sm:border-l border-[#F23645]/20 sm:pl-6 min-w-[160px] flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Anteil am Gesamtverlust
              </span>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-3xl font-black text-[#F23645] font-mono">{toxicImpactPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#161A23] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#F23645]/50 to-[#F23645] rounded-full shadow-[0_0_10px_rgba(242,54,69,0.8)]" 
                  style={{ width: `${toxicImpactPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 1. Setup Edge PnL (Original) */}
      <div className="bg-[#0B0E14] border border-[#161A23] rounded-xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#222938] transition-all">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-blue-400" />
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Setup Edge (PnL)</h3>
        </div>
        
        <div className="space-y-3 relative z-10">
          {bestSetup ? (
            <div className="flex justify-between items-center bg-[#089981]/5 border border-[#089981]/10 p-2.5 rounded-lg transition-all hover:bg-[#089981]/10">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#089981] animate-pulse"/>
                {bestSetup[0]}
              </span>
              <span className="text-xs font-mono font-bold text-[#089981]">+{bestSetup[1].pnl.toFixed(2)}$</span>
            </div>
          ) : <span className="text-xs text-slate-600">Noch keine Gewinner-Setups</span>}

          {worstSetup ? (
            <div className="flex justify-between items-center bg-[#F23645]/5 border border-[#F23645]/10 p-2.5 rounded-lg transition-all hover:bg-[#F23645]/10">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F23645]"/>
                {worstSetup[0]}
              </span>
              <span className="text-xs font-mono font-bold text-[#F23645]">{worstSetup[1].pnl.toFixed(2)}$</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* 2. Directional Edge (Original) */}
      <div className="bg-[#0B0E14] border border-[#161A23] rounded-xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#222938] transition-all">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all"></div>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-purple-400" />
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Directional Edge</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <div className="flex flex-col gap-1 border-r border-[#161A23]">
            <span className="text-[10px] text-slate-500 font-medium">LONG WINRATE</span>
            <span className={`text-xl font-mono font-black ${Number(longWinrate) >= 50 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
              {longWinrate}%
            </span>
            <span className="text-[9px] text-slate-600 font-medium">{longTotal} Trades</span>
          </div>
          <div className="flex flex-col gap-1 pl-2">
            <span className="text-[10px] text-slate-500 font-medium">SHORT WINRATE</span>
            <span className={`text-xl font-mono font-black ${Number(shortWinrate) >= 50 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
              {shortWinrate}%
            </span>
            <span className="text-[9px] text-slate-600 font-medium">{shortTotal} Trades</span>
          </div>
        </div>
      </div>

      {/* 3. Psychologie Index (Original) */}
      <div className="bg-[#0B0E14] border border-[#161A23] rounded-xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#222938] transition-all">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="w-4 h-4 text-amber-400" />
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Psychologie Index</h3>
        </div>
        
        <div className="space-y-2.5 relative z-10">
          {Object.entries(moodPerformance).length > 0 ? (
            Object.entries(moodPerformance)
              .sort((a, b) => a[1].pnl - b[1].pnl)
              .slice(0, 2)
              .map(([mood, data]) => (
                <div key={mood} className="flex justify-between items-center border-b border-[#161A23] pb-2 last:border-0 last:pb-0">
                  <span className="text-xs text-slate-300 font-medium flex items-center gap-2">{mood}</span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${data.pnl >= 0 ? 'bg-[#089981]/10 text-[#089981]' : 'bg-[#F23645]/10 text-[#F23645]'}`}>
                    {data.pnl >= 0 ? '+' : ''}{data.pnl.toFixed(2)}$
                  </span>
                </div>
              ))
          ) : (
            <div className="text-xs text-slate-500 flex items-center gap-2 bg-[#161A23]/50 p-2 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500/50" /> Keine Mood-Daten erfasst.
            </div>
          )}
        </div>
      </div>

      {/* 4. Setup-Klassen Winrate (Neu) */}
      <div className="bg-[#0B0E14] border border-[#161A23] rounded-xl p-5 flex flex-col relative overflow-hidden group hover:border-[#222938] transition-all md:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-brand" />
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Setup-Klassen Winrate</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
          {Object.entries(setupPerformance).map(([setup, data]) => {
            if (data.count === 0) return (
              <div key={setup} className="flex justify-between items-center bg-[#161A23]/50 p-3 rounded-lg border border-[#1E2536] opacity-50">
                <span className="text-[10px] font-bold text-slate-500">{setup.replace('Setup ', '')}</span>
                <span className="text-xs text-slate-600">-</span>
              </div>
            );
            const winrate = (data.wins / data.count) * 100;
            const isGood = winrate >= 50;
            return (
              <div key={setup} className="flex justify-between items-center bg-[#161A23]/50 p-3 rounded-lg border border-[#1E2536] transition-all hover:bg-[#1C2333]">
                <span className="text-[10px] font-bold text-slate-300">{setup.replace('Setup ', '')}</span>
                <div className="text-right">
                  <span className={`text-xs font-mono font-black ${isGood ? 'text-[#089981]' : 'text-[#F23645]'}`}>{winrate.toFixed(0)}%</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">{data.count} Trades</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 5. Fehler-Frequenz (Neu) */}
      <div className="bg-[#0B0E14] border border-[#161A23] rounded-xl p-5 flex flex-col relative overflow-hidden group hover:border-[#222938] transition-all md:col-span-1">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[#F23645]" />
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fehler-Frequenz</h3>
        </div>
        <div className="space-y-3 relative z-10">
          {Object.entries(errorFrequency).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([error, count]) => {
            const pct = totalErrors > 0 ? (count / totalErrors) * 100 : 0;
            return (
              <div key={error} className="space-y-1">
                <div className="flex justify-between items-end text-[10px]">
                  <span className="text-slate-300 font-medium truncate max-w-[120px]">{error}</span>
                  <span className="text-slate-500 font-mono bg-[#161A23] px-1.5 rounded">{count}x</span>
                </div>
                <div className="w-full h-1.5 bg-[#161A23] rounded-full overflow-hidden">
                  <div className="h-full bg-[#F23645]/80 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
          {totalErrors === 0 && (
            <div className="text-xs text-[#089981] bg-[#089981]/10 p-2 rounded-lg text-center mt-2 border border-[#089981]/20">
              Keine Ausführungsfehler erfasst.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}