'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useGlobalTags } from '@/context/CustomTagsContext'
import TagManagerModal from '@/components/TagManagerModal'
import { 
  User, 
  Mail, 
  Key, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Lock,
  X,
  Camera,
  Trash2,
  ShieldAlert,
  Loader2,
  Activity,
  Send,
  CreditCard,
  RefreshCw,
  Unlink,
  Tag,
  Plus,
  RotateCcw,
  Flame
} from 'lucide-react'

// Legendäre, direkt generierte Pixel- & Degen-Avatare im einheitlichen Stil
const LEGENDARY_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=DegenBot1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=LiquidationKing',
  'https://api.dicebear.com/7.x/bottts/svg?seed=GoblinMode',
  'https://api.dicebear.com/7.x/bottts/svg?seed=FomoDemon',
  'https://api.dicebear.com/7.x/bottts/svg?seed=CryptoApe',
  'https://api.dicebear.com/7.x/bottts/svg?seed=RageQuit',
  'https://api.dicebear.com/7.x/bottts/svg?seed=MoonBoi',
  'https://api.dicebear.com/7.x/bottts/svg?seed=PaperHands',
  'https://api.dicebear.com/7.x/bottts/svg?seed=DiamondChad',
  'https://api.dicebear.com/7.x/bottts/svg?seed=BearMarket',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Leverage100x',
  'https://api.dicebear.com/7.x/bottts/svg?seed=WhaleWatcher'
]

