import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import WebSocket from 'ws';

// 1. Clients initialisieren
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://true-pegasus-173701.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'gQAAAAAAAqaFAAIgcDEzYTljM2FjZTA1Y2Q0NDc1OWViNDM4ZTlhOTM3MTBkNg',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Einheitliches Fill-Schema
export interface NormalizedFill {
  userId: string;
  exchange: 'bitget' | 'bybit' | 'okx';
  symbol: string;
  orderId: string;
  tradeId: string;
  side: 'BUY' | 'SELL';
  price: number;
  qty: number;
  fee: number;
  executedAt: string;
}

// Position State in Redis
export interface PositionState {
  side: 'LONG' | 'SHORT';
  currentQty: number;
  avgEntryPrice: number;
  totalFees: number;
  openedAt: string;
  fills: NormalizedFill[];
}

// 2. Engine Logic: Fills verarbeiten & Trades mergen
export async function processFill(fill: NormalizedFill) {
  const stateKey = `pos:${fill.userId}:${fill.exchange}:${fill.symbol}`;
  
  // 1. Raw Fill in Supabase sichern (Audit-Trail)
  await supabase.from('raw_fills').upsert({
    user_id: fill.userId,
    exchange: fill.exchange,
    symbol: fill.symbol,
    order_id: fill.orderId,
    trade_id: fill.tradeId,
    side: fill.side,
    price: fill.price,
    qty: fill.qty,
    fee: fill.fee,
    executed_at: fill.executedAt
  }, { onConflict: 'trade_id' });

  // 2. Aktuellen Positionsstatus aus Redis laden
  let pos = await redis.get<PositionState>(stateKey);

  // Fall A: Keine offene Position -> Neue Position eröffnen
  if (!pos || pos.currentQty === 0) {
    const newPosition: PositionState = {
      side: fill.side === 'BUY' ? 'LONG' : 'SHORT',
      currentQty: fill.qty,
      avgEntryPrice: fill.price,
      totalFees: fill.fee,
      openedAt: fill.executedAt,
      fills: [fill]
    };
    await redis.set(stateKey, newPosition);
    return;
  }

  // Fall B: Position vergrößern (Scale In)
  const isAdding = (pos.side === 'LONG' && fill.side === 'BUY') || (pos.side === 'SHORT' && fill.side === 'SELL');

  if (isAdding) {
    const totalQty = pos.currentQty + fill.qty;
    const weightedAvgPrice = ((pos.avgEntryPrice * pos.currentQty) + (fill.price * fill.qty)) / totalQty;

    pos.currentQty = totalQty;
    pos.avgEntryPrice = weightedAvgPrice;
    pos.totalFees += fill.fee;
    pos.fills.push(fill);

    await redis.set(stateKey, pos);
    return;
  }

  // Fall C: Position reduzieren oder vollständig schließen (Scale Out / Close)
  const closedQty = Math.min(pos.currentQty, fill.qty);
  pos.currentQty -= closedQty;
  pos.totalFees += fill.fee;
  pos.fills.push(fill);

  // Position ist komplett geschlossen (Net Zero Position Trigger)
  if (pos.currentQty <= 0) {
    const exitPrice = fill.price;
    const volumeUsd = pos.fills.reduce((acc: number, f: NormalizedFill) => acc + (f.price * f.qty), 0);
    
    // PnL Berechnung
    const priceDiff = pos.side === 'LONG' ? exitPrice - pos.avgEntryPrice : pos.avgEntryPrice - exitPrice;
    const grossPnl = priceDiff * closedQty;
    const netPnl = grossPnl - pos.totalFees;

    const openedDate = new Date(pos.openedAt).getTime();
    const closedDate = new Date(fill.executedAt).getTime();
    const holdingTimeSeconds = Math.round((closedDate - openedDate) / 1000);

    // Auto-Journal Eintrag in Supabase committen
    await supabase.from('journal_trades').insert({
      user_id: fill.userId,
      exchange: fill.exchange,
      symbol: fill.symbol,
      direction: pos.side,
      avg_entry_price: pos.avgEntryPrice,
      avg_exit_price: exitPrice,
      total_volume_usd: volumeUsd,
      gross_pnl: grossPnl,
      net_pnl: netPnl,
      total_fees: pos.totalFees,
      opened_at: pos.openedAt,
      closed_at: fill.executedAt,
      holding_time_seconds: holdingTimeSeconds,
      status: 'CLOSED'
    });

    // Redis State aufräumen
    await redis.del(stateKey);
  } else {
    await redis.set(stateKey, pos);
  }
}

