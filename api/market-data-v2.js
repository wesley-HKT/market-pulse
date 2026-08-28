// Vercel serverless function for Alpha Vantage market data with alert calculations
// Deploy with ALPHA_VANTAGE_API_KEY environment variable

// Store recent price history (in-memory, resets on cold start)
const priceHistory = new Map();

export default async function handler(req, res) {
  // Enable CORS for GitHub Pages front‑end
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    console.error('Alpha Vantage API key not configured');
    return res.status(500).json({ 
      error: 'Server configuration error',
      markets: getFallbackData(),
      alerts: getFallbackAlerts()
    });
  }

  const { symbols = 'XAUUSD,BTCUSD,USDJPY,EURJPY,GBPJPY' } = req.query;
  const symbolList = symbols.split(',');

  try {
    // Fetch market data
    const marketData = await Promise.all(
      symbolList.map(symbol => fetchMarketData(symbol, apiKey))
    );

    const validMarkets = marketData.filter(data => data !== null);
    
    // Generate alerts based on price history
    const alerts = generateAlerts(validMarkets);
    
    // Update price history
    updatePriceHistory(validMarkets);
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      markets: validMarkets,
      alerts: alerts,
      disclaimer: 'Data provided by Alpha Vantage. Real‑time prices may be delayed. Alerts based on 5‑minute window.',
      note: 'Alert thresholds: Breakout > 0.5%, Volume spike > 2x avg, RSI < 30 or > 70'
    });
  } catch (error) {
    console.error('Error fetching market data:', error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch market data',
      message: error.message,
      markets: getFallbackData(),
      alerts: getFallbackAlerts()
    });
  }
}

async function fetchMarketData(symbol, apiKey) {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data['Error Message']) {
      console.warn(`Alpha Vantage error for ${symbol}:`, data['Error Message']);
      return null;
    }

    const quote = data['Global Quote'];
    if (!quote) {
      console.warn(`No quote data for ${symbol}`);
      return null;
    }

    const currentPrice = parseFloat(quote['05. price']);
    const previousClose = parseFloat(quote['08. previous close']);
    const change = parseFloat(quote['09. change']) || (currentPrice - previousClose);
    const changePercent = parseFloat(quote['10. change percent']?.replace('%', '')) || 
                         (previousClose !== 0 ? (change / previousClose) * 100 : 0);

    // Calculate volume (use previous close volume if available)
    const volume = quote['06. volume'] ? parseInt(quote['06. volume']) : null;
    
    return {
      symbol,
      name: getInstrumentName(symbol),
      category: getCategory(symbol),
      currentPrice,
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      lastUpdated: new Date().toISOString(),
      iconClass: getIconClass(symbol),
      icon: getIcon(symbol),
      source: 'Alpha Vantage',
      high: parseFloat(quote['03. high'] || 0),
      low: parseFloat(quote['04. low'] || 0),
      volume,
      open: parseFloat(quote['02. open'] || 0)
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error.message);
    return null;
  }
}

function generateAlerts(markets) {
  const alerts = [];
  const now = new Date();
  
  for (const market of markets) {
    const symbol = market.symbol;
    const history = priceHistory.get(symbol) || [];
    
    // 1. Breakout detection (price moves > 0.5% from 5-min average)
    if (history.length >= 5) {
      const avgPrice = history.reduce((sum, h) => sum + h.price, 0) / history.length;
      const priceChangePercent = Math.abs((market.currentPrice - avgPrice) / avgPrice * 100);
      
      if (priceChangePercent > 0.5) {
        alerts.push({
          id: `breakout_${symbol}_${now.getTime()}`,
          symbol,
          title: 'Breakout Detected',
          type: 'breakout',
          message: `${market.name} moved ${priceChangePercent.toFixed(2)}% from 5‑min average. Current: ${market.currentPrice}`,
          time: 'Just now',
          severity: priceChangePercent > 1 ? 'high' : 'medium',
          price: market.currentPrice,
          threshold: `${avgPrice.toFixed(2)} ±0.5%`
        });
      }
    }
    
    // 2. Volume spike detection (if volume data available)
    if (market.volume && history.length >= 3) {
      const avgVolume = history.reduce((sum, h) => sum + (h.volume || 0), 0) / history.length;
      
      if (avgVolume > 0 && market.volume > avgVolume * 2) {
        alerts.push({
          id: `volume_${symbol}_${now.getTime()}`,
          symbol,
          title: 'Unusual Volume',
          type: 'volume',
          message: `${market.name} volume ${(market.volume / avgVolume).toFixed(1)}x average. Volume: ${market.volume}`,
          time: 'Just now',
          severity: 'medium',
          volume: market.volume,
          avgVolume: Math.round(avgVolume)
        });
      }
    }
    
    // 3. RSI-like detection (based on price momentum)
    if (history.length >= 14) {
      const recentPrices = history.slice(-14).map(h => h.price);
      const gains = [];
      const losses = [];
      
      for (let i = 1; i < recentPrices.length; i++) {
        const change = recentPrices[i] - recentPrices[i - 1];
        if (change > 0) {
          gains.push(change);
          losses.push(0);
        } else {
          gains.push(0);
          losses.push(Math.abs(change));
        }
      }
      
      const avgGain = gains.reduce((sum, g) => sum + g, 0) / gains.length;
      const avgLoss = losses.reduce((sum, l) => sum + l, 0) / losses.length;
      
      if (avgLoss > 0) {
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        
        if (rsi < 30) {
          alerts.push({
            id: `rsi_${symbol}_${now.getTime()}`,
            symbol,
            title: 'RSI Oversold',
            type: 'rsi',
            message: `${market.name} RSI ${rsi.toFixed(1)} (<30). Current: ${market.currentPrice}`,
            time: 'Just now',
            severity: 'low',
            rsi: parseFloat(rsi.toFixed(1)),
            level: 'oversold'
          });
        } else if (rsi > 70) {
          alerts.push({
            id: `rsi_${symbol}_${now.getTime()}`,
            symbol,
            title: 'RSI Overbought',
            type: 'rsi',
            message: `${market.name} RSI ${rsi.toFixed(1)} (>70). Current: ${market.currentPrice}`,
            time: 'Just now',
            severity: 'low',
            rsi: parseFloat(rsi.toFixed(1)),
            level: 'overbought'
          });
        }
      }
    }
  }
  
  // Limit to 10 most recent alerts
  return alerts.slice(0, 10);
}

