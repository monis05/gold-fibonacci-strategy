"use client";

import React, { useState } from "react";
import { X, PlayCircle, Download, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { BacktestResult, Candle, StrategySettings } from "@/types/trading";
import { runBacktest } from "@/lib/strategy/backtester";
import { formatCurrency, formatPercent, formatPrice, formatDateTime } from "@/lib/utils/formatters";
import { exportTradesToCSV } from "@/lib/utils/csvExporter";

interface BacktestModalProps {
  isOpen: boolean;
  onClose: () => void;
  candles: Candle[];
  settings: StrategySettings;
}

export const BacktestModal: React.FC<BacktestModalProps> = ({
  isOpen,
  onClose,
  candles,
  settings,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [candleSample, setCandleSample] = useState<number>(300);

  if (!isOpen) return null;

  const handleRunBacktest = () => {
    setIsRunning(true);
    setTimeout(() => {
      const slice = candles.slice(-candleSample);
      const res = runBacktest(slice, settings);
      setResult(res);
      setIsRunning(false);
    }, 400);
  };

  // SVG Equity Curve Calculation
  let equitySvgPath = "";
  if (result && result.equityCurve.length > 1) {
    const minEq = Math.min(...result.equityCurve.map((e) => e.equity));
    const maxEq = Math.max(...result.equityCurve.map((e) => e.equity));
    const range = maxEq - minEq || 1;

    const width = 600;
    const height = 140;

    const points = result.equityCurve.map((pt, idx) => {
      const x = (idx / (result.equityCurve.length - 1)) * width;
      const y = height - ((pt.equity - minEq) / range) * (height - 20) - 10;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    equitySvgPath = `M ${points.join(" L ")}`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-terminal-card border border-terminal-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-terminal-border bg-terminal-bg/50">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white font-sans">
              HISTORICAL STRATEGY BACKTESTING ENGINE
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-terminal-muted hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-terminal-bg border border-terminal-border text-xs">
            <div className="flex items-center gap-3">
              <span className="text-terminal-muted font-medium">Historical Sample:</span>
              {[150, 300, 500].map((count) => (
                <button
                  key={count}
                  onClick={() => setCandleSample(count)}
                  className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition-colors ${
                    candleSample === count
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {count} Candles ({Math.floor((count * 5) / 60)}h)
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRunBacktest}
                disabled={isRunning}
                className="flex items-center gap-2 px-5 py-2 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <PlayCircle className="w-4 h-4" />
                <span>{isRunning ? "Simulating..." : "Execute Backtest"}</span>
              </button>

              {result && (
                <button
                  onClick={() => exportTradesToCSV(result.trades, "backtest_trades.csv")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-terminal-border transition-colors"
                  title="Export Backtest to CSV"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              )}
            </div>
          </div>

          {/* Results Display */}
          {result ? (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-4 rounded-xl bg-terminal-bg border border-terminal-border">
                  <span className="text-terminal-muted text-[11px] block">SIMULATED NET PROFIT</span>
                  <div
                    className={`text-xl font-extrabold mt-1 ${
                      result.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatCurrency(result.netProfit)}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Return: {formatPercent(result.netProfitPercent)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-terminal-bg border border-terminal-border">
                  <span className="text-terminal-muted text-[11px] block">WIN RATE</span>
                  <div className="text-xl font-extrabold text-gold-400 mt-1">
                    {result.winRate.toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {result.winningTrades}W / {result.losingTrades}L
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-terminal-bg border border-terminal-border">
                  <span className="text-terminal-muted text-[11px] block">PROFIT FACTOR</span>
                  <div className="text-xl font-extrabold text-white mt-1">
                    {result.profitFactor}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {result.totalTrades} Executed Trades
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-terminal-bg border border-terminal-border">
                  <span className="text-terminal-muted text-[11px] block">MAX DRAWDOWN</span>
                  <div className="text-xl font-extrabold text-rose-400 mt-1">
                    {result.maxDrawdownPercent.toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-slate-400">
                    -${result.maxDrawdown.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Equity Curve Visualization */}
              <div className="p-4 rounded-xl bg-terminal-bg border border-terminal-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Simulated Portfolio Equity Curve
                  </span>
                  <span className="text-terminal-muted font-mono">
                    Initial: ${settings.initialBalance.toLocaleString()}
                  </span>
                </div>

                <div className="w-full h-[150px] relative overflow-hidden flex items-center justify-center">
                  {equitySvgPath ? (
                    <svg
                      viewBox="0 0 600 140"
                      className="w-full h-full overflow-visible"
                      preserveAspectRatio="none"
                    >
                      <path
                        d={equitySvgPath}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs text-terminal-muted">Insufficient trades for curve</span>
                  )}
                </div>
              </div>

              {/* Backtest Trades Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Executed Historical Trades ({result.trades.length})
                </h4>
                <div className="overflow-x-auto max-h-[220px] rounded-lg border border-terminal-border">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-terminal-bg text-terminal-muted uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="p-2">Type</th>
                        <th className="p-2">Entry</th>
                        <th className="p-2">Exit</th>
                        <th className="p-2">P/L ($)</th>
                        <th className="p-2">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-terminal-border">
                      {result.trades.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-800/40">
                          <td className="p-2 font-bold text-slate-300">{t.direction}</td>
                          <td className="p-2 text-white">${formatPrice(t.entryPrice)}</td>
                          <td className="p-2 text-slate-300">${formatPrice(t.exitPrice || 0)}</td>
                          <td
                            className={`p-2 font-bold ${
                              (t.realizedPL || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {formatCurrency(t.realizedPL || 0)}
                          </td>
                          <td className="p-2 text-[11px]">
                            {t.exitReason === "TARGET_HIT" ? (
                              <span className="text-gold-400 font-semibold">1.414 HIT</span>
                            ) : (
                              <span className="text-rose-400">STOPPED</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-terminal-muted text-xs flex flex-col items-center">
              <PlayCircle className="w-12 h-12 mb-3 text-blue-400 opacity-40" />
              <p className="font-semibold text-slate-300 text-sm">
                Ready to Backtest Gold Fibonacci Strategy
              </p>
              <p className="text-slate-500 mt-1 max-w-md">
                Click &quot;Execute Backtest&quot; above to simulate the 3-Anchor Fibonacci Breakout strategy tick-by-tick across historical 5M candles.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
