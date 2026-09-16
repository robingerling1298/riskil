'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { 
  Zap, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // 1. Code anfordern (Registriert User automatisch, falls neu)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!email || !email.includes('@')) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein.')
      return
    }

    if (!termsAccepted) {
      setError('Bitte akzeptiere die AGB und die Datenschutzerklärung.')
      return
    }

    setIsLoading(true)

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
        },
      })

      if (otpError) throw otpError

      setSuccessMsg(`Bestätigungscode wurde an ${email.trim().toLowerCase()} gesendet.`)
      setStep('OTP')
    } catch (err: any) {
      console.error('OTP Send Error:', err)
      setError(err.message || 'Fehler beim Senden des Bestätigungscodes.')
    } finally {
      setIsLoading(false)
    }
  }

  // 2. Code verifizieren
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!otp || otp.trim().length < 6) {
      setError('Bitte gib den vollständigen Code ein.')
      return
    }

    setIsLoading(true)

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp.trim(),
        type: 'email',
      })

      if (verifyError) throw verifyError

      if (data?.session) {
        setSuccessMsg('Erfolgreich verifiziert! Weiterleitung...')
        router.replace('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      console.error('OTP Verify Error:', err)
      setError(err.message || 'Der eingegebene Code ist ungültig oder abgelaufen.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-200 font-sans flex items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-[#089981]/30">
      
      {/* AMBIENT GLOW EFFECT */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#089981]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10">
        
        {/* BRANDING HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#089981]/10 text-[#089981] border border-[#089981]/20 shadow-lg shadow-[#089981]/5 mb-1">
            {step === 'EMAIL' ? <Zap size={24} /> : <KeyRound size={24} />}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {step === 'EMAIL' ? 'Anmelden oder Registrieren' : 'Code bestätigen'}
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {step === 'EMAIL' 
              ? 'Gib deine E-Mail ein. Wir schicken dir einen Code zur Anmeldung oder Registrierung.' 
              : `Wir haben einen Bestätigungscode an ${email} gesendet.`}
          </p>
        </div>

        {/* CARD CONTAINER */}
        <div className="bg-[#0D111A] border border-[#1A202C] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 backdrop-blur-xl relative">
          
          {/* FEEDBACK MELDUNGEN */}
          {error && (
            <div className="p-3 bg-[#F23645]/10 border border-[#F23645]/30 rounded-xl flex items-center gap-2 text-xs text-[#F23645] animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-[#089981]/10 border border-[#089981]/30 rounded-xl flex items-center gap-2 text-xs text-[#089981] animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SCHRITT 1: E-MAIL EINGABE */}
          {step === 'EMAIL' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs pb-0.5">
                  <label className="font-semibold text-slate-300">E-Mail Adresse *</label>
                  <span className="text-[#089981] text-[10px] font-mono bg-[#089981]/10 px-2 py-0.5 rounded-md border border-[#089981]/20">
                    Login & Registrierung
                  </span>
                </div>
                <div className="flex items-center bg-[#07090E] border border-[#1A202C] focus-within:border-[#089981] rounded-xl px-3.5 py-2.5 transition">
                  <Mail className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                  <input
                    type="email"
                    required
                    placeholder="trader@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600 font-mono"
                  />
                </div>
              </div>

              {/* AGB CHECKBOX */}
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#089981] hover:bg-[#067a67] text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-[#089981]/15 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Weiter mit E-Mail</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* SCHRITT 2: OTP VERIFIZIERUNG */}
          {step === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Bestätigungscode</label>
                <input
                  type="text"
                  maxLength={8}
                  autoFocus
                  required
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#07090E] border border-[#1A202C] focus:border-[#089981] rounded-xl px-4 py-3 text-center tracking-[0.3em] text-xl font-mono font-black text-white outline-none transition placeholder:text-slate-700"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#089981] hover:bg-[#067a67] text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-[#089981]/15 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Bestätigen & Einloggen</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setStep('EMAIL'); setOtp(''); setError(null); setSuccessMsg(null); }}
                  className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
                >
                  ← E-Mail-Adresse ändern
                </button>
              </div>
            </form>
          )}

          {/* FOOTER INFO */}
          <div className="pt-2 border-t border-[#161B26] flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-[#089981]" />
            <span>256-bit verschlüsseltes & passwortloses System</span>
          </div>

        </div>

      </div>
    </div>
  )
}