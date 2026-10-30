import type { Candle, PaperAccount, PaperTrade, StrategySignal } from "../../types/trading.ts";

export const INITIAL_ACCOUNT_STATE: PaperAccount = {
  balance: 10000,
  equity: 10000,
  marginUsed: 0,
  freeMargin: 10000,
  winRate: 0,
  totalTrades: 0,
  winningTrades: 0,
  losingTrades: 0,
  netProfit: 0,
  maxDrawdown: 0,
  maxDrawdownPercent: 0,
  history: [],
};

const GOLD_CONTRACT_SIZE = 100; // 1 standard lot = 100 oz

/**
 * Calculates unrealized profit/loss for a gold paper trade
 */
export function calculateTradePL(
  trade: PaperTrade,
  currentPrice: number
): { unrealizedPL: number; pips: number } {
  let diff = 0;
  if (trade.direction === "BUY") {
    diff = currentPrice - trade.entryPrice;
  } else {
    diff = trade.entryPrice - currentPrice;
  }

  const unrealizedPL = Number((diff * trade.lotSize * GOLD_CONTRACT_SIZE).toFixed(2));
  const pips = Number((diff * 10).toFixed(1)); // 0.10 price move = 1 pip in Gold

  return { unrealizedPL, pips };
}

/**
 * Creates a new active paper trade from a strategy signal
 */
export function openPaperTradeFromSignal(
  signal: StrategySignal,
  lotSize: number = 1.0
): PaperTrade {
  return {
    id: `trade-${signal.id}-${Date.now()}`,
    signalId: signal.id,
    symbol: "XAUUSD",
    direction: signal.type === "BUY" ? "BUY" : "SELL",
    entryPrice: signal.entryPrice,
    entryTime: signal.time,
    targetPrice: signal.targetPrice,
    stopLossPrice: signal.stopLossPrice,
    currentPrice: signal.entryPrice,
    lotSize,
    unrealizedPL: 0,
    pips: 0,
    durationSeconds: 0,
    status: "TRADE_ACTIVE",
    anchors: signal.anchors,
  };
}

/**
 * Updates active trades with the latest candle / tick price and checks for TP/SL exits
 */
export function updatePaperTrades(
  activeTrades: PaperTrade[],
  currentCandle: Candle,
  account: PaperAccount
): {
  updatedActiveTrades: PaperTrade[];
  newlyClosedTrades: PaperTrade[];
  updatedAccount: PaperAccount;
} {
  const updatedActiveTrades: PaperTrade[] = [];
  const newlyClosedTrades: PaperTrade[] = [];

  let currentEquity = account.balance;
  let newWinning = account.winningTrades;
  let newLosing = account.losingTrades;
  let newNetProfit = account.netProfit;
  let newBalance = account.balance;

  for (const trade of activeTrades) {
    const { unrealizedPL, pips } = calculateTradePL(trade, currentCandle.close);
    const duration = Math.max(0, currentCandle.time - trade.entryTime);

    let isClosed = false;
    let exitPrice = currentCandle.close;
    let exitReason: "TARGET_HIT" | "STOP_INVALIDATED" | undefined = undefined;

    if (trade.direction === "BUY") {
      // Check if high touched or exceeded 1.414 target
      if (currentCandle.high >= trade.targetPrice) {
        isClosed = true;
        exitPrice = trade.targetPrice;
        exitReason = "TARGET_HIT";
      } else if (currentCandle.low <= trade.stopLossPrice) {
        isClosed = true;
        exitPrice = trade.stopLossPrice;
        exitReason = "STOP_INVALIDATED";
      }
    } else {
      // SELL trade
      if (currentCandle.low <= trade.targetPrice) {
        isClosed = true;
        exitPrice = trade.targetPrice;
        exitReason = "TARGET_HIT";
      } else if (currentCandle.high >= trade.stopLossPrice) {
        isClosed = true;
        exitPrice = trade.stopLossPrice;
        exitReason = "STOP_INVALIDATED";
      }
    }

    if (isClosed) {
      let realizedPL = 0;
      if (trade.direction === "BUY") {
        realizedPL = (exitPrice - trade.entryPrice) * trade.lotSize * GOLD_CONTRACT_SIZE;
      } else {
        realizedPL = (trade.entryPrice - exitPrice) * trade.lotSize * GOLD_CONTRACT_SIZE;
      }
      realizedPL = Number(realizedPL.toFixed(2));

      newBalance += realizedPL;
      newNetProfit += realizedPL;
      if (realizedPL > 0) {
        newWinning += 1;
      } else {
        newLosing += 1;
      }

      newlyClosedTrades.push({
        ...trade,
        currentPrice: exitPrice,
        exitPrice,
        exitTime: currentCandle.time,
        exitReason,
        realizedPL,
        durationSeconds: duration,
        status: exitReason === "TARGET_HIT" ? "TARGET_HIT" : "INVALIDATED",
      });
    } else {
      // Still active
      currentEquity += unrealizedPL;
      updatedActiveTrades.push({
        ...trade,
        currentPrice: currentCandle.close,
        unrealizedPL,
        pips,
        durationSeconds: duration,
      });
    }
  }

  const allClosedHistory = [...newlyClosedTrades, ...account.history];
  const totalCompleted = newWinning + newLosing;
  const winRate = totalCompleted > 0 ? Number(((newWinning / totalCompleted) * 100).toFixed(1)) : 0;

  // Calculate Max Drawdown
  let peak = account.balance;
  let maxDD = account.maxDrawdown;
  let maxDDPct = account.maxDrawdownPercent;

  if (currentEquity > peak) {
    peak = currentEquity;
  }
  const drawdown = peak - currentEquity;
  if (drawdown > maxDD) {
    maxDD = Number(drawdown.toFixed(2));
    maxDDPct = peak > 0 ? Number(((maxDD / peak) * 100).toFixed(2)) : 0;
  }

  const updatedAccount: PaperAccount = {
    ...account,
    balance: Number(newBalance.toFixed(2)),
    equity: Number(currentEquity.toFixed(2)),
    winRate,
    totalTrades: totalCompleted,
    winningTrades: newWinning,
    losingTrades: newLosing,
    netProfit: Number(newNetProfit.toFixed(2)),
    maxDrawdown: maxDD,
    maxDrawdownPercent: maxDDPct,
    history: allClosedHistory,
  };

  return { updatedActiveTrades, newlyClosedTrades, updatedAccount };
}
