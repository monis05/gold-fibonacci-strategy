"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { MarketOverview } from "@/components/terminal/MarketOverview";
import { StrategyStateCard } from "@/components/terminal/StrategyStateCard";
import { CandlestickChart } from "@/components/chart/CandlestickChart";
import { ChartControls } from "@/components/chart/ChartControls";
import { SignalsPanel } from "@/components/terminal/SignalsPanel";
import { ActiveTrades } from "@/components/terminal/ActiveTrades";
import { PaperAccountCard } from "@/components/terminal/PaperAccountCard";
import { TradeHistory } from "@/components/terminal/TradeHistory";
import { BacktestModal } from "@/components/terminal/BacktestModal";
import { SettingsModal } from "@/components/terminal/SettingsModal";
import {
  Candle,
  PaperAccount,
  PaperTrade,
  StrategySettings,
  StrategySignal,
  TimeFrame,
} from "@/types/trading";
import { runStrategy, DEFAULT_STRATEGY_SETTINGS } from "@/lib/strategy/strategyEngine";
import {
  INITIAL_ACCOUNT_STATE,
  openPaperTradeFromSignal,
  updatePaperTrades,
} from "@/lib/paperTrading/paperTradingEngine";
import { generateRealisticGoldCandles, generateLiveGoldTick } from "@/lib/marketData/mockDataGenerator";
import { exportTradesToCSV, exportSignalsToCSV } from "@/lib/utils/csvExporter";
import { Activity, ShieldCheck, FileText, BarChart3 } from "lucide-react";

