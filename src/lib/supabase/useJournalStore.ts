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

type NewTradeInput = Omit<LoggedTrade, 'id'>

interface JournalState {
  trades: LoggedTrade[]
  addTrade: (trade: NewTradeInput) => void
  removeTrade: (id: string) => void
  closeTrade: (id: string, pnl: number) => void
  clearJournal: () => void
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set) => ({
      trades: [],

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
    }),
    {
      name: 'crypto-journal-storage',
    }
  )
)