import { describe, it } from "node:test";
import assert from "node:assert";
import { calculateEMA, identifySwingPoints } from "../src/lib/strategy/indicators.ts";
import { labelMarketStructure } from "../src/lib/strategy/marketStructure.ts";
import { calculateBreakoutZone, calculateTrendBasedFibonacci } from "../src/lib/strategy/fibonacci.ts";
import type { FibAnchors, Candle } from "../src/types/trading.ts";
import { calculateTradePL } from "../src/lib/paperTrading/paperTradingEngine.ts";

describe("Gold Fibonacci Strategy Engine Unit Tests", () => {
  it("should correctly compute EMA 9 and EMA 20", () => {
    const data = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    const ema9 = calculateEMA(data, 9);
    assert.strictEqual(ema9.length, data.length);
    assert.ok(isNaN(ema9[0]));
    assert.ok(isNaN(ema9[7]));
    assert.ok(!isNaN(ema9[8])); // 9th element has SMA seed
    assert.ok(!isNaN(ema9[12]));
    assert.ok(ema9[12] > ema9[8]); // upward trend
  });

  it("should accurately detect swing points and pivot highs/lows", () => {
    // Generate synthetic candles with a clear peak and valley
    const candles: Candle[] = [
      { time: 100, open: 2700, high: 2705, low: 2698, close: 2702, volume: 100 },
      { time: 200, open: 2702, high: 2715, low: 2701, close: 2712, volume: 100 },
      { time: 300, open: 2712, high: 2730, low: 2710, close: 2728, volume: 100 }, // Peak High
      { time: 400, open: 2728, high: 2720, low: 2710, close: 2715, volume: 100 },
      { time: 500, open: 2715, high: 2712, low: 2690, close: 2695, volume: 100 }, // Valley Low
      { time: 600, open: 2695, high: 2708, low: 2694, close: 2705, volume: 100 },
      { time: 700, open: 2705, high: 2710, low: 2700, close: 2708, volume: 100 },
    ];

    const swings = identifySwingPoints(candles, 1);
    assert.ok(swings.length >= 2);
    const high = swings.find((s) => s.type === "HIGH");
    const low = swings.find((s) => s.type === "LOW");
    assert.strictEqual(high?.price, 2730);
    assert.strictEqual(low?.price, 2690);
  });

  it("should correctly label HH, HL, LH, LL structure", () => {
    const rawSwings = [
      { index: 1, time: 100, price: 2700, type: "HIGH" as const },
      { index: 2, time: 200, price: 2680, type: "LOW" as const },
      { index: 3, time: 300, price: 2720, type: "HIGH" as const }, // HH
      { index: 4, time: 400, price: 2690, type: "LOW" as const }, // HL
    ];

    const labeled = labelMarketStructure(rawSwings);
    assert.strictEqual(labeled[2].label, "HH");
    assert.strictEqual(labeled[3].label, "HL");
  });

  it("should calculate correct 3-anchor Trend-Based Fibonacci Extension levels for Bullish trend", () => {
    // Anchor 1 (Swing Low): 2700
    // Anchor 2 (Swing High): 2750 -> Impulse = 50
    // Anchor 3 (Pullback Low): 2730
    const anchors: FibAnchors = {
      anchor1: { time: 100, price: 2700, type: "SWING_LOW" },
      anchor2: { time: 200, price: 2750, type: "SWING_HIGH" },
      anchor3: { time: 300, price: 2730, type: "PULLBACK_LOW" },
      direction: "BULLISH",
      impulseDistance: 50,
    };

    const levels = calculateTrendBasedFibonacci(anchors);
    const fib0 = levels.find((l) => l.ratio === 0.0);
    const fib05 = levels.find((l) => l.ratio === 0.5);
    const fib0618 = levels.find((l) => l.ratio === 0.618);
    const fib1414 = levels.find((l) => l.ratio === 1.414);

    // Level = 2730 + ratio * 50
    assert.strictEqual(fib0?.price, 2730);
    assert.strictEqual(fib05?.price, 2755); // 2730 + 25
    assert.strictEqual(fib0618?.price, 2760.9); // 2730 + 30.9
    assert.strictEqual(fib1414?.price, 2800.7); // 2730 + 70.7
  });

  it("should calculate correct 3-anchor Trend-Based Fibonacci Extension levels for Bearish trend", () => {
    // Anchor 1 (Swing High): 2750
    // Anchor 2 (Swing Low): 2700 -> Impulse = 50
    // Anchor 3 (Pullback High): 2730
    const anchors: FibAnchors = {
      anchor1: { time: 100, price: 2750, type: "SWING_HIGH" },
      anchor2: { time: 200, price: 2700, type: "SWING_LOW" },
      anchor3: { time: 300, price: 2730, type: "PULLBACK_HIGH" },
      direction: "BEARISH",
      impulseDistance: 50,
    };

    const levels = calculateTrendBasedFibonacci(anchors);
    const fib0 = levels.find((l) => l.ratio === 0.0);
    const fib05 = levels.find((l) => l.ratio === 0.5);
    const fib0618 = levels.find((l) => l.ratio === 0.618);
    const fib1414 = levels.find((l) => l.ratio === 1.414);

    // Level = 2730 - ratio * 50
    assert.strictEqual(fib0?.price, 2730);
    assert.strictEqual(fib05?.price, 2705); // 2730 - 25
    assert.strictEqual(fib0618?.price, 2699.1); // 2730 - 30.9
    assert.strictEqual(fib1414?.price, 2659.3); // 2730 - 70.7
  });

  it("should enforce the 50% zone width breakout buffer", () => {
    const anchors: FibAnchors = {
      anchor1: { time: 100, price: 2700, type: "SWING_LOW" },
      anchor2: { time: 200, price: 2800, type: "SWING_HIGH" },
      anchor3: { time: 300, price: 2750, type: "PULLBACK_LOW" },
      direction: "BULLISH",
      impulseDistance: 100,
    };

    // Fib 0.500 = 2750 + 50 = 2800
    // Fib 0.618 = 2750 + 61.8 = 2811.8
    // Zone width = 11.8
    // Required 50% buffer = 5.9
    // Breakout threshold = 2811.8 + 5.9 = 2817.7
    const zone = calculateBreakoutZone(anchors, 0.5);
    assert.strictEqual(zone.price050, 2800);
    assert.strictEqual(zone.price0618, 2811.8);
    assert.strictEqual(zone.zoneWidth, 11.8);
    assert.strictEqual(zone.requiredBuffer, 5.9);
    assert.strictEqual(zone.breakoutThreshold, 2817.7);
  });

  it("should accurately compute simulated gold P/L based on 100 oz contract size", () => {
    const buyTrade = {
      id: "t1",
      signalId: "s1",
      symbol: "XAUUSD",
      direction: "BUY" as const,
      entryPrice: 2700.0,
      entryTime: 1000,
      targetPrice: 2720.0,
      stopLossPrice: 2690.0,
      currentPrice: 2710.0,
      lotSize: 1.0, // 100 oz
      unrealizedPL: 0,
      pips: 0,
      durationSeconds: 60,
      status: "TRADE_ACTIVE" as const,
      anchors: {} as any,
    };

    // Price moved +$10.00 -> 10 * 1.0 * 100 = +$1000.00
    const { unrealizedPL, pips } = calculateTradePL(buyTrade, 2710.0);
    assert.strictEqual(unrealizedPL, 1000.0);
    assert.strictEqual(pips, 100.0);
  });
});
