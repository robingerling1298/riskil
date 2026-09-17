import Link from 'next/link'
import { ArrowLeft, Building2 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Impressum • RISKIL',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ImpressumPage() {
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
            <Building2 size={20} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Impressum</h1>
          <p className="text-xs font-mono text-slate-500">Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)</p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-400">
          <section className="space-y-1.5">
            <h2 className="text-base font-bold text-white">Diensteanbieter</h2>
            <div className="text-slate-200 font-medium space-y-0.5">
              <p className="font-bold text-white tracking-wide">RISKIL – Engineering Discipline</p>
              <p>Inhaber: Robin Gerling</p>
              <p>Vor den Birken, 2</p>
              <p>59609 Anröchte</p>
              <p>Deutschland</p>
            </div>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-base font-bold text-white">Kontakt</h2>
            <p>E-Mail: support@riskil.app</p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-base font-bold text-white">Hinweis zum Entwicklungsstatus</h2>
            <p>
              RISKIL befindet sich in einer geschlossenen Beta-Phase (Closed Beta). Die Plattform stellt Software-Tools zur mathematischen Auswertung und Selbstanalyse bereit. Es wird zu keinem Zeitpunkt eine Finanz-, Anlage- oder Steuerberatung erbracht.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-base font-bold text-white">Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}