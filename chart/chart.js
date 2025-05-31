// Inisialisasi TradingView Widget dan Chart.js
let currentSymbol = 'BTCUSD';
let currentInterval = 'D';
const API_KEY = 'SOSO-0ce237c06c284fb4afd341dcfaedc17a';
let currentChartType = 'advanced'; // 'advanced' untuk TradingView, 'simple' untuk gaya home
let canvasChart = null; // Akan menyimpan instance Chart.js
let websocket = null;

// Fungsi untuk memperbarui tema container chart berdasarkan coin yang dipilih
function updateChartTheme(symbol) {
    // Dapatkan nama coin dari symbol
    const coinName = symbol.toLowerCase().replace('usd', '');
    
    // Peta nama coin ke kelas tema
    const themeMap = {
        'btc': 'bitcoin-theme',
        'eth': 'ethereum-theme',
        'bnb': 'bnb-theme',
        'sol': 'solana-theme',
        'xrp': 'xrp-theme',
        'ada': 'cardano-theme',
        'doge': 'doge-theme',
        'dot': 'polkadot-theme',
        'avax': 'avalanche-theme',
        'shib': 'shiba-theme'
    };
    
    // Dapatkan kelas tema untuk coin yang dipilih
    const themeClass = themeMap[coinName] || '';
    
    // Hapus semua kelas tema dari container chart
    const containers = [
        document.getElementById('tradingview-chart'),
        document.getElementById('canvas-chart-container')
    ];
    
    containers.forEach(container => {
        Object.values(themeMap).forEach(cls => {
            if (container) container.classList.remove(cls);
        });
        // Tambahkan kelas tema baru
        if (container && themeClass) container.classList.add(themeClass);
    });
}

function createChart(symbol, interval) {
    updateChartTheme(symbol);
    
    if (currentChartType === 'advanced') {
        createTradingViewChart(symbol, interval);
    } else {
        createSimpleChart(symbol, interval);
    }
    
    // Update selected coin name
    updateSelectedCoin(symbol);
    
    // Fetch and update market stats for the selected coin
    connectWebSocket(symbol);
    fetchCryptoCompareStats(symbol);
}

function createTradingViewChart(symbol, interval) {
    const chartContainer = document.getElementById('tradingview-chart');
    const canvasContainer = document.getElementById('canvas-chart-container');
    
    // Show TradingView, hide Canvas
    chartContainer.style.display = 'block';
    canvasContainer.style.display = 'none';
    
    // Show loading state
    chartContainer.innerHTML = '';
    chartContainer.classList.add('loading');
    
    // Short delay to ensure DOM updates
    setTimeout(() => {
        chartContainer.classList.remove('loading');
        
        new TradingView.widget({
            "width": "100%",
            "height": 500,
            "symbol": "BINANCE:" + symbol,
            "interval": interval,
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "en",
            "toolbar_bg": "#1a1a2e",
            "enable_publishing": false,
            "allow_symbol_change": false,
            "container_id": "tradingview-chart",
            "hide_side_toolbar": false,
            "backgroundColor": "rgba(0, 0, 0, 0.5)",
            "gridColor": "rgba(255, 255, 255, 0.05)",
            "withdateranges": true
        });
    }, 300);
}

