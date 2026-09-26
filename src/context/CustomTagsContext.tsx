'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

export interface TagCategoryMap {
  setup_classes: string[]
  mental_states: string[]
  confluences: string[]
  error_tags: string[]
}

export const DEFAULT_TAG_CONFIG: TagCategoryMap = {
  setup_classes: ['Setup A: Perfekt', 'Setup B: Suboptimal', 'Setup C: Impulsiv / FOMO'],
  mental_states: ['Fokus', 'FOMO', 'Müde', 'Frustriert (Revenge)', 'Gelangweilt', 'Überzeugt'],
  confluences: ['Orderblock', 'Fibonacci', 'Imbalance', 'CVD-Divergenz', 'Liq-Cluster', 'Trendlinienbruch', 'Support/Resistance'],
  error_tags: ['SL verschoben', 'Zu früh geschlossen', 'Gewinn zu früh mitgenommen', 'Hebel erhöht', 'Invalidation ignoriert']
}

const STORAGE_KEY = 'riskil_custom_tags'

interface CustomTagsContextType {
  customTags: TagCategoryMap
  isLoading: boolean
  updateTags: (newTags: TagCategoryMap) => Promise<boolean>
  resetToDefaults: () => Promise<boolean>
}

const CustomTagsContext = createContext<CustomTagsContextType>({
  customTags: DEFAULT_TAG_CONFIG,
  isLoading: true,
  updateTags: async () => false,
  resetToDefaults: async () => false,
})

export function CustomTagsProvider({ children }: { children: React.ReactNode }) {
  const [customTags, setCustomTags] = useState<TagCategoryMap>(DEFAULT_TAG_CONFIG)
  const [isLoading, setIsLoading] = useState(true)

  // 1. Initialer Sync: Erst blitzschnell aus localStorage, dann frisch von Supabase
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.setup_classes) {
          setCustomTags(parsed)
        }
      }
    } catch {}

    async function fetchFromApi() {
      try {
        const res = await fetch('/api/user/tags')
        if (res.ok) {
          const json = await res.json()
          if (json?.tags?.setup_classes) {
            setCustomTags(json.tags)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(json.tags))
          }
        }
      } catch (err) {
        console.error('Fehler beim Laden der globalen Tags:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFromApi()
  }, [])

  // 2. Tags aktualisieren & persistieren
  const updateTags = useCallback(async (newTags: TagCategoryMap): Promise<boolean> => {
    // Sofort lokales UI & Cache updaten
    setCustomTags(newTags)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTags))
    } catch {}

    try {
      const res = await fetch('/api/user/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      })
      return res.ok
    } catch (err) {
      console.error('Fehler beim Speichern der Tags in Supabase:', err)
      return false
    }
  }, [])

  // 3. Auf Werkseinstellungen zurücksetzen
  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    setCustomTags(DEFAULT_TAG_CONFIG)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TAG_CONFIG))
    } catch {}

    try {
      const res = await fetch('/api/user/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: DEFAULT_TAG_CONFIG }),
      })
      return res.ok
    } catch (err) {
      console.error('Fehler beim Zurücksetzen der Tags in Supabase:', err)
      return false
    }
  }, [])

  return (
    <CustomTagsContext.Provider value={{ customTags, isLoading, updateTags, resetToDefaults }}>
      {children}
    </CustomTagsContext.Provider>
  )
}

export function useGlobalTags() {
  return useContext(CustomTagsContext)
}