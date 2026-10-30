import type { Candle, SwingPoint } from "../../types/trading.ts";

/**
 * Calculates Exponential Moving Average (EMA) for an array of numbers
 */
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length < period) return result;

  const multiplier = 2 / (period + 1);

  // Initialize with Simple Moving Average (SMA) of first `period` elements
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  let prevEMA = sum / period;
  result[period - 1] = prevEMA;

  // Calculate subsequent EMAs
  for (let i = period; i < data.length; i++) {
    const currentVal = data[i];
    const currentEMA = (currentVal - prevEMA) * multiplier + prevEMA;
    result[i] = currentEMA;
    prevEMA = currentEMA;
  }

  return result;
}

/**
 * Calculates Average True Range (ATR)
 */
export function calculateATR(candles: Candle[], period: number = 14): number[] {
  const atr: number[] = new Array(candles.length).fill(0);
  if (candles.length < 2) return atr;

  const trueRanges: number[] = [candles[0].high - candles[0].low];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  // Calculate smoothed ATR
  let sum = 0;
  for (let i = 0; i < Math.min(period, trueRanges.length); i++) {
    sum += trueRanges[i];
  }
  let currentATR = sum / period;
  if (period - 1 < atr.length) {
    atr[period - 1] = currentATR;
  }

  for (let i = period; i < trueRanges.length; i++) {
    currentATR = (currentATR * (period - 1) + trueRanges[i]) / period;
    atr[i] = currentATR;
  }

  return atr;
}

/**
 * Identifies Swing Highs and Swing Lows using pivot window lookback
 * A pivot high has `lookback` lower highs to its left and right.
 * A pivot low has `lookback` higher lows to its left and right.
 */
export function identifySwingPoints(
  candles: Candle[],
  lookback: number = 3
): SwingPoint[] {
  const swings: SwingPoint[] = [];

  for (let i = lookback; i < candles.length - lookback; i++) {
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;

    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= lookback; j++) {
      if (candles[i - j].high >= currentHigh || candles[i + j].high > currentHigh) {
        isHigh = false;
      }
      if (candles[i - j].low <= currentLow || candles[i + j].low < currentLow) {
        isLow = false;
      }
    }

    if (isHigh) {
      swings.push({
        index: i,
        time: candles[i].time,
        price: currentHigh,
        type: "HIGH",
      });
    }

    if (isLow) {
      swings.push({
        index: i,
        time: candles[i].time,
        price: currentLow,
        type: "LOW",
      });
    }
  }

  // Sort chronologically
  return swings.sort((a, b) => a.index - b.index);
}
