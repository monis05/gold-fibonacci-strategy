"use client";

import React, { useState } from "react";
import { ArrowUpRight, ArrowDownRight, Target, Shield, Layers, Radio } from "lucide-react";
import { FibLevel, StrategySignal } from "@/types/trading";
import { formatPrice, formatTime } from "@/lib/utils/formatters";

interface SignalsPanelProps {
  signals: StrategySignal[];
  fibLevels: FibLevel[];
}

export const SignalsPanel: React.FC<SignalsPanelProps> = ({ signals, fibLevels }) => {
  const [activeTab, setActiveTab] = useState<"signals" | "fibLevels">("signals");

  return (
    <div className="bg-terminal-card border border-terminal-border rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Tab Header */}
      <div className="flex items-center justify-between border-b border-terminal-border px-4 py-2.5 bg-terminal-bg/50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("signals")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "signals"
                ? "bg-slate-800 text-white border border-terminal-border"
                : "text-terminal-muted hover:text-white"
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-gold-400" />
            <span>Signals ({signals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("fibLevels")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "fibLevels"
                ? "bg-slate-800 text-white border border-terminal-border"
                : "text-terminal-muted hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fib Levels ({fibLevels.length})</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[380px] space-y-3">
        {activeTab === "signals" ? (
          signals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-terminal-muted text-xs">
              <Radio className="w-8 h-8 mb-2 opacity-30 text-gold-400" />
              <span>No breakout signals triggered yet.</span>
              <span className="text-[11px] text-slate-500 mt-1">
                Monitoring 5M candles for 0.618 breakout close...
              </span>
            </div>
          ) : (
            signals
              .slice()
              .reverse()
              .map((sig) => {
                const isBuy = sig.type === "BUY";
                return (
                  <div
                    key={sig.id}
                    className={`p-3 rounded-lg border text-xs font-mono transition-all ${
                      isBuy
                        ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50"
                        : "bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded font-bold text-xs ${
                            isBuy
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {isBuy ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {sig.type} SIGNAL
                        </span>
                        <span className="text-terminal-muted text-[11px]">
                          {formatTime(sig.time)}
                        </span>
                      </div>
                      <span className="text-gold-400 font-bold">1:{sig.riskRewardRatio} R:R</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-terminal-border/50">
                      <div>
                        <span className="text-slate-400 block">Entry Price:</span>
                        <span className="font-bold text-white">${formatPrice(sig.entryPrice)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">0.618 Level:</span>
                        <span className="font-bold text-slate-300">${formatPrice(sig.breakoutLevel)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block flex items-center gap-1">
                          <Target className="w-3 h-3 text-gold-400" />
                          1.414 Target:
                        </span>
                        <span className="font-bold text-gold-400">${formatPrice(sig.targetPrice)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block flex items-center gap-1">
                          <Shield className="w-3 h-3 text-rose-400" />
                          Invalidation:
                        </span>
                        <span className="font-bold text-rose-400">${formatPrice(sig.stopLossPrice)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
          )
        ) : (
          /* Fibonacci Levels Table */
          <div className="space-y-1.5 text-xs font-mono">
            {fibLevels.length === 0 ? (
              <div className="py-6 text-center text-terminal-muted">
                No active 3-anchor Fibonacci extension plotted.
              </div>
            ) : (
              fibLevels.map((lvl) => (
                <div
                  key={lvl.ratio}
                  className={`flex items-center justify-between p-2 rounded border ${
                    lvl.isBreakoutTrigger
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : lvl.isTarget
                      ? "bg-gold-500/10 border-gold-500/40 text-gold-300"
                      : "bg-terminal-bg border-terminal-border text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: lvl.color }}
                    />
                    <span className="font-medium">{lvl.label}</span>
                  </div>
                  <span className="font-bold text-white">${formatPrice(lvl.price)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
