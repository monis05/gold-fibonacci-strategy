"use client";

import React from "react";
import { Wallet, Award, TrendingUp, AlertTriangle, RotateCcw } from "lucide-react";
import { PaperAccount } from "@/types/trading";
import { formatCurrency, formatPercent } from "@/lib/utils/formatters";

interface PaperAccountCardProps {
  account: PaperAccount;
  onResetAccount: () => void;
}

export const PaperAccountCard: React.FC<PaperAccountCardProps> = ({ account, onResetAccount }) => {
  const isNetProfitPositive = account.netProfit >= 0;

  return (
    <div className="bg-terminal-card border border-terminal-border rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-terminal-border pb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-gold-400" />
          <h2 className="font-bold text-sm text-white tracking-wide">
            SIMULATED PAPER PORTFOLIO
          </h2>
        </div>

        <button
          onClick={onResetAccount}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-terminal-muted hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
          title="Reset Virtual Balance to $10,000"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Portfolio</span>
        </button>
      </div>

      {/* Grid of Key Account Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        {/* Balance & Equity */}
        <div className="p-3 rounded-lg bg-terminal-bg border border-terminal-border">
          <span className="text-[10px] text-terminal-muted block">EQUITY / BALANCE</span>
          <div className="text-base font-extrabold text-white mt-0.5">
            {formatCurrency(account.equity, 2)}
          </div>
          <span className="text-[10px] text-slate-400">
            Bal: {formatCurrency(account.balance, 2)}
          </span>
        </div>

        {/* Net Profit */}
        <div className="p-3 rounded-lg bg-terminal-bg border border-terminal-border">
          <span className="text-[10px] text-terminal-muted block">SIMULATED NET P/L</span>
          <div
            className={`text-base font-extrabold mt-0.5 ${
              isNetProfitPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatCurrency(account.netProfit, 2)}
          </div>
          <span className="text-[10px] text-slate-400">
            {account.balance > 0
              ? formatPercent((account.netProfit / (account.balance - account.netProfit)) * 100)
              : "0%"}
          </span>
        </div>

        {/* Win Rate */}
        <div className="p-3 rounded-lg bg-terminal-bg border border-terminal-border">
          <span className="text-[10px] text-terminal-muted block flex items-center gap-1">
            <Award className="w-3 h-3 text-gold-400" />
            WIN RATE
          </span>
          <div className="text-base font-extrabold text-gold-400 mt-0.5">
            {account.winRate.toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400">
            {account.winningTrades}W / {account.losingTrades}L ({account.totalTrades} total)
          </span>
        </div>

        {/* Max Drawdown */}
        <div className="p-3 rounded-lg bg-terminal-bg border border-terminal-border">
          <span className="text-[10px] text-terminal-muted block flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            MAX DRAWDOWN
          </span>
          <div className="text-base font-extrabold text-rose-400 mt-0.5">
            {account.maxDrawdownPercent.toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400">
            -${account.maxDrawdown.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
