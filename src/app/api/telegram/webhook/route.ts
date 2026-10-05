import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

const REASON_LABELS: Record<string, string> = {
  planned: '🎯 Geplanter DCA',
  fomo: '⚡ FOMO / Impulsiv',
  hedge: '🛡️ Hedge / Breakout',
  revenge: '🩸 Revenge / Verbilligt'
};

export async function POST(req: Request) {
  try {
    const update = await req.json();

    // 1. Inline-Keyboard Button-Klicks verarbeiten
    if (update.callback_query) {
      const { id, data, message } = update.callback_query;

      // Format: si:<tradeId>:<fillId>:<reason>
      if (data?.startsWith('si:')) {
        const [, , fillId, reason] = data.split(':');

        // Scale-In Grund in der Tabelle 'raw_fills' aktualisieren
        const { error: dbError } = await supabase
          .from('raw_fills')
          .update({ scale_in_reason: reason })
          .eq('id', fillId);

        if (dbError) {
          console.error('Fehler beim Aktualisieren von raw_fills:', dbError);
        }

        const label = REASON_LABELS[reason] || reason;

        // Feedback-Toast im Telegram-Client bestätigen
        await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: id,
            text: `Erfasst: ${label}`
          })
        });

        // Nachricht aktualisieren (Buttons entfernen und Bestätigung anhängen)
        if (message?.chat?.id && message?.message_id) {
          await fetch(`${TELEGRAM_API}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: message.chat.id,
              message_id: message.message_id,
              text: `${message.text}\n\n✅ *Status erfasst:* ${label}`,
              parse_mode: 'Markdown'
            })
          });
        }
      }

      return NextResponse.json({ ok: true });
    }

    // 2. /start Befehl mit Token zur Verknüpfung verarbeiten (/start <token>)
    if (update.message?.text?.startsWith('/start')) {
      const parts = update.message.text.trim().split(' ');
      const linkToken = parts[1];

      if (linkToken) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .update({ telegram_chat_id: update.message.chat.id })
          .eq('telegram_link_token', linkToken)
          .select()
          .single();

        if (!error && profile) {
          await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: update.message.chat.id,
              text: '⚡ *RISKIL Terminal erfolgreich verbunden!*\n\nDu erhältst deine Scale-Ins und Fill-Alerts ab jetzt direkt in diesen Chat.',
              parse_mode: 'Markdown'
            })
          });
        } else {
          await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: update.message.chat.id,
              text: '⚠️ *Ungültiger oder abgelaufener Token.*\nBitte öffne dein RISKIL Terminal und klicke erneut auf „Telegram verbinden“.',
              parse_mode: 'Markdown'
            })
          });
        }
      } else {
        await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: update.message.chat.id,
            text: '👋 Willkommen beim *RISKIL Bot*!\n\nVerbinde deinen Account über das Terminal, indem du dort auf den Telegram-Verbindungslink klickst.',
            parse_mode: 'Markdown'
          })
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telegram Webhook Route Error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}