import { PaperTrade, StrategySignal } from "@/types/trading";
import { formatDateTime } from "./formatters";

/**
 * Converts array of trades to CSV formatted string and triggers download
 */
export function exportTradesToCSV(trades: PaperTrade[], filename: string = "gold_fibonacci_trades.csv") {
  if (trades.length === 0) return;

  const headers = [
    "Trade ID",
    "Symbol",
    "Direction",
    "Entry Time",
    "Entry Price",
    "Target 1.414",
    "Stop Loss",
    "Exit Time",
    "Exit Price",
    "Lot Size",
    "Realized P/L ($)",
    "Pips",
    "Duration (s)",
    "Status",
    "Exit Reason",
    "Fib Anchor 1",
    "Fib Anchor 2",
    "Fib Anchor 3",
  ];

  const rows = trades.map((t) => [
    t.id,
    t.symbol,
    t.direction,
    formatDateTime(t.entryTime),
    t.entryPrice.toFixed(2),
    t.targetPrice.toFixed(2),
    t.stopLossPrice.toFixed(2),
    t.exitTime ? formatDateTime(t.exitTime) : "N/A",
    t.exitPrice ? t.exitPrice.toFixed(2) : "N/A",
    t.lotSize.toFixed(2),
    t.realizedPL !== undefined ? t.realizedPL.toFixed(2) : t.unrealizedPL.toFixed(2),
    t.pips.toFixed(1),
    t.durationSeconds,
    t.status,
    t.exitReason || "ACTIVE",
    t.anchors ? `${t.anchors.anchor1.price.toFixed(2)} (${t.anchors.anchor1.type})` : "N/A",
    t.anchors ? `${t.anchors.anchor2.price.toFixed(2)} (${t.anchors.anchor2.type})` : "N/A",
    t.anchors ? `${t.anchors.anchor3.price.toFixed(2)} (${t.anchors.anchor3.type})` : "N/A",
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Converts array of signals to CSV string
 */
export function exportSignalsToCSV(signals: StrategySignal[], filename: string = "gold_fibonacci_signals.csv") {
  if (signals.length === 0) return;

  const headers = [
    "Signal ID",
    "Symbol",
    "Type",
    "Time",
    "Entry Price",
    "0.618 Breakout Level",
    "0.500 Zone Boundary",
    "Zone Width",
    "Breakout Distance",
    "Target 1.414",
    "Stop Loss",
    "Risk/Reward",
    "Status",
  ];

  const rows = signals.map((s) => [
    s.id,
    s.symbol,
    s.type,
    formatDateTime(s.time),
    s.entryPrice.toFixed(2),
    s.breakoutLevel.toFixed(2),
    s.zoneBoundary050.toFixed(2),
    s.zoneWidth.toFixed(2),
    s.breakoutDistance.toFixed(2),
    s.targetPrice.toFixed(2),
    s.stopLossPrice.toFixed(2),
    `1:${s.riskRewardRatio}`,
    s.status,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
