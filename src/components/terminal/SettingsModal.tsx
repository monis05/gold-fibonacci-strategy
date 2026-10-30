"use client";

import React, { useState } from "react";
import { X, Sliders, Check, RotateCcw } from "lucide-react";
import { StrategySettings } from "@/types/trading";
import { DEFAULT_STRATEGY_SETTINGS } from "@/lib/strategy/strategyEngine";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StrategySettings;
  onSave: (newSettings: StrategySettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [form, setForm] = useState<StrategySettings>(settings);

  if (!isOpen) return null;

  const handleLevelToggle = (ratio: number) => {
    setForm((prev) => ({
      ...prev,
      visibleFibLevels: prev.visibleFibLevels.map((lvl) =>
        lvl.ratio === ratio ? { ...lvl, enabled: !lvl.enabled } : lvl
      ),
    }));
  };

  const handleReset = () => {
    setForm(DEFAULT_STRATEGY_SETTINGS);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-terminal-card border border-terminal-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-terminal-border bg-terminal-bg/50">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-gold-400" />
            <h2 className="text-base font-bold text-white font-sans">
              STRATEGY & FIBONACCI PARAMETERS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-terminal-muted hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs font-mono">
          {/* Moving Averages */}
          <div className="space-y-3">
            <h3 className="font-sans font-bold text-slate-200 uppercase tracking-wide text-xs">
              Moving Average Trend Filters
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-terminal-muted block mb-1">EMA Fast Period</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={form.emaFast}
                  onChange={(e) => setForm({ ...form, emaFast: parseInt(e.target.value) || 9 })}
                  className="w-full bg-terminal-bg border border-terminal-border rounded-lg px-3 py-2 text-white font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Default: 9</span>
              </div>
              <div>
                <label className="text-terminal-muted block mb-1">EMA Slow Period</label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  value={form.emaSlow}
                  onChange={(e) => setForm({ ...form, emaSlow: parseInt(e.target.value) || 20 })}
                  className="w-full bg-terminal-bg border border-terminal-border rounded-lg px-3 py-2 text-white font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Default: 20</span>
              </div>
            </div>
          </div>

          {/* Fibonacci & Breakout Rules */}
          <div className="space-y-3 pt-4 border-t border-terminal-border">
            <h3 className="font-sans font-bold text-slate-200 uppercase tracking-wide text-xs">
              Trend-Based Fibonacci & Breakout Rules
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-terminal-muted block mb-1">Zone Width Buffer (%)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="1.0"
                  value={form.zoneWidthThresholdPercent}
                  onChange={(e) =>
                    setForm({ ...form, zoneWidthThresholdPercent: parseFloat(e.target.value) || 0.5 })
                  }
                  className="w-full bg-terminal-bg border border-terminal-border rounded-lg px-3 py-2 text-white font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Mandatory: 50% (0.50) beyond 0.618
                </span>
              </div>
              <div>
                <label className="text-terminal-muted block mb-1">Target Ratio</label>
                <input
                  type="number"
                  step="0.001"
                  value={form.fibTargetRatio}
                  onChange={(e) =>
                    setForm({ ...form, fibTargetRatio: parseFloat(e.target.value) || 1.414 })
                  }
                  className="w-full bg-terminal-bg border border-terminal-border rounded-lg px-3 py-2 text-white font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Default: 1.414 Target</span>
              </div>
            </div>
          </div>

          {/* Visible Fibonacci Extension Levels */}
          <div className="space-y-3 pt-4 border-t border-terminal-border">
            <h3 className="font-sans font-bold text-slate-200 uppercase tracking-wide text-xs">
              Configurable Fibonacci Levels
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {form.visibleFibLevels.map((lvl) => (
                <label
                  key={lvl.ratio}
                  className="flex items-center gap-2 p-2 rounded-lg bg-terminal-bg border border-terminal-border cursor-pointer hover:border-slate-600 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={lvl.enabled}
                    onChange={() => handleLevelToggle(lvl.ratio)}
                    className="rounded border-slate-700 text-gold-500 focus:ring-0"
                  />
                  <span className="text-white font-mono text-[11px]">Fib {lvl.ratio}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Risk Management / Stop Loss Mode */}
          <div className="space-y-3 pt-4 border-t border-terminal-border">
            <h3 className="font-sans font-bold text-slate-200 uppercase tracking-wide text-xs">
              Risk Management Stop Invalidation
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, stopLossMode: "ANCHOR3_SWING" })}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  form.stopLossMode === "ANCHOR3_SWING"
                    ? "bg-gold-500/15 border-gold-500/50 text-white"
                    : "bg-terminal-bg border-terminal-border text-slate-400"
                }`}
              >
                <div className="font-bold">Anchor 3 (Pullback Swing)</div>
                <div className="text-[10px] text-terminal-muted mt-0.5">
                  Tighter stop at pullback apex
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, stopLossMode: "PREVIOUS_STRUCTURE_SWING" })}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  form.stopLossMode === "PREVIOUS_STRUCTURE_SWING"
                    ? "bg-gold-500/15 border-gold-500/50 text-white"
                    : "bg-terminal-bg border-terminal-border text-slate-400"
                }`}
              >
                <div className="font-bold">Anchor 1 (Major Structure)</div>
                <div className="text-[10px] text-terminal-muted mt-0.5">
                  Wider stop at initial swing anchor
                </div>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-terminal-border">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-terminal-muted hover:text-white bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg font-semibold bg-gold-500 hover:bg-gold-400 text-slate-950 font-sans shadow-lg shadow-gold-500/20 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Save Parameters</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
