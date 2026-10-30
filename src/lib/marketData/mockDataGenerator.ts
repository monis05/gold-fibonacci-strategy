import { Candle } from "@/types/trading";

/**
 * Generates high-fidelity historical 5-minute XAUUSD candles.
 * Includes natural trend impulses, pullbacks, and realistic ATR spreads ($2.00 - $6.00 per 5m bar).
 */
export function generateRealisticGoldCandles(count: number = 300, basePrice: number = 2735.5): Candle[] {
  const candles: Candle[] = [];
  const now = Math.floor(Date.now() / 1000);
  const fiveMinSeconds = 300;
  const startTime = now - count * fiveMinSeconds;

  let currentPrice = basePrice;
  let trendDirection = 1; // 1 for bull, -1 for bear
  let trendDuration = 0;

  for (let i = 0; i < count; i++) {
    const time = startTime + i * fiveMinSeconds;

    // Switch trends periodically to create swing highs and swing lows
    trendDuration++;
    if (trendDuration > 15 + Math.floor(Math.sin(i * 0.1) * 8)) {
      trendDirection = -trendDirection;
      trendDuration = 0;
    }

    // Volatility and drift
    const drift = trendDirection * (0.4 + Math.random() * 0.8);
    const noise = (Math.random() - 0.48) * 1.5;
    const change = drift + noise;

    const open = Number(currentPrice.toFixed(2));
    const close = Number((open + change).toFixed(2));

    const wickUp = Math.random() * 1.8 + 0.3;
    const wickDown = Math.random() * 1.8 + 0.3;

    const high = Number((Math.max(open, close) + wickUp).toFixed(2));
    const low = Number((Math.min(open, close) - wickDown).toFixed(2));

    const volume = Math.floor(1200 + Math.random() * 2500);

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

/**
 * Generates the next live 5m candle tick update or new candle
 */
export function generateLiveGoldTick(lastCandle: Candle): { candle: Candle; isNewBar: boolean } {
  const now = Math.floor(Date.now() / 1000);
  const fiveMinSeconds = 300;
  const currentBarStartTime = Math.floor(now / fiveMinSeconds) * fiveMinSeconds;

  const isNewBar = currentBarStartTime > lastCandle.time;

  if (isNewBar) {
    const open = lastCandle.close;
    const change = (Math.random() - 0.49) * 0.8;
    const close = Number((open + change).toFixed(2));
    const high = Number((Math.max(open, close) + Math.random() * 0.5).toFixed(2));
    const low = Number((Math.min(open, close) - Math.random() * 0.5).toFixed(2));

    return {
      candle: {
        time: currentBarStartTime,
        open,
        high,
        low,
        close,
        volume: Math.floor(50 + Math.random() * 100),
      },
      isNewBar: true,
    };
  } else {
    // Tick within existing bar
    const change = (Math.random() - 0.49) * 0.4;
    const close = Number((lastCandle.close + change).toFixed(2));
    const high = Math.max(lastCandle.high, close);
    const low = Math.min(lastCandle.low, close);

    return {
      candle: {
        ...lastCandle,
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close,
        volume: lastCandle.volume + Math.floor(5 + Math.random() * 15),
      },
      isNewBar: false,
    };
  }
}
