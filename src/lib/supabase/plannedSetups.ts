import { createClient } from '@/lib/supabase/client'
import { PlannedSetup } from './useJournalStore'

export async function createPlannedSetup(
  setup: Omit<PlannedSetup, 'id' | 'createdAt'>
): Promise<{ data: PlannedSetup | null; error: Error | null }> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: new Error('User nicht authentifiziert') }
  }

  const { data, error } = await supabase
    .from('planned_setups')
    .insert({
      user_id: user.id,
      name: setup.name || null,
      pair: setup.pair,
      direction: setup.direction,
      avg_entry_price: setup.avgEntryPrice,
      leverage: setup.leverage,
      total_margin: setup.totalMargin,
      stop_loss: setup.stopLoss || null,
      max_loss_usd: setup.maxLossUsd || null,
      crv: setup.crv || null,
      take_profits: setup.takeProfits || [],
      tranches: setup.tranches || [],
      setup_grade: setup.setupGrade || null,
      confluences: setup.confluences || [],
      invalidation_condition: setup.invalidationCondition || null,
      mindset: setup.mindset || null,
      notes: setup.notes || null,
      status: setup.status || 'PENDING',
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: new Error(error.message) }
  }

  return {
    data: {
      id: data.id,
      name: data.name || undefined,
      pair: data.pair,
      direction: data.direction,
      avgEntryPrice: Number(data.avg_entry_price),
      leverage: data.leverage,
      totalMargin: Number(data.total_margin),
      stopLoss: data.stop_loss ? Number(data.stop_loss) : undefined,
      maxLossUsd: data.max_loss_usd ? Number(data.max_loss_usd) : undefined,
      crv: data.crv,
      takeProfits: data.take_profits || [],
      tranches: data.tranches || [],
      setupGrade: data.setup_grade || undefined,
      confluences: data.confluences || [],
      invalidationCondition: data.invalidation_condition || undefined,
      mindset: data.mindset || undefined,
      notes: data.notes || undefined,
      status: data.status,
      createdAt: data.created_at,
    },
    error: null,
  }
}

export async function fetchPlannedSetups(): Promise<{
  data: PlannedSetup[];
  error: Error | null;
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('planned_setups')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return { data: [], error: new Error(error.message) }
  }

  const mapped: PlannedSetup[] = (data || []).map((row) => ({
    id: row.id,
    name: row.name || undefined,
    pair: row.pair,
    direction: row.direction,
    avgEntryPrice: Number(row.avg_entry_price),
    leverage: row.leverage,
    totalMargin: Number(row.total_margin),
    stopLoss: row.stop_loss ? Number(row.stop_loss) : undefined,
    maxLossUsd: row.max_loss_usd ? Number(row.max_loss_usd) : undefined,
    crv: row.crv,
    takeProfits: row.take_profits || [],
    tranches: row.tranches || [],
    setupGrade: row.setup_grade || undefined,
    confluences: row.confluences || [],
    invalidationCondition: row.invalidation_condition || undefined,
    mindset: row.mindset || undefined,
    notes: row.notes || undefined,
    status: row.status,
    createdAt: row.created_at,
  }))

  return { data: mapped, error: null }
}

export async function updatePlannedSetupNameDb(
  id: string,
  name: string
): Promise<{ error: Error | null }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('planned_setups')
    .update({ name: name || null })
    .eq('id', id)

  if (error) return { error: new Error(error.message) }
  return { error: null }
}

export async function updatePlannedSetupAnalysisDb(
  id: string,
  analysis: {
    setupGrade?: 'A+' | 'B' | 'C'
    confluences?: string[]
    invalidationCondition?: string
    mindset?: string
    notes?: string
  }
): Promise<{ error: Error | null }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('planned_setups')
    .update({
      setup_grade: analysis.setupGrade || null,
      confluences: analysis.confluences || [],
      invalidation_condition: analysis.invalidationCondition || null,
      mindset: analysis.mindset || null,
      notes: analysis.notes || null,
    })
    .eq('id', id)

  if (error) return { error: new Error(error.message) }
  return { error: null }
}

export async function deletePlannedSetup(
  id: string
): Promise<{ error: Error | null }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('planned_setups')
    .delete()
    .eq('id', id)

  if (error) return { error: new Error(error.message) }
  return { error: null }
}