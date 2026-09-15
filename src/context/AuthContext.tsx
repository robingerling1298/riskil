'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client' // 💥 Zentralen Client importieren statt neuen zu erstellen

interface AuthContextType {
  isPro: boolean
  setIsPro: (value: boolean) => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isPro, setIsPro] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const checkUserPlan = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('subscription_plan')
            .eq('id', session.user.id)
            .single()

          if (profile && !error) {
            setIsPro(profile.subscription_plan === 'pro')
          } else {
            setIsPro(false)
          }
        } else {
          setIsPro(false)
        }
      } catch (err) {
        console.error('Fehler beim Abrufen des Aboplans:', err)
        setIsPro(false)
      } finally {
        setLoading(false)
      }
    }

    checkUserPlan()

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkUserPlan()
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ isPro, setIsPro, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth muss innerhalb eines AuthProviders verwendet werden')
  }
  return context
}