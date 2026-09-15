'use client'

import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Key,
  Lock,
  X,
  CheckCircle2,
  AlertCircle,
  Unlink,
} from 'lucide-react'
import { EXCHANGES, ExchangeId } from '@/context/UserPreferencesContext'

interface ConnectExchangeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function ConnectExchangeModal({
  isOpen,
  onClose,
  onSuccess,
}: ConnectExchangeModalProps) {
  const [selectedExchange, setSelectedExchange] = useState<ExchangeId>('bitget')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [label, setLabel] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [connectedExchange, setConnectedExchange] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    const checkLiveStatus = async () => {
      try {
        const res = await fetch('/api/exchange/live')
        const data = await res.json()
        if (data.success) {
          setConnectedExchange(data.currency ? 'Aktiv' : 'Bitget')
        } else {
          setConnectedExchange(null)
        }
      } catch {
        setConnectedExchange(null)
      }
    }
    checkLiveStatus()
  }, [isOpen])

  if (!isOpen) return null

  const requiresPassphrase = selectedExchange === 'bitget' || selectedExchange === 'okx'

  const handleExchangeSelect = (exKey: ExchangeId) => {
    setSelectedExchange(exKey)
    setError(null)
    if (exKey !== 'bitget' && exKey !== 'okx') {
      setPassphrase('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const payload = {
        exchange: selectedExchange,
        label: label || `${EXCHANGES[selectedExchange]?.name || selectedExchange} Main`,
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        passphrase: requiresPassphrase ? passphrase.trim() : null,
      }

      const res = await fetch('/api/exchange/live', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Verbindung fehlgeschlagen')
      }

      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        onSuccess?.()
        onClose()
      }, 1000)
    } catch (err: any) {
      setError(err?.message || 'Verbindung fehlgeschlagen. Bitte Key, Secret und Passphrase prüfen.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Möchtest du die Börsenverbindung wirklich trennen? Dein Journal bleibt vollständig erhalten.')) {
      return
    }

    setIsDisconnecting(true)
    setError(null)

    try {
      const res = await fetch('/api/exchange/live', { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Trennen fehlgeschlagen.')
      }

      setConnectedExchange(null)
      setApiKey('')
      setApiSecret('')
      setPassphrase('')
      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Fehler beim Trennen.')
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-term-card border border-term-border rounded-3xl shadow-2xl overflow-hidden font-sans text-slate-200">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-term-border bg-term-bg/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand/15 text-brand rounded-2xl border border-brand/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Börse live verbinden</h3>
              <p className="text-xs text-slate-400">
                Automatische PnL- & Trade-Synchronisation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-term-bg hover:bg-term-border/50 border border-term-border rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SECURITY BANNER */}
        <div className="px-6 py-3 bg-[#089981]/10 border-b border-[#089981]/20 flex items-center gap-3 text-xs text-[#089981]">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            <strong>100% Sicher:</strong> Erstelle in deiner Börse ausschließlich einen <strong>Read-Only</strong> Key. Niemals Auszahlungs- oder Trade-Rechte aktivieren!
          </span>
        </div>

        {/* AKTIVER STATUS MIT DISCONNECT BUTTON */}
        {connectedExchange && (
          <div className="p-4 mx-6 mt-4 bg-term-bg border border-term-border rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#089981] animate-pulse" />
              <span className="text-xs font-semibold text-slate-200">
                Börsenschnittstelle aktiv synchronisiert
              </span>
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="px-3 py-1.5 bg-[#F23645]/15 hover:bg-[#F23645]/25 border border-[#F23645]/30 text-[#F23645] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>{isDisconnecting ? 'Trennt...' : 'Trennen'}</span>
            </button>
          </div>
        )}

        {/* FORM CONTENT */}
        {isSuccess ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#089981] animate-bounce" />
            <h4 className="text-lg font-bold text-white">Erfolgreich verbunden!</h4>
            <p className="text-xs text-slate-400">
              Deine Live-Trades und PnL-Daten werden jetzt synchronisiert.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* BÖRSE AUSWAHL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Börse / Exchange</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(EXCHANGES) as ExchangeId[]).map((exKey) => {
                  const ex = EXCHANGES[exKey]
                  const isSelected = selectedExchange === exKey
                  return (
                    <button
                      key={exKey}
                      type="button"
                      onClick={() => handleExchangeSelect(exKey)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        isSelected
                          ? 'bg-brand/15 border-brand text-white shadow-md'
                          : 'bg-term-bg border-term-border text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${ex.logoColor}`} />
                      <span>{ex.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* KONTO-LABEL (OPTIONAL) */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Account Name (Optional)</label>
              <input
                type="text"
                placeholder="z.B. Bitget Main oder OKX Scalping"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-term-bg border border-term-border focus:border-brand rounded-xl px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-slate-600 transition"
              />
            </div>

            {/* API KEY INPUT */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">API Key</label>
              <div className="flex items-center bg-term-bg border border-term-border focus-within:border-brand rounded-xl px-3.5 py-2.5 transition">
                <Key className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="bg_api_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>

            {/* API SECRET INPUT */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">API Secret</label>
              <div className="flex items-center bg-term-bg border border-term-border focus-within:border-brand rounded-xl px-3.5 py-2.5 transition">
                <Lock className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••••••••••••••"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>

            {/* PASSPHRASE INPUT */}
            {requiresPassphrase && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-slate-400">API Passphrase</label>
                  <span className="text-[10px] text-amber-400 font-medium">Erforderlich für {selectedExchange.toUpperCase()}</span>
                </div>
                <div className="flex items-center bg-term-bg border border-term-border focus-within:border-brand rounded-xl px-3.5 py-2.5 transition">
                  <Lock className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                  <input
                    type="password"
                    required={requiresPassphrase}
                    placeholder="Passphrase deiner Key-Erstellung"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600 font-mono"
                  />
                </div>
              </div>
            )}

            {/* ERROR DISPLAY */}
            {error && (
              <div className="p-3 bg-[#F23645]/10 border border-[#F23645]/30 rounded-xl flex items-center gap-2 text-xs text-[#F23645]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-brand text-black font-extrabold rounded-xl text-xs hover:brightness-110 transition shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="animate-pulse">Verbindung wird geprüft...</span>
                ) : (
                  <span>Börse jetzt verbinden</span>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}