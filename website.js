// Website version - clean dashboard without iPhone UI
const BACKEND_URL = 'https://market-pulse-umber.vercel.app/api/market-data';

// DOM Elements
const watchlistEl = document.getElementById('watchlist');
const alertsContainer = document.getElementById('alertsContainer');
const noAlertsMessage = document.getElementById('noAlertsMessage');
const refreshBtn = document.getElementById('refreshBtn');
const refreshIcon = document.getElementById('refreshIcon');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');
const lastUpdateTime = document.getElementById('lastUpdateTime');
const activeAlertsCount = document.getElementById('activeAlertsCount');
const watchlistCount = document.getElementById('watchlistCount');
const alertsCount = document.getElementById('alertsCount');
const dataSource = document.getElementById('dataSource');

// State
let currentMarkets = [];
let currentAlerts = [];
let isLoading = false;

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
        <div class="instrument">
            <div class="instrument-left">
                <div class="instrument-icon ${market.iconClass}">
                    <i class="${market.icon}"></i>
                </div>
                <div class="instrument-info">
                    <h3>${market.symbol} ${sourceBadge}</h3>
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
        <div class="alert ${alert.type}">
            <div class="alert-header">
                <div class="alert-title">${alert.symbol} - ${alert.title}</div>
                <div class="alert-time">${alert.time}</div>
            </div>
            <div class="alert-body">
                <p>${alert.message}</p>
                <p><strong>Severity:</strong> ${alert.severity}</p>
            </div>
            <div class="alert-actions">
                <button class="action-btn primary" onclick="acknowledgeAlert('${alert.id}')">Acknowledge</button>
                <button class="action-btn secondary" onclick="viewAlertDetails('${alert.id}')">Details</button>
            </div>
        </div>
    `;
}

// Fetch market data and alerts
async function fetchMarketData() {
    if (isLoading) return;
    
    isLoading = true;
    refreshIcon.className = 'fas fa-spinner fa-spin';
    
    try {
        const response = await fetch(`${BACKEND_URL}?symbols=XAUUSD,BTCUSD,USDJPY,EURJPY,GBPJPY`);
        
        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            currentMarkets = data.markets || [];
            currentAlerts = data.alerts || [];
            updateUI();
            showToast('Market data updated');
        } else {
            throw new Error('No market data received');
        }
    } catch (error) {
        console.error('Failed to fetch market data:', error.message);
        // Use fallback data
        currentMarkets = getFallbackMarkets();
        currentAlerts = [];
        showToast('Using fallback data', 'warning');
        updateUI();
    } finally {
        isLoading = false;
        refreshIcon.className = 'fas fa-sync-alt';
    }
}

// Update UI with current data
function updateUI() {
    // Update watchlist
    if (currentMarkets.length > 0) {
        watchlistEl.innerHTML = currentMarkets.map(renderWatchlistItem).join('');
    } else {
        watchlistEl.innerHTML = '<div class="loading"><i class="fas fa-exclamation-triangle"></i><p>No market data available</p></div>';
    }
    
    // Update alerts
    if (currentAlerts.length > 0) {
        noAlertsMessage.style.display = 'none';
        alertsContainer.innerHTML = currentAlerts.map(renderAlertItem).join('');
    } else {
        noAlertsMessage.style.display = 'block';
        alertsContainer.innerHTML = '';
    }
    
    // Update counters
    watchlistCount.textContent = currentMarkets.length;
    activeAlertsCount.textContent = currentAlerts.length;
    alertsCount.textContent = currentAlerts.length;
    
    // Update timestamp
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    lastUpdateTime.textContent = timeString;
    
    // Update data source
    const source = currentMarkets[0]?.source || 'Alpha Vantage';
    dataSource.textContent = source;
}

// Show toast notification
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    
    if (type === 'warning') {
        toastIcon.className = 'fas fa-exclamation-triangle';
        toast.classList.add('warning');
    } else {
        toastIcon.className = 'fas fa-check-circle';
        toast.classList.remove('warning');
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Alert actions
function acknowledgeAlert(alertId) {
    currentAlerts = currentAlerts.filter(alert => alert.id !== alertId);
    updateUI();
    showToast('Alert acknowledged');
}

function viewAlertDetails(alertId) {
    const alert = currentAlerts.find(a => a.id === alertId);
    if (alert) {
        alert(`Alert Details:\n\n${alert.symbol} - ${alert.title}\n\n${alert.message}\n\nSeverity: ${alert.severity}\nTime: ${alert.time}`);
    }
}

// Fallback data
function getFallbackMarkets() {
    return [
        {
            symbol: 'XAUUSD',
            name: 'Gold Spot',
            currentPrice: 2345.67,
            change: 12.34,
            changePercent: 0.53,
            iconClass: 'gold',
            icon: 'fas fa-gem',
            source: 'fallback'
        },
        {
            symbol: 'BTCUSD',
            name: 'Bitcoin',
            currentPrice: 68542.19,
            change: -1234.56,
            changePercent: -1.77,
            iconClass: 'crypto',
            icon: 'fab fa-bitcoin',
            source: 'fallback'
        },
        {
            symbol: 'USDJPY',
            name: 'US Dollar / Japanese Yen',
            currentPrice: 148.92,
            change: 0.34,
            changePercent: 0.23,
            iconClass: 'forex',
            icon: 'fas fa-yen-sign',
            source: 'fallback'
        },
        {
            symbol: 'EURJPY',
            name: 'Euro / Japanese Yen',
            currentPrice: 160.45,
            change: -0.28,
            changePercent: -0.17,
            iconClass: 'forex',
            icon: 'fas fa-euro-sign',
            source: 'fallback'
        },
        {
            symbol: 'GBPJPY',
            name: 'British Pound / Japanese Yen',
            currentPrice: 187.23,
            change: 0.67,
            changePercent: 0.36,
            iconClass: 'forex',
            icon: 'fas fa-pound-sign',
            source: 'fallback'
        }
    ];
}

// Initialize
async function init() {
    // Set up refresh button
    refreshBtn.addEventListener('click', fetchMarketData);
    
    // Set up toggle switches
    document.getElementById('breakoutToggle').addEventListener('change', function() {
        showToast(`Breakout detection ${this.checked ? 'enabled' : 'disabled'}`);
    });
    
    document.getElementById('volumeToggle').addEventListener('change', function() {
        showToast(`Unusual volume detection ${this.checked ? 'enabled' : 'disabled'}`);
    });
    
    document.getElementById('rsiToggle').addEventListener('change', function() {
        showToast(`RSI extreme detection ${this.checked ? 'enabled' : 'disabled'}`);
    });
    
    // Load initial data
    fetchMarketData();
    
    // Auto-refresh every 60 seconds
    setInterval(() => {
        if (!isLoading) {
            fetchMarketData();
        }
    }, 60000);
    
    // Show welcome message
    setTimeout(() => {
        showToast('Market Pulse dashboard ready');
    }, 1000);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}