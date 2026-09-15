'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    console.log(`1. Formular abgesendet. Modus: ${isSignUp ? 'signup' : 'login'}`)
    console.log('2. Eingaben:', { email, passwordLength: password.length })

    if (isSignUp) {
      console.log('3. Sende signUp an Supabase...')
      try {
        const { data, error } = await supabase.auth.signUp({ email, password })
        console.log('4. Supabase SignUp Antwort erhalten:', { data, error })
        if (error) {
          setMessage(error.message)
        } else {
          setMessage('Bestätigungs-E-Mail wurde gesendet!')
        }
      } catch (err) {
        console.error('Unerwarteter SignUp-Fehler:', err)
        setMessage('Ein unerwarteter Fehler ist aufgetreten.')
      }
    } else {
      console.log('3. Sende signInWithPassword an Supabase...')
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        console.log('4. Supabase SignIn Antwort erhalten:', { data, error })

        if (error) {
          setMessage(error.message)
        } else {
          console.log('5. Login erfolgreich, leite weiter...')
          setMessage('Erfolgreich eingeloggt! Weiterleitung...')
          router.refresh()
          window.location.href = 'https://go.riskil.app/dashboard'
        }
      } catch (err) {
        console.error('Unerwarteter SignIn-Fehler:', err)
        setMessage('Ein unerwarteter Fehler ist aufgetreten.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isSignUp ? 'Konto erstellen' : 'Anmelden'}
        </h1>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 font-semibold rounded-lg transition"
          >
            {isSignUp ? 'Registrieren' : 'Einloggen'}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-center text-amber-400">{message}</p>}

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-4 text-sm text-gray-400 hover:underline text-center block"
        >
          {isSignUp ? 'Bereits ein Konto? Hier einloggen' : 'Noch kein Konto? Registrieren'}
        </button>
      </div>
    </div>
  )
}