// Fungsi baru: ambil data dari CryptoCompare
async function fetchCryptoCompareHistory(coin, interval) {
    // Pemetaan symbol
    const symbolMap = {
        btc: 'BTC', eth: 'ETH', bnb: 'BNB', sol: 'SOL',
        xrp: 'XRP', ada: 'ADA', doge: 'DOGE', dot: 'DOT',
        avax: 'AVAX', shib: 'SHIB'
    };
    const fsym = symbolMap[coin] || coin.toUpperCase();
    const tsym = 'USD';
    let apiUrl = '';
    let limit = 30;
    // Pemetaan interval
    if (interval === 900) { // 15m
        apiUrl = 'https://min-api.cryptocompare.com/data/v2/histominute';
        limit = 15;
    } else if (interval === 3600) { // 1h
        apiUrl = 'https://min-api.cryptocompare.com/data/v2/histohour';
        limit = 24;
    } else if (interval === 86400) { // 1d
        apiUrl = 'https://min-api.cryptocompare.com/data/v2/histohour';
        limit = 24;
    } else if (interval === 604800) { // 1w
        apiUrl = 'https://min-api.cryptocompare.com/data/v2/histohour';
        limit = 168;
    } else if (interval === 2592000) { // 1m
        apiUrl = 'https://min-api.cryptocompare.com/data/v2/histoday';
        limit = 30;
    } else {
        apiUrl = 'https://min-api.cryptocompare.com/data/v2/histohour';
        limit = 24;
    }
    const url = `${apiUrl}?fsym=${fsym}&tsym=${tsym}&limit=${limit}&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Response API CryptoCompare tidak OK');
    const result = await response.json();
    if (!result.Data || !result.Data.Data) throw new Error('Data CryptoCompare tidak valid');
    // Kembalikan array [timestamp, harga]
    return result.Data.Data.map(item => [item.time * 1000, item.close]);
}

// Ubah createSimpleChart agar pakai CryptoCompare
function createSimpleChart(symbol, interval) {
    const chartContainer = document.getElementById('tradingview-chart');
    const canvasContainer = document.getElementById('canvas-chart-container');
    chartContainer.style.display = 'none';
    canvasContainer.style.display = 'block';
    // Convert TradingView intervals to seconds for API
    const intervalMap = {
        '15': 900,    // 15 minutes
        '60': 3600,   // 1 hour
        'D': 86400,   // 1 day
        'W': 604800,  // 1 week
        'M': 2592000  // 1 month (30 days)
    };
    const seconds = intervalMap[interval] || 86400;
    const coin = symbol.replace('USD', '').toLowerCase();
    // Fetch historical data for the chart
    fetchCryptoCompareHistory(coin, seconds)
        .then(data => {
            renderCanvasChart(data, coin);
        })
        .catch(error => {
            console.error('Error fetching CryptoCompare data:', error);
            renderCanvasChartWithFallbackData(coin);
        });
}

function renderCanvasChart(data, coin) {
    const ctx = document.getElementById('canvas-chart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (canvasChart) canvasChart.destroy();
    
    // Prepare data for Chart.js
    const chartData = processChartData(data);
    
    // Get colors based on coin
    const colors = getCoinColors(coin);
    
    canvasChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: coin.toUpperCase() + ' Price',
                data: chartData.prices,
                borderColor: colors.main,
                backgroundColor: colors.gradient,
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return coin.toUpperCase() + ': $' + context.parsed.y.toLocaleString();
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'rgba(255, 255, 255, 0.8)',
                    bodyColor: 'rgba(255, 255, 255, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1
                }
            }
        }
    });
}

function processChartData(data) {
    // This function converts API data to Chart.js format
    // Format will depend on your API response structure
    const labels = [];
    const prices = [];
    
    // Assuming data is an array of [timestamp, price] pairs
    data.forEach(point => {
        const date = new Date(point[0]);
        labels.push(formatDate(date));
        prices.push(point[1]);
    });
    
    return { labels, prices };
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getCoinColors(coin) {
    // Define color schemes for each coin
    const colorMap = {
        'btc': {
            main: 'rgba(247, 147, 26, 1)',
            gradient: createGradient('rgba(247, 147, 26, 0.5)', 'rgba(247, 147, 26, 0)')
        },
        'eth': {
            main: 'rgba(98, 126, 234, 1)',
            gradient: createGradient('rgba(98, 126, 234, 0.5)', 'rgba(98, 126, 234, 0)')
        },
        'bnb': {
            main: 'rgba(243, 186, 47, 1)',
            gradient: createGradient('rgba(243, 186, 47, 0.5)', 'rgba(243, 186, 47, 0)')
        },
        'sol': {
            main: 'rgba(0, 255, 189, 1)',
            gradient: createGradient('rgba(0, 255, 189, 0.5)', 'rgba(0, 255, 189, 0)')
        },
        'xrp': {
            main: 'rgba(35, 41, 47, 1)',
            gradient: createGradient('rgba(35, 41, 47, 0.5)', 'rgba(35, 41, 47, 0)')
        },
        'ada': {
            main: 'rgba(0, 51, 173, 1)',
            gradient: createGradient('rgba(0, 51, 173, 0.5)', 'rgba(0, 51, 173, 0)')
        },
        'doge': {
            main: 'rgba(195, 166, 52, 1)',
            gradient: createGradient('rgba(195, 166, 52, 0.5)', 'rgba(195, 166, 52, 0)')
        },
        'dot': {
            main: 'rgba(230, 0, 122, 1)',
            gradient: createGradient('rgba(230, 0, 122, 0.5)', 'rgba(230, 0, 122, 0)')
        },
        'avax': {
            main: 'rgba(232, 65, 66, 1)',
            gradient: createGradient('rgba(232, 65, 66, 0.5)', 'rgba(232, 65, 66, 0)')
        },
        'shib': {
            main: 'rgba(255, 164, 9, 1)',
            gradient: createGradient('rgba(255, 164, 9, 0.5)', 'rgba(255, 164, 9, 0)')
        }
    };
    
    return colorMap[coin] || {
        main: 'rgba(255, 255, 255, 1)',
        gradient: createGradient('rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)')
    };
}

function createGradient(colorStart, colorEnd) {
    const ctx = document.getElementById('canvas-chart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
}

function renderCanvasChartWithFallbackData(coin) {
    // Generate sample data if API fails
    const sampleData = [];
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    // Generate 30 data points
    for (let i = 30; i >= 0; i--) {
        const timestamp = now - (i * day / 30);
        
        // Base prices for different coins
        const basePrices = {
            'btc': 45000,
            'eth': 3200,
            'bnb': 560,
            'sol': 120,
            'xrp': 0.58,
            'ada': 0.45,
            'doge': 0.12,
            'dot': 6.8,
            'avax': 37,
            'shib': 0.000023
        };
        
        const basePrice = basePrices[coin] || 100;
        
        // Add some random variation
        const randomFactor = 0.05; // 5% variation
        const price = basePrice + (basePrice * randomFactor * (Math.random() * 2 - 1));
        
        sampleData.push([timestamp, price]);
    }
    
    renderCanvasChart(sampleData, coin);
}

function updateSelectedCoin(symbol) {
    const coinMap = {
        'BTCUSD': 'Bitcoin (BTC)',
        'ETHUSD': 'Ethereum (ETH)',
        'BNBUSD': 'BNB (BNB)',
        'SOLUSD': 'Solana (SOL)',
        'XRPUSD': 'XRP (XRP)',
        'ADAUSD': 'Cardano (ADA)',
        'DOGEUSD': 'Dogecoin (DOGE)',
        'DOTUSD': 'Polkadot (DOT)',
        'AVAXUSD': 'Avalanche (AVAX)',
        'SHIBUSD': 'Shiba Inu (SHIB)'
    };
    
    document.getElementById('selected-coin').textContent = coinMap[symbol] || symbol;
    
    // Update the coin icon class
    const coinIconClass = symbol.toLowerCase().replace('usd', '');
    const currentCoinIcon = document.querySelector('.current-coin .coin-icon');
    
    // Remove all coin-specific classes
    currentCoinIcon.className = 'coin-icon large';
    // Add the specific coin class
    currentCoinIcon.classList.add(coinIconClass);
}

function connectWebSocket(symbol) {
    if (websocket) {
        websocket.close();
    }

    const coin = symbol.replace('USD', '').toLowerCase();
    websocket = new WebSocket(`wss://api.sosmarkets.com/v1/stream/${coin}/usd?apikey=${API_KEY}`);

    websocket.onopen = () => {
        console.log('WebSocket connection established');
    };

    websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        updateRealTimeData(data);
    };

    websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Fallback to REST API if WebSocket fails
        fetchMarketStats(symbol);
    };

    websocket.onclose = () => {
        console.log('WebSocket connection closed');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => connectWebSocket(symbol), 5000);
    };
}

