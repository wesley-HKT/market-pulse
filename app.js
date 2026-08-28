// Mock market data - same as Expo project
const mockMarkets = [
    {
        symbol: 'XAU/USD',
        name: 'Gold Spot',
        category: 'metals',
        currentPrice: 2345.67,
        change: 12.34,
        changePercent: 0.53,
        lastUpdated: new Date().toISOString(),
        iconClass: 'gold',
        icon: 'fas fa-gem'
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
        icon: 'fab fa-bitcoin'
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
        icon: 'fas fa-yen-sign'
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
        icon: 'fas fa-euro-sign'
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
        icon: 'fas fa-pound-sign'
    }
];

// Mock alerts
const mockAlerts = [
    {
        id: 1,
        symbol: 'XAU/USD',
        title: 'Breakout Detected',
        type: 'breakout',
        message: 'Gold broke above resistance at 2330. Price currently 2345.67.',
        time: '10 minutes ago',
        severity: 'medium'
    },
    {
        id: 2,
        symbol: 'BTC/USD',
        title: 'Unusual Volume Spike',
        type: 'volume',
        message: 'Bitcoin volume 2.3x 30‑day average. Current price 68542.19.',
        time: '25 minutes ago',
        severity: 'high'
    },
    {
        id: 3,
        symbol: 'USD/JPY',
        title: 'RSI Oversold',
        type: 'rsi',
        message: 'RSI dropped below 30. Current price 148.92.',
        time: '1 hour ago',
        severity: 'low'
    }
];

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
    
    return `
        <div class="watchlist-item">
            <div class="instrument">
                <div class="instrument-icon ${market.iconClass}">
                    <i class="${market.icon}"></i>
                </div>
                <div class="instrument-info">
                    <h4>${market.symbol}</h4>
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
    
    return `
        <div class="market-item">
            <div class="instrument">
                <div class="instrument-icon ${market.iconClass}">
                    <i class="${market.icon}"></i>
                </div>
                <div class="instrument-info">
                    <h4>${market.symbol}</h4>
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

// Populate watchlist
function populateWatchlist() {
    watchlistEl.innerHTML = mockMarkets.map(renderWatchlistItem).join('');
}

// Populate markets list
function populateMarkets() {
    marketsListEl.innerHTML = mockMarkets.map(renderMarketItem).join('');
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
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Update timestamp
function updateTimestamp() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    lastUpdateTime.textContent = timeString;
}

// Simulate refresh
function simulateRefresh() {
    // Add a slight random fluctuation to prices
    mockMarkets.forEach(market => {
        const fluctuation = (Math.random() - 0.5) * 10;
        market.currentPrice += fluctuation;
        market.change += fluctuation;
        market.changePercent = (market.change / (market.currentPrice - market.change)) * 100;
        market.lastUpdated = new Date().toISOString();
    });
    
    updateTimestamp();
    populateWatchlist();
    populateMarkets();
    showToast('Watchlist updated with latest data');
}

// Filter markets by category
function filterMarkets(category) {
    const filtered = category === 'all' 
        ? mockMarkets 
        : mockMarkets.filter(m => m.category === category);
    
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
function init() {
    populateWatchlist();
    populateMarkets();
    populateAlerts();
    updateTimestamp();
    
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
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        simulateRefresh();
    }, 30000);
    
    // Update status bar time every minute
    setInterval(() => {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.querySelector('.status-left .time').textContent = timeString;
    }, 60000);
    
    // Show welcome toast
    setTimeout(() => {
        showToast('Market Pulse ready. All data is mock.');
    }, 1000);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}