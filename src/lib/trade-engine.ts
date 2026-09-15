import { createClient } from '@supabase/supabase-js';

export interface NormalizedFill {
  userId: string;
  exchange: string;
  symbol: string;
  orderId: string;
  tradeId: string;
  side: 'BUY' | 'SELL';
  positionSide: 'LONG' | 'SHORT'; // 💥 NEU: Unterscheidet im Hedge-Modus exakt die Richtung
  price: number;
  qty: number;
  fee: number;
  executedAt: string;
}

export interface AggregatedTradeState {
  side: 'LONG' | 'SHORT';
  currentQty: number;
  avgEntryPrice: number;
  totalFees: number;
  openedAt: string;
  fills: NormalizedFill[];
}

/**
 * Verarbeitet rohe Fills hedge-fähig und aggregiert sie zu sauberen Gesamthandelspositionen.
 * Key-Format in Redis/State trennt nun strikt nach symbol und positionSide.
 */
export async function processAndAggregateFills(
  supabaseClient: any,
  userId: string,
  exchange: string,
  symbol: string,
  fills: NormalizedFill[]
) {
  // Sortiere Fills chronologisch nach Ausführungszeitpunkt
  const sortedFills = [...fills].sort(
    (a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime()
  );

  // Wir halten pro Symbol getrennte States für LONG und SHORT (ermöglicht echtes Hedging)
  const activeStates: Record<string, AggregatedTradeState | null> = {
    LONG: null,
    SHORT: null,
  };

  for (const fill of sortedFills) {
    const posSide = fill.positionSide; // Entweder 'LONG' oder 'SHORT'

    // 1. Raw Fill in Audit-Tabelle sichern
    await supabaseClient.from('raw_fills').upsert({
      user_id: userId,
      exchange,
      symbol,
      order_id: fill.orderId,
      trade_id: fill.tradeId,
      side: fill.side,
      position_side: posSide,
      price: fill.price,
      qty: fill.qty,
      fee: fill.fee,
      executed_at: fill.executedAt,
    }, { onConflict: 'trade_id' });

    let currentState = activeStates[posSide];

    // 2. State initialisieren, falls für diese Richtung keine Position offen ist
    if (!currentState || currentState.currentQty === 0) {
      currentState = {
        side: posSide,
        currentQty: fill.qty,
        avgEntryPrice: fill.price,
        totalFees: fill.fee,
        openedAt: fill.executedAt,
        fills: [fill],
      };
      activeStates[posSide] = currentState;
      continue;
    }

    // 3. Im Hedge-Modus bestimmt die positionSide, ob wir aufstocken (Scale-In) oder abbauen (Exit)
    // Da Fills im 'LONG'-Container immer Longs betreffen und im 'SHORT'-Container Shorts, 
    // ist ein kaufendes Signal im Long-Container bzw. ein verkaufendes Signal im Short-Container ein Aufstocken.
    const isAdding =
      (posSide === 'LONG' && fill.side === 'BUY') ||
      (posSide === 'SHORT' && fill.side === 'SELL');

    if (isAdding) {
      // Scale-In: Neuer gewichteter Durchschnittspreis
      const totalQty = currentState.currentQty + fill.qty;
      const weightedAvgPrice =
        (currentState.avgEntryPrice * currentState.currentQty + fill.price * fill.qty) /
        totalQty;

      currentState.currentQty = totalQty;
      currentState.avgEntryPrice = weightedAvgPrice;
      currentState.totalFees += fill.fee;
      currentState.fills.push(fill);
    } else {
      // Reduzieren oder Schließen (Exit der jeweiligen Hedge-Richtung)
      const closedQty = Math.min(currentState.currentQty, fill.qty);
      currentState.currentQty -= closedQty;
      currentState.totalFees += fill.fee;
      currentState.fills.push(fill);

      // Wenn diese Richtung komplett geschlossen ist (Netto-Null)
      if (currentState.currentQty <= 0) {
        const exitPrice = fill.price;
        const volumeUsd = currentState.fills.reduce(
          (acc, f) => acc + f.price * f.qty,
          0
        );

        const priceDiff =
          posSide === 'LONG'
            ? exitPrice - currentState.avgEntryPrice
            : currentState.avgEntryPrice - exitPrice;
        
        const grossPnl = priceDiff * closedQty;
        const netPnl = grossPnl - currentState.totalFees;

        const openedTime = new Date(currentState.openedAt).getTime();
        const closedTime = new Date(fill.executedAt).getTime();
        const holdingTimeSeconds = Math.round((closedTime - openedTime) / 1000);

        // Sauberen Gesamtrade in die Haupt-Tabelle 'trades' committen
        await supabaseClient.from('trades').insert({
          user_id: userId,
          external_id: fill.tradeId,
          pair: symbol,
          status: 'CLOSED',
          side: posSide,
          entry_price: currentState.avgEntryPrice,
          exit_price: exitPrice,
          size: volumeUsd,
          pnl: netPnl,
          total_fees: currentState.totalFees,
          holding_time_seconds: holdingTimeSeconds,
          timestamp: fill.executedAt,
        });

        // State für diese Richtung leeren
        activeStates[posSide] = null;
      }
    }
  }
}