function updatePriceHistory(markets) {
  const now = new Date();
  
  for (const market of markets) {
    const symbol = market.symbol;
    const history = priceHistory.get(symbol) || [];
    
    // Add new data point
    history.push({
      timestamp: now,
      price: market.currentPrice,
      volume: market.volume || 0
    });
    
    // Keep last 30 minutes of data (assuming 1-minute updates)
    const cutoff = new Date(now.getTime() - 30 * 60 * 1000);
    const filtered = history.filter(h => h.timestamp > cutoff);
    
    priceHistory.set(symbol, filtered);
  }
}

// Helper functions
function getInstrumentName(symbol) {
  const names = {
    'XAUUSD': 'Gold Spot',
    'BTCUSD': 'Bitcoin',
    'USDJPY': 'US Dollar / Japanese Yen',
    'EURJPY': 'Euro / Japanese Yen',
    'GBPJPY': 'British Pound / Japanese Yen'
  };
  return names[symbol] || symbol;
}

function getCategory(symbol) {
  if (symbol === 'XAUUSD') return 'metals';
  if (symbol === 'BTCUSD') return 'crypto';
  return 'forex';
}

function getIconClass(symbol) {
  if (symbol === 'XAUUSD') return 'gold';
  if (symbol === 'BTCUSD') return 'crypto';
  return 'forex';
}

function getIcon(symbol) {
  if (symbol === 'XAUUSD') return 'fas fa-gem';
  if (symbol === 'BTCUSD') return 'fab fa-bitcoin';
  if (symbol === 'USDJPY') return 'fas fa-yen-sign';
  if (symbol === 'EURJPY') return 'fas fa-euro-sign';
  if (symbol === 'GBPJPY') return 'fas fa-pound-sign';
  return 'fas fa-chart-line';
}

function getFallbackData() {
  return [
    {
      symbol: 'XAUUSD',
      name: 'Gold Spot',
      category: 'metals',
      currentPrice: 2345.67,
      change: 12.34,
      changePercent: 0.53,
      lastUpdated: new Date().toISOString(),
      iconClass: 'gold',
      icon: 'fas fa-gem',
      source: 'fallback'
    },
    {
      symbol: 'BTCUSD',
      name: 'Bitcoin',
      category: 'crypto',
      currentPrice: 68542.19,
      change: -1234.56,
      changePercent: -1.77,
      lastUpdated: new Date().toISOString(),
      iconClass: 'crypto',
      icon: 'fab fa-bitcoin',
      source: 'fallback'
    },
    {
      symbol: 'USDJPY',
      name: 'US Dollar / Japanese Yen',
      category: 'forex',
      currentPrice: 148.92,
      change: 0.34,
      changePercent: 0.23,
      lastUpdated: new Date().toISOString(),
      iconClass: 'forex',
      icon: 'fas fa-yen-sign',
      source: 'fallback'
    },
    {
      symbol: 'EURJPY',
      name: 'Euro / Japanese Yen',
      category: 'forex',
      currentPrice: 160.45,
      change: -0.28,
      changePercent: -0.17,
      lastUpdated: new Date().toISOString(),
      iconClass: 'forex',
      icon: 'fas fa-euro-sign',
      source: 'fallback'
    },
    {
      symbol: 'GBPJPY',
      name: 'British Pound / Japanese Yen',
      category: 'forex',
      currentPrice: 187.23,
      change: 0.67,
      changePercent: 0.36,
      lastUpdated: new Date().toISOString(),
      iconClass: 'forex',
      icon: 'fas fa-pound-sign',
      source: 'fallback'
    }
  ];
}

function getFallbackAlerts() {
  return [
    {
      id: 'fallback_1',
      symbol: 'XAUUSD',
      title: 'Breakout Detected',
      type: 'breakout',
      message: 'Gold broke above resistance at 2330. Price currently 2345.67.',
      time: '10 minutes ago',
      severity: 'medium'
    },
    {
      id: 'fallback_2',
      symbol: 'BTCUSD',
      title: 'Unusual Volume Spike',
      type: 'volume',
      message: 'Bitcoin volume 2.3x 30‑day average. Current price 68542.19.',
      time: '25 minutes ago',
      severity: 'high'
    },
    {
      id: 'fallback_3',
      symbol: 'USDJPY',
      title: 'RSI Oversold',
      type: 'rsi',
      message: 'RSI dropped below 30. Current price 148.92.',
      time: '1 hour ago',
      severity: 'low'
    }
  ];
}