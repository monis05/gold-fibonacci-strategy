export interface Candle {
  time: number; // UNIX timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TimeFrame = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export type TrendDirection = "BULLISH" | "BEARISH" | "NO_TRADE";

export type MarketStructureType = "HH" | "HL" | "LH" | "LL" | "NEUTRAL";

export interface SwingPoint {
  index: number;
  time: number;
  price: number;
  type: "HIGH" | "LOW";
  label?: MarketStructureType;
}

export interface FibAnchors {
  anchor1: { time: number; price: number; type: "SWING_HIGH" | "SWING_LOW" };
  anchor2: { time: number; price: number; type: "SWING_HIGH" | "SWING_LOW" };
  anchor3: { time: number; price: number; type: "PULLBACK_HIGH" | "PULLBACK_LOW" };
  direction: "BULLISH" | "BEARISH";
  impulseDistance: number;
}

export interface FibLevel {
  ratio: number;
  price: number;
  label: string;
  color: string;
  isBreakoutTrigger?: boolean;
  isTarget?: boolean;
}

export type StrategyPhase =
  | "WAITING_FOR_TREND"
  | "WAITING_FOR_PULLBACK"
  | "FIBONACCI_APPLIED"
  | "WAITING_FOR_BREAKOUT"
  | "SIGNAL_CONFIRMED"
  | "TRADE_ACTIVE"
  | "TARGET_HIT"
  | "INVALIDATED"
  | "CANCELLED";

export type SignalType = "BUY" | "SELL" | "NONE";

export interface StrategySignal {
  id: string;
  time: number;
  symbol: string;
  type: SignalType;
  entryPrice: number;
  breakoutLevel: number;
  zoneBoundary050: number;
  zoneBoundary0618: number;
  zoneWidth: number;
  breakoutDistance: number;
  targetPrice: number; // 1.414 target
  stopLossPrice: number; // Swing invalidation
  riskRewardRatio: number;
  anchors: FibAnchors;
  candleIndex: number;
  status: "ACTIVE" | "COMPLETED" | "INVALIDATED";
}

export interface PaperTrade {
  id: string;
  signalId: string;
  symbol: string;
  direction: "BUY" | "SELL";
  entryPrice: number;
  entryTime: number;
  targetPrice: number; // 1.414
  stopLossPrice: number;
  currentPrice: number;
  lotSize: number; // e.g. 1.00 lot (100 oz)
  unrealizedPL: number;
  realizedPL?: number;
  pips: number;
  durationSeconds: number;
  status: StrategyPhase;
  exitPrice?: number;
  exitTime?: number;
  exitReason?: "TARGET_HIT" | "STOP_INVALIDATED" | "MANUAL_CLOSE";
  anchors: FibAnchors;
}

export interface PaperAccount {
  balance: number;
  equity: number;
  marginUsed: number;
  freeMargin: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  netProfit: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  history: PaperTrade[];
}

export interface StrategySettings {
  timeframe: TimeFrame;
  emaFast: number; // 9
  emaSlow: number; // 20
  swingLookback: number; // 5
  fibTargetRatio: number; // 1.414
  zoneWidthThresholdPercent: number; // 50%
  stopLossMode: "ANCHOR3_SWING" | "PREVIOUS_STRUCTURE_SWING";
  visibleFibLevels: {
    ratio: number;
    enabled: boolean;
  }[];
  lotSize: number; // default 1.00 lot
  initialBalance: number; // $10,000
}

export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  netProfit: number;
  netProfitPercent: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  trades: PaperTrade[];
  equityCurve: { time: number; equity: number }[];
}
