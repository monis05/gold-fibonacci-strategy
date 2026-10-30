import type { Candle, SwingPoint, TrendDirection, MarketStructureType } from "../../types/trading.ts";

export interface MarketStructureAnalysis {
  trend: TrendDirection;
  labeledSwings: SwingPoint[];
  lastHigh: SwingPoint | null;
  lastLow: SwingPoint | null;
  prevHigh: SwingPoint | null;
  prevLow: SwingPoint | null;
  reason: string;
}

/**
 * Labels swing highs as Higher High (HH) or Lower High (LH)
 * and swing lows as Higher Low (HL) or Lower Low (LL).
 */
export function labelMarketStructure(swings: SwingPoint[]): SwingPoint[] {
  const result: SwingPoint[] = [];
  let prevHigh: SwingPoint | null = null;
  let prevLow: SwingPoint | null = null;

  for (const swing of swings) {
    const labeled: SwingPoint = { ...swing };

    if (swing.type === "HIGH") {
      if (prevHigh === null) {
        labeled.label = "NEUTRAL";
      } else if (swing.price > prevHigh.price) {
        labeled.label = "HH";
      } else {
        labeled.label = "LH";
      }
      prevHigh = labeled;
    } else {
      if (prevLow === null) {
        labeled.label = "NEUTRAL";
      } else if (swing.price > prevLow.price) {
        labeled.label = "HL";
      } else {
        labeled.label = "LL";
      }
      prevLow = labeled;
    }

    result.push(labeled);
  }

  return result;
}

/**
 * Analyzes market trend based on:
 * 1. Price vs EMA 9 and EMA 20
 * 2. EMA 9 vs EMA 20 alignment
 * 3. Market structure (HH/HL for bullish, LH/LL for bearish)
 */
export function analyzeMarketStructure(
  candles: Candle[],
  ema9: number[],
  ema20: number[],
  swings: SwingPoint[],
  currentIndex?: number
): MarketStructureAnalysis {
  const idx = currentIndex !== undefined ? currentIndex : candles.length - 1;
  if (idx < 20 || candles.length < 20) {
    return {
      trend: "NO_TRADE",
      labeledSwings: [],
      lastHigh: null,
      lastLow: null,
      prevHigh: null,
      prevLow: null,
      reason: "Insufficient candle history (minimum 20 candles needed).",
    };
  }

  const currentCandle = candles[idx];
  const e9 = ema9[idx];
  const e20 = ema20[idx];

  // Filter swings up to current index
  const pastSwings = swings.filter((s) => s.index <= idx);
  const labeledSwings = labelMarketStructure(pastSwings);

  // Find recent highs and lows
  const highs = labeledSwings.filter((s) => s.type === "HIGH");
  const lows = labeledSwings.filter((s) => s.type === "LOW");

  const lastHigh = highs.length > 0 ? highs[highs.length - 1] : null;
  const prevHigh = highs.length > 1 ? highs[highs.length - 2] : null;
  const lastLow = lows.length > 0 ? lows[lows.length - 1] : null;
  const prevLow = lows.length > 1 ? lows[lows.length - 2] : null;

  const isPriceAboveEMAs = currentCandle.close > e9 && currentCandle.close > e20;
  const isPriceBelowEMAs = currentCandle.close < e9 && currentCandle.close < e20;
  const isEmaBullish = e9 >= e20;
  const isEmaBearish = e9 <= e20;

  // Structure conditions
  const isStructureBullish =
    (lastHigh?.label === "HH" || (prevHigh && lastHigh && lastHigh.price > prevHigh.price)) &&
    (lastLow?.label === "HL" || (prevLow && lastLow && lastLow.price > prevLow.price));

  const isStructureBearish =
    (lastHigh?.label === "LH" || (prevHigh && lastHigh && lastHigh.price < prevHigh.price)) &&
    (lastLow?.label === "LL" || (prevLow && lastLow && lastLow.price < prevLow.price));

  // Determine trend
  if (isPriceAboveEMAs && isEmaBullish && isStructureBullish) {
    return {
      trend: "BULLISH",
      labeledSwings,
      lastHigh,
      lastLow,
      prevHigh,
      prevLow,
      reason: "Price above EMA 9/20, EMA 9 > EMA 20, and confirmed HH / HL market structure.",
    };
  }

  if (isPriceBelowEMAs && isEmaBearish && isStructureBearish) {
    return {
      trend: "BEARISH",
      labeledSwings,
      lastHigh,
      lastLow,
      prevHigh,
      prevLow,
      reason: "Price below EMA 9/20, EMA 9 < EMA 20, and confirmed LH / LL market structure.",
    };
  }

  return {
    trend: "NO_TRADE",
    labeledSwings,
    lastHigh,
    lastLow,
    prevHigh,
    prevLow,
    reason: "Trend signals conflict or market structure is consolidating (NO TRADE).",
  };
}
