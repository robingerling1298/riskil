import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // 💥 preNotes jetzt explizit empfangen!
    const { symbol, tags, energy, conviction, locked, initialSize, preNotes } = await req.json()

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol fehlt' }, { status: 400 })
    }

    const { data: settings } = await supabase
      .from('user_settings')
      .select('active_tags, active_pre_trades')
      .eq('user_id', user.id)
      .maybeSingle()

    const currentTags = { ...(settings?.active_tags || {}) }
    const currentPreTrades = { ...(settings?.active_pre_trades || {}) }

    if (tags !== undefined) {
      currentTags[symbol] = tags
    }

    if (
      energy !== undefined || 
      conviction !== undefined || 
      locked !== undefined || 
      initialSize !== undefined ||
      preNotes !== undefined
    ) {
      currentPreTrades[symbol] = {
        ...(currentPreTrades[symbol] || {}),
        ...(energy !== undefined ? { energy } : {}),
        ...(conviction !== undefined ? { conviction } : {}),
        ...(locked !== undefined ? { locked } : {}),
        ...(initialSize !== undefined ? { initialSize } : {}),
        ...(preNotes !== undefined ? { preNotes } : {}), // 💥 Gespeichert!
      }
    }

    const { error: updateError } = await supabase
      .from('user_settings')
      .upsert({ 
        user_id: user.id,
        active_tags: currentTags,
        active_pre_trades: currentPreTrades,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Serverfehler' }, { status: 500 })
  }
}