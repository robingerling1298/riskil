import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_TAGS = {
  setup_classes: ['Setup A: Perfekt', 'Setup B: Suboptimal', 'Setup C: Impulsiv / FOMO'],
  mental_states: ['Fokus', 'FOMO', 'Müde', 'Frustriert (Revenge)', 'Gelangweilt', 'Überzeugt'],
  confluences: ['Orderblock', 'Fibonacci', 'Imbalance', 'CVD-Divergenz', 'Liq-Cluster', 'Trendlinienbruch', 'Support/Resistance'],
  error_tags: ['SL verschoben', 'Zu früh geschlossen', 'Gewinn zu früh mitgenommen', 'Hebel erhöht', 'Invalidation ignoriert']
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ tags: DEFAULT_TAGS }, { status: 200 })
    }

    const { data: settings } = await supabase
      .from('user_settings')
      .select('custom_tags')
      .eq('user_id', user.id)
      .maybeSingle()

    const userTags = settings?.custom_tags || DEFAULT_TAGS
    return NextResponse.json({ tags: userTags }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Serverfehler' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { tags } = await req.json()

    if (!tags) {
      return NextResponse.json({ error: 'Tags fehlen' }, { status: 400 })
    }

    const { error: upsertError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        custom_tags: tags,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (upsertError) throw upsertError

    return NextResponse.json({ success: true, tags })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Serverfehler' }, { status: 500 })
  }
}