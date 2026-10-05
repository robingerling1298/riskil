const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export interface ScaleInAlertParams {
  chatId: string | number;
  tradeId: string;
  fillId: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  price: number;
  orderType: 'limit' | 'market';
  newAvgPrice: number;
}

export async function sendTelegramMessage(chatId: string | number, text: string) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    })
  });
  return res.json();
}

export async function sendScaleInPrompt(params: ScaleInAlertParams) {
  const { chatId, tradeId, fillId, symbol, side, size, price, orderType, newAvgPrice } = params;

  const typeLabel = orderType === 'limit' ? '🎯 Limit (Maker)' : '⚡ Market (Taker)';
  const sideEmoji = side === 'long' ? '🟢' : '🔴';

  const text =
    `${sideEmoji} *Fill Alert: ${symbol} ${side.toUpperCase()}*\n\n` +
    `*Scale-In:* +${size} @ ${price} USDT\n` +
    `*Order-Typ:* ${typeLabel}\n` +
    `*Neuer Avg Entry:* ${newAvgPrice} USDT\n\n` +
    `_Warum hast du diesen Entry genommen?_`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '🎯 Geplanter DCA', callback_data: `si:${tradeId}:${fillId}:planned` },
        { text: '⚡ FOMO / Impulsiv', callback_data: `si:${tradeId}:${fillId}:fomo` }
      ],
      [
        { text: '🛡️ Hedge / Breakout', callback_data: `si:${tradeId}:${fillId}:hedge` },
        { text: '🩸 Revenge / Verbilligt', callback_data: `si:${tradeId}:${fillId}:revenge` }
      ]
    ]
  };

  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      reply_markup: inlineKeyboard
    })
  });

  return res.json();
}