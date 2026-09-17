'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, PlusSquare, MoreVertical, Download, CheckCircle2, Apple, Smartphone } from 'lucide-react'

type Platform = 'ios' | 'android'

interface GuideStep {
  title: string
  desc: string
  icon: any
  badge: string
}

const iosSteps: GuideStep[] = [
  {
    title: 'Teilen-Button antippen',
    desc: 'Tippe in Safari unten in der Navigationsleiste auf das Teilen-Symbol (Viereck mit Pfeil nach oben).',
    icon: Share2,
    badge: 'Schritt 1',
  },
  {
    title: '„Zum Home-Bildschirm“ wählen',
    desc: 'Scrolle im Menü leicht nach unten und wähle den Eintrag „Zum Home-Bildschirm“ mit dem Plus-Icon.',
    icon: PlusSquare,
    badge: 'Schritt 2',
  },
  {
    title: 'Hinzufügen bestätigen',
    desc: 'Tippe oben rechts auf „Hinzufügen“. RISKIL startet ab jetzt direkt im Vollbild ohne Safari-Leiste.',
    icon: CheckCircle2,
    badge: 'Schritt 3',
  },
]

const androidSteps: GuideStep[] = [
  {
    title: 'Menü aufrufen',
    desc: 'Öffne Chrome und tippe oben rechts auf die drei Punkte (⋮) neben der Adressleiste.',
    icon: MoreVertical,
    badge: 'Schritt 1',
  },
  {
    title: '„Installieren und Verknüpfen“ wählen',
    desc: 'Tippe auf „Installieren und Verknüpfen...“ oder „App installieren“ mit dem Monitor/Download-Symbol.',
    icon: Download,
    badge: 'Schritt 2',
  },
  {
    title: 'Bestätigen & Durchstarten',
    desc: 'Bestätige im Android-Dialog mit „Installieren“. Die WebAPK wird eigenständig im App-Drawer abgelegt.',
    icon: CheckCircle2,
    badge: 'Schritt 3',
  },
]

