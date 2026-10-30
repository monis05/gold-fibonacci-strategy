import {
  Candle,
  FibAnchors,
  FibLevel,
  StrategyPhase,
  StrategySettings,
  StrategySignal,
  SwingPoint,
  TrendDirection,
} from "@/types/trading";
import { calculateEMA, identifySwingPoints } from "./indicators";
import { analyzeMarketStructure, labelMarketStructure } from "./marketStructure";
import {
  calculateBreakoutZone,
  calculateTrendBasedFibonacci,
  DEFAULT_FIB_CONFIG,
} from "./fibonacci";

export interface StrategyEngineOutput {
  trend: TrendDirection;
  phase: StrategyPhase;
  phaseDescription: string;
  ema9: number[];
  ema20: number[];
  swings: SwingPoint[];
  currentAnchors: FibAnchors | null;
  fibLevels: FibLevel[];
  signals: StrategySignal[];
  latestSignal: StrategySignal | null;
  zoneInfo: {
    price050: number;
    price0618: number;
    target1414: number;
    zoneWidth: number;
    breakoutThreshold: number;
  } | null;
}

export const DEFAULT_STRATEGY_SETTINGS: StrategySettings = {
  timeframe: "5m",
  emaFast: 9,
  emaSlow: 20,
  swingLookback: 3,
  fibTargetRatio: 1.414,
  zoneWidthThresholdPercent: 0.5,
  stopLossMode: "ANCHOR3_SWING",
  visibleFibLevels: DEFAULT_FIB_CONFIG,
  lotSize: 1.0,
  initialBalance: 10000,
};

/**
 * Runs the complete Trend-Based Fibonacci Breakout Strategy on candle data
 */
