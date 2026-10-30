import { BacktestResult, Candle, PaperTrade, StrategySettings } from "@/types/trading";
import { runStrategy, DEFAULT_STRATEGY_SETTINGS } from "./strategyEngine";
import { openPaperTradeFromSignal, updatePaperTrades, INITIAL_ACCOUNT_STATE } from "../paperTrading/paperTradingEngine";

/**
 * Executes a tick-by-tick / candle-by-candle backtest over historical candles
 * Strictly prevents look-ahead bias by advancing bar by bar
 */
export function runBacktest(
  candles: Candle[],
  settings: StrategySettings = DEFAULT_STRATEGY_SETTINGS,
  startDate?: number,
  endDate?: number
): BacktestResult {
  // Filter by date range if provided
  let testCandles = candles;
  if (startDate) {
    testCandles = testCandles.filter((c) => c.time >= startDate);
  }
  if (endDate) {
    testCandles = testCandles.filter((c) => c.time <= endDate);
  }

  if (testCandles.length < 30) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      profitFactor: 0,
      netProfit: 0,
      netProfitPercent: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      trades: [],
      equityCurve: [],
    };
  }

  let account = { ...INITIAL_ACCOUNT_STATE, balance: settings.initialBalance, equity: settings.initialBalance };
  let activeTrades: PaperTrade[] = [];
  const closedTrades: PaperTrade[] = [];
  const equityCurve: { time: number; equity: number }[] = [
    { time: testCandles[0].time, equity: settings.initialBalance },
  ];

  const processedSignalIds = new Set<string>();

  // Walk forward bar by bar
  for (let i = 25; i < testCandles.length; i++) {
    const historicalSlice = testCandles.slice(0, i + 1);
    const currentBar = testCandles[i];

    // 1. Update any existing active trades against the current bar's price action
    if (activeTrades.length > 0) {
      const updateResult = updatePaperTrades(activeTrades, currentBar, account);
      activeTrades = updateResult.updatedActiveTrades;
      account = updateResult.updatedAccount;

      for (const closed of updateResult.newlyClosedTrades) {
        closedTrades.push(closed);
      }
    }

    // 2. Run strategy on the current slice to check for new signals
    const strategyResult = runStrategy(historicalSlice, settings);

    if (strategyResult.latestSignal && !processedSignalIds.has(strategyResult.latestSignal.id)) {
      // Avoid stacking too many concurrent trades if one is already active in the same direction
      const hasOppositeActive = activeTrades.some(
        (t) => t.direction !== strategyResult.latestSignal?.type
      );

      // Only enter if no conflicting position
      if (!hasOppositeActive && activeTrades.length < 3) {
        const newTrade = openPaperTradeFromSignal(strategyResult.latestSignal, settings.lotSize);
        activeTrades.push(newTrade);
        processedSignalIds.add(strategyResult.latestSignal.id);
      }
    }

    equityCurve.push({
      time: currentBar.time,
      equity: account.equity,
    });
  }

  // Calculate gross profits and gross losses for profit factor
  let grossProfit = 0;
  let grossLoss = 0;

  for (const t of closedTrades) {
    const pl = t.realizedPL || 0;
    if (pl > 0) {
      grossProfit += pl;
    } else {
      grossLoss += Math.abs(pl);
    }
  }

  const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.9 : 0;
  const netProfit = Number((account.balance - settings.initialBalance).toFixed(2));
  const netProfitPercent = Number(((netProfit / settings.initialBalance) * 100).toFixed(2));

  return {
    totalTrades: account.totalTrades,
    winningTrades: account.winningTrades,
    losingTrades: account.losingTrades,
    winRate: account.winRate,
    profitFactor,
    netProfit,
    netProfitPercent,
    maxDrawdown: account.maxDrawdown,
    maxDrawdownPercent: account.maxDrawdownPercent,
    trades: closedTrades,
    equityCurve,
  };
}
