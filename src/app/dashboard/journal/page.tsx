'use client'

import { useEffect, useState } from 'react'
import { JournalDashboard } from '@/components/JournalDashboard'
import { supabase } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function DedicatedJournalPage() {
  const [trades, setTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })

        if (!error && data) {
          setTrades(data)
        }
      } catch (err) {
        console.error('Fehler beim Laden des Journals:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTrades()
  }, [])

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 text-slate-200">
      <div className="p-6 bg-[#0B0E14] border border-[#161A23] rounded-2xl">
        <h1 className="text-2xl font-black text-white">Handelsjournal</h1>
        <p className="text-xs text-slate-400 mt-1">
          Detaillierte Analyse aller geschlossenen Positionen, Setups und Psychologie-Muster.
        </p>
      </div>

      {loading ? (
        <div className="p-12 flex items-center justify-center text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-[#089981]" />
        </div>
      ) : (
        <JournalDashboard trades={trades} viewMode="journal" />
      )}
    </div>
  )
}