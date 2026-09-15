import { createClient } from '@supabase/supabase-js'

// Entwicklungs-Bypass: Auf Localhost standardmäßig immer PRO
const IS_DEV = process.env.NODE_ENV === 'development'

export type UserRole = 'free' | 'pro' | 'admin'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  isPro: boolean
}

// Platzhalter-Hook/Funktion für den Rollen-Check
export function getDevUserStatus(): { role: UserRole; isPro: boolean } {
  // Wenn FORCE_FREE gesetzt ist (zum Testen), dann Free, sonst in DEV immer Pro
  const forceFree = typeof window !== 'undefined' && localStorage.getItem('DEV_FORCE_FREE') === 'true'
  
  if (forceFree) {
    return { role: 'free', isPro: false }
  }

  return { role: 'pro', isPro: true }
}
