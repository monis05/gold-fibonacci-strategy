import { Candle } from "@/types/trading";
import { generateRealisticGoldCandles } from "./mockDataGenerator";

export interface MarketDataResponse {
  candles: Candle[];
  symbol: string;
  source: "LIVE_PAXG_GOLD" | "TWELVE_DATA" | "DEMO_SIMULATION";
  sourceName: string;
  isLive: boolean;
  timestamp: number;
}

/**
 * Fetches real XAUUSD / Gold 5-minute klines
 * Priority 1: Binance PAXGUSDT (Free institutional 1:1 spot gold feed, no API key needed)
 * Priority 2: TwelveData (if TWELVE_DATA_API_KEY is present)
 * Fallback: Realistic high-fidelity simulated demo candles with explicit DEMO label
 */
export async function fetchGoldMarketData(limit: number = 250): Promise<MarketDataResponse> {
  // 1. Try Binance PAXG/USDT (Spot Gold)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=PAXGUSDT&interval=5m&limit=${limit}`,
      {
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache" },
      }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const candles: Candle[] = data.map((k: any) => ({
          time: Math.floor(k[0] / 1000),
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5]),
        }));

        return {
          candles,
          symbol: "XAUUSD (PAXG Spot Gold)",
          source: "LIVE_PAXG_GOLD",
          sourceName: "Binance Spot Gold (PAXG/USDT Live Feed)",
          isLive: true,
          timestamp: Date.now(),
        };
      }
    }
  } catch (err) {
    // Silently fall through to next provider
  }

  // 2. Try TwelveData if API key is present
  const twelveDataKey = process.env.TWELVE_DATA_API_KEY;
  if (twelveDataKey) {
    try {
      const res = await fetch(
        `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=5min&outputsize=${limit}&apikey=${twelveDataKey}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.values && Array.isArray(json.values)) {
          const candles: Candle[] = json.values
            .reverse()
            .map((v: any) => ({
              time: Math.floor(new Date(v.datetime).getTime() / 1000),
              open: parseFloat(v.open),
              high: parseFloat(v.high),
              low: parseFloat(v.low),
              close: parseFloat(v.close),
              volume: parseFloat(v.volume || "1000"),
            }));

          return {
            candles,
            symbol: "XAUUSD",
            source: "TWELVE_DATA",
            sourceName: "TwelveData XAU/USD 5M",
            isLive: true,
            timestamp: Date.now(),
          };
        }
      }
    } catch (err) {
      // Fall through to simulated fallback
    }
  }

  // 3. Fallback: High-Fidelity Simulation Demo Mode
  return {
    candles: generateRealisticGoldCandles(limit, 2742.3),
    symbol: "XAUUSD",
    source: "DEMO_SIMULATION",
    sourceName: "High-Fidelity Simulated Gold (DEMO MODE)",
    isLive: false,
    timestamp: Date.now(),
  };
}
