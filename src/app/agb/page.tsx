import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export default function AgbPage() {
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
            <FileText size={20} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Allgemeine Nutzungsbedingungen (Beta)</h1>
          <p className="text-xs font-mono text-slate-500">Stand: September 2026 • RISKIL Terminal</p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-400">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Geltungsbereich & Beta-Status</h2>
            <p>
              Diese Bedingungen regeln die Nutzung des Software-Terminals RISKIL während der geschlossenen Beta-Phase. Mit der Registrierung bestätigst du, dass du an einem Vorab-Testlauf teilnimmst und temporäre Wartungsarbeiten oder Fehler auftreten können.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Kein Finanz- oder Anlageberatungsservice</h2>
            <p>
              RISKIL ist ein reines <strong>Analysetool und psychologisches Trading-Journal</strong>. Die Plattform gibt keinerlei Handelsempfehlungen, Signale oder Anlageberatung ab. Alle Handelsentscheidungen, Orderplatzierungen und das damit verbundene Risiko liegen zu 100% in der alleinigen Verantwortung des Nutzers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. API-Schlüssel & Eigenverantwortung</h2>
            <p>
              Der Nutzer verpflichtet sich, im Terminal ausschließlich API-Schlüssel mit reinen Lese-Berechtigungen (Read-Only) zu konfigurieren. RISKIL haftet nicht für Schäden, die aus fehlerhaften Einstellungen oder der Weitergabe von Authentifizierungsdaten durch den Nutzer resultieren.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Haftungsausschluss</h2>
            <p>
              Der Handel mit Derivaten und Krypto-Futures birgt erhebliche Verlustrisiken. RISKIL haftet nicht für finanzielle Verluste, entgangene Gewinne oder Handelsentscheidungen, die durch die Nutzung der Rechner, Statistiken oder Synchronisationsfeatures entstehen.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">5. Beendigung der Teilnahme</h2>
            <p>
              Sowohl der Nutzer als auch die Plattformbetreiber können den Beta-Zugang jederzeit ohne Einhaltung von Fristen beenden.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}