import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gold Fibonacci Strategy Terminal | XAUUSD 5M Trend Breakout Engine",
  description:
    "Institutional-grade quantitative analysis terminal for XAUUSD Gold implementing the 3-anchor Trend-Based Fibonacci Breakout strategy with live market tracking, automated EMA 9/20, paper trading, and backtesting.",
  keywords: ["XAUUSD", "Gold Trading", "Fibonacci Extension", "Trend Following", "Paper Trading", "Lightweight Charts"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-terminal-bg text-terminal-text min-h-screen antialiased selection:bg-gold-500/30 selection:text-gold-200">
        {children}
      </body>
    </html>
  );
}
