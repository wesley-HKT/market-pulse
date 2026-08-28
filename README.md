# Market Pulse – Web Prototype

iPhone‑style market‑alert dashboard for Gold (`XAU/USD`), Bitcoin (`BTC/USD`), and JPY FX pairs.

**Live site:** [https://wesley-hkt.github.io/market-pulse](https://wesley-hkt.github.io/market-pulse)

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


## Real‑Time Data Setup

The prototype now supports real‑time market data via Alpha Vantage API.

### 1. Deploy the Backend to Vercel

1. **Push all files** to your GitHub repository:
   ```bash
   git add .
   git commit -m "Add real‑time backend"
   git push origin gh-pages
   ```

2. **Go to [Vercel](https://vercel.com)** and import your GitHub repository.

3. **Set environment variable:**
   - In Vercel project dashboard → Settings → Environment Variables
   - Add `ALPHA_VANTAGE_API_KEY` with your key `LA1XN79UZUQ1R0JU`
   - Scope: Production (and Preview if needed)

4. **Deploy.** Vercel will give you a URL like `https://your-project.vercel.app`.

5. **Update front‑end URL:** In `app.js`, change `BACKEND_URL` to your Vercel URL:
   ```javascript
   const BACKEND_URL = 'https://your-project.vercel.app/api/market-data';
   ```

### 2. Alpha Vantage API Key

Your key `LA1XN79UZUQ1R0JU` is from [Alpha Vantage](https://www.alphavantage.co/support/#api-key).

**Limits (free tier):**
- 5 API calls per minute
- 500 calls per day
- Real‑time and historical data
- Supports Forex, Crypto, Commodities

**Covered symbols:**
- `XAUUSD` (Gold)
- `BTCUSD` (Bitcoin) 
- `USDJPY`, `EURJPY`, `GBPJPY` (Forex pairs)

### 3. How It Works

1. **Front‑end** (GitHub Pages) calls your **Vercel function** at `/api/market-data`
2. **Vercel function** uses your Alpha Vantage key to fetch live prices
3. **Data flows:** Alpha Vantage → Vercel → GitHub Pages → User's browser
4. **Security:** Your API key stays on Vercel, never exposed to client

### 4. Error Handling

The system includes:
- **Loading states** with spinner icons
- **Fallback data** if backend is unavailable
- **Toast notifications** for success/warnings
- **Source badges** showing "Alpha Vantage" or "fallback"
- **Auto‑retry** every 60 seconds (respects API limits)

### 5. Next: Real Alerts & Grok/xAI

To add real alert logic and Grok integration:

1. **Extend the backend** to:
   - Store historical prices
   - Calculate technical indicators (RSI, volume spikes, breakouts)
   - Call xAI/Grok API for market analysis
   - Generate alert objects

2. **Add a database** (Supabase, Firebase) for:
   - User preferences
   - Alert history
   - Signal cooldowns

3. **Replace mock alerts** in `app.js` with backend‑generated alerts.

### 6. Monitoring

Check your Alpha Vantage usage at:  
[https://www.alphavantage.co/premium/](https://www.alphavantage.co/premium/)

If you exceed free limits, consider:
- Upgrading Alpha Vantage plan
- Adding request caching
- Reducing refresh frequency
- Using multiple API keys