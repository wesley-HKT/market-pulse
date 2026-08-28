// Configuration
const BACKEND_URL = 'https://market-pulse-umber.vercel.app/api/market-data-v2';

// Fallback mock data if backend is unavailable
const fallbackMarkets = [
    {
        symbol: 'XAU/USD',
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
        symbol: 'BTC/USD',
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
        symbol: 'USD/JPY',
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
        symbol: 'EUR/JPY',
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
        symbol: 'GBP/JPY',
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

// Real alerts will come from backend
let currentAlerts = [];

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const watchlistEl = document.getElementById('watchlist');
const marketsListEl = document.getElementById('marketsList');
const alertsListEl = document.getElementById('alertsList');
const noAlertsMessage = document.getElementById('noAlertsMessage');
const refreshBtn = document.getElementById('refreshBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const lastUpdateTime = document.getElementById('lastUpdateTime');
const disclaimerEl = document.querySelector('.disclaimer p');

// State
let currentMarkets = [];
let isLoading = false;

// Tab navigation
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.dataset.tab;
        
        // Update active tab button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Show corresponding tab pane
        tabPanes.forEach(pane => pane.classList.remove('active'));
        document.getElementById(`${tabId}-tab`).classList.add('active');
        
        // Update badge if we're going to alerts tab
        if (tabId === 'alerts') {
            button.querySelector('.badge').style.display = 'none';
        }
    });
});

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Format percent
function formatPercent(value) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}

