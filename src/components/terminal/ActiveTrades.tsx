"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Target, Clock, XCircle, ShieldCheck } from "lucide-react";
import { PaperTrade } from "@/types/trading";
import { formatPrice, formatCurrency, formatDuration, formatTime } from "@/lib/utils/formatters";

interface ActiveTradesProps {
  trades: PaperTrade[];
  onManualClose: (tradeId: string) => void;
}

export const ActiveTrades: React.FC<ActiveTradesProps> = ({ trades, onManualClose }) => {
  if (trades.length === 0) {
    return (
      <div className="bg-terminal-card border border-terminal-border rounded-xl p-8 text-center text-terminal-muted shadow-xl">
        <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-400" />
        <h3 className="font-bold text-white text-sm mb-1">No Active Paper Trades</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          When a valid 0.618 breakout signal confirms on the 5M chart, a simulated position will open automatically and track up to the 1.414 target.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-terminal-card border border-terminal-border rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-terminal-border pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          <h2 className="font-bold text-sm text-white tracking-wide">
            ACTIVE PAPER POSITIONS ({trades.length})
          </h2>
        </div>
        <span className="text-xs text-terminal-muted font-mono">
          Simulated 100 oz Gold Contracts
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trades.map((trade) => {
          const isBuy = trade.direction === "BUY";
          const isProfitable = trade.unrealizedPL >= 0;

          // Calculate progress % towards 1.414 target
          const totalDistance = Math.abs(trade.targetPrice - trade.entryPrice);
          const currentDistance = isBuy
            ? trade.currentPrice - trade.entryPrice
            : trade.entryPrice - trade.currentPrice;
          const targetProgress = totalDistance > 0 ? Math.min(100, Math.max(0, (currentDistance / totalDistance) * 100)) : 0;

          return (
            <div
              key={trade.id}
              className={`p-4 rounded-xl border text-xs font-mono flex flex-col justify-between transition-all ${
                isBuy
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : "bg-rose-500/5 border-rose-500/30"
              }`}
            >
              {/* Top row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1 px-2.5 py-1 rounded font-bold text-xs ${
                      isBuy
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}
                  >
                    {isBuy ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {trade.direction} {trade.lotSize.toFixed(2)} LOTS
                  </span>
                  <span className="text-terminal-muted text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(trade.durationSeconds)}
                  </span>
                </div>

                <button
                  onClick={() => onManualClose(trade.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 border border-terminal-border transition-colors"
                  title="Close Position Now"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>

              {/* Middle row: P/L highlight */}
              <div className="my-2 p-3 rounded-lg bg-terminal-bg border border-terminal-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-terminal-muted block">UNREALIZED P/L</span>
                  <div
                    className={`text-xl font-extrabold ${
                      isProfitable ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatCurrency(trade.unrealizedPL)}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-terminal-muted block">PIPS / POINTS</span>
                  <span className={`font-bold ${isProfitable ? "text-emerald-400" : "text-rose-400"}`}>
                    {trade.pips > 0 ? "+" : ""}
                    {trade.pips.toFixed(1)} pips
                  </span>
                </div>
              </div>

              {/* Progress towards 1.414 Target */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-[10px] text-terminal-muted">
                  <span className="flex items-center gap-1 text-gold-400 font-semibold">
                    <Target className="w-3 h-3" />
                    Target Progress (1.414)
                  </span>
                  <span>{targetProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${targetProgress}%` }}
                  />
                </div>
              </div>

              {/* Trade details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-2 border-t border-terminal-border/50">
                <div>
                  <span className="text-slate-400 block">Entry Price:</span>
                  <span className="font-bold text-white">${formatPrice(trade.entryPrice)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Current Price:</span>
                  <span className="font-bold text-slate-200">${formatPrice(trade.currentPrice)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">1.414 Target:</span>
                  <span className="font-bold text-gold-400">${formatPrice(trade.targetPrice)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Stop Invalidation:</span>
                  <span className="font-bold text-rose-400">${formatPrice(trade.stopLossPrice)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
