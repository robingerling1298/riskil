import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-[#07090E] text-slate-300 font-sans p-6 sm:p-12 selection:bg-[#089981]/30">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#089981] hover:underline"
        >
          <ArrowLeft size={14} /> Zurück zur Startseite
        </Link>

        <div className="space-y-2 border-b border-[#161A23] pb-6">
          <div className="w-10 h-10 rounded-xl bg-[#089981]/15 text-[#089981] flex items-center justify-center mb-3">
            <Shield size={20} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Datenschutzerklärung (Beta)</h1>
          <p className="text-xs font-mono text-slate-500">Stand: September 2026 • RISKIL Execution Terminal</p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-400">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Verantwortlicher & Beta-Phase</h2>
            <p>
              Dieses Terminal befindet sich derzeit in einer geschlossenen Beta-Phase. Betreiber und Ansprechpartner für Datenschutzfragen ist das Team von RISKIL. Bei Fragen erreichst du uns unter support@riskil.app.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Erfassung & Zweck der Datenverarbeitung</h2>
            <p>Im Rahmen der Nutzung verarbeiten wir folgende Daten ausschließlich zur Bereitstellung der Kernfunktionen:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>E-Mail-Adresse:</strong> Zur passwortlosen Authentifizierung via Einmalcode (OTP).</li>
              <li><strong>Exchange-API-Schlüssel:</strong> Wir verlangen und akzeptieren ausschließlich <strong>Read-Only API-Keys</strong>. Keys mit Auszahlungs- oder Order-Berechtigung werden nicht unterstützt.</li>
              <li><strong>Trading- & Journal-Daten:</strong> Ausgelesene Positions- und Ausführungsdaten von Bitget sowie deine manuell verfassten Pre-Trade-Analysen, Notizen und Tags.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Verschlüsselung & Sicherheit</h2>
            <p>
              Deine sensiblen Schnittstellendaten (API-Keys und Secrets) werden mit hardwarenaher <strong>AES-256-GCM-Verschlüsselung</strong> gesichert. Kein Mitarbeiter hat unverschlüsselten Zugriff auf deine Schlüssel. Die Kommunikation erfolgt lückenlos über TLS/HTTPS.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Keine Weitergabe an Dritte</h2>
            <p>
              Deine Trading-Statistiken, Notizen und PnL-Daten sind strikt an deinen Account gebunden. Sie werden weder an Dritte weitergegeben noch für Trainingszwecke von externen Modellen verkauft.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">5. Deine Rechte & Datenlöschung</h2>
            <p>
              Du kannst deinen Account, alle hinterlegten API-Schlüssel sowie dein gesamtes Journal jederzeit eigenständig über dein Profil oder durch eine formlose E-Mail an uns unwiderruflich löschen lassen.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}