export default function InstallGuide() {
  const [platform, setPlatform] = useState<Platform>('ios')
  const [activeStep, setActiveStep] = useState(0)

  const steps = platform === 'ios' ? iosSteps : androidSteps

  const switchPlatform = (next: Platform) => {
    setPlatform(next)
    setActiveStep(0)
  }

  return (
    <section className="py-20 px-4 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-mono tracking-widest text-[#00E599] uppercase bg-[#00E599]/10 px-3 py-1 rounded-full border border-[#00E599]/20">
          Mobile App Experience
        </span>
        <h2 className="text-3xl md:text-4xl font-black text-white mt-4 tracking-tight">
          In 10 Sekunden auf deinem Homescreen
        </h2>
        <p className="text-slate-400 text-sm md:text-base mt-2">
          Kein App-Store-Download nötig. Volle PWA-Performance ohne störende Browser-Leisten.
        </p>

        {/* OS SELECTOR SWITCH */}
        <div className="flex justify-center mt-6">
          <div className="bg-[#0B0E14] p-1.5 rounded-2xl border border-[#161A23] flex gap-1">
            <button
              onClick={() => switchPlatform('ios')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                platform === 'ios'
                  ? 'bg-[#141824] text-white border border-[#1E2536] shadow-lg shadow-black/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Apple size={16} /> Apple iOS
            </button>

            <button
              onClick={() => switchPlatform('android')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                platform === 'android'
                  ? 'bg-[#141824] text-white border border-[#1E2536] shadow-lg shadow-black/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone size={16} /> Android (Chrome)
            </button>
          </div>
        </div>
      </div>

      {/* INTERACTIVE GUIDE CONTAINER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#0B0E14]/80 border border-[#161A23] rounded-3xl p-6 md:p-10 backdrop-blur-xl">
        {/* STEP CARDS (LINKS) */}
        <div className="md:col-span-6 space-y-4">
          {steps.map((step, idx) => {
            const Icon = step.icon
            const isCurrent = activeStep === idx

            return (
              <div
                key={step.title}
                onClick={() => setActiveStep(idx)}
                className={`cursor-pointer p-4 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                  isCurrent
                    ? 'bg-[#121622] border-[#00E599]/40 shadow-lg shadow-[#00E599]/5'
                    : 'bg-[#0E111A] border-[#161A23] hover:border-slate-700 opacity-60 hover:opacity-90'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                    isCurrent
                      ? 'bg-[#00E599] text-black shadow-md shadow-[#00E599]/30'
                      : 'bg-[#161A23] text-slate-400'
                  }`}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#00E599] uppercase font-bold">
                      {step.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-0.5">{step.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* PHONE VISUALIZER (RECHTS) */}
        <div className="md:col-span-6 flex justify-center py-4">
          <div className="relative w-[280px] h-[480px] bg-[#07090E] border-[6px] border-[#1A1F2C] rounded-[40px] shadow-2xl overflow-hidden flex flex-col justify-between">
            {/* DYNAMIC ISLAND / CAMERA NOTCH */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#161A23] rounded-full z-20" />

            {/* DUMMY APP SCREENSHOT HEADER */}
            <div className="pt-8 px-4 flex items-center justify-between border-b border-[#161A23]/60 pb-3 bg-[#0B0E14]/40">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#00E599] flex items-center justify-center text-[10px] font-black text-black">
                  R
                </div>
                <span className="text-[11px] font-bold text-white tracking-wide">RISKIL</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse" />
            </div>

            {/* SIMULATED CONTENT VIEW */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-center">
              <div className="bg-[#121622] p-3 rounded-xl border border-[#161A23] space-y-1">
                <div className="h-2 w-12 bg-slate-700 rounded" />
                <div className="h-4 w-24 bg-[#00E599]/80 rounded" />
              </div>

              <div className="bg-[#121622] p-3 rounded-xl border border-[#161A23] space-y-2">
                <div className="h-2 w-20 bg-slate-700 rounded" />
                <div className="h-16 w-full bg-[#0B0E14] rounded-lg border border-[#161A23] flex items-center justify-center text-[10px] text-slate-500 font-mono">
                  Performance Chart
                </div>
              </div>
            </div>

            {/* ANIMATED INTERACTIVE ACTION OVERLAY */}
            <AnimatePresence mode="wait">
              {platform === 'ios' ? (
                <motion.div
                  key={`ios-${activeStep}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  className="bg-[#121622]/95 backdrop-blur-md border-t border-[#1E2536] p-4 text-center rounded-b-[34px]"
                >
                  {activeStep === 0 && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-[#00E599]/20 text-[#00E599] flex items-center justify-center animate-bounce">
                        <Share2 size={20} />
                      </div>
                      <span className="text-xs font-bold text-white">1. Unten auf Teilen tippen</span>
                    </div>
                  )}
                  {activeStep === 1 && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-[#00E599] text-black flex items-center justify-center">
                        <PlusSquare size={20} />
                      </div>
                      <span className="text-xs font-bold text-white">2. „Zum Home-Bildschirm“</span>
                    </div>
                  )}
                  {activeStep === 2 && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-[#00E599] text-black flex items-center justify-center">
                        <CheckCircle2 size={20} />
                      </div>
                      <span className="text-xs font-bold text-white">3. „Hinzufügen“ antippen</span>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={`android-${activeStep}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  className="bg-[#121622]/95 backdrop-blur-md border-t border-[#1E2536] p-4 text-center rounded-b-[34px]"
                >
                  {activeStep === 0 && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-[#00E599]/20 text-[#00E599] flex items-center justify-center animate-pulse">
                        <MoreVertical size={20} />
                      </div>
                      <span className="text-xs font-bold text-white">1. Oben auf Menü (⋮) tippen</span>
                    </div>
                  )}
                  {activeStep === 1 && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-[#00E599] text-black flex items-center justify-center">
                        <Download size={20} />
                      </div>
                      <span className="text-xs font-bold text-white">2. „Installieren & Verknüpfen“</span>
                    </div>
                  )}
                  {activeStep === 2 && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-[#00E599] text-black flex items-center justify-center">
                        <CheckCircle2 size={20} />
                      </div>
                      <span className="text-xs font-bold text-white">3. Installation bestätigen</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}