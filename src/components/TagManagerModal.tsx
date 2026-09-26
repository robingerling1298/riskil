'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Tag, Check, RefreshCw, RotateCcw } from 'lucide-react'
import { TagCategoryMap, DEFAULT_TAG_CONFIG } from '@/context/CustomTagsContext'

interface TagManagerModalProps {
  isOpen: boolean
  onClose: () => void
  currentTags: TagCategoryMap
  onSaveTags: (newTags: TagCategoryMap) => Promise<boolean>
  onResetToDefaults: () => Promise<boolean>
}

const CATEGORY_LABELS: Record<keyof TagCategoryMap, { title: string; hint: string }> = {
  confluences: { title: 'Konfluenz-Faktoren / Hard Rules', hint: 'z. B. Orderblock, FVG, Volume Profile POC' },
  setup_classes: { title: 'Setup-Klassen', hint: 'z. B. Setup A: Perfekt, Breakout, Range Sweep' },
  mental_states: { title: 'Mentale Verfassungen', hint: 'z. B. Fokus, Tunnelblick, FOMO' },
  error_tags: { title: 'Ausführungs- & Managementfehler', hint: 'z. B. SL verschoben, Panikverkauf' }
}

export default function TagManagerModal({
  isOpen,
  onClose,
  currentTags,
  onSaveTags,
  onResetToDefaults,
}: TagManagerModalProps) {
  const [activeTab, setActiveTab] = useState<keyof TagCategoryMap>('confluences')
  const [tagsState, setTagsState] = useState<TagCategoryMap>(currentTags)
  const [newTagInput, setNewTagInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Sync state wenn Modal geöffnet wird
  useEffect(() => {
    if (isOpen) {
      setTagsState(currentTags)
    }
  }, [isOpen, currentTags])

  if (!isOpen) return null

  const handleAddTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, '')
    if (!trimmed) return

    if (tagsState[activeTab].includes(trimmed)) {
      setNewTagInput('')
      return
    }

    const updatedList = [...tagsState[activeTab], trimmed]
    setTagsState({ ...tagsState, [activeTab]: updatedList })
    setNewTagInput('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedList = tagsState[activeTab].filter(t => t !== tagToRemove)
    setTagsState({ ...tagsState, [activeTab]: updatedList })
  }

  const handleSave = async () => {
    setIsSaving(true)
    await onSaveTags(tagsState)
    setIsSaving(false)
    onClose()
  }

  const handleReset = async () => {
    if (!confirm('Möchtest du wirklich alle Tags auf die Werkseinstellungen zurücksetzen? Eigene Tags gehen dabei verloren.')) {
      return
    }
    setIsResetting(true)
    await onResetToDefaults()
    setTagsState(DEFAULT_TAG_CONFIG)
    setIsResetting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5 text-white font-mono text-xs font-bold uppercase tracking-wider">
            <Tag className="w-4 h-4 text-brand" />
            <span>Globale Tag & Setup Haupteinstellungen</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Kategorie-Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#060911] border border-slate-800 rounded-xl text-xs font-mono">
          {(Object.keys(CATEGORY_LABELS) as Array<keyof TagCategoryMap>).map((catKey) => {
            const isActive = activeTab === catKey
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setActiveTab(catKey)}
                className={`py-2 px-2 rounded-lg font-bold transition truncate cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-brand shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {catKey === 'confluences' ? 'Konfluenzen' : catKey === 'setup_classes' ? 'Setups' : catKey === 'mental_states' ? 'Mindset' : 'Fehler'}
              </button>
            )
          })}
        </div>

        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white font-mono">
            {CATEGORY_LABELS[activeTab].title}
          </h4>
          <p className="text-[11px] text-slate-400 font-sans">
            {CATEGORY_LABELS[activeTab].hint}
          </p>
        </div>

        {/* Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={`Neuen Tag für ${CATEGORY_LABELS[activeTab].title} hinzufügen...`}
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
              className="w-full bg-[#060911] border border-slate-800 focus:border-brand rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-600 outline-none font-mono"
            />
          </div>
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-black font-mono font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-brand/20"
          >
            <Plus className="w-4 h-4" />
            <span>Hinzufügen</span>
          </button>
        </div>

        {/* Tag-Pills */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
            Aktive Tags ({tagsState[activeTab].length})
          </span>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {tagsState[activeTab].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-[#060911] border border-slate-800 rounded-xl text-xs font-mono text-slate-200 flex items-center gap-2 group hover:border-slate-700"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-slate-500 hover:text-[#F23645] transition cursor-pointer"
                  title="Tag entfernen"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 flex items-center justify-between gap-2.5 border-t border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting || isSaving}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="Alle Tags auf Standardwerte zurücksetzen"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Standard wiederherstellen</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isResetting}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Speichern</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}