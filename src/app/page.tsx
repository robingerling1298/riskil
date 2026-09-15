'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { 
  Zap, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('register')
  
  // Formular States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Social Logins (Google & Apple) via Supabase OAuth
  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setError(null)
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || `Login mit ${provider} fehlgeschlagen.`)
      setIsLoading(false)
    }
  }

  // E-Mail / Passwort Login & Registrierung via Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Popup zum sofortigen Testen, ob der Formular-Submit auslöst
    alert("Formular abgesendet! Starte Supabase Request...")

    setError(null)
    setSuccessMsg(null)
    setIsLoading(true)

    console.log("1. Formular abgesendet. Modus:", mode)
    console.log("2. Eingaben:", { email, name, passwordLength: password.length })

    try {
      if (mode === 'register') {
        console.log("3. Sende signUp an Supabase...")
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              full_name: name 
            }
          }
        })

        console.log("4. Antwort von Supabase:", { data, signUpError })

        if (signUpError) throw signUpError

        // Wenn E-Mail-Bestätigung in Supabase aktiv ist, gibt es noch keine Session
        if (data?.user && !data?.session) {
          console.log("5. User angelegt, aber E-Mail muss bestätigt werden.")
          setSuccessMsg('Account erstellt! Bitte überprüfe dein Postfach und bestätige deine E-Mail.')
        } else if (data?.user) {
          console.log("5. User angelegt und eingeloggt. Leite weiter...")
          setSuccessMsg('Account erfolgreich erstellt! Weiterleitung...')
          setTimeout(() => router.push('/'), 1200)
        } else {
          console.warn("5. Keines der Kriterien zutreffend:", data)
        }

      } else {
        console.log("3. Sende signInWithPassword an Supabase...")
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) throw signInError

        setSuccessMsg('Erfolgreich eingeloggt! Weiterleitung...')
        setTimeout(() => router.push('/'), 1000)
      }
    } catch (err: any) {
      console.error("FEHLER aufgetreten:", err)
      if (err.message?.includes('Invalid login credentials')) {
        setError('E-Mail oder Passwort ist falsch.')
      } else if (err.message?.includes('User already registered')) {
        setError('Ein Account mit dieser E-Mail existiert bereits.')
      } else {
        setError(err.message || 'Etwas ist schiefgelaufen. Bitte überprüfe deine Eingaben.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-200 font-sans flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      
      {/* GLOW DEKORATION IM HINTERGRUND */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00E676]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10">
        
        {/* BRANDING HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20 mb-2">
            <Zap size={24} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {mode === 'login' ? 'Willkommen zurück' : 'Account erstellen'}
          </h1>
          <p className="text-xs text-slate-400">
            {mode === 'login'
              ? 'Melde dich an, um dein Portfolio und deine Live-Trades zu verwalten.'
              : 'Starte jetzt mit automatischer PnL-Analyse & Live-Tracking.'}
          </p>
        </div>

        {/* CARD CONTAINER */}
        <div className="bg-[#0B0E14] border border-[#161A23] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 relative">
          
          {/* TAB SWITCHER */}
          <div className="grid grid-cols-2 p-1 bg-[#11151F] border border-[#1A1F2C] rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#161A23] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Anmelden
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); setSuccessMsg(null); }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#161A23] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Registrieren
            </button>
          </div>

          {/* FORMULAR OBEN */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* NAME FELD (NUR BEI REGISTRIERUNG) */}
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Name</label>
                <div className="flex items-center bg-[#11151F] border border-[#1A1F2C] focus-within:border-[#00E676] rounded-xl px-3.5 py-2.5 transition">
                  <User className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="Dein Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>
            )}

            {/* EMAIL FELD */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">E-Mail Adresse</label>
              <div className="flex items-center bg-[#11151F] border border-[#1A1F2C] focus-within:border-[#00E676] rounded-xl px-3.5 py-2.5 transition">
                <Mail className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="trader@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* PASSWORT FELD */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">Passwort</label>
                {mode === 'login' && (
                  <button type="button" className="text-[10px] text-[#00E676] hover:underline">
                    Passwort vergessen?
                  </button>
                )}
              </div>
              <div className="flex items-center bg-[#11151F] border border-[#1A1F2C] focus-within:border-[#00E676] rounded-xl px-3.5 py-2.5 transition">
                <Lock className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* ERROR DISPLAY */}
            {error && (
              <div className="p-3 bg-[#F23645]/10 border border-[#F23645]/30 rounded-xl flex items-center gap-2 text-xs text-[#F23645]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* SUCCESS DISPLAY */}
            {successMsg && (
              <div className="p-3 bg-[#00E676]/10 border border-[#00E676]/30 rounded-xl flex items-center gap-2 text-xs text-[#00E676]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#00E676] hover:bg-[#00C853] text-black font-extrabold rounded-xl text-xs transition shadow-lg shadow-[#00E676]/10 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="animate-pulse">Verbindung zu Supabase...</span>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Jetzt anmelden' : 'Account erstellen'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* TRENNLINIE */}
          <div className="relative flex items-center justify-center pt-1">
            <div className="border-t border-[#161A23] w-full" />
            <span className="bg-[#0B0E14] px-3 text-[10px] uppercase font-bold text-slate-500 absolute">
              Oder weiter mit
            </span>
          </div>

          {/* SOCIAL LOGIN BUTTONS UNTEN */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center gap-2 py-2.5 bg-[#11151F] hover:bg-[#161A23] border border-[#1A1F2C] hover:border-[#222938] rounded-xl text-xs font-semibold text-white transition cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin('apple')}
              className="flex items-center justify-center gap-2 py-2.5 bg-[#11151F] hover:bg-[#161A23] border border-[#1A1F2C] hover:border-[#222938] rounded-xl text-xs font-semibold text-white transition cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current text-white shrink-0" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.68-.83 1.14-1.99.98-3.17-.98.04-2.17.65-2.87 1.47-.63.73-1.18 1.91-1.03 3.06 1.1.09 2.24-.53 2.92-1.36z" />
              </svg>
              <span>Apple</span>
            </button>
          </div>

          {/* FOOTER INFO */}
          <div className="pt-2 border-t border-[#161A23] flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-[#00E676]" />
            <span>256-bit Ende-zu-Ende verschlüsselte API-Key Speicherung</span>
          </div>

        </div>

      </div>
    </div>
  )
}