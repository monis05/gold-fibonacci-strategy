"use client";

import React, { useState } from "react";
import { Download, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, History } from "lucide-react";
import { PaperTrade } from "@/types/trading";
import { formatCurrency, formatDateTime, formatDuration, formatPrice } from "@/lib/utils/formatters";
import { exportTradesToCSV } from "@/lib/utils/csvExporter";

interface TradeHistoryProps {
  history: PaperTrade[];
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ history }) => {
  const [filter, setFilter] = useState<"ALL" | "BUY" | "SELL" | "WIN" | "LOSS">("ALL");

  const filtered = history.filter((t) => {
    if (filter === "BUY") return t.direction === "BUY";
    if (filter === "SELL") return t.direction === "SELL";
    if (filter === "WIN") return (t.realizedPL || 0) > 0;
    if (filter === "LOSS") return (t.realizedPL || 0) <= 0;
    return true;
  });

  return (
    <div className="bg-terminal-card border border-terminal-border rounded-xl p-5 shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-terminal-border pb-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gold-400" />
          <h2 className="font-bold text-sm text-white tracking-wide">
            COMPLETED TRADE HISTORY ({history.length})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-terminal-bg p-1 rounded-lg border border-terminal-border text-xs">
            {(["ALL", "BUY", "SELL", "WIN", "LOSS"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  filter === f
                    ? "bg-slate-700 text-white font-bold"
                    : "text-terminal-muted hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={() => exportTradesToCSV(history, "xauusd_trade_history.csv")}
            disabled={history.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-terminal-border disabled:opacity-40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[350px]">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-terminal-muted text-xs">
            No completed trades match the selected filter.
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-terminal-bg text-terminal-muted uppercase text-[10px] sticky top-0 border-b border-terminal-border">
              <tr>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Entry Time</th>
                <th className="py-2.5 px-3">Entry Price</th>
                <th className="py-2.5 px-3">Exit Price</th>
                <th className="py-2.5 px-3">P/L ($)</th>
                <th className="py-2.5 px-3">Pips</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {filtered.map((t) => {
                const isBuy = t.direction === "BUY";
                const isProfit = (t.realizedPL || 0) >= 0;

                return (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBuy
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {t.direction}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {formatDateTime(t.entryTime)}
                    </td>
                    <td className="py-2.5 px-3 text-white font-semibold">
                      ${formatPrice(t.entryPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      ${formatPrice(t.exitPrice || t.currentPrice)}
                    </td>
                    <td
                      className={`py-2.5 px-3 font-bold ${
                        isProfit ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {formatCurrency(t.realizedPL || 0)}
                    </td>
                    <td
                      className={`py-2.5 px-3 ${
                        isProfit ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {t.pips > 0 ? "+" : ""}
                      {t.pips.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {formatDuration(t.durationSeconds)}
                    </td>
                    <td className="py-2.5 px-3">
                      {t.exitReason === "TARGET_HIT" ? (
                        <span className="inline-flex items-center gap-1 text-gold-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          1.414 HIT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          INVALIDATED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
