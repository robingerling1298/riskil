"use client";

import React, { useState } from "react";
import { X, Check, Image as ImageIcon, Zap, Brain } from "lucide-react";
import { useJournalStore } from "@/lib/supabase/useJournalStore";

export interface TradeData {
  pair: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  leverage: number;
  margin: number;
  stopLoss?: number;
  takeProfit?: number; // <-- Ergänzt für den TakeProfitPlanner
  takeProfits?: number[];
}

interface LogTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeData: TradeData;
}

const CONFLUENCE_TAGS = [
  "Orderblock",
  "Liquidity Grab",
  "Divergenz",
  "EMA Cross",
  "Trendline Break",
  "Fib 0.618",
  "Support/Resistance",
  "Volume Spike",
];

const MINDSET_TAGS = [
  { label: "Plan gefolgt", emoji: "🧘", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  { label: "FOMO", emoji: "⚡", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  { label: "Revenge", emoji: "😤", color: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
  { label: "Spät drin", emoji: "🏃", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
];

export const LogTradeModal: React.FC<LogTradeModalProps> = ({
  isOpen,
  onClose,
  tradeData,
}) => {
  const addTrade = useJournalStore((state: any) => state.addTrade);

  const [selectedConfluences, setSelectedConfluences] = useState<string[]>([]);
  const [selectedMindset, setSelectedMindset] = useState<string>("Plan gefolgt");
  const [note, setNote] = useState("");
  const [chartUrl, setChartUrl] = useState("");

  if (!isOpen) return null;

  const toggleConfluence = (tag: string) => {
    setSelectedConfluences((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    addTrade({
      pair: tradeData.pair || "BTC/USDT",
      direction: tradeData.direction,
      entryPrice: tradeData.entryPrice,
      leverage: tradeData.leverage,
      margin: tradeData.margin,
      stopLoss: tradeData.stopLoss,
      takeProfits: tradeData.takeProfit
        ? [tradeData.takeProfit]
        : tradeData.takeProfits,
      confluences: selectedConfluences,
      mindset: selectedMindset,
      note,
      chartUrl,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    });
    
    setSelectedConfluences([]);
    setSelectedMindset("Plan gefolgt");
    setNote("");
    setChartUrl("");
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#121418] text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <span
              className={`rounded px-2 py-0.5 text-xs font-bold ${
                tradeData.direction === "LONG"
                  ? "bg-[#089981]/20 text-[#089981]"
                  : "bg-[#F23645]/20 text-[#F23645]"
              }`}
            >
              {tradeData.direction}
            </span>
            <h3 className="font-semibold text-lg">{tradeData.pair || "BTC/USDT"}</h3>
            <span className="text-xs text-slate-400">({tradeData.leverage}x)</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Trade Data Snapshot */}
          <div className="grid grid-cols-3 gap-3 rounded-lg border border-slate-800/80 bg-slate-900/50 p-3 text-center">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Entry</p>
              <p className="text-sm font-semibold">${tradeData.entryPrice}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Margin</p>
              <p className="text-sm font-semibold">${tradeData.margin}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Stop Loss / TP1</p>
              <p className="text-sm font-semibold text-[#089981]">
                {tradeData.takeProfit
                  ? `$${tradeData.takeProfit}`
                  : tradeData.stopLoss
                  ? `$${tradeData.stopLoss}`
                  : "-"}
              </p>
            </div>
          </div>

          {/* Section 1: Confluences */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
              <Zap size={14} className="text-amber-400" /> CONFLUENCE / SETUP (Mehrfachauswahl)
            </label>
            <div className="flex flex-wrap gap-2">
              {CONFLUENCE_TAGS.map((tag: string) => {
                const active = selectedConfluences.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleConfluence(tag)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium border transition-all ${
                      active
                        ? "border-[#2962FF] bg-[#2962FF]/20 text-[#2962FF]"
                        : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    {active && <Check size={12} />}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Mindset Tag */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
              <Brain size={14} className="text-purple-400" /> EMOTION & DISZIPLIN
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MINDSET_TAGS.map((m) => {
                const active = selectedMindset === m.label;
                return (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setSelectedMindset(m.label)}
                    className={`flex items-center justify-center gap-2 rounded-lg p-2 text-xs font-medium border transition-all ${
                      active ? m.color : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Optional Chart URL & Short Note */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
                <ImageIcon size={14} /> TradingView Link / Screenshot
              </div>
              <input
                type="text"
                placeholder="https://www.tradingview.com/x/..."
                value={chartUrl}
                onChange={(e) => setChartUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-[#2962FF] focus:outline-none"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Kurze Notiz zum Entry (optional)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-[#2962FF] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-[#2962FF] px-5 py-2 text-xs font-semibold text-white shadow-lg hover:bg-[#1E50E6] transition-all"
          >
            Trade Einloggen
          </button>
        </div>
      </div>
    </div>
  );
};