// 3. Bitget REST Backfill Importer (Historie abrufen)
export async function backfillBitgetHistory(userId: string, apiKey: string, apiSecret: string, passphrase: string) {
  const timestamp = Date.now().toString();
  const path = '/api/v2/mix/order/fills';
  const queryString = '?productType=USDT-FUTURES&limit=100';
  
  const message = timestamp + 'GET' + path + queryString;
  const signature = crypto.createHmac('sha256', apiSecret).update(message).digest('base64');

  const response = await fetch(`https://api.bitget.com${path}${queryString}`, {
    headers: {
      'ACCESS-KEY': apiKey,
      'ACCESS-SIGN': signature,
      'ACCESS-TIMESTAMP': timestamp,
      'ACCESS-PASSPHRASE': passphrase,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();

  if (data.code === '00000' && data.data?.fillList) {
    const fills: NormalizedFill[] = data.data.fillList
      .reverse()
      .map((f: any) => ({
        userId,
        exchange: 'bitget',
        symbol: f.symbol,
        orderId: f.orderId,
        tradeId: f.tradeId,
        side: f.side.toUpperCase() as 'BUY' | 'SELL',
        price: parseFloat(f.price),
        qty: parseFloat(f.baseVolume),
        fee: Math.abs(parseFloat(f.feeDetail?.[0]?.totalFee || 0)),
        executedAt: new Date(parseInt(f.cTime)).toISOString()
      }));

    for (const fill of fills) {
      await processFill(fill);
    }
  }
}

// 4. Bitget WebSocket Live Engine (Echtzeit-Fills abfangen)
export function startBitgetWebSocket(userId: string, apiKey: string, apiSecret: string, passphrase: string) {
  const ws = new WebSocket('wss://ws.bitget.com/v2/ws/private');

  ws.on('open', () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const sign = crypto
      .createHmac('sha256', apiSecret)
      .update(timestamp + 'GET' + '/user/verify')
      .digest('base64');

    ws.send(JSON.stringify({
      op: 'login',
      args: [{ apiKey, passphrase, timestamp, sign }]
    }));
  });

  ws.on('message', async (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());

      // Nach Login: Order-Channel abonnieren
      if (msg.event === 'login' && msg.code === '0') {
        ws.send(JSON.stringify({
          op: 'subscribe',
          args: [{
            instType: 'USDT-FUTURES',
            channel: 'orders',
            instId: 'default'
          }]
        }));
      }

      // Eingehende Order Fills verarbeiten
      if (msg.data && Array.isArray(msg.data)) {
        for (const order of msg.data) {
          if (order.status === 'full-fill' || order.status === 'partial-fill') {
            const fill: NormalizedFill = {
              userId,
              exchange: 'bitget',
              symbol: order.instId,
              orderId: order.ordId,
              tradeId: order.tradeId || `${order.ordId}-${order.cTime}`,
              side: order.side.toUpperCase() as 'BUY' | 'SELL',
              price: parseFloat(order.priceAvg || order.price),
              qty: parseFloat(order.baseVolume || order.size),
              fee: Math.abs(parseFloat(order.feeDetail?.[0]?.totalFee || 0)),
              executedAt: new Date(parseInt(order.cTime)).toISOString()
            };

            await processFill(fill);
          }
        }
      }
    } catch (err) {
      console.error('WS Message Parsing Error:', err);
    }
  });

  ws.on('close', () => {
    setTimeout(() => startBitgetWebSocket(userId, apiKey, apiSecret, passphrase), 5000);
  });

  setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send('ping');
    }
  }, 30000);
}