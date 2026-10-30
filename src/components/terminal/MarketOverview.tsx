"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Clock, ShieldAlert, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { TrendDirection } from "@/types/trading";
import { formatPrice } from "@/lib/utils/formatters";

interface MarketOverviewProps {
  currentPrice: number;
  trend: TrendDirection;
  trendReason: string;
  ema9Value: number;
  ema20Value: number;
  high24h: number;
  low24h: number;
  lastCandleTime: number;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  currentPrice,
  trend,
  trendReason,
  ema9Value,
  ema20Value,
  high24h,
  low24h,
  lastCandleTime,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(300);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const barDuration = 300; // 5 min
      const elapsed = now % barDuration;
      setSecondsRemaining(barDuration - elapsed);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastCandleTime]);

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

  const range = high24h - low24h;
  const pricePosPercent = range > 0 ? Math.min(100, Math.max(0, ((currentPrice - low24h) / range) * 100)) : 50;

  return (
    <div className="bg-terminal-card border border-terminal-border rounded-xl p-4 shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Current Price & Tick */}
        <div className="flex flex-col justify-between border-b md:border-b-0 md:border-r border-terminal-border pb-3 md:pb-0 md:pr-4">
          <div className="flex items-center justify-between text-xs text-terminal-muted">
            <span className="font-medium">XAUUSD SPOT</span>
            <div className="flex items-center gap-1 font-mono text-gold-400">
              <Clock className="w-3.5 h-3.5" />
              <span>5M Bar: {timeFormatted}</span>
            </div>
          </div>

          <div className="my-2">
            <div className="text-3xl font-extrabold text-white font-mono tracking-tight flex items-baseline gap-1.5">
              <span>${formatPrice(currentPrice)}</span>
              <span className="text-xs text-terminal-muted font-normal">USD</span>
            </div>
          </div>

          {/* 24h Price Range Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-terminal-muted font-mono">
              <span>L: ${formatPrice(low24h)}</span>
              <span>H: ${formatPrice(high24h)}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-gold-400 rounded-full transition-all duration-300"
                style={{ width: `${pricePosPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="flex flex-col justify-between border-b md:border-b-0 md:border-r border-terminal-border pb-3 md:pb-0 md:pr-4 md:col-span-2">
          <div className="text-xs text-terminal-muted font-medium mb-1">
            STRATEGY MARKET TREND (5M)
          </div>

          <div className="flex items-center gap-3">
            {trend === "BULLISH" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm tracking-wide">BULLISH TREND</span>
              </div>
            )}
            {trend === "BEARISH" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-400">
                <TrendingDown className="w-5 h-5 text-rose-400" />
                <span className="font-bold text-sm tracking-wide">BEARISH TREND</span>
              </div>
            )}
            {trend === "NO_TRADE" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm tracking-wide">NO TRADE (RANGING)</span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-2 line-clamp-2">
            {trendReason}
          </p>
        </div>

        {/* EMA 9 / 20 Alignment */}
        <div className="flex flex-col justify-between">
          <div className="text-xs text-terminal-muted font-medium mb-1">
            MOVING AVERAGE CLUSTER
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-terminal-bg border border-terminal-border">
              <span className="text-[#06B6D4] font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                EMA 9 (Fast)
              </span>
              <span className="text-white font-bold">${formatPrice(ema9Value)}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-terminal-bg border border-terminal-border">
              <span className="text-[#F59E0B] font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                EMA 20 (Slow)
              </span>
              <span className="text-white font-bold">${formatPrice(ema20Value)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