// Function to update real-time data (WebSocket)
function updateRealTimeData(data) {
    try {
        // Hanya update chart jika mode simple dan canvasChart aktif
        if (currentChartType === 'simple' && canvasChart) {
            updateChartData(data);
        }
        // Jangan update elemen stats di sini, biarkan hanya CryptoCompare yang update stats
        // document.getElementById('current-price').textContent = ...
        // document.getElementById('price-change').textContent = ...
        // document.getElementById('price-change').className = ...
        // document.getElementById('day-high').textContent = ...
        // document.getElementById('day-low').textContent = ...
        // document.getElementById('market-cap').textContent = ...
        // document.getElementById('volume').textContent = ...
        // document.getElementById('last-updated').textContent = ...
    } catch (error) {
        console.error('Error updating real-time data:', error);
    }
}

function updateChartData(data) {
    if (!canvasChart) return;

    const chartData = canvasChart.data;
    const newPrice = parseFloat(data.price);

    // Add new data point
    chartData.labels.push(new Date().toLocaleTimeString());
    chartData.datasets[0].data.push(newPrice);

    // Keep only last 30 data points
    if (chartData.labels.length > 30) {
        chartData.labels.shift();
        chartData.datasets[0].data.shift();
    }

    canvasChart.update();
}

async function fetchMarketStats(symbol) {
    const coin = symbol.replace('USD', '');
    
    try {
        const response = await fetch(`https://api.sosmarkets.com/v1/assets/${coin}?apikey=${API_KEY}`);
        if (!response.ok) throw new Error('API response not ok');
        
        const data = await response.json();
        updateRealTimeData(data);
    } catch (error) {
        console.error('Error fetching market data:', error);
        useFallbackData(symbol);
    }
}

