import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LoggedTrade {
  id: string
  pair: string
  direction: 'LONG' | 'SHORT'
  entryPrice: number
  leverage: number
  margin: number
  stopLoss?: number
  takeProfits?: number[]
  confluences: string[]
  mindset: string
  note?: string
  chartUrl?: string
  status: 'ACTIVE' | 'CLOSED'
  pnl?: number
  createdAt: string
}

export interface PlannedSetup {
  id: string
  name?: string
  pair: string
  direction: 'LONG' | 'SHORT'
  avgEntryPrice: number
  leverage: number
  totalMargin: number
  stopLoss?: number
  maxLossUsd?: number
  crv?: string | null
  takeProfits: Array<{ targetPrice: number; roePercent: number; closePercent: number }>
  tranches: Array<{ price: number; margin: number; orderType: 'LIMIT' | 'MARKET' }>
  setupGrade?: 'A+' | 'B' | 'C'
  confluences?: string[]
  invalidationCondition?: string
  mindset?: string
  notes?: string
  status: 'PENDING' | 'ACTIVE' | 'CANCELLED'
  createdAt: string
}

type NewTradeInput = Omit<LoggedTrade, 'id'>
type NewPlannedSetupInput = Omit<PlannedSetup, 'id' | 'createdAt'>

interface JournalState {
  trades: LoggedTrade[]
  plannedSetups: PlannedSetup[]
  addTrade: (trade: NewTradeInput) => void
  removeTrade: (id: string) => void
  closeTrade: (id: string, pnl: number) => void
  clearJournal: () => void
  addPlannedSetup: (setup: NewPlannedSetupInput) => void
  removePlannedSetup: (id: string) => void
  updatePlannedSetupStatus: (id: string, status: PlannedSetup['status']) => void
  updatePlannedSetupName: (id: string, name: string) => void
  updatePlannedSetupAnalysis: (
    id: string,
    analysis: {
      setupGrade?: 'A+' | 'B' | 'C'
      confluences?: string[]
      invalidationCondition?: string
      mindset?: string
      notes?: string
    }
  ) => void
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set) => ({
      trades: [],
      plannedSetups: [],

      addTrade: (trade) =>
        set((state) => ({
          trades: [
            {
              ...trade,
              id: typeof crypto !== 'undefined' && crypto.randomUUID 
                ? crypto.randomUUID() 
                : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            },
            ...state.trades,
          ],
        })),

      removeTrade: (id) =>
        set((state) => ({
          trades: state.trades.filter((t) => t.id !== id),
        })),

      closeTrade: (id, pnl) =>
        set((state) => ({
          trades: state.trades.map((t) =>
            t.id === id ? { ...t, status: 'CLOSED', pnl } : t
          ),
        })),

      clearJournal: () => set({ trades: [] }),

      addPlannedSetup: (setup) =>
        set((state) => ({
          plannedSetups: [
            {
              ...setup,
              id: typeof crypto !== 'undefined' && crypto.randomUUID 
                ? crypto.randomUUID() 
                : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              createdAt: new Date().toISOString(),
            },
            ...(state.plannedSetups || []),
          ],
        })),

      removePlannedSetup: (id) =>
        set((state) => ({
          plannedSetups: (state.plannedSetups || []).filter((s) => s.id !== id),
        })),

      updatePlannedSetupStatus: (id, status) =>
        set((state) => ({
          plannedSetups: (state.plannedSetups || []).map((s) =>
            s.id === id ? { ...s, status } : s
          ),
        })),

      updatePlannedSetupName: (id, name) =>
        set((state) => ({
          plannedSetups: (state.plannedSetups || []).map((s) =>
            s.id === id ? { ...s, name } : s
          ),
        })),

      updatePlannedSetupAnalysis: (id, analysis) =>
        set((state) => ({
          plannedSetups: (state.plannedSetups || []).map((s) =>
            s.id === id ? { ...s, ...analysis } : s
          ),
        })),
    }),
    {
      name: 'crypto-journal-storage',
    }
  )
)