const EXCHANGES = [
  { 
    id: 'bitget', 
    name: 'Bitget', 
    color: '#00F0FF', 
    bg: 'rgba(0, 240, 255, 0.08)',
    logo: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 500 500">
        <path d="M224.4,179.5h124.5L476.2,306c8.3,8.2,8.3,21.6,0.1,29.9L313,500H184.8l38.8-37.7l142.3-141.4L225.4,179.4"/>
        <path d="M275.6,320.5H151.1L23.8,194c-8.3-8.2-8.3-21.6-0.1-29.9c0,0,0,0,0,0L187,0h128.2l-38.8,37.7L134.1,179.1l140.5,141.4"/>
      </svg>
    ) 
  },
  { 
    id: 'okx', 
    name: 'OKX', 
    color: '#FFFFFF', 
    bg: 'rgba(255, 255, 255, 0.08)',
    logo: (
      <svg className="w-10 h-4 fill-current" viewBox="0 0 157.4 44.2">
        <g transform="translate(-62.058587,-90.445746)">
          <g transform="matrix(0.39972707,0,0,0.34817986,61.931647,90.445746)">
            <path d="M 115.822,0 H 2.94268 C 2.24645,0 1.57875,0.297103 1.08644,0.825953 0.594137,1.3548 0.317566,2.07208 0.317566,2.81999 V 124.079 c 0,0.748 0.276571,1.466 0.768874,1.995 0.49231,0.528 1.16001,0.825 1.85624,0.825 H 115.822 c 0.697,0 1.364,-0.297 1.857,-0.825 0.492,-0.529 0.769,-1.247 0.769,-1.995 V 2.81999 c 0,-0.74791 -0.277,-1.46519 -0.769,-1.994037 C 117.186,0.297103 116.519,0 115.822,0 Z" />
          </g>
        </g>
      </svg>
    ) 
  },
  { 
    id: 'bybit', 
    name: 'Bybit', 
    color: '#F7A600', 
    bg: 'rgba(247, 166, 0, 0.08)',
    logo: (
      <svg className="w-10 h-4" viewBox="0 0 87 34" fill="none">
        <path d="M62.0083 25.3572V3H66.5022V25.3572H62.0083Z" fill="#F7A600"/>
      </svg>
    ) 
  },
  { 
    id: 'binance', 
    name: 'Binance', 
    color: '#F0B90B', 
    bg: 'rgba(240, 185, 11, 0.08)',
    logo: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 50 50">
        <path d="M11.3,25l-5.6,5.6L0,25l5.7-5.7L11.3,25z"/>
      </svg>
    ) 
  }
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'exchanges' | 'security' | 'tags'>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Global Tags Context
  const { customTags, updateTags, resetToDefaults } = useGlobalTags()
  const [tagCategoryTab, setTagCategoryTab] = useState<'confluences' | 'setup_classes' | 'mental_states' | 'error_tags'>('confluences')
  const [newTagInput, setNewTagInput] = useState('')
  const [localTagsState, setLocalTagsState] = useState(customTags)

  useEffect(() => {
    setLocalTagsState(customTags)
  }, [customTags])

  // Modals & States
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [testingApi, setTestingApi] = useState(false)
  const [apiStatus, setApiStatus] = useState<{ connected: boolean; latency?: number; message?: string } | null>(null)

  // Status & Feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Auth User
  const [user, setUser] = useState<any>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Börsen & Keys
  const [selectedExchange, setSelectedExchange] = useState('bitget')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [passphrase, setPassphrase] = useState('')

  // Telegram / Notifications
  const [telegramChatId, setTelegramChatId] = useState('')
  const [notifyOnFill, setNotifyOnFill] = useState(true)

  // Security Form
  const [newEmail, setNewEmail] = useState('')
  const [updatingEmail, setUpdatingEmail] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)

  const requiresPassphrase = selectedExchange === 'bitget' || selectedExchange === 'okx'

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser(user)
          setFirstName(user.user_metadata?.first_name || '')
          setLastName(user.user_metadata?.last_name || '')
          setNewEmail(user.email || '')

          const savedAvatar = user.user_metadata?.avatar_url
          if (savedAvatar) {
            setAvatarUrl(savedAvatar)
          } else {
            setAvatarUrl(LEGENDARY_AVATARS[0])
          }

          const { data: settings } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()

          if (settings) {
            setSelectedExchange(settings.selected_exchange || 'bitget')
            setApiKey(settings.api_key || '')
            setApiSecret(settings.api_secret || '')
            setPassphrase(settings.passphrase || '')
            setTelegramChatId(settings.telegram_chat_id || '')
            setNotifyOnFill(settings.notify_on_fill ?? true)

            if (settings.api_key && settings.api_secret) {
              setApiStatus({ connected: true, message: 'API-Schlüssel konfiguriert.' })
            }
          }
        }
      } catch (err: any) {
        console.error('Fehler beim Laden des Profils:', err)
      } finally {
        setLoading(false)
        setHasUnsavedChanges(false)
      }
    }
    loadUserData()
  }, [])

  const markDirty = () => setHasUnsavedChanges(true)

  // API Health Check
  const handleTestApi = async () => {
    if (!apiKey || !apiSecret || (requiresPassphrase && !passphrase)) {
      setApiStatus({ connected: false, message: 'Bitte gib API Key, Secret und Passphrase ein.' })
      return
    }
    setTestingApi(true)
    setApiStatus(null)

    try {
      const res = await fetch('/api/exchange/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchange: selectedExchange,
          apiKey: apiKey.trim(),
          apiSecret: apiSecret.trim(),
          passphrase: requiresPassphrase ? passphrase.trim() : null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verbindung fehlgeschlagen')

      setApiStatus({ connected: true, latency: 42, message: 'Verbindung zu ' + selectedExchange.toUpperCase() + ' erfolgreich!' })
    } catch (err: any) {
      setApiStatus({ connected: false, message: err.message || 'Verbindung fehlgeschlagen' })
    } finally {
      setTestingApi(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm(`Möchtest du die Verbindung zu ${selectedExchange.toUpperCase()} wirklich trennen? Dein Journal bleibt vollständig erhalten.`)) {
      return
    }

    setDisconnecting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/exchange/live', { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Trennen fehlgeschlagen.')
      }

      setApiKey('')
      setApiSecret('')
      setPassphrase('')
      setApiStatus(null)
      setHasUnsavedChanges(false)
      setSuccessMsg('Börsenverbindung erfolgreich getrennt. Gespeicherte Trades im Journal bleiben erhalten.')
    } catch (err: any) {
      setError(err.message || 'Fehler beim Trennen der Börse.')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    setSuccessMsg(null)
    setError(null)

    try {
      if (!user) throw new Error('Kein angemeldeter Benutzer gefunden.')

      const { data: updatedAuth, error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          avatar_url: avatarUrl
        }
      })

      if (updateError) throw updateError
      if (updatedAuth.user) setUser(updatedAuth.user)

      const payload: Record<string, any> = {
        user_id: user.id,
        selected_exchange: selectedExchange,
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
        passphrase: requiresPassphrase ? passphrase.trim() : null,
        telegram_chat_id: telegramChatId.trim(),
        notify_on_fill: notifyOnFill,
        updated_at: new Date().toISOString()
      }

      const { error: dbError } = await supabase
        .from('user_settings')
        .upsert(payload, { onConflict: 'user_id' })

      if (dbError) throw dbError

      setSuccessMsg('Alle Einstellungen wurden erfolgreich gespeichert.')
      setHasUnsavedChanges(false)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern der Einstellungen.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail || newEmail === user?.email) return
    setUpdatingEmail(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
      if (error) throw error
      setSuccessMsg('Bestätigungs-E-Mail gesendet! Bitte überprüfe dein Postfach.')
    } catch (err: any) {
      setError(err.message || 'Fehler beim Aktualisieren der E-Mail.')
    } finally {
      setUpdatingEmail(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) return
    if (newPassword.length < 6) return setError('Das Passwort muss mindestens 6 Zeichen lang sein.')
    if (newPassword !== confirmPassword) return setError('Passwörter stimmen nicht überein.')

    setUpdatingPassword(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setSuccessMsg('Passwort erfolgreich geändert!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.message || 'Fehler beim Ändern des Passworts.')
    } finally {
      setUpdatingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'LÖSCHEN') return
    setDeletingAccount(true)
    try {
      await supabase.from('user_settings').delete().eq('user_id', user.id)
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (err: any) {
      setError(err.message || 'Fehler beim Löschen des Kontos.')
      setDeletingAccount(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090E] text-slate-200 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#00E676] animate-spin" />
      </div>
    )
  }

  const isConnected = Boolean(apiKey && apiSecret && (!requiresPassphrase || passphrase) && apiStatus?.connected)

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-200 p-4 sm:p-8 font-sans pb-32">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#0D111A] via-[#101725] to-[#0D111A] border border-[#1A202C] rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#00E676]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-5 z-10">
            <button
              onClick={() => setIsAvatarModalOpen(true)}
              className="relative group cursor-pointer focus:outline-none"
              title="Avatar ändern"
            >
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="w-16 h-16 rounded-2xl bg-[#07090E] border-2 border-[#00E676]/40 p-1 object-cover shadow-lg group-hover:border-[#00E676] group-hover:scale-105 transition-all"
              />
              <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={18} className="text-[#00E676]" />
              </div>
            </button>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-white tracking-tight">
                  {firstName || 'Trader'} {lastName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] text-[10px] font-extrabold tracking-wide uppercase">
                  <Sparkles size={10} /> PRO Terminal
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                <Mail size={12} className="text-slate-500" /> {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 z-10 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-[#1A202C] pt-4 md:pt-0">
            <div className="text-left md:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Mitgliedschaft</span>
              <p className="text-xs font-bold text-white flex items-center gap-1">
                Pro Plan (Aktiv)
              </p>
            </div>
            <button className="px-3.5 py-2 bg-[#1A202C] hover:bg-[#252D3C] border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
              <CreditCard size={14} />
              <span>Abo verwalten</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK MESSAGES */}
        {error && (
          <div className="p-4 bg-[#F23645]/10 border border-[#F23645]/30 rounded-2xl flex items-center gap-3 text-xs text-[#F23645]">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-[#00E676]/10 border border-[#00E676]/30 rounded-2xl flex items-center gap-3 text-xs text-[#00E676]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-1 border-b border-[#1A202C] overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[#00E676] text-[#00E676] bg-[#00E676]/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <User size={15} /> Allgemein & Profil
          </button>

          <button
            onClick={() => setActiveTab('exchanges')}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'exchanges'
                ? 'border-[#00E676] text-[#00E676] bg-[#00E676]/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Key size={15} /> Börsen & APIs
            {isConnected && <span className="w-2 h-2 rounded-full bg-[#00E676]" />}
          </button>

          <button
            onClick={() => setActiveTab('tags')}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'tags'
                ? 'border-[#00E676] text-[#00E676] bg-[#00E676]/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Tag size={15} /> Trading Tags & Setups
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'border-[#00E676] text-[#00E676] bg-[#00E676]/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Lock size={15} /> Sicherheit & Konto
          </button>
        </div>

        {/* TAB 1: PROFIL */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-[#0D111A] border border-[#1A202C] rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <User size={16} className="text-[#00E676]" /> Profil-Informationen
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verwalte deine Namensanzeige für das Terminal.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Vorname</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); markDirty(); }}
                    className="w-full bg-[#07090E] border border-[#1A202C] focus:border-[#00E676] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Nachname</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); markDirty(); }}
                    className="w-full bg-[#07090E] border border-[#1A202C] focus:border-[#00E676] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#0D111A] border border-[#1A202C] rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Send size={16} className="text-[#00E676]" /> Telegram Notifications & Alarme
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Erhalte sofortige Signale, Preisalarme und Order-Fills direkt auf dein Smartphone.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Telegram Chat ID</label>
                  <input
                    type="text"
                    placeholder="z.B. 123456789"
                    value={telegramChatId}
                    onChange={(e) => { setTelegramChatId(e.target.value); markDirty(); }}
                    className="w-full bg-[#07090E] border border-[#1A202C] focus:border-[#00E676] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-mono placeholder:text-slate-600 transition"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#07090E] border border-[#1A202C] rounded-xl self-end">
                  <span className="text-xs font-semibold text-slate-300">Order-Fill Benachrichtigungen</span>
                  <button
                    type="button"
                    onClick={() => { setNotifyOnFill(!notifyOnFill); markDirty(); }}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      notifyOnFill ? 'bg-[#00E676]' : 'bg-[#1A202C]'
                    }`}
                  >
                    <span className={`block w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                      notifyOnFill ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BÖRSEN */}
        {activeTab === 'exchanges' && (
          <div className="space-y-6">
            <div className="bg-[#0D111A] border border-[#1A202C] rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Key size={16} className="text-[#00E676]" /> Börsen-Anbindung
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Wähle deine bevorzugte Börse und hinterlege deine API-Keys.
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 flex items-center gap-1 bg-[#07090E] px-3 py-1.5 rounded-xl border border-[#1A202C]">
                  <Lock size={12} className="text-[#00E676]" /> AES-256 Verschlüsselt
                </span>
              </div>

              {/* BÖRSEN GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {EXCHANGES.map((exc) => {
                  const isSelected = selectedExchange === exc.id
                  const isFullyConnected = isSelected && isConnected

                  return (
                    <button
                      key={exc.id}
                      type="button"
                      onClick={() => { 
                        setSelectedExchange(exc.id); 
                        if (exc.id !== 'bitget' && exc.id !== 'okx') {
                          setPassphrase('');
                        }
                        markDirty(); 
                      }}
                      style={{
                        borderColor: isSelected ? exc.color : '#1A202C',
                        backgroundColor: isSelected ? exc.bg : '#07090E'
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 cursor-pointer relative ${
                        isSelected ? 'shadow-lg shadow-black/40' : 'hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-black" style={{ color: isSelected ? exc.color : '#FFFFFF' }}>
                          {exc.name}
                        </span>
                        <div style={{ color: isSelected ? exc.color : '#64748B' }}>
                          {exc.logo}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isSelected ? (
                          <>
                            <span className={`w-2 h-2 rounded-full ${
                              isFullyConnected 
                                ? 'bg-[#00E676] animate-pulse' 
                                : 'bg-[#FF9800]'
                            }`} />
                            <span className={`text-[10px] font-mono font-bold ${
                              isFullyConnected ? 'text-[#00E676]' : 'text-[#FF9800]'
                            }`}>
                              {isFullyConnected ? 'Verbunden' : 'Jetzt verbinden'}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full border border-slate-500 shrink-0" />
                            <span className="text-[10px] font-mono text-slate-400">
                              Auswählen
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* API INPUTS */}
              <div className={`grid grid-cols-1 gap-4 pt-2 ${requiresPassphrase ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {EXCHANGES.find(e => e.id === selectedExchange)?.name} API Key
                  </label>
                  <input
                    type="text"
                    placeholder="API Key eingeben"
                    value={apiKey}
                    onChange={(e) => { setApiKey(e.target.value); markDirty(); }}
                    className="w-full bg-[#07090E] border border-[#1A202C] focus:border-[#00E676] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none placeholder:text-slate-600 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">API Secret</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={apiSecret}
                    onChange={(e) => { setApiSecret(e.target.value); markDirty(); }}
                    className="w-full bg-[#07090E] border border-[#1A202C] focus:border-[#00E676] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none placeholder:text-slate-600 transition"
                  />
                </div>

                {requiresPassphrase && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-300">API Passphrase</label>
                      <span className="text-[10px] text-amber-400 font-medium">Erforderlich</span>
                    </div>
                    <input
                      type="password"
                      placeholder="Passphrase eingeben"
                      value={passphrase}
                      onChange={(e) => { setPassphrase(e.target.value); markDirty(); }}
                      className="w-full bg-[#07090E] border border-[#1A202C] focus:border-[#00E676] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none placeholder:text-slate-600 transition"
                    />
                  </div>
                )}
              </div>

              {/* API STATUS & DISCONNECT / HEALTH CHECK */}
              <div className="p-4 bg-[#07090E] rounded-xl border border-[#1A202C] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Activity className={`w-5 h-5 ${isConnected ? 'text-[#00E676]' : 'text-[#FF9800]'}`} />
                  <div>
                    <p className="text-xs font-bold text-white">Verbindungs-Status</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {apiStatus?.message || (apiKey ? 'API-Schlüssel konfiguriert.' : 'Keine Börse verbunden.')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  {Boolean(apiKey || apiStatus?.connected) && (
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="px-3.5 py-2 bg-[#F23645]/10 hover:bg-[#F23645]/20 border border-[#F23645]/30 text-[#F23645] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Unlink size={14} />
                      <span>{disconnecting ? 'Trennt...' : 'Börse trennen'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleTestApi}
                    disabled={testingApi}
                    className="px-3.5 py-2 bg-[#1A202C] hover:bg-[#252D3C] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {testingApi ? <Loader2 size={14} className="animate-spin text-[#00E676]" /> : <RefreshCw size={14} />}
                    <span>Verbindung testen</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-[#00E676]/5 rounded-xl border border-[#00E676]/20 text-[11px] text-slate-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#00E676] shrink-0 mt-0.5" />
                <span>
                  <strong>Sicherheits-Hinweis:</strong> Erstelle Key mit <strong>Futures Read & Trade</strong> Rechten. Aktiviere <strong>niemals Auszahlungen (Withdrawals)</strong>!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TAGS & SETUPS MANAGEMENT */}
        {activeTab === 'tags' && (
          <div className="space-y-6">
            <div className="bg-[#0D111A] border border-[#1A202C] rounded-2xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1A202C]">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Tag size={16} className="text-[#00E676]" /> Globale Trading Tags & Setups
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verwalte hier zentral deine Setup-Klassen, Mindsets, Konfluenz-Faktoren und Fehlertags für die gesamte App.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Möchtest du wirklich alle Tags auf die Werkseinstellungen zurücksetzen?')) {
                      await resetToDefaults()
                      setSuccessMsg('Tags erfolgreich auf Standard zurückgesetzt.')
                      setTimeout(() => setSuccessMsg(null), 3000)
                    }
                  }}
                  className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RotateCcw size={14} />
                  <span>Standard wiederherstellen</span>
                </button>
              </div>

              {/* KATEGORIE-SUB-TABS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#07090E] border border-[#1A202C] rounded-xl text-xs font-mono">
                {[
                  { key: 'confluences', label: 'Konfluenzen' },
                  { key: 'setup_classes', label: 'Setups' },
                  { key: 'mental_states', label: 'Mindset' },
                  { key: 'error_tags', label: 'Fehler' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setTagCategoryTab(tab.key as any)}
                    className={`py-2 px-3 rounded-lg font-bold transition cursor-pointer text-center truncate ${
                      tagCategoryTab === tab.key
                        ? 'bg-[#1A202C] text-[#00E676] shadow-md border border-slate-700'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* NEUEN TAG HINZUFÜGEN */}
              <div className="flex items-center gap-2 pt-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={`Neuen Tag zu ${tagCategoryTab} hinzufügen...`}
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const trimmed = newTagInput.trim().replace(/^#/, '')
                        if (!trimmed) return
                        const currentList = localTagsState[tagCategoryTab] || []
                        if (currentList.includes(trimmed)) {
                          setNewTagInput('')
                          return
                        }
                        const updated = {
                          ...localTagsState,
                          [tagCategoryTab]: [...currentList, trimmed]
                        }
                        setLocalTagsState(updated)
                        updateTags(updated)
                        setNewTagInput('')
                      }
                    }}
                    className="w-full bg-[#07090E] border border-[#1A202C] focus:border-[#00E676] rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-600 outline-none font-mono transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = newTagInput.trim().replace(/^#/, '')
                    if (!trimmed) return
                    const currentList = localTagsState[tagCategoryTab] || []
                    if (currentList.includes(trimmed)) {
                      setNewTagInput('')
                      return
                    }
                    const updated = {
                      ...localTagsState,
                      [tagCategoryTab]: [...currentList, trimmed]
                    }
                    setLocalTagsState(updated)
                    updateTags(updated)
                    setNewTagInput('')
                  }}
                  className="px-4 py-2.5 bg-[#00E676] hover:bg-[#00C853] text-black font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
                >
                  <Plus size={14} />
                  <span>Hinzufügen</span>
                </button>
              </div>

              {/* LISTE DER TAGS */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                  Aktive Tags in dieser Kategorie ({localTagsState[tagCategoryTab]?.length || 0})
                </span>
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1">
                  {(localTagsState[tagCategoryTab] || []).map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-[#07090E] border border-[#1A202C] rounded-xl text-xs font-mono text-slate-200 flex items-center gap-2 group hover:border-slate-700"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedList = localTagsState[tagCategoryTab].filter((t: string) => t !== tag)
                          const updated = {
                            ...localTagsState,
                            [tagCategoryTab]: updatedList
                          }
                          setLocalTagsState(updated)
                          updateTags(updated)
                        }}
                        className="text-slate-500 hover:text-[#F23645] transition cursor-pointer"
                        title="Tag entfernen"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SICHERHEIT */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-[#0D111A] border border-[#1A202C] rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mail size={16} className="text-[#00E676]" /> E-Mail-Adresse ändern
              </h3>

              <form onSubmit={handleUpdateEmail} className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-semibold text-slate-300">Neue E-Mail-Adresse</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#07090E] border border-[#1A202C] focus:border-[#00E676] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={updatingEmail || newEmail === user?.email}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#1A202C] hover:bg-[#252D3C] text-white font-bold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 h-10"
                >
                  {updatingEmail ? <Loader2 size={14} className="animate-spin" /> : null}
                  <span>E-Mail aktualisieren</span>
                </button>
              </form>
            </div>

            <div className="bg-[#0D111A] border border-[#1A202C] rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock size={16} className="text-[#00E676]" /> Passwort ändern
              </h3>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Neues Passwort</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mindestens 6 Zeichen"
                      className="w-full bg-[#07090E] border border-[#1A202C] focus:border-[#00E676] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Passwort wiederholen</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Wiederholen"
                      className="w-full bg-[#07090E] border border-[#1A202C] focus:border-[#00E676] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updatingPassword || !newPassword}
                    className="px-5 py-2.5 bg-[#1A202C] hover:bg-[#252D3C] text-white font-bold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {updatingPassword ? <Loader2 size={14} className="animate-spin" /> : null}
                    <span>Passwort speichern</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-[#1A0D0D] border border-[#F23645]/30 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[#F23645] flex items-center gap-2">
                    <ShieldAlert size={16} /> Konto dauerhaft löschen
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Löscht deine API-Keys, Einstellungen und Zugänge unwiderruflich.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="px-4 py-2.5 bg-[#F23645]/10 hover:bg-[#F23645] text-[#F23645] hover:text-white border border-[#F23645]/40 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Trash2 size={14} />
                  <span>Konto löschen</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FLOATING ACTION BAR FOR SAVING */}
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 w-full max-w-md px-4 ${
          hasUnsavedChanges ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}>
          <div className="bg-[#0D111A]/90 backdrop-blur-xl border border-[#00E676]/40 p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-2 pl-2">
              <span className="w-2 h-2 rounded-full bg-[#00E676] animate-ping" />
              Ungespeicherte Änderungen
            </span>

            <button
              onClick={() => handleSaveAll()}
              disabled={saving}
              className="px-5 py-2.5 bg-[#00E676] hover:bg-[#00C853] text-black font-extrabold rounded-xl text-xs transition shadow-lg shadow-[#00E676]/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>Speichern</span>
            </button>
          </div>
        </div>

      </div>

      {/* AVATAR PICKER MODAL (IM GLEICHEN STIL WIE DIE ROBOTER, ABER ALS DEGEN PIXEL-ART) */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D111A] border border-[#1A202C] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#1A202C] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame size={16} className="text-amber-400" /> Wähle deinen Degen Avatar
              </h3>
              <button 
                onClick={() => setIsAvatarModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-[#07090E] border border-[#1A202C] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1">
              {LEGENDARY_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAvatarUrl(url)
                    setIsAvatarModalOpen(false)
                    markDirty()
                  }}
                  className={`p-1.5 rounded-xl bg-[#07090E] border-2 transition-all cursor-pointer hover:scale-105 aspect-square ${
                    avatarUrl === url 
                      ? 'border-[#00E676] bg-[#00E676]/10 shadow-lg shadow-[#00E676]/20' 
                      : 'border-[#1A202C] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Avatar ${idx}`} className="w-full h-full rounded-lg bg-[#141824]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D111A] border border-[#F23645]/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#1A202C] pb-3">
              <h3 className="text-sm font-bold text-[#F23645] flex items-center gap-2">
                <ShieldAlert size={18} /> Konto wirklich löschen?
              </h3>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-slate-400 grid place-items-center hover:text-white p-1 rounded-lg bg-[#07090E] border border-[#1A202C]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Diese Aktion kann <strong className="text-white">nicht rückgängig</strong> gemacht werden.
              Tippe zur Bestätigung <span className="text-[#F23645] font-mono font-bold">LÖSCHEN</span> in das untere Feld.
            </p>

            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder='Tippe "LÖSCHEN"'
              className="w-full bg-[#07090E] border border-[#1A202C] focus:border-[#F23645] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition font-mono"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-[#1A202C] hover:bg-[#252D3C] text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Abbrechen
              </button>

              <button
                type="button"
                disabled={deleteConfirmation !== 'LÖSCHEN' || deletingAccount}
                key="delete-account-btn"
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-[#F23645] hover:bg-[#d92231] text-white font-bold rounded-xl text-xs transition disabled:opacity-40 cursor-pointer flex items-center gap-2"
              >
                {deletingAccount ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>Endgültig löschen</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}