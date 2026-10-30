import type { FibAnchors, FibLevel, StrategySettings } from "../../types/trading.ts";

export const DEFAULT_FIB_CONFIG = [
  { ratio: 0.0, label: "Fib 0.000 (Anchor 3)", color: "#94A3B8", enabled: true },
  { ratio: 0.382, label: "Fib 0.382", color: "#64748B", enabled: false },
  { ratio: 0.5, label: "Fib 0.500 (Zone Entry)", color: "#F59E0B", enabled: true },
  { ratio: 0.618, label: "Fib 0.618 (Golden Breakout)", color: "#10B981", enabled: true },
  { ratio: 0.786, label: "Fib 0.786", color: "#3B82F6", enabled: false },
  { ratio: 1.0, label: "Fib 1.000 (100% Extension)", color: "#8B5CF6", enabled: true },
  { ratio: 1.272, label: "Fib 1.272", color: "#EC4899", enabled: false },
  { ratio: 1.414, label: "Fib 1.414 (Final Target)", color: "#FFD700", enabled: true },
  { ratio: 1.618, label: "Fib 1.618 (Extended Target)", color: "#06B6D4", enabled: false },
];

/**
 * Calculates Trend-Based Fibonacci Extension levels for 3 anchors:
 * Bearish: Anchor 1 (High) -> Anchor 2 (Low) -> Anchor 3 (Pullback High)
 * Bullish: Anchor 1 (Low) -> Anchor 2 (High) -> Anchor 3 (Pullback Low)
 */
export function calculateTrendBasedFibonacci(
  anchors: FibAnchors,
  settings?: StrategySettings
): FibLevel[] {
  const { direction, impulseDistance, anchor3 } = anchors;
  const config = settings?.visibleFibLevels || DEFAULT_FIB_CONFIG;

  const levels: FibLevel[] = [];

  for (const item of config) {
    if (!item.enabled) continue;

    let price = 0;
    if (direction === "BULLISH") {
      // Bullish extension: projects upward from Pullback Low (anchor3)
      price = anchor3.price + item.ratio * impulseDistance;
    } else {
      // Bearish extension: projects downward from Pullback High (anchor3)
      price = anchor3.price - item.ratio * impulseDistance;
    }

    const defaultMeta = DEFAULT_FIB_CONFIG.find((d) => d.ratio === item.ratio);
    levels.push({
      ratio: item.ratio,
      price: Number(price.toFixed(3)),
      label: defaultMeta?.label || `Fib ${item.ratio}`,
      color: defaultMeta?.color || "#94A3B8",
      isBreakoutTrigger: item.ratio === 0.618,
      isTarget: item.ratio === (settings?.fibTargetRatio || 1.414),
    });
  }

  return levels;
}

/**
 * Calculates the 0.500 - 0.618 zone boundaries and required breakout threshold
 */
export function calculateBreakoutZone(anchors: FibAnchors, thresholdPercent: number = 0.5) {
  const { direction, impulseDistance, anchor3 } = anchors;

  let price050 = 0;
  let price0618 = 0;
  let target1414 = 0;

  if (direction === "BULLISH") {
    price050 = anchor3.price + 0.5 * impulseDistance;
    price0618 = anchor3.price + 0.618 * impulseDistance;
    target1414 = anchor3.price + 1.414 * impulseDistance;
  } else {
    price050 = anchor3.price - 0.5 * impulseDistance;
    price0618 = anchor3.price - 0.618 * impulseDistance;
    target1414 = anchor3.price - 1.414 * impulseDistance;
  }

  const zoneWidth = Math.abs(price0618 - price050);
  const requiredBuffer = zoneWidth * thresholdPercent;

  let breakoutThreshold = 0;
  if (direction === "BULLISH") {
    breakoutThreshold = price0618 + requiredBuffer;
  } else {
    breakoutThreshold = price0618 - requiredBuffer;
  }

  return {
    price050: Number(price050.toFixed(3)),
    price0618: Number(price0618.toFixed(3)),
    target1414: Number(target1414.toFixed(3)),
    zoneWidth: Number(zoneWidth.toFixed(3)),
    requiredBuffer: Number(requiredBuffer.toFixed(3)),
    breakoutThreshold: Number(breakoutThreshold.toFixed(3)),
  };
}