function formatLargeNumber(num) {
    if (!num) return '$0';
    
    // Convert to number if it's a string
    num = typeof num === 'string' ? parseFloat(num) : num;
    
    if (num >= 1e12) {
        return '$' + (num / 1e12).toFixed(1) + 'T';
    } else if (num >= 1e9) {
        return '$' + (num / 1e9).toFixed(1) + 'B';
    } else if (num >= 1e6) {
        return '$' + (num / 1e6).toFixed(1) + 'M';
    } else if (num >= 1e3) {
        return '$' + (num / 1e3).toFixed(1) + 'K';
    }
    return '$' + num.toFixed(2);
}

function formatCurrency(value) {
    if (!value) return '$0.00';
    
    // Convert to number if it's a string
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    return num.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: num < 1 ? 6 : 2
    });
}


// Auto-refresh data every 60 seconds
function setupAutoRefresh() {
    setInterval(() => {
        fetchMarketStats(currentSymbol);
    }, 60000); // 60 seconds
}

// Add new function for chart auto-refresh
function setupChartAutoRefresh() {
    setInterval(() => {
        if (currentChartType === 'advanced') {
            // For TradingView chart, we need to recreate the widget
            createTradingViewChart(currentSymbol, currentInterval);
        } else {
            // For simple chart, fetch new data and update
            const coin = currentSymbol.replace('USD', '').toLowerCase();
            const intervalMap = {
                '15': 900,    // 15 minutes
                '60': 3600,   // 1 hour
                'D': 86400,   // 1 day
                'W': 604800,  // 1 week
                'M': 2592000  // 1 month (30 days)
            };
            const seconds = intervalMap[currentInterval] || 86400;
            
            fetchHistoricalData(coin, seconds)
                .then(data => {
                    renderCanvasChart(data, coin);
                })
                .catch(error => {
                    console.error('Error refreshing chart data:', error);
                });
        }
    }, 30000); // Refresh every 30 seconds
}