// Format change
function formatChange(value) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${formatCurrency(Math.abs(value))}`;
}

// Render watchlist item
function renderWatchlistItem(market) {
    const changeClass = market.change >= 0 ? 'positive' : 'negative';
    const sourceBadge = market.source !== 'Alpha Vantage' ? `<span class="source-badge">${market.source}</span>` : '';
    
    return `
        <div class="watchlist-item">
            <div class="instrument">
                <div class="instrument-icon ${market.iconClass}">
                    <i class="${market.icon}"></i>
                </div>
                <div class="instrument-info">
                    <h4>${market.symbol} ${sourceBadge}</h4>
                    <p>${market.name}</p>
                </div>
            </div>
            <div class="price-data">
                <div class="current-price">$${formatCurrency(market.currentPrice)}</div>
                <div class="price-change ${changeClass}">
                    ${formatChange(market.change)} (${formatPercent(market.changePercent)})
                </div>
            </div>
        </div>
    `;
}

// Render market item (for Markets tab)
function renderMarketItem(market) {
    const changeClass = market.change >= 0 ? 'positive' : 'negative';
    const sourceBadge = market.source !== 'Alpha Vantage' ? `<span class="source-badge">${market.source}</span>` : '';
    
    return `
        <div class="market-item">
            <div class="instrument">
                <div class="instrument-icon ${market.iconClass}">
                    <i class="${market.icon}"></i>
                </div>
                <div class="instrument-info">
                    <h4>${market.symbol} ${sourceBadge}</h4>
                    <p>${market.name}</p>
                </div>
            </div>
            <div class="price-data">
                <div class="current-price">$${formatCurrency(market.currentPrice)}</div>
                <div class="price-change ${changeClass}">
                    ${formatChange(market.change)} (${formatPercent(market.changePercent)})
                </div>
            </div>
        </div>
    `;
}

// Render alert item
function renderAlertItem(alert) {
    return `
        <div class="alert-item ${alert.type}">
            <div class="alert-header">
                <div class="alert-title">${alert.symbol} - ${alert.title}</div>
                <div class="alert-time">${alert.time}</div>
            </div>
            <div class="alert-body">
                <p>${alert.message}</p>
                <p><strong>Severity:</strong> ${alert.severity}</p>
            </div>
            <div class="alert-actions">
                <button class="action-btn primary">Acknowledge</button>
                <button class="action-btn secondary">View Details</button>
            </div>
        </div>
    `;
}

// Fetch real market data from backend
async function fetchMarketData() {
    if (isLoading) return;
    
    isLoading = true;
    showLoadingState(true);
    
    try {
        const response = await fetch(`${BACKEND_URL}?symbols=XAUUSD,BTCUSD,USDJPY,EURJPY,GBPJPY`);
        
        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.markets && data.markets.length > 0) {
            currentMarkets = data.markets;
            updateDisclaimer(data.disclaimer || 'Live data from Alpha Vantage');
            showToast('Market data updated');
        } else {
            throw new Error('No market data received');
        }
    } catch (error) {
        console.error('Failed to fetch market data:', error.message);
        currentMarkets = fallbackMarkets;
        updateDisclaimer('Using fallback data - backend unavailable');
        showToast('Using fallback data', 'warning');
    } finally {
        isLoading = false;
        showLoadingState(false);
        updateTimestamp();
        populateWatchlist();
        populateMarkets();
    }
}

// Show/hide loading state
function showLoadingState(show) {
    if (show) {
        watchlistEl.innerHTML = '<div class="loading">Loading market data...</div>';
        marketsListEl.innerHTML = '<div class="loading">Loading market data...</div>';
        refreshBtn.querySelector('i').className = 'fas fa-spinner fa-spin';
    } else {
        refreshBtn.querySelector('i').className = 'fas fa-sync-alt';
    }
}

// Update disclaimer
function updateDisclaimer(text) {
    if (disclaimerEl) {
        disclaimerEl.innerHTML = `<i class="fas fa-info-circle"></i> ${text}`;
    }
}

// Populate watchlist
function populateWatchlist() {
    if (!currentMarkets || currentMarkets.length === 0) {
        currentMarkets = fallbackMarkets;
    }
    
    watchlistEl.innerHTML = currentMarkets.map(renderWatchlistItem).join('');
}

// Populate markets list
function populateMarkets() {
    if (!currentMarkets || currentMarkets.length === 0) {
        currentMarkets = fallbackMarkets;
    }
    
    marketsListEl.innerHTML = currentMarkets.map(renderMarketItem).join('');
}

// Populate alerts
function populateAlerts() {
    if (mockAlerts.length === 0) {
        noAlertsMessage.style.display = 'block';
        alertsListEl.innerHTML = '';
    } else {
        noAlertsMessage.style.display = 'none';
        alertsListEl.innerHTML = mockAlerts.map(renderAlertItem).join('');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    
    // Reset icon
    const icon = toast.querySelector('i');
    if (type === 'warning') {
        icon.className = 'fas fa-exclamation-triangle';
        icon.style.color = '#ffaa00';
    } else {
        icon.className = 'fas fa-check-circle';
        icon.style.color = '#2ecc71';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Update timestamp
function updateTimestamp() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (lastUpdateTime) {
        lastUpdateTime.textContent = timeString;
    }
}

// Simulate refresh
function simulateRefresh() {
    fetchMarketData();
}

// Filter markets by category
function filterMarkets(category) {
    const filtered = category === 'all' 
        ? currentMarkets 
        : currentMarkets.filter(m => m.category === category);
    
    marketsListEl.innerHTML = filtered.map(renderMarketItem).join('');
}

// Filter alerts by type
function filterAlerts(type) {
    const filtered = type === 'all'
        ? mockAlerts
        : mockAlerts.filter(a => a.type === type);
    
    if (filtered.length === 0) {
        noAlertsMessage.style.display = 'block';
        alertsListEl.innerHTML = '';
    } else {
        noAlertsMessage.style.display = 'none';
        alertsListEl.innerHTML = filtered.map(renderAlertItem).join('');
    }
}

// Initialize
async function init() {
    // Start with fallback data
    currentMarkets = fallbackMarkets;
    populateWatchlist();
    populateMarkets();
    populateAlerts();
    updateTimestamp();
    
    // Try to fetch real data
    setTimeout(() => {
        fetchMarketData();
    }, 1000);
    
    // Refresh button
    refreshBtn.addEventListener('click', simulateRefresh);
    
    // Market filters
    document.querySelectorAll('.market-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.market-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterMarkets(btn.textContent.toLowerCase());
        });
    });
    
    // Alert filters
    document.querySelectorAll('.alert-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.alert-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterAlerts(btn.textContent.toLowerCase());
        });
    });
    
    // Settings toggles
    document.getElementById('breakoutToggle').addEventListener('change', function() {
        showToast(`Breakout detection ${this.checked ? 'enabled' : 'disabled'}`);
    });
    
    document.getElementById('volumeToggle').addEventListener('change', function() {
        showToast(`Unusual volume detection ${this.checked ? 'enabled' : 'disabled'}`);
    });
    
    document.getElementById('rsiToggle').addEventListener('change', function() {
        showToast(`RSI extreme detection ${this.checked ? 'enabled' : 'disabled'}`);
    });
    
    // Auto‑refresh every 60 seconds (Alpha Vantage free tier: 5 calls/minute)
    setInterval(() => {
        if (!isLoading) {
            fetchMarketData();
        }
    }, 60000);
    
    // Update status bar time every minute
    setInterval(() => {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.querySelector('.status-left .time').textContent = timeString;
    }, 60000);
    
    // Show welcome toast
    setTimeout(() => {
        showToast('Market Pulse ready. Fetching live data...');
    }, 500);
}

// Add CSS for source badge
const style = document.createElement('style');
style.textContent = `
    .source-badge {
        font-size: 10px;
        background: #444;
        color: #ccc;
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: 6px;
        vertical-align: middle;
    }
    .loading {
        text-align: center;
        padding: 40px;
        color: #666;
        font-size: 14px;
    }
`;
document.head.appendChild(style);

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}