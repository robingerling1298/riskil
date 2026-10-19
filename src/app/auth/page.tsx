'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  Loader2,
  X
} from 'lucide-react'

function AuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // 1. Stripe Checkout Success Popup State
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)

  // Prüft auf ?success=true von Stripe
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccessPopup(true)
      // URL bereinigen, damit das Popup nicht beim Neuladen wiederkommt
      router.replace('/auth', { scroll: false })
    }
  }, [searchParams, router])

  // 2. Code anfordern (Registriert User automatisch, falls neu)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    if (!termsAccepted) {
      setError('Please accept the Terms of Service and Privacy Policy.')
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

      setSuccessMsg(`Verification code sent to ${email.trim().toLowerCase()}.`)
      setStep('OTP')
    } catch (err: any) {
      console.error('OTP Send Error:', err)
      const rawMsg = err.message || ''

      if (
        rawMsg.includes('Database error saving new user') ||
        rawMsg.includes('Beta-Zugang') ||
        rawMsg.includes('beta_access_restricted')
      ) {
        setError('Access denied: This email does not hold a Founder Pass and is not yet whitelisted.')
      } else if (rawMsg.includes('rate limit')) {
        setError('Too many attempts. Please wait a moment before trying again.')
      } else {
        setError(rawMsg || 'Error sending the verification code.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 3. Code verifizieren
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!otp || otp.trim().length < 6) {
      setError('Please enter the full 6-digit code.')
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
        setSuccessMsg('Successfully verified! Redirecting...')
        router.replace('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      console.error('OTP Verify Error:', err)
      const rawMsg = err.message || ''

      if (
        rawMsg.includes('Database error') ||
        rawMsg.includes('Beta-Zugang') ||
        rawMsg.includes('beta_access_restricted')
      ) {
        setError('Access denied: This email is not yet whitelisted.')
      } else {
        setError(rawMsg || 'The entered code is invalid or has expired.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-200 font-sans flex items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-[#089981]/30">
      
      {/* STRIPE SUCCESS OVERLAY POPUP */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0B0E14] border border-[#089981]/50 rounded-2xl w-full max-w-sm p-6 text-center shadow-[0_0_40px_rgba(8,153,129,0.15)] relative">
            <button 
              onClick={() => setShowSuccessPopup(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="w-12 h-12 rounded-full bg-[#089981]/20 text-[#089981] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Payment Successful!</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Your Founder Pass is now active. Please enter the email address you used during checkout below to log in.
            </p>
            <button 
              onClick={() => setShowSuccessPopup(false)}
              className="w-full py-3 bg-[#089981] hover:bg-[#0AAE93] text-black font-extrabold text-xs rounded-xl transition cursor-pointer"
            >
              Continue to Login
            </button>
          </div>
        </div>
      )}

      {/* AMBIENT GLOW EFFECT */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#089981]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10">
        
        {/* BRANDING HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#089981]/10 text-[#089981] border border-[#089981]/20 shadow-lg shadow-[#089981]/5 mb-1">
            {step === 'EMAIL' ? <Zap size={24} /> : <KeyRound size={24} />}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {step === 'EMAIL' ? 'Sign In or Register' : 'Verify Code'}
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {step === 'EMAIL' 
              ? "Enter your email. We'll send you a secure code to sign in or register." 
              : `We have sent a verification code to ${email}.`}
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
                  <label className="font-semibold text-slate-300">Email Address *</label>
                  <span className="text-[#089981] text-[10px] font-mono bg-[#089981]/10 px-2 py-0.5 rounded-md border border-[#089981]/20">
                    Terminal Login
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
                  I accept the{' '}
                  <Link href="/agb" className="text-[#089981] hover:underline" target="_blank">
                    Terms of Service
                  </Link>{' '}
                  and the{' '}
                  <Link href="/datenschutz" className="text-[#089981] hover:underline" target="_blank">
                    Privacy Policy
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
                    <span>Continue with Email</span>
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
                <label className="text-xs font-semibold text-slate-300">Verification Code</label>
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
                    <span>Verify & Log In</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setStep('EMAIL'); setOtp(''); setError(null); setSuccessMsg(null); }}
                  className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
                >
                  ← Change email address
                </button>
              </div>
            </form>
          )}

          {/* FOOTER INFO */}
          <div className="pt-2 border-t border-[#161B26] flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-[#089981]" />
            <span>256-bit encrypted & passwordless system</span>
          </div>

        </div>

      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#07090E] flex items-center justify-center text-slate-500 font-mono text-xs">
        <Loader2 className="w-5 h-5 animate-spin text-[#089981]" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  )
}