// Modify the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    createChart(currentSymbol, currentInterval);
    
    // Set up auto-refresh for both market stats and chart
    setupAutoRefresh();
    setupChartAutoRefresh();
    
    // Chart type selection
    const chartTypeButtons = document.querySelectorAll('.chart-type-option');
    chartTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const chartType = this.getAttribute('data-chart-type');
            currentChartType = chartType;
            
            // Update active state
            chartTypeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            createChart(currentSymbol, currentInterval);
        });
    });
    
    // Coin selection
    const coinList = document.querySelectorAll('.coin-list li');
    coinList.forEach(coin => {
        coin.addEventListener('click', function() {
            const symbol = this.getAttribute('data-symbol');
            currentSymbol = symbol;
            
            // Update active state
            coinList.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            
            createChart(currentSymbol, currentInterval);
        });
    });
    
    // Timeframe selection
    const timeframeButtons = document.querySelectorAll('.timeframe-btn');
    timeframeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const interval = this.getAttribute('data-interval');
            currentInterval = interval;
            
            // Update active state
            timeframeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            createChart(currentSymbol, currentInterval);
        });
    });
    
    // Load Chart.js library if not already loaded
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
        script.onload = function() {
            console.log('Chart.js loaded successfully');
            if (currentChartType === 'simple') {
                createSimpleChart(currentSymbol, currentInterval);
            }
        };
        script.onerror = function() {
            console.error('Failed to load Chart.js');
        };
        document.head.appendChild(script);
    }
});

// Kode debugging
console.log('Inisialisasi Chart dimulai');
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM sepenuhnya dimuat');
    console.log('Elemen container TradingView:', document.getElementById('tradingview-chart'));
    console.log('API Key Chart:', API_KEY);
    
    // Periksa apakah library TradingView dimuat
    if (typeof TradingView === 'undefined') {
        console.error('Library TradingView tidak dimuat!');
    } else {
        console.log('Library TradingView berhasil dimuat');
    }
    
    try {
        createChart(currentSymbol, currentInterval);
        console.log('Chart berhasil dibuat');
    } catch (error) {
        console.error('Error membuat chart:', error);
    }
});

// Fetch real-time stats from CryptoCompare
async function fetchCryptoCompareStats(symbol) {
    // symbol: e.g. BTCUSD
    const coin = symbol.replace('USD', '');
    const url = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${coin}&tsyms=USD&api_key=${API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('CryptoCompare stats API response not OK');
        const data = await response.json();
        if (!data.RAW || !data.RAW[coin] || !data.RAW[coin].USD) throw new Error('Invalid CryptoCompare stats data');
        const stats = data.RAW[coin].USD;
        // Update DOM
        document.getElementById('current-price').textContent = stats.PRICE ? stats.PRICE.toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: stats.PRICE < 1 ? 6 : 2}) : 'N/A';
        const change = stats.CHANGEPCT24HOUR || 0;
        document.getElementById('price-change').textContent = (change > 0 ? '+' : '') + change.toFixed(2) + '%';
        document.getElementById('price-change').className = change >= 0 ? 'stat-value positive' : 'stat-value negative';
        document.getElementById('day-high').textContent = stats.HIGH24HOUR ? stats.HIGH24HOUR.toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: stats.HIGH24HOUR < 1 ? 6 : 2}) : 'N/A';
        document.getElementById('day-low').textContent = stats.LOW24HOUR ? stats.LOW24HOUR.toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: stats.LOW24HOUR < 1 ? 6 : 2}) : 'N/A';
        document.getElementById('market-cap').textContent = stats.MKTCAP ? formatLargeNumber(stats.MKTCAP) : 'N/A';
        document.getElementById('volume').textContent = stats.VOLUME24HOURTO ? formatLargeNumber(stats.VOLUME24HOURTO) : 'N/A';
        document.getElementById('last-updated').textContent = new Date().toLocaleString();
    } catch (error) {
        console.error('Error fetching CryptoCompare stats:', error);
        // Set all stats to N/A if error
        document.getElementById('current-price').textContent = 'N/A';
        document.getElementById('price-change').textContent = 'N/A';
        document.getElementById('price-change').className = 'stat-value';
        document.getElementById('day-high').textContent = 'N/A';
        document.getElementById('day-low').textContent = 'N/A';
        document.getElementById('market-cap').textContent = 'N/A';
        document.getElementById('volume').textContent = 'N/A';
        document.getElementById('last-updated').textContent = new Date().toLocaleString();
    }
}