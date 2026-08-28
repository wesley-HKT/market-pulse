# Market Pulse – Web Prototype

iPhone‑style market‑alert dashboard for Gold (`XAU/USD`), Bitcoin (`BTC/USD`), and JPY FX pairs.

**Live site:** [https://wesle.github.io/market‑pulse](https://wesle.github.io/market-pulse)

## Features

- iPhone‑style dark interface with status bar
- Four‑tab navigation (Home, Markets, Alerts, Settings)
- Watchlist: XAU/USD, BTC/USD, USD/JPY, EUR/JPY, GBP/JPY
- Three alert types: breakout, unusual volume, RSI extremes
- Interactive toggles for alert strategies
- Auto‑refresh simulation every 30 seconds
- Mock data only – no real trading or API keys

## Purpose

Personal alert dashboard prototype. All prices, signals, and Grok context are explicitly **mock data**. No market‑data provider, xAI/Grok API, or brokerage credentials are included. This is a front‑end demonstration; real alerts would require a secure backend with proper credential isolation.

## Run locally

Open `index.html` in any browser. Works offline after loading fonts/icons.

## Architecture

```text
Browser (iPhone/desktop)
   ├── HTML/CSS/JS static front‑end
   ├── Mock market data (client‑side)
   └── No server calls, no secrets
```

## Next steps

To turn this into a real alert system:

1. Select a market‑data provider for Gold, BTC, and JPY pairs.
2. Obtain an xAI API key (Grok chat subscription alone is not an API).
3. Build a secure backend that:
   - Fetches real market data
   - Runs deterministic signal logic
   - Calls Grok/xAI for contextual analysis
   - Exposes sanitized alerts via HTTPS
4. Replace the mock data in `app.js` with calls to that backend.

## License

MIT