export default function TerminalHome() {
  // State: Market Data & Candles
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(2742.5);
  const [bid, setBid] = useState<number>(2742.35);
  const [ask, setAsk] = useState<number>(2742.65);
  const [spread, setSpread] = useState<number>(0.3);
  const [change24h, setChange24h] = useState<number>(18.4);
  const [changePercent24h, setChangePercent24h] = useState<number>(0.68);
  const [high24h, setHigh24h] = useState<number>(2756.2);
  const [low24h, setLow24h] = useState<number>(2728.0);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [sourceName, setSourceName] = useState<string>("Binance Spot Gold (PAXG/USDT Live Feed)");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // State: Strategy Configuration & UI Controls
  const [settings, setSettings] = useState<StrategySettings>(DEFAULT_STRATEGY_SETTINGS);
  const [timeframe, setTimeframe] = useState<TimeFrame>("5m");
  const [showEMA, setShowEMA] = useState<boolean>(true);
  const [showSwings, setShowSwings] = useState<boolean>(true);
  const [showFibLevels, setShowFibLevels] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // State: Modals & Tabs
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isBacktestOpen, setIsBacktestOpen] = useState<boolean>(false);
  const [bottomTab, setBottomTab] = useState<"active" | "portfolio" | "history" | "strategyDoc">("active");

  // State: Paper Trading
  const [activeTrades, setActiveTrades] = useState<PaperTrade[]>([]);
  const [paperAccount, setPaperAccount] = useState<PaperAccount>(INITIAL_ACCOUNT_STATE);
  const [processedSignalIds, setProcessedSignalIds] = useState<Set<string>>(new Set());

  // Web Audio Synth for Signal Notification
  const playSignalSound = useCallback((type: "BUY" | "SELL") => {
    try {
      if (typeof window === "undefined") return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "BUY") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      } else {
        osc.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
        osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.15); // C5
      }

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }, []);

  // Fetch initial market data from server
  const loadMarketData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/market-data?limit=300");
      if (res.ok) {
        const data = await res.json();
        if (data.candles && data.candles.length > 0) {
          setCandles(data.candles);
          setCurrentPrice(data.currentPrice);
          setBid(data.bid);
          setAsk(data.ask);
          setSpread(data.spread);
          setChange24h(data.change24h);
          setChangePercent24h(data.changePercent24h);
          setHigh24h(data.high24h);
          setLow24h(data.low24h);
          setIsLive(data.isLive);
          setSourceName(data.sourceName);
        }
      }
    } catch (e) {
      // Fallback to high-fidelity simulated candles
      if (candles.length === 0) {
        const fallback = generateRealisticGoldCandles(300, 2742.5);
        setCandles(fallback);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [candles.length]);

  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  // Live Tick & 5M Candle Polling Loop (every 3 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setCandles((prevCandles) => {
        if (prevCandles.length === 0) return prevCandles;

        const lastBar = prevCandles[prevCandles.length - 1];
        const { candle: updatedBar, isNewBar } = generateLiveGoldTick(lastBar);

        setCurrentPrice(updatedBar.close);
        setBid(Number((updatedBar.close - spread / 2).toFixed(2)));
        setAsk(Number((updatedBar.close + spread / 2).toFixed(2)));

        if (isNewBar) {
          return [...prevCandles.slice(1), updatedBar];
        } else {
          return [...prevCandles.slice(0, -1), updatedBar];
        }
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [spread]);

  // Run Strategy Engine whenever candles or settings update
  const strategyResult = React.useMemo(() => {
    return runStrategy(candles, settings);
  }, [candles, settings]);

  // Handle Signal Detection & Automatic Paper Trading Execution
  useEffect(() => {
    if (!strategyResult.latestSignal) return;

    const sig = strategyResult.latestSignal;
    if (!processedSignalIds.has(sig.id)) {
      setProcessedSignalIds((prev) => new Set(prev).add(sig.id));

      if (soundEnabled) {
        playSignalSound(sig.type === "BUY" ? "BUY" : "SELL");
      }

      // Automatically open paper trade position
      const newTrade = openPaperTradeFromSignal(sig, settings.lotSize);
      setActiveTrades((prev) => [newTrade, ...prev]);
    }
  }, [strategyResult.latestSignal, processedSignalIds, soundEnabled, playSignalSound, settings.lotSize]);

  // Update Active Paper Trades against latest price action
  useEffect(() => {
    if (candles.length === 0 || activeTrades.length === 0) return;

    const latestBar = candles[candles.length - 1];
    const { updatedActiveTrades, newlyClosedTrades, updatedAccount } = updatePaperTrades(
      activeTrades,
      latestBar,
      paperAccount
    );

    setActiveTrades(updatedActiveTrades);
    setPaperAccount(updatedAccount);
  }, [candles, activeTrades, paperAccount]);

  // Manual Close Handler
  const handleManualCloseTrade = (tradeId: string) => {
    const trade = activeTrades.find((t) => t.id === tradeId);
    if (!trade) return;

    const latestCandle = candles[candles.length - 1] || { close: trade.currentPrice, time: Math.floor(Date.now() / 1000) };
    const realizedPL = trade.unrealizedPL;

    const closedTrade: PaperTrade = {
      ...trade,
      exitPrice: latestCandle.close,
      exitTime: latestCandle.time,
      exitReason: "MANUAL_CLOSE",
      realizedPL,
      status: "CANCELLED",
    };

    setActiveTrades((prev) => prev.filter((t) => t.id !== tradeId));
    setPaperAccount((prev) => ({
      ...prev,
      balance: prev.balance + realizedPL,
      equity: prev.equity,
      netProfit: prev.netProfit + realizedPL,
      totalTrades: prev.totalTrades + 1,
      winningTrades: realizedPL > 0 ? prev.winningTrades + 1 : prev.winningTrades,
      losingTrades: realizedPL <= 0 ? prev.losingTrades + 1 : prev.losingTrades,
      history: [closedTrade, ...prev.history],
    }));
  };

  // Reset Account Handler
  const handleResetAccount = () => {
    setActiveTrades([]);
    setPaperAccount({
      ...INITIAL_ACCOUNT_STATE,
      balance: settings.initialBalance,
      equity: settings.initialBalance,
    });
  };

  // Master CSV Export Handler
  const handleExportCSV = () => {
    if (paperAccount.history.length > 0 || activeTrades.length > 0) {
      exportTradesToCSV([...activeTrades, ...paperAccount.history], "gold_fibonacci_all_trades.csv");
    } else if (strategyResult.signals.length > 0) {
      exportSignalsToCSV(strategyResult.signals, "gold_fibonacci_signals.csv");
    } else {
      alert("No trades or signals available to export yet.");
    }
  };

  const lastCandleTime = candles.length > 0 ? candles[candles.length - 1].time : 0;
  const lastEma9 = strategyResult.ema9.length > 0 ? strategyResult.ema9[strategyResult.ema9.length - 1] : currentPrice;
  const lastEma20 = strategyResult.ema20.length > 0 ? strategyResult.ema20[strategyResult.ema20.length - 1] : currentPrice;

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text flex flex-col font-sans selection:bg-gold-500/30">
      {/* 1. Header with Live Ticker Bar */}
      <Header
        currentPrice={currentPrice}
        bid={bid}
        ask={ask}
        spread={spread}
        change24h={change24h}
        changePercent24h={changePercent24h}
        high24h={high24h}
        low24h={low24h}
        isLive={isLive}
        sourceName={sourceName}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBacktest={() => setIsBacktestOpen(true)}
        onExportCSV={handleExportCSV}
      />

      {/* Main Terminal Body */}
      <main className="flex-1 p-3 md:p-5 max-w-[1720px] w-full mx-auto space-y-4">
        {/* 2. Market Overview & Strategy State Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <MarketOverview
              currentPrice={currentPrice}
              trend={strategyResult.trend}
              trendReason={strategyResult.phaseDescription}
              ema9Value={lastEma9}
              ema20Value={lastEma20}
              high24h={high24h}
              low24h={low24h}
              lastCandleTime={lastCandleTime}
            />
          </div>

          <div className="lg:col-span-2">
            <StrategyStateCard
              phase={strategyResult.phase}
              phaseDescription={strategyResult.phaseDescription}
              trend={strategyResult.trend}
              anchors={strategyResult.currentAnchors}
              zoneInfo={strategyResult.zoneInfo}
            />
          </div>
        </div>

        {/* 3. Interactive Chart & Live Signals Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Chart Section (3 cols on XL) */}
          <div className="xl:col-span-3 flex flex-col rounded-xl overflow-hidden border border-terminal-border bg-terminal-card shadow-2xl">
            <ChartControls
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              showEMA={showEMA}
              onToggleEMA={() => setShowEMA(!showEMA)}
              showSwings={showSwings}
              onToggleSwings={() => setShowSwings(!showSwings)}
              showFibLevels={showFibLevels}
              onToggleFibLevels={() => setShowFibLevels(!showFibLevels)}
              onRefresh={loadMarketData}
              isRefreshing={isRefreshing}
            />
            <div className="p-2">
              <CandlestickChart
                candles={candles}
                ema9={strategyResult.ema9}
                ema20={strategyResult.ema20}
                fibLevels={strategyResult.fibLevels}
                swings={strategyResult.swings}
                signals={strategyResult.signals}
                showEMA={showEMA}
                showSwings={showSwings}
                showFibLevels={showFibLevels}
              />
            </div>
          </div>

          {/* Signals & Fibonacci Levels Sidebar (1 col on XL) */}
          <div className="xl:col-span-1">
            <SignalsPanel
              signals={strategyResult.signals}
              fibLevels={strategyResult.fibLevels}
            />
          </div>
        </div>

        {/* 4. Bottom Terminal Tabs: Active Trades, Portfolio, History, Strategy Rules */}
        <div className="space-y-3">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-terminal-border pb-2 text-xs">
            <button
              onClick={() => setBottomTab("active")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                bottomTab === "active"
                  ? "bg-slate-800 text-white border border-terminal-border"
                  : "text-terminal-muted hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Active Paper Trades ({activeTrades.length})</span>
            </button>

            <button
              onClick={() => setBottomTab("portfolio")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                bottomTab === "portfolio"
                  ? "bg-slate-800 text-white border border-terminal-border"
                  : "text-terminal-muted hover:text-white"
              }`}
            >
              <BarChart3 className="w-4 h-4 text-gold-400" />
              <span>Paper Portfolio & Stats</span>
            </button>

            <button
              onClick={() => setBottomTab("history")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                bottomTab === "history"
                  ? "bg-slate-800 text-white border border-terminal-border"
                  : "text-terminal-muted hover:text-white"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Closed Trade History ({paperAccount.history.length})</span>
            </button>

            <button
              onClick={() => setBottomTab("strategyDoc")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                bottomTab === "strategyDoc"
                  ? "bg-slate-800 text-white border border-terminal-border"
                  : "text-terminal-muted hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Strategy Rules Guide</span>
            </button>
          </div>

          {/* Tab Panels */}
          {bottomTab === "active" && (
            <ActiveTrades trades={activeTrades} onManualClose={handleManualCloseTrade} />
          )}

          {bottomTab === "portfolio" && (
            <PaperAccountCard account={paperAccount} onResetAccount={handleResetAccount} />
          )}

          {bottomTab === "history" && (
            <TradeHistory history={paperAccount.history} />
          )}

          {bottomTab === "strategyDoc" && (
            <div className="bg-terminal-card border border-terminal-border rounded-xl p-6 shadow-xl text-xs space-y-4 font-mono text-slate-300">
              <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold-400" />
                QUANTITATIVE STRATEGY SPECIFICATION (XAUUSD 5M)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="space-y-2 p-3 bg-terminal-bg rounded-lg border border-terminal-border">
                  <h4 className="font-bold text-emerald-400 uppercase font-sans">
                    1. Trend & Structure
                  </h4>
                  <p>
                    Analyzed on 5-Minute timeframe using EMA 9 and EMA 20. Bullish requires price above both EMAs, EMA 9 &gt; EMA 20, and confirmed Higher High / Higher Low swings. Bearish requires price below both EMAs, EMA 9 &lt; EMA 20, and Lower High / Lower Low swings.
                  </p>
                </div>

                <div className="space-y-2 p-3 bg-terminal-bg rounded-lg border border-terminal-border">
                  <h4 className="font-bold text-gold-400 uppercase font-sans">
                    2. 3-Anchor Fib Extension
                  </h4>
                  <p>
                    Utilizes actual 3-anchor Trend-Based Fibonacci Extension: Anchor 1 (Swing Low/High), Anchor 2 (Swing High/Low), and Anchor 3 (Pullback Low/High). Pullback must not invalidate the previous major swing.
                  </p>
                </div>

                <div className="space-y-2 p-3 bg-terminal-bg rounded-lg border border-terminal-border">
                  <h4 className="font-bold text-cyan-400 uppercase font-sans">
                    3. 0.618 Breakout & 1.414 Target
                  </h4>
                  <p>
                    First zone is 0.500-0.618. Valid signal triggers when completed candle closes beyond 0.618 by at least 50% of the zone width. Never enters on wick touches. Automatically takes profit at 1.414 Fibonacci extension target.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="border-t border-terminal-border bg-terminal-card px-4 py-2 text-[11px] font-mono text-terminal-muted flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            Terminal Engine Active
          </span>
          <span>Source: {sourceName}</span>
          <span>Symbol: XAUUSD (Gold / US Dollar)</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Target: Fib 1.414</span>
          <span>Zone Confirmation: ≥50% buffer</span>
          <span className="text-slate-400">TradingView Lightweight Charts v4.2</span>
        </div>
      </footer>

      {/* Modals */}
      <BacktestModal
        isOpen={isBacktestOpen}
        onClose={() => setIsBacktestOpen(false)}
        candles={candles}
        settings={settings}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(newS) => setSettings(newS)}
      />
    </div>
  );
}
