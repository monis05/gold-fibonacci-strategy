"use client";

import React from "react";
import { Eye, EyeOff, RotateCcw, Activity } from "lucide-react";
import { TimeFrame } from "@/types/trading";

interface ChartControlsProps {
  timeframe: TimeFrame;
  onTimeframeChange: (tf: TimeFrame) => void;
  showEMA: boolean;
  onToggleEMA: () => void;
  showSwings: boolean;
  onToggleSwings: () => void;
  showFibLevels: boolean;
  onToggleFibLevels: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const ChartControls: React.FC<ChartControlsProps> = ({
  timeframe,
  onTimeframeChange,
  showEMA,
  onToggleEMA,
  showSwings,
  onToggleSwings,
  showFibLevels,
  onToggleFibLevels,
  onRefresh,
  isRefreshing,
}) => {
  const timeframes: TimeFrame[] = ["1m", "5m", "15m", "1h"];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-terminal-card border-b border-terminal-border text-xs">
      {/* Timeframes */}
      <div className="flex items-center gap-1">
        <span className="text-terminal-muted mr-1 font-medium">Timeframe:</span>
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={`px-2.5 py-1 rounded font-mono font-medium transition-colors ${
              timeframe === tf
                ? "bg-gold-500/20 text-gold-400 border border-gold-500/40"
                : "text-terminal-muted hover:text-white hover:bg-slate-800"
            }`}
          >
            {tf.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Layer Toggles */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleEMA}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
            showEMA
              ? "bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/40"
              : "text-terminal-muted hover:text-white bg-slate-800/40"
          }`}
          title="Toggle EMA 9 & EMA 20 Overlays"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>EMA 9/20</span>
        </button>

        <button
          onClick={onToggleSwings}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
            showSwings
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
              : "text-terminal-muted hover:text-white bg-slate-800/40"
          }`}
          title="Toggle Market Structure Pivot Highs & Lows (HH/HL/LH/LL)"
        >
          {showSwings ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>HH / HL Structure</span>
        </button>

        <button
          onClick={onToggleFibLevels}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
            showFibLevels
              ? "bg-gold-500/15 text-gold-400 border border-gold-500/40"
              : "text-terminal-muted hover:text-white bg-slate-800/40"
          }`}
          title="Toggle 3-Anchor Trend-Based Fibonacci Extension Lines"
        >
          {showFibLevels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Fib Extension</span>
        </button>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 text-terminal-muted hover:text-white hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
          title="Re-sync Market Data"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-gold-400" : ""}`} />
        </button>
      </div>
    </div>
  );
};
