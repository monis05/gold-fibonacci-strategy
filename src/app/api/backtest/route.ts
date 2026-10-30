import { NextResponse } from "next/server";
import { fetchGoldMarketData } from "@/lib/marketData/providers";
import { runBacktest } from "@/lib/strategy/backtester";
import { DEFAULT_STRATEGY_SETTINGS } from "@/lib/strategy/strategyEngine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { settings = DEFAULT_STRATEGY_SETTINGS, startDate, endDate, limit = 500 } = body;

    const data = await fetchGoldMarketData(limit);
    const result = runBacktest(data.candles, settings, startDate, endDate);

    return NextResponse.json({
      success: true,
      result,
      source: data.source,
      sourceName: data.sourceName,
      totalCandlesTested: data.candles.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to execute backtest",
      },
      { status: 500 }
    );
  }
}
