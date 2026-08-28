// Vercel serverless function for Alpha Vantage market data
// Deploy with ALPHA_VANTAGE_API_KEY environment variable

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
      message: 'Alpha Vantage API key is not configured on the server.' 
    });
  }

  const { symbols = 'XAUUSD,BTCUSD,USDJPY,EURJPY,GBPJPY' } = req.query;
  const symbolList = symbols.split(',');

  try {
    const marketData = await Promise.all(
      symbolList.map(symbol => fetchMarketData(symbol, apiKey))
    );

    const validData = marketData.filter(data => data !== null);
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      markets: validData,
      disclaimer: 'Data provided by Alpha Vantage. Real‑time prices may be delayed.',
      note: 'Change and changePercent are calculated from previous close.'
    });
  } catch (error) {
    console.error('Error fetching market data:', error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch market data',
      message: error.message,
      fallback: 'Returning mock data for demonstration',
      markets: getFallbackData(symbolList)
    });
  }
}

async function fetchMarketData(symbol, apiKey) {
  // Map our symbols to Alpha Vantage symbols
  const symbolMap = {
    'XAUUSD': 'XAUUSD',
    'BTCUSD': 'BTCUSD',
    'USDJPY': 'USDJPY',
    'EURJPY': 'EURJPY',
    'GBPJPY': 'GBPJPY'
  };

  const avSymbol = symbolMap[symbol] || symbol;
  
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${avSymbol}&apikey=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Alpha Vantage returns {"Global Quote": {...}} or {"Error Message": ...}
    if (data['Error Message']) {
      console.warn(`Alpha Vantage error for ${symbol}:`, data['Error Message']);
      return null;
    }

    const quote = data['Global Quote'];
    if (!quote) {
      console.warn(`No quote data for ${symbol}`);
      return null;
    }

    // Extract relevant fields
    const currentPrice = parseFloat(quote['05. price']);
    const previousClose = parseFloat(quote['08. previous close']);
    const change = currentPrice - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    // Map to our front‑end format
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
      volume: quote['06. volume'] ? parseInt(quote['06. volume']) : null,
      open: parseFloat(quote['02. open'] || 0)
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error.message);
    return null;
  }
}

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

function getFallbackData(symbolList) {
  // Fallback mock data in case Alpha Vantage fails
  const mockMarkets = [
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
      source: 'mock'
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
      source: 'mock'
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
      source: 'mock'
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
      source: 'mock'
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
      source: 'mock'
    }
  ];

  return mockMarkets.filter(market => symbolList.includes(market.symbol));
}