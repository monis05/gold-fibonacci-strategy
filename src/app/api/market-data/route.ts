import { NextResponse } from "next/server";
import { fetchGoldMarketData } from "@/lib/marketData/providers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 1000) : 300;

    const data = await fetchGoldMarketData(limit);

    const latest = data.candles[data.candles.length - 1];
    const prevDay = data.candles[Math.max(0, data.candles.length - 288)]; // ~24h of 5m bars

    const change = latest && prevDay ? Number((latest.close - prevDay.close).toFixed(2)) : 0;
    const changePercent = prevDay && prevDay.close > 0 ? Number(((change / prevDay.close) * 100).toFixed(2)) : 0;

    let high24h = latest ? latest.high : 0;
    let low24h = latest ? latest.low : 0;

    for (let i = Math.max(0, data.candles.length - 288); i < data.candles.length; i++) {
      if (data.candles[i].high > high24h) high24h = data.candles[i].high;
      if (data.candles[i].low < low24h) low24h = data.candles[i].low;
    }

    // Bid/Ask spread (typical gold spread 0.25 - 0.35)
    const spread = 0.3;
    const bid = latest ? Number((latest.close - spread / 2).toFixed(2)) : 0;
    const ask = latest ? Number((latest.close + spread / 2).toFixed(2)) : 0;

    return NextResponse.json({
      success: true,
      symbol: "XAUUSD",
      currentPrice: latest ? latest.close : 0,
      bid,
      ask,
      spread,
      change24h: change,
      changePercent24h: changePercent,
      high24h,
      low24h,
      source: data.source,
      sourceName: data.sourceName,
      isLive: data.isLive,
      timestamp: data.timestamp,
      candles: data.candles,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to fetch market data",
      },
      { status: 500 }
    );
  }
}
