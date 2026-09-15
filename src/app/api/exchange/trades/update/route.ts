import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      tradeId, 
      entry_tags, 
      exit_tags, 
      mood, 
      notes, 
      entry_notes, // 💥 NEU: Pre-Trade Notiz
      stress_level, 
      trade_rating, 
      plan_treue, 
      is_transferred,
      energy_level,
      conviction 
    } = body

    if (!tradeId) {
      return NextResponse.json({ error: 'tradeId fehlt' }, { status: 400 })
    }

    const updateData: Record<string, any> = {}
    if (entry_tags !== undefined) updateData.entry_tags = entry_tags
    if (exit_tags !== undefined) updateData.exit_tags = exit_tags
    if (mood !== undefined) updateData.mood = mood
    if (notes !== undefined) updateData.notes = notes
    if (entry_notes !== undefined) updateData.entry_notes = entry_notes // 💥 NEU
    if (stress_level !== undefined) updateData.stress_level = stress_level
    if (trade_rating !== undefined) updateData.trade_rating = trade_rating
    if (plan_treue !== undefined) updateData.plan_treue = plan_treue
    if (is_transferred !== undefined) updateData.is_transferred = is_transferred
    if (energy_level !== undefined) updateData.energy_level = energy_level
    if (conviction !== undefined) updateData.conviction = conviction

    const { error: updateError } = await supabase
      .from('trades')
      .update(updateData)
      .eq('id', tradeId)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Serverfehler' }, { status: 500 })
  }
}