"use client";

import React from "react";
import { CheckCircle2, Circle, AlertCircle, Target, Compass, Zap } from "lucide-react";
import { FibAnchors, StrategyPhase, TrendDirection } from "@/types/trading";
import { formatPrice } from "@/lib/utils/formatters";

interface StrategyStateCardProps {
  phase: StrategyPhase;
  phaseDescription: string;
  trend: TrendDirection;
  anchors: FibAnchors | null;
  zoneInfo: {
    price050: number;
    price0618: number;
    target1414: number;
    zoneWidth: number;
    breakoutThreshold: number;
  } | null;
}

export const StrategyStateCard: React.FC<StrategyStateCardProps> = ({
  phase,
  phaseDescription,
  trend,
  anchors,
  zoneInfo,
}) => {
  // Steps in the pipeline
  const steps = [
    { id: 1, title: "Trend Alignment", desc: "Price > EMA 9/20 & Structure" },
    { id: 2, title: "Pullback Validated", desc: "Swing Low/High preserved" },
    { id: 3, title: "3-Anchor Fib", desc: "Extension levels mapped" },
    { id: 4, title: "0.618 Breakout", desc: "Closed with ≥50% zone buffer" },
    { id: 5, title: "1.414 Target", desc: "Simulated paper trade target" },
  ];

  const getStepStatus = (stepId: number) => {
    if (phase === "WAITING_FOR_TREND") {
      return stepId === 1 ? "current" : "pending";
    }
    if (phase === "WAITING_FOR_PULLBACK") {
      return stepId === 1 ? "completed" : stepId === 2 ? "current" : "pending";
    }
    if (phase === "FIBONACCI_APPLIED" || phase === "WAITING_FOR_BREAKOUT") {
      return stepId <= 2 ? "completed" : stepId === 3 || stepId === 4 ? "current" : "pending";
    }
    if (phase === "SIGNAL_CONFIRMED" || phase === "TRADE_ACTIVE" || phase === "TARGET_HIT") {
      return stepId <= 4 ? "completed" : "current";
    }
    return "pending";
  };

  return (
    <div className="bg-terminal-card border border-terminal-border rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-terminal-border pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-gold-400" />
          <h2 className="font-bold text-sm text-white tracking-wide">
            STRATEGY EXECUTION PIPELINE
          </h2>
        </div>

        {/* Phase Badge */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
            phase === "SIGNAL_CONFIRMED" || phase === "TRADE_ACTIVE"
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse"
              : phase === "TARGET_HIT"
              ? "bg-gold-500/20 text-gold-400 border-gold-500/40"
              : phase === "FIBONACCI_APPLIED" || phase === "WAITING_FOR_BREAKOUT"
              ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
              : "bg-slate-800 text-slate-400 border-slate-700"
          }`}
        >
          {phase.replace(/_/g, " ")}
        </span>
      </div>

      {/* Rationale explanation */}
      <p className="text-xs text-slate-300 font-mono bg-terminal-bg/70 p-3 rounded-lg border border-terminal-border">
        {phaseDescription}
      </p>

      {/* 5-Step Pipeline Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
        {steps.map((s) => {
          const status = getStepStatus(s.id);
          return (
            <div
              key={s.id}
              className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between transition-all ${
                status === "completed"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : status === "current"
                  ? "bg-gold-500/10 border-gold-500/40 text-gold-300"
                  : "bg-terminal-bg/50 border-terminal-border text-slate-500"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] font-bold">STEP {s.id}</span>
                {status === "completed" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : status === "current" ? (
                  <Circle className="w-3.5 h-3.5 text-gold-400 animate-pulse" />
                ) : (
                  <Circle className="w-3.5 h-3.5 opacity-30" />
                )}
              </div>
              <div className="font-semibold text-[11px] text-white">{s.title}</div>
              <div className="text-[10px] text-terminal-muted truncate">{s.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Zone & Anchors Metrics Bar */}
      {zoneInfo && anchors && (
        <div className="pt-2 border-t border-terminal-border">
          <div className="text-[11px] font-mono text-terminal-muted mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-gold-400" />
              ACTIVE 3-ANCHOR FIBONACCI ZONE ({anchors.direction})
            </span>
            <span>Impulse: ${formatPrice(anchors.impulseDistance)}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-terminal-bg border border-terminal-border">
              <span className="text-[10px] text-slate-400 block">0.500 BOUNDARY</span>
              <span className="font-bold text-amber-400">${formatPrice(zoneInfo.price050)}</span>
            </div>

            <div className="p-2 rounded bg-terminal-bg border border-terminal-border">
              <span className="text-[10px] text-slate-400 block">0.618 BREAKOUT</span>
              <span className="font-bold text-emerald-400">${formatPrice(zoneInfo.price0618)}</span>
            </div>

            <div className="p-2 rounded bg-terminal-bg border border-terminal-border">
              <span className="text-[10px] text-slate-400 block">ZONE WIDTH</span>
              <span className="font-bold text-white">${formatPrice(zoneInfo.zoneWidth)}</span>
            </div>

            <div className="p-2 rounded bg-terminal-bg border border-terminal-border">
              <span className="text-[10px] text-slate-400 block">50% CONFIRMATION</span>
              <span className="font-bold text-cyan-400">${formatPrice(zoneInfo.breakoutThreshold)}</span>
            </div>

            <div className="p-2 rounded bg-terminal-bg border border-gold-500/30 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-gold-400 block flex items-center gap-1">
                <Target className="w-3 h-3" />
                1.414 TARGET
              </span>
              <span className="font-extrabold text-gold-300">${formatPrice(zoneInfo.target1414)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