export function runStrategy(
  candles: Candle[],
  settings: StrategySettings = DEFAULT_STRATEGY_SETTINGS
): StrategyEngineOutput {
  if (candles.length < 25) {
    return {
      trend: "NO_TRADE",
      phase: "WAITING_FOR_TREND",
      phaseDescription: "Awaiting historical candle load...",
      ema9: [],
      ema20: [],
      swings: [],
      currentAnchors: null,
      fibLevels: [],
      signals: [],
      latestSignal: null,
      zoneInfo: null,
    };
  }

  const closes = candles.map((c) => c.close);
  const ema9 = calculateEMA(closes, settings.emaFast);
  const ema20 = calculateEMA(closes, settings.emaSlow);
  const rawSwings = identifySwingPoints(candles, settings.swingLookback);
  const swings = labelMarketStructure(rawSwings);

  const signals: StrategySignal[] = [];
  let currentAnchors: FibAnchors | null = null;
  let activePhase: StrategyPhase = "WAITING_FOR_TREND";
  let phaseDesc = "Scanning for 5M market trend and EMA 9/20 alignment.";

  // Track signals over history without look-ahead bias
  const processedBarIndices = new Set<number>();

  for (let i = 25; i < candles.length; i++) {
    const analysis = analyzeMarketStructure(candles, ema9, ema20, swings, i);
    const trend = analysis.trend;
    const currentCandle = candles[i];

    if (trend === "NO_TRADE") {
      if (i === candles.length - 1) {
        activePhase = "WAITING_FOR_TREND";
        phaseDesc = analysis.reason;
      }
      continue;
    }

    // Get swings prior to current bar
    const pastSwings = swings.filter((s) => s.index < i);
    if (pastSwings.length < 3) continue;

    if (trend === "BULLISH") {
      // For Bullish Trend:
      // Anchor 1: Swing Low (past)
      // Anchor 2: Swing High (after Anchor 1)
      // Anchor 3: Pullback Low (after Anchor 2, but must not invalidate Anchor 1 Low)
      const recentHighs = pastSwings.filter((s) => s.type === "HIGH");
      const recentLows = pastSwings.filter((s) => s.type === "LOW");

      if (recentHighs.length >= 1 && recentLows.length >= 2) {
        const lastLow = recentLows[recentLows.length - 1]; // Potential Anchor 3 (Pullback Low)
        const lastHigh = recentHighs[recentHighs.length - 1]; // Potential Anchor 2 (Swing High)
        const prevLow = recentLows[recentLows.length - 2]; // Potential Anchor 1 (Swing Low)

        // Valid sequence: prevLow -> lastHigh -> lastLow
        if (
          prevLow.index < lastHigh.index &&
          lastHigh.index < lastLow.index &&
          lastLow.price > prevLow.price && // Confirm previous swing low is NOT invalidated
          lastHigh.price > prevLow.price
        ) {
          const impulse = lastHigh.price - prevLow.price;
          const candidateAnchors: FibAnchors = {
            anchor1: { time: prevLow.time, price: prevLow.price, type: "SWING_LOW" },
            anchor2: { time: lastHigh.time, price: lastHigh.price, type: "SWING_HIGH" },
            anchor3: { time: lastLow.time, price: lastLow.price, type: "PULLBACK_LOW" },
            direction: "BULLISH",
            impulseDistance: impulse,
          };

          currentAnchors = candidateAnchors;
          const zone = calculateBreakoutZone(candidateAnchors, settings.zoneWidthThresholdPercent);

          if (i === candles.length - 1) {
            activePhase = "FIBONACCI_APPLIED";
            phaseDesc = `Bullish Fib plotted (0.618 at $${zone.price0618.toFixed(2)}, Target at $${zone.target1414.toFixed(2)}). Waiting for 0.618 breakout close.`;
          }

          // Check if current candle reaches 0.500-0.618 zone and confirms breakout
          // Condition: completed candle closes above 0.618 + 50% buffer, and is bullish
          const isGreenCandle = currentCandle.close > currentCandle.open;
          const isBreakout = currentCandle.close >= zone.breakoutThreshold;

          if (isGreenCandle && isBreakout && !processedBarIndices.has(i)) {
            // Confirm previous bar was not already triggered
            const stopLoss =
              settings.stopLossMode === "ANCHOR3_SWING" ? candidateAnchors.anchor3.price : candidateAnchors.anchor1.price;
            const risk = currentCandle.close - stopLoss;
            const reward = zone.target1414 - currentCandle.close;
            const rr = risk > 0 ? Number((reward / risk).toFixed(2)) : 1.5;

            signals.push({
              id: `sig-bull-${i}-${currentCandle.time}`,
              time: currentCandle.time,
              symbol: "XAUUSD",
              type: "BUY",
              entryPrice: currentCandle.close,
              breakoutLevel: zone.price0618,
              zoneBoundary050: zone.price050,
              zoneBoundary0618: zone.price0618,
              zoneWidth: zone.zoneWidth,
              breakoutDistance: Number((currentCandle.close - zone.price0618).toFixed(3)),
              targetPrice: zone.target1414,
              stopLossPrice: Number(stopLoss.toFixed(3)),
              riskRewardRatio: rr,
              anchors: candidateAnchors,
              candleIndex: i,
              status: "ACTIVE",
            });

            processedBarIndices.add(i);

            if (i === candles.length - 1) {
              activePhase = "SIGNAL_CONFIRMED";
              phaseDesc = `BUY SIGNAL CONFIRMED at $${currentCandle.close.toFixed(2)}! Closed above 0.618 with 50% buffer.`;
            }
          }
        }
      }
    } else if (trend === "BEARISH") {
      // For Bearish Trend:
      // Anchor 1: Swing High (past)
      // Anchor 2: Swing Low (after Anchor 1)
      // Anchor 3: Pullback High (after Anchor 2, must not invalidate Anchor 1 High)
      const recentHighs = pastSwings.filter((s) => s.type === "HIGH");
      const recentLows = pastSwings.filter((s) => s.type === "LOW");

      if (recentHighs.length >= 2 && recentLows.length >= 1) {
        const lastHigh = recentHighs[recentHighs.length - 1]; // Potential Anchor 3 (Pullback High)
        const lastLow = recentLows[recentLows.length - 1]; // Potential Anchor 2 (Swing Low)
        const prevHigh = recentHighs[recentHighs.length - 2]; // Potential Anchor 1 (Swing High)

        // Valid sequence: prevHigh -> lastLow -> lastHigh
        if (
          prevHigh.index < lastLow.index &&
          lastLow.index < lastHigh.index &&
          lastHigh.price < prevHigh.price && // Confirm previous swing high is NOT invalidated
          lastLow.price < prevHigh.price
        ) {
          const impulse = prevHigh.price - lastLow.price;
          const candidateAnchors: FibAnchors = {
            anchor1: { time: prevHigh.time, price: prevHigh.price, type: "SWING_HIGH" },
            anchor2: { time: lastLow.time, price: lastLow.price, type: "SWING_LOW" },
            anchor3: { time: lastHigh.time, price: lastHigh.price, type: "PULLBACK_HIGH" },
            direction: "BEARISH",
            impulseDistance: impulse,
          };

          currentAnchors = candidateAnchors;
          const zone = calculateBreakoutZone(candidateAnchors, settings.zoneWidthThresholdPercent);

          if (i === candles.length - 1) {
            activePhase = "FIBONACCI_APPLIED";
            phaseDesc = `Bearish Fib plotted (0.618 at $${zone.price0618.toFixed(2)}, Target at $${zone.target1414.toFixed(2)}). Waiting for 0.618 breakout close.`;
          }

          // Check if current candle reaches 0.500-0.618 zone and confirms breakout
          // Condition: completed candle closes below 0.618 - 50% buffer, and is bearish
          const isRedCandle = currentCandle.close < currentCandle.open;
          const isBreakout = currentCandle.close <= zone.breakoutThreshold;

          if (isRedCandle && isBreakout && !processedBarIndices.has(i)) {
            const stopLoss =
              settings.stopLossMode === "ANCHOR3_SWING" ? candidateAnchors.anchor3.price : candidateAnchors.anchor1.price;
            const risk = stopLoss - currentCandle.close;
            const reward = currentCandle.close - zone.target1414;
            const rr = risk > 0 ? Number((reward / risk).toFixed(2)) : 1.5;

            signals.push({
              id: `sig-bear-${i}-${currentCandle.time}`,
              time: currentCandle.time,
              symbol: "XAUUSD",
              type: "SELL",
              entryPrice: currentCandle.close,
              breakoutLevel: zone.price0618,
              zoneBoundary050: zone.price050,
              zoneBoundary0618: zone.price0618,
              zoneWidth: zone.zoneWidth,
              breakoutDistance: Number((zone.price0618 - currentCandle.close).toFixed(3)),
              targetPrice: zone.target1414,
              stopLossPrice: Number(stopLoss.toFixed(3)),
              riskRewardRatio: rr,
              anchors: candidateAnchors,
              candleIndex: i,
              status: "ACTIVE",
            });

            processedBarIndices.add(i);

            if (i === candles.length - 1) {
              activePhase = "SIGNAL_CONFIRMED";
              phaseDesc = `SELL SIGNAL CONFIRMED at $${currentCandle.close.toFixed(2)}! Closed below 0.618 with 50% buffer.`;
            }
          }
        }
      }
    }
  }

  // Calculate Fibonacci levels for current anchors
  const fibLevels = currentAnchors
    ? calculateTrendBasedFibonacci(currentAnchors, settings)
    : [];

  const zoneInfo = currentAnchors
    ? calculateBreakoutZone(currentAnchors, settings.zoneWidthThresholdPercent)
    : null;

  const currentAnalysis = analyzeMarketStructure(candles, ema9, ema20, swings);

  return {
    trend: currentAnalysis.trend,
    phase: activePhase,
    phaseDescription: phaseDesc,
    ema9,
    ema20,
    swings,
    currentAnchors,
    fibLevels,
    signals,
    latestSignal: signals.length > 0 ? signals[signals.length - 1] : null,
    zoneInfo,
  };
}
