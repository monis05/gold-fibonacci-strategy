"use client";

import React from "react";
import {
  TrendingUp,
  Volume2,
  VolumeX,
  Sliders,
  PlayCircle,
  Download,
  Wifi,
  WifiOff,
  Coins,
} from "lucide-react";
import { formatPrice, formatPercent } from "@/lib/utils/formatters";

interface HeaderProps {
  currentPrice: number;
  bid: number;
  ask: number;
  spread: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  isLive: boolean;
  sourceName: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onOpenBacktest: () => void;
  onExportCSV: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPrice,
  bid,
  ask,
  spread,
  change24h,
  changePercent24h,
  high24h,
  low24h,
  isLive,
  sourceName,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  onOpenBacktest,
  onExportCSV,
}) => {
  const isPositive = change24h >= 0;

  return (
    <header className="border-b border-terminal-border bg-terminal-card/95 backdrop-blur-md sticky top-0 z-40">
      {/* Top Banner / Ticker */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center shadow-lg shadow-gold-500/20 text-slate-950">
            <Coins className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-wide text-white font-sans flex items-center gap-1.5">
                GOLD FIBONACCI
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-400 border border-gold-500/30">
                  TERMINAL
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-terminal-muted font-mono">
              XAUUSD 5M Trend-Based Breakout Engine
            </p>
          </div>
        </div>

        {/* Live Market Ticker */}
        <div className="hidden lg:flex items-center gap-6 text-xs font-mono">
          <div className="flex flex-col">
            <span className="text-terminal-muted text-[10px]">CURRENT PRICE</span>
            <span className={`text-base font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
              ${formatPrice(currentPrice)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-terminal-muted text-[10px]">24H CHANGE</span>
            <span className={`font-semibold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {isPositive ? "+" : ""}
              {formatPrice(change24h)} ({formatPercent(changePercent24h)})
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-terminal-muted text-[10px]">BID / ASK</span>
            <span className="text-slate-300">
              ${formatPrice(bid)} / ${formatPrice(ask)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-terminal-muted text-[10px]">SPREAD</span>
            <span className="text-gold-400 font-bold">{spread.toFixed(2)} pts</span>
          </div>

          <div className="flex flex-col">
            <span className="text-terminal-muted text-[10px]">24H HIGH / LOW</span>
            <span className="text-slate-300">
              ${formatPrice(high24h)} / ${formatPrice(low24h)}
            </span>
          </div>
        </div>

        {/* Actions & Connection Status */}
        <div className="flex items-center gap-2.5">
          {/* Feed Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isLive
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
            }`}
            title={sourceName}
          >
            {isLive ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="font-mono text-[11px] font-bold">
              {isLive ? "LIVE SPOT FEED" : "DEMO SIMULATION"}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? "bg-gold-500/20 text-gold-400 border-gold-500/40"
                : "text-terminal-muted hover:text-white border-terminal-border bg-terminal-bg"
            }`}
            title={soundEnabled ? "Breakout sound alerts enabled" : "Muted"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Backtest Engine Button */}
          <button
            onClick={onOpenBacktest}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-colors shadow-sm"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Backtest Engine</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-terminal-border transition-colors shadow-sm"
            title="Export Trades & Signals to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Strategy Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg border border-terminal-border bg-terminal-bg text-terminal-muted hover:text-white hover:border-slate-600 transition-colors"
            title="Configure Strategy & Fibonacci Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
