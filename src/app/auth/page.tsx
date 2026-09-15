'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { 
  Zap, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Check,
  X
} from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  // Standardmäßig auf 'login'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>('login')
  
  // Formular States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Feedback States
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Passwort-Stärke-Validierung
  const passwordCriteria = {
    length: password.length >= 8,
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    uppercase: /[A-Z]/.test(password),
  }
  const isPasswordValid = Object.values(passwordCriteria).filter(Boolean).length >= 3

  const switchMode = (newMode: 'login' | 'register' | 'forgot_password') => {
    setMode(newMode)
    setError(null)
    setSuccessMsg(null)
  }

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      setSuccessMsg('Anweisungen zum Zurücksetzen wurden an deine E-Mail gesendet.')
    } catch (err: any) {
      setError(err.message || 'Fehler beim Senden der E-Mail.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (mode === 'register') {
      if (!termsAccepted) {
        setError('Bitte akzeptiere die AGB und die Datenschutzerklärung.')
        return
      }
      if (!isPasswordValid) {
        setError('Bitte wähle ein sicheres Passwort, das den Kriterien entspricht.')
        return
      }
    }

    setIsLoading(true)

    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: { 
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              full_name: `${firstName.trim()} ${lastName.trim()}`.trim()
            }
          }
        })

        if (signUpError) throw signUpError

        if (data?.user && !data?.session) {
          setSuccessMsg('Account erstellt! Bitte überprüfe dein E-Mail-Postfach zur Bestätigung.')
        } else if (data?.user || data?.session) {
          setSuccessMsg('Account erfolgreich erstellt! Weiterleitung...')
          router.refresh()
          window.location.href = 'https://go.riskil.app/dashboard'
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        })

        if (signInError) throw signInError

        // Direkt prüfen, ob User da ist, und harten Redirect auf die Subdomain erzwingen
        setSuccessMsg('Erfolgreich eingeloggt! Weiterleitung...')
        router.refresh()
        window.location.href = 'https://go.riskil.app/dashboard'
      }
    } catch (err: any) {
      console.error('Auth Error Log:', err)
      const msg = err.message || ''
      if (msg.includes('Invalid login credentials')) {
        setError('E-Mail oder Passwort ist falsch.')
      } else if (msg.includes('User already registered')) {
        setError('Ein Account mit dieser E-Mail existiert bereits.')
      } else if (msg.includes('Email not confirmed')) {
        setError('Bitte bestätige zuerst deine E-Mail-Adresse.')
      } else {
        setError(msg || 'Etwas ist schiefgelaufen. Bitte überprüfe deine Daten.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-200 font-sans flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      
      {/* AMBIENT GLOW EFFECT */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#089981]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10">
        
        {/* BRANDING HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#089981]/10 text-[#089981] border border-[#089981]/20 shadow-lg shadow-[#089981]/5 mb-1">
            <Zap size={24} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {mode === 'login' && 'Willkommen zurück'}
            {mode === 'register' && 'Account erstellen'}
            {mode === 'forgot_password' && 'Passwort zurücksetzen'}
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {mode === 'login' && 'Melde dich an, um dein Portfolio und deine Live-Trades zu verwalten.'}
            {mode === 'register' && 'Starte jetzt mit automatischer PnL-Analyse & Live-Tracking.'}
            {mode === 'forgot_password' && 'Gib deine E-Mail ein. Wir senden dir einen Link zum Zurücksetzen.'}
          </p>
        </div>

        {/* CARD CONTAINER */}
        <div className="bg-[#0D111A] border border-[#1A202C] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 backdrop-blur-xl relative">
          
          {/* TAB SWITCHER (Nur bei Login / Register) */}
          {mode !== 'forgot_password' && (
            <div className="grid grid-cols-2 p-1 bg-[#07090E] border border-[#161B26] rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`py-2.5 rounded-lg transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#161B26] text-white shadow-md border border-[#222938]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Anmelden
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`py-2.5 rounded-lg transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[#161B26] text-white shadow-md border border-[#222938]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Registrieren
              </button>
            </div>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot_password' ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">E-Mail Adresse</label>
                <div className="flex items-center bg-[#07090E] border border-[#1A202C] focus-within:border-[#089981] rounded-xl px-3.5 py-2.5 transition">
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

              {error && (
                <div className="p-3 bg-[#F23645]/10 border border-[#F23645]/30 rounded-xl flex items-center gap-2 text-xs text-[#F23645]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-[#089981]/10 border border-[#089981]/30 rounded-xl flex items-center gap-2 text-xs text-[#089981]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#089981] hover:bg-[#067a67] text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-[#089981]/10 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? 'Wird gesendet...' : 'Reset-Link anfordern'}
              </button>

              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full text-center text-xs text-slate-400 hover:text-white transition pt-2 block"
              >
                Zurück zum Login
              </button>
            </form>
          ) : (
            /* MAIN FORM (LOGIN / REGISTER) */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* VORNAME & NACHNAME (NUR BEI REGISTER) */}
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Vorname *</label>
                    <div className="flex items-center bg-[#07090E] border border-[#1A202C] focus-within:border-[#089981] rounded-xl px-3 py-2.5 transition">
                      <User className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
                      <input
                        type="text"
                        required
                        placeholder="Max"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Nachname *</label>
                    <div className="flex items-center bg-[#07090E] border border-[#1A202C] focus-within:border-[#089981] rounded-xl px-3 py-2.5 transition">
                      <User className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
                      <input
                        type="text"
                        required
                        placeholder="Mustermann"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* EMAIL FELD */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">E-Mail Adresse *</label>
                <div className="flex items-center bg-[#07090E] border border-[#1A202C] focus-within:border-[#089981] rounded-xl px-3.5 py-2.5 transition">
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
                  <label className="text-xs font-semibold text-slate-300">Passwort *</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot_password')}
                      className="text-[11px] text-[#089981] hover:underline cursor-pointer"
                    >
                      Passwort vergessen?
                    </button>
                  )}
                </div>
                <div className="flex items-center bg-[#07090E] border border-[#1A202C] focus-within:border-[#089981] rounded-xl px-3.5 py-2.5 transition relative">
                  <Lock className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600 pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* PASSWORT-STÄRKE CHECKER (NUR BEI REGISTER) */}
                {mode === 'register' && password.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <div className={`flex items-center gap-1 ${passwordCriteria.length ? 'text-[#089981]' : 'text-slate-500'}`}>
                        {passwordCriteria.length ? <Check size={12} /> : <X size={12} />} Mind. 8 Zeichen
                      </div>
                      <div className={`flex items-center gap-1 ${passwordCriteria.number ? 'text-[#089981]' : 'text-slate-500'}`}>
                        {passwordCriteria.number ? <Check size={12} /> : <X size={12} />} Mind. eine Zahl
                      </div>
                      <div className={`flex items-center gap-1 ${passwordCriteria.uppercase ? 'text-[#089981]' : 'text-slate-500'}`}>
                        {passwordCriteria.uppercase ? <Check size={12} /> : <X size={12} />} Großbuchstabe
                      </div>
                      <div className={`flex items-center gap-1 ${passwordCriteria.special ? 'text-[#089981]' : 'text-slate-500'}`}>
                        {passwordCriteria.special ? <Check size={12} /> : <X size={12} />} Sonderzeichen
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* AGB CHECKBOX (NUR BEI REGISTER) */}
              {mode === 'register' && (
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded bg-[#07090E] border-[#1A202C] text-[#089981] focus:ring-[#089981] focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-[11px] text-slate-400 leading-tight cursor-pointer">
                    Ich akzeptiere die{' '}
                    <Link href="/agb" className="text-[#089981] hover:underline" target="_blank">
                      AGB
                    </Link>{' '}
                    und die{' '}
                    <Link href="/datenschutz" className="text-[#089981] hover:underline" target="_blank">
                      Datenschutzerklärung
                    </Link>
                    .
                  </label>
                </div>
              )}

              {/* ERROR DISPLAY */}
              {error && (
                <div className="p-3 bg-[#F23645]/10 border border-[#F23645]/30 rounded-xl flex items-center gap-2 text-xs text-[#F23645]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* SUCCESS DISPLAY */}
              {successMsg && (
                <div className="p-3 bg-[#089981]/10 border border-[#089981]/30 rounded-xl flex items-center gap-2 text-xs text-[#089981]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#089981] hover:bg-[#067a67] text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-[#089981]/10 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <span className="animate-pulse">Wird verarbeitet...</span>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Jetzt anmelden' : 'Account erstellen'}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ODER SOCIAL LOGIN (NUR BEI LOGIN/REGISTER) */}
          {mode !== 'forgot_password' && (
            <>
              <div className="relative flex items-center justify-center pt-1">
                <div className="border-t border-[#161B26] w-full" />
                <span className="bg-[#0D111A] px-3 text-[10px] uppercase font-bold text-slate-500 absolute">
                  Oder weiter mit
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="flex items-center justify-center gap-2 py-2.5 bg-[#07090E] hover:bg-[#11151F] border border-[#1A202C] hover:border-[#222938] rounded-xl text-xs font-semibold text-white transition cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('apple')}
                  className="flex items-center justify-center gap-2 py-2.5 bg-[#07090E] hover:bg-[#11151F] border border-[#1A202C] hover:border-[#222938] rounded-xl text-xs font-semibold text-white transition cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current text-white shrink-0" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.68-.83 1.14-1.99.98-3.17-.98.04-2.17.65-2.87 1.47-.63.73-1.18 1.91-1.03 3.06 1.1.09 2.24-.53 2.92-1.36z" />
                  </svg>
                  <span>Apple</span>
                </button>
              </div>
            </>
          )}

          {/* FOOTER INFO */}
          <div className="pt-2 border-t border-[#161B26] flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-[#089981]" />
            <span>256-bit Ende-zu-Ende verschlüsselte API-Key Speicherung</span>
          </div>

        </div>

      </div>
    </div>
  )
}