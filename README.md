# Gold Fibonacci Strategy Terminal (XAUUSD 5M)
> **Institutional Quantitative Trading Analysis & Paper Execution Platform**

A full-stack, real-time quantitative analysis terminal engineered for the **XAUUSD (Gold / US Dollar)** market on the 5-minute timeframe. It automates trend detection via EMA 9/20 and market structure (HH/HL/LH/LL), calculates true 3-anchor Trend-Based Fibonacci Extensions, verifies 0.618 breakouts with zone width confirmation, and executes simulated paper trades targeting the 1.414 Fibonacci extension.

---

## Key Features

1. **Live XAUUSD Market Dashboard**: Real-time tick updates, 5-minute candle countdown timer, Bid/Ask spread, 24h high/low range, and 24h price change.
2. **Interactive Candlestick Chart**: Powered by TradingView Lightweight Charts with Emerald/Rose styling, EMA 9 & EMA 20 indicators, swing markers (HH/HL/LH/LL), and 3-anchor Fibonacci extension levels.
3. **Automated Trend & Structure Detection**: Strict rule-based classification combining price relation to EMA 9/20, EMA slope/cross, and swing pivot confirmation. Confirms `NO TRADE` when in choppy consolidation.
4. **3-Anchor Trend-Based Fibonacci Extension**:
   - **Bullish**: Anchor 1 (Swing Low) → Anchor 2 (Swing High) → Anchor 3 (Pullback Low).
   - **Bearish**: Anchor 1 (Swing High) → Anchor 2 (Swing Low) → Anchor 3 (Pullback High).
   - Default active levels: 0.000, 0.500, 0.618, 1.414.
5. **Exact Breakout Filter**:
   - Monitored zone: 0.500 - 0.618.
   - Entry triggered only on **completed candle close** exceeding 0.618 by at least **50% of the zone width**. No wick-only false breakouts.
6. **Active Paper Trading Engine**:
   - Tracks active positions in real-time with simulated 100 oz Gold contracts.
   - Live P/L, pips, progress percentage towards 1.414 target, and swing-based stop invalidation.
7. **Historical Backtesting Engine**:
   - Simulates strategy bar-by-bar without look-ahead bias.
   - Computes Net Profit, Win Rate, Profit Factor, Max Drawdown %, and displays the simulated Equity Curve.
8. **Export Capabilities**:
   - 1-click CSV export for active trades, historical trades, backtest runs, and detected breakout signals.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server-side API routes)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Financial Charting**: [TradingView Lightweight Charts v4.2](https://tradingview.github.io/lightweight-charts/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## Strategy Rules Reference

| Metric | Bullish Condition | Bearish Condition |
|---|---|---|
| **Trend Filter** | Price > EMA 9 & EMA 20, EMA 9 > EMA 20 | Price < EMA 9 & EMA 20, EMA 9 < EMA 20 |
| **Market Structure** | Higher High (HH) & Higher Low (HL) | Lower High (LH) & Lower Low (LL) |
| **Pullback Validation** | Pullback Low must not breach Anchor 1 | Pullback High must not breach Anchor 1 |
| **Zone Width** | $\lvert \text{Fib}_{0.618} - \text{Fib}_{0.500} \rvert$ | $\lvert \text{Fib}_{0.618} - \text{Fib}_{0.500} \rvert$ |
| **Breakout Trigger** | Close $\ge \text{Fib}_{0.618} + 0.5 \times \text{ZoneWidth}$ | Close $\le \text{Fib}_{0.618} - 0.5 \times \text{ZoneWidth}$ |
| **Target** | Fib 1.414 Extension | Fib 1.414 Extension |
| **Invalidation** | Swing Low (Anchor 3) | Swing High (Anchor 3) |

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests
npm test

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the terminal.
