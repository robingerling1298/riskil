import { NextResponse } from 'next/server';
import { backfillBitgetHistory } from '@/workers/bitget-worker';

export async function POST(req: Request) {
  try {
    const { userId, apiKey, apiSecret, passphrase } = await req.json();

    if (!userId || !apiKey || !apiSecret || !passphrase) {
      return NextResponse.json(
        { error: 'Fehlende API-Zugangsdaten' },
        { status: 400 }
      );
    }

    // Historischen REST-Backfill starten
    await backfillBitgetHistory(userId, apiKey, apiSecret, passphrase);

    return NextResponse.json({
      success: true,
      message: 'Historische Trades erfolgreich importiert und gemergt!',
    });
  } catch (error: any) {
    console.error('Backfill Error:', error);
    return NextResponse.json(
      { error: error.message || 'Backfill fehlgeschlagen' },
      { status: 500 }
    );
  }
}