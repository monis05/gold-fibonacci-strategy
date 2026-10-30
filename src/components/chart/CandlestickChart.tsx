"use client";

import React, { useEffect, useRef } from "react";
import { createChart, IChartApi, ISeriesApi, LineStyle, CrosshairMode } from "lightweight-charts";
import { Candle, FibLevel, StrategySignal, SwingPoint } from "@/types/trading";

interface CandlestickChartProps {
  candles: Candle[];
  ema9: number[];
  ema20: number[];
  fibLevels: FibLevel[];
  swings: SwingPoint[];
  signals: StrategySignal[];
  showEMA: boolean;
  showSwings: boolean;
  showFibLevels: boolean;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  candles,
  ema9,
  ema20,
  fibLevels,
  swings,
  signals,
  showEMA,
  showSwings,
  showFibLevels,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const fibPriceLinesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Initialize Lightweight Chart with Institutional Dark Theme
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 520,
      layout: {
        background: { color: "#0B0E14" },
        textColor: "#94A3B8",
        fontSize: 12,
        fontFamily: "var(--font-mono, monospace)",
      },
      grid: {
        vertLines: { color: "#161D2B" },
        horzLines: { color: "#161D2B" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#475569",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#1E293B",
        },
        horzLine: {
          color: "#475569",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#1E293B",
        },
      },
      rightPriceScale: {
        borderColor: "#1E293B",
        scaleMargins: {
          top: 0.1,
          bottom: 0.15,
        },
      },
      timeScale: {
        borderColor: "#1E293B",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Add Candlestick Series (Emerald & Rose)
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#10B981",
      downColor: "#EF4444",
      borderVisible: false,
      wickUpColor: "#10B981",
      wickDownColor: "#EF4444",
    });

    // Add EMA 9 (Cyan) & EMA 20 (Amber)
    const ema9Series = chart.addLineSeries({
      color: "#06B6D4",
      lineWidth: 2,
      priceLineVisible: false,
      title: "EMA 9",
    });

    const ema20Series = chart.addLineSeries({
      color: "#F59E0B",
      lineWidth: 2,
      priceLineVisible: false,
      title: "EMA 20",
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    ema9SeriesRef.current = ema9Series;
    ema20SeriesRef.current = ema20Series;

    // Responsive Resize Handler
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || 520,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Update Candlestick and Indicator Data
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;

    // Format candles for lightweight-charts
    const formattedCandles = candles.map((c) => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeriesRef.current.setData(formattedCandles);

    // Update EMA 9 and EMA 20
    if (ema9SeriesRef.current) {
      if (showEMA) {
        const ema9Data: any[] = [];
        for (let i = 0; i < candles.length; i++) {
          if (!isNaN(ema9[i])) {
            ema9Data.push({ time: candles[i].time, value: ema9[i] });
          }
        }
        ema9SeriesRef.current.setData(ema9Data);
        ema9SeriesRef.current.applyOptions({ visible: true });
      } else {
        ema9SeriesRef.current.applyOptions({ visible: false });
      }
    }

    if (ema20SeriesRef.current) {
      if (showEMA) {
        const ema20Data: any[] = [];
        for (let i = 0; i < candles.length; i++) {
          if (!isNaN(ema20[i])) {
            ema20Data.push({ time: candles[i].time, value: ema20[i] });
          }
        }
        ema20SeriesRef.current.setData(ema20Data);
        ema20SeriesRef.current.applyOptions({ visible: true });
      } else {
        ema20SeriesRef.current.applyOptions({ visible: false });
      }
    }

    // Build Chart Markers (Swings & Signals)
    const markers: any[] = [];

    // Add Swing High / Low Markers
    if (showSwings) {
      for (const swing of swings) {
        if (swing.type === "HIGH") {
          markers.push({
            time: swing.time,
            position: "aboveBar",
            color: swing.label === "HH" ? "#10B981" : "#F59E0B",
            shape: "arrowDown",
            text: swing.label || "H",
            size: 1,
          });
        } else {
          markers.push({
            time: swing.time,
            position: "belowBar",
            color: swing.label === "HL" ? "#10B981" : "#EF4444",
            shape: "arrowUp",
            text: swing.label || "L",
            size: 1,
          });
        }
      }
    }

    // Add Strategy Breakout Signals (BUY / SELL)
    for (const sig of signals) {
      if (sig.type === "BUY") {
        markers.push({
          time: sig.time,
          position: "belowBar",
          color: "#10B981",
          shape: "arrowUp",
          text: `BUY (0.618 Breakout) @ $${sig.entryPrice.toFixed(1)}`,
          size: 2,
        });
      } else if (sig.type === "SELL") {
        markers.push({
          time: sig.time,
          position: "aboveBar",
          color: "#EF4444",
          shape: "arrowDown",
          text: `SELL (0.618 Breakout) @ $${sig.entryPrice.toFixed(1)}`,
          size: 2,
        });
      }
    }

    // Sort markers by time
    markers.sort((a, b) => a.time - b.time);
    candleSeriesRef.current.setMarkers(markers);
  }, [candles, ema9, ema20, swings, signals, showEMA, showSwings]);

  // Update Fibonacci Price Lines on Candlestick Series
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    // Remove existing price lines
    for (const pl of fibPriceLinesRef.current) {
      try {
        candleSeriesRef.current.removePriceLine(pl);
      } catch (e) {}
    }
    fibPriceLinesRef.current = [];

    if (!showFibLevels || fibLevels.length === 0) return;

    // Add price line for each Fibonacci level
    for (const fib of fibLevels) {
      let title = `${fib.label} - $${fib.price.toFixed(2)}`;
      let lineStyle = LineStyle.Dashed;
      let lineWidth: 1 | 2 = 1;

      if (fib.isBreakoutTrigger) {
        title = `★ 0.618 BREAKOUT TRIGGER: $${fib.price.toFixed(2)}`;
        lineWidth = 2;
        lineStyle = LineStyle.Solid;
      } else if (fib.isTarget) {
        title = `🎯 1.414 TARGET: $${fib.price.toFixed(2)}`;
        lineWidth = 2;
        lineStyle = LineStyle.Solid;
      }

      const pl = candleSeriesRef.current.createPriceLine({
        price: fib.price,
        color: fib.color,
        lineWidth,
        lineStyle,
        axisLabelVisible: true,
        title,
      });

      fibPriceLinesRef.current.push(pl);
    }
  }, [fibLevels, showFibLevels]);

  return (
    <div className="relative w-full h-[520px] bg-terminal-bg rounded-lg overflow-hidden border border-terminal-border shadow-2xl">
      <div ref={chartContainerRef} className="w-full h-full" />
      
      {/* Legend Overlay */}
      <div className="absolute top-3 left-4 flex flex-wrap items-center gap-3 text-xs bg-terminal-card/90 backdrop-blur-md px-3 py-1.5 rounded-md border border-terminal-border z-10">
        <span className="font-bold text-white flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gold-400 inline-block animate-pulse" />
          XAUUSD 5M
        </span>
        {showEMA && (
          <>
            <span className="text-[#06B6D4] font-mono">
              EMA 9: {ema9.length > 0 && !isNaN(ema9[ema9.length - 1]) ? ema9[ema9.length - 1].toFixed(2) : "—"}
            </span>
            <span className="text-[#F59E0B] font-mono">
              EMA 20: {ema20.length > 0 && !isNaN(ema20[ema20.length - 1]) ? ema20[ema20.length - 1].toFixed(2) : "—"}
            </span>
          </>
        )}
        {fibLevels.length > 0 && (
          <span className="text-emerald-400 font-mono">
            Fib 0.618: {fibLevels.find((f) => f.ratio === 0.618)?.price.toFixed(2) || "—"}
          </span>
        )}
      </div>
    </div>
  );
};
