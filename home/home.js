document.addEventListener("DOMContentLoaded", function () {
    // Initialize cryptocurrency ticker
    initCryptoTicker();

    // Load Chart.js only once and then initialize charts
    if (typeof Chart === "undefined") {
        loadScript(
            "https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js",
            initCharts
        );
    } else {
        initCharts();
    }
});

async function initCryptoTicker() {
    const tickerContainer = document.getElementById("crypto-ticker");

    try {
        // Fetch top coins data from CryptoCompare with API key
        const url =
            "https://min-api.cryptocompare.com/data/top/mktcapfull?limit=20&tsym=USD&api_key=SOSO-0ce237c06c284fb4afd341dcfaedc17a";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API response: ${response.status}`);
        }

        const result = await response.json();

        if (!result.Data || !Array.isArray(result.Data)) {
            throw new Error("Invalid data structure received from API");
        }

        // Process the data from CryptoCompare format
        const data = result.Data.map((item) => ({
            name: item.CoinInfo.Name,
            symbol: item.CoinInfo.Name,
            image: `https://www.cryptocompare.com${item.CoinInfo.ImageUrl}`,
            current_price: item.RAW?.USD?.PRICE || 0,
            price_change_percentage_24h: item.RAW?.USD?.CHANGEPCT24HOUR || 0,
        }));

        // Clear loading message
        tickerContainer.innerHTML = "";

        // Create ticker items
        const tickerContent = createTickerItems(data);

        // Append original items
        tickerContainer.innerHTML = tickerContent;

        // Clone ticker items for infinite scroll effect
        tickerContainer.innerHTML += tickerContent;

        // Auto-refresh every 60 seconds
        setTimeout(initCryptoTicker, 60000);
    } catch (error) {
        console.error("Error fetching cryptocurrency data:", error);
        tickerContainer.innerHTML = `
            <div class="ticker-loading">
                Error loading cryptocurrency data. Please try again later.
            </div>
        `;
    }
}

function createTickerItems(data) {
    let tickerContent = "";

    data.forEach((crypto) => {
        const priceChange = crypto.price_change_percentage_24h;
        const priceChangeClass = priceChange >= 0 ? "price-up" : "price-down";
        const priceChangeSymbol = priceChange >= 0 ? "+" : "";

        tickerContent += `
            <div class="crypto-item">
                <img src="${crypto.image}" alt="${crypto.name
            }" class="crypto-icon">
                <span class="crypto-name">${crypto.symbol.toUpperCase()}</span>
                <span class="crypto-change ${priceChangeClass}">
                    ${priceChangeSymbol}${priceChange.toFixed(2)}%
                </span>
            </div>
        `;
    });

    return tickerContent;
}

// Adjust animation speed based on screen width
function adjustScrollSpeed() {
    const tickerScroll = document.querySelector(".ticker-scroll");
    if (!tickerScroll) return;

    const screenWidth = window.innerWidth;
    let duration = "30s";

    if (screenWidth < 768) {
        duration = "20s";
    } else if (screenWidth > 1400) {
        duration = "40s";
    }

    tickerScroll.style.animationDuration = duration;
}

window.addEventListener("resize", adjustScrollSpeed);
window.addEventListener("load", adjustScrollSpeed);

function loadScript(src, callback) {
    const script = document.createElement("script");
    script.src = src;
    script.onload = callback;
    document.head.appendChild(script);
}

function initCharts() {
    console.log("Initializing charts with real-time data...");

    // Create chart instances with empty data initially
    const btcChart = createChart("btc-chart", [], "#F7931A");
    const ethChart = createChart("eth-chart", [], "#627EEA");

    // Default timeframe
    const defaultTimeframe = "1d";

    // Fetch initial data
    fetchCryptoData(
        "bitcoin",
        defaultTimeframe,
        btcChart,
        "btc-price",
        "btc-loader",
        "btc-updated"
    );
    fetchCryptoData(
        "ethereum",
        defaultTimeframe,
        ethChart,
        "eth-price",
        "eth-loader",
        "eth-updated"
    );

    // Set up timeframe button event listeners
    document.querySelectorAll(".timeframe-selector").forEach((selector) => {
        const cryptoId =
            selector.getAttribute("data-chart") === "btc" ? "bitcoin" : "ethereum";
        const chartElement =
            selector.getAttribute("data-chart") === "btc" ? btcChart : ethChart;
        const priceElement = `${selector.getAttribute("data-chart")}-price`;
        const loaderElement = `${selector.getAttribute("data-chart")}-loader`;
        const updatedElement = `${selector.getAttribute("data-chart")}-updated`;

        selector.querySelectorAll(".timeframe-btn").forEach((button) => {
            button.addEventListener("click", function () {
                const period = this.getAttribute("data-period");

                // Update active button state
                selector.querySelectorAll(".timeframe-btn").forEach((btn) => {
                    btn.classList.remove("active");
                });
                this.classList.add("active");

                // Show loader
                document.getElementById(loaderElement).style.display = "flex";

                // Fetch and update data
                fetchCryptoData(
                    cryptoId,
                    period,
                    chartElement,
                    priceElement,
                    loaderElement,
                    updatedElement
                );
            });
        });
    });

    // Set up auto-refresh
    setInterval(() => {
        try {
            // Get active timeframes
            const btcTimeframe =
                document
                    .querySelector(
                        '.timeframe-selector[data-chart="btc"] .timeframe-btn.active'
                    )
                    ?.getAttribute("data-period") || "1d";
            const ethTimeframe =
                document
                    .querySelector(
                        '.timeframe-selector[data-chart="eth"] .timeframe-btn.active'
                    )
                    ?.getAttribute("data-period") || "1d";

            // Get chart instances
            const btcChart = Chart.getChart("btc-chart");
            const ethChart = Chart.getChart("eth-chart");

            // Refresh data
            if (btcChart)
                fetchCryptoData(
                    "bitcoin",
                    btcTimeframe,
                    btcChart,
                    "btc-price",
                    "btc-loader",
                    "btc-updated"
                );
            if (ethChart)
                fetchCryptoData(
                    "ethereum",
                    ethTimeframe,
                    ethChart,
                    "eth-price",
                    "eth-loader",
                    "eth-updated"
                );

            console.log("Chart data refreshed at " + new Date().toLocaleTimeString());
        } catch (error) {
            console.error("Error during auto-refresh:", error);
        }
    }, 120000); // 2 minutes
}

function fetchCryptoData(
    cryptoId,
    timeframe,
    chart,
    priceElementId,
    loaderId,
    updatedElementId
) {
    // Convert timeframe to API parameters
    let days;
    switch (timeframe) {
        case "1d":
            days = 1;
            break;
        case "1w":
            days = 7;
            break;
        case "1m":
            days = 30;
            break;
        case "1y":
            days = 365;
            break;
        default:
            days = 1;
    }

    // Show loader
    document.getElementById(loaderId).style.display = "flex";

    // Using new CryptoCompare API with the provided API key
    // This API is more reliable than CoinGecko for real-time data
    let apiUrl;
    let limit;

    if (timeframe === "1d") {
        apiUrl = "https://min-api.cryptocompare.com/data/v2/histohour";
        limit = 24;
    } else if (timeframe === "1w") {
        apiUrl = "https://min-api.cryptocompare.com/data/v2/histohour";
        limit = 168; // 7 days * 24 hours
    } else if (timeframe === "1m") {
        apiUrl = "https://min-api.cryptocompare.com/data/v2/histoday";
        limit = 30;
    } else {
        apiUrl = "https://min-api.cryptocompare.com/data/v2/histoday";
        limit = 365;
    }

    // Convert CoinGecko coin ids to CryptoCompare symbols
    const symbol = cryptoId === "bitcoin" ? "BTC" : "ETH";

    const fullUrl = `${apiUrl}?fsym=${symbol}&tsym=USD&limit=${limit}&api_key=SOSO-0ce237c06c284fb4afd341dcfaedc17a`;

    console.log(
        `Fetching data for ${cryptoId} with timeframe ${timeframe} from CryptoCompare`
    );

    fetch(fullUrl)
        .then((response) => {
            if (!response.ok) {
                console.error(`API responded with status: ${response.status}`);
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            return response.json();
        })
        .then((result) => {
            console.log(`Received data for ${cryptoId}, processing data points`);

            if (!result.Data || !result.Data.Data || result.Data.Data.length === 0) {
                throw new Error("No price data received from API");
            }

            // Process CryptoCompare data format
            const pricesArray = result.Data.Data.map((item) => ({
                timestamp: item.time * 1000, // Convert to milliseconds
                price: item.close,
            }));

            // Process data
            const chartData = processDataFromCryptoCompare(pricesArray, timeframe);

            // Update chart
            updateChartData(chart, chartData);

            // Update current price display (last price in the array)
            const currentPrice = pricesArray[pricesArray.length - 1].price;
            document.getElementById(priceElementId).textContent =
                "$" + formatNumber(currentPrice);

            // Update last updated timestamp
            document.getElementById(updatedElementId).textContent =
                "Last updated: " + new Date().toLocaleTimeString();

            // Hide loader
            document.getElementById(loaderId).style.display = "none";
        })
        .catch((error) => {
            console.error(`Error fetching data for ${cryptoId}:`, error);

            // Fallback to sample data if API fails
            const fallbackData = generateSampleData(
                timeframe === "1d"
                    ? 24
                    : timeframe === "1w"
                        ? 7
                        : timeframe === "1m"
                            ? 30
                            : 12,
                cryptoId === "bitcoin" ? 60000 : 3000,
                cryptoId === "bitcoin" ? 65000 : 3500
            );

            updateChartData(chart, fallbackData);
            document.getElementById(priceElementId).textContent =
                "$" + formatNumber(fallbackData[fallbackData.length - 1].y);

            // Update last updated with error notice
            document.getElementById(updatedElementId).textContent =
                "Error loading live data";

            // Hide loader
            document.getElementById(loaderId).style.display = "none";
        });
}

// New function to process data from CryptoCompare
function processDataFromCryptoCompare(pricesArray, timeframe) {
    // Filter data points based on timeframe to ensure reasonable display
    let filteredPrices = [...pricesArray]; // Clone the array

    // If we have too many points, sample them appropriately
    const maxPoints = {
        "1d": 24,
        "1w": 42, // One point every 4 hours
        "1m": 30,
        "1y": 52, // One point per week
    };

    if (filteredPrices.length > maxPoints[timeframe]) {
        const samplingRate = Math.floor(
            filteredPrices.length / maxPoints[timeframe]
        );
        filteredPrices = filteredPrices.filter(
            (_, index) =>
                index % samplingRate === 0 || index === filteredPrices.length - 1
        );
    }

    // Convert timestamps to readable format based on timeframe
    return filteredPrices.map((item) => {
        const date = new Date(item.timestamp);
        let label;

        if (timeframe === "1d") {
            label = date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        } else if (timeframe === "1w") {
            label = date.toLocaleDateString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
            });
        } else if (timeframe === "1m") {
            label = date.toLocaleDateString([], { month: "short", day: "numeric" });
        } else {
            label = date.toLocaleDateString([], { month: "short", year: "2-digit" });
        }

        return {
            x: label,
            y: item.price,
            timestamp: date, // Keep full timestamp for tooltips
        };
    });
}

function processChartData(pricesArray, timeframe) {
    // Filter data points based on timeframe to ensure reasonable display
    let filteredPrices = [...pricesArray]; // Clone the array

    // If we have too many points, sample them appropriately
    if (timeframe === "1y" && filteredPrices.length > 365) {
        const samplingRate = Math.floor(filteredPrices.length / 365);
        filteredPrices = filteredPrices.filter(
            (_, index) => index % samplingRate === 0
        );
    } else if (timeframe === "1m" && filteredPrices.length > 60) {
        const samplingRate = Math.floor(filteredPrices.length / 60);
        filteredPrices = filteredPrices.filter(
            (_, index) => index % samplingRate === 0
        );
    } else if (timeframe === "1w" && filteredPrices.length > 84) {
        const samplingRate = Math.floor(filteredPrices.length / 84);
        filteredPrices = filteredPrices.filter(
            (_, index) => index % samplingRate === 0
        );
    } else if (timeframe === "1d" && filteredPrices.length > 24) {
        const samplingRate = Math.floor(filteredPrices.length / 24);
        filteredPrices = filteredPrices.filter(
            (_, index) => index % samplingRate === 0
        );
    }

    // Convert timestamps to readable format based on timeframe
    return filteredPrices.map((item) => {
        const date = new Date(item[0]);
        let label;

        if (timeframe === "1d") {
            label = date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        } else if (timeframe === "1w") {
            label = date.toLocaleDateString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
            });
        } else if (timeframe === "1m") {
            label = date.toLocaleDateString([], { month: "short", day: "numeric" });
        } else {
            label = date.toLocaleDateString([], { month: "short", year: "2-digit" });
        }

        return {
            x: label,
            y: item[1],
            timestamp: date, // Keep full timestamp for tooltips
        };
    });
}

function createChart(canvasId, data, color) {
    const ctx = document.getElementById(canvasId).getContext("2d");

    // Create gradient fill
    const gradientFill = ctx.createLinearGradient(0, 0, 0, 250);
    gradientFill.addColorStop(0, color + "33"); // Add transparency
    gradientFill.addColorStop(1, color + "03"); // Almost transparent at bottom

    return new Chart(ctx, {
        type: "line",
        data: {
            labels: data.map((point) => point.x),
            datasets: [
                {
                    label: "Price",
                    data: data.map((point) => point.y),
                    borderColor: color,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    tension: 0.4,
                    fill: true,
                    backgroundColor: gradientFill,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    mode: "index",
                    intersect: false,
                    backgroundColor: "rgba(21, 12, 40, 0.9)",
                    titleColor: "#fff",
                    bodyColor: "#fff",
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    borderWidth: 1,
                    padding: 10,
                    titleFont: {
                        size: 12,
                    },
                    bodyFont: {
                        size: 14,
                    },
                    callbacks: {
                        label: function (context) {
                            return "$ " + formatNumber(context.raw);
                        },
                        title: function (tooltipItems) {
                            const dataPoint = data[tooltipItems[0].dataIndex];
                            return dataPoint && dataPoint.timestamp
                                ? dataPoint.timestamp.toLocaleString()
                                : tooltipItems[0].label;
                        },
                    },
                },
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false,
                    },
                    ticks: {
                        display: true,
                        maxRotation: 45,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 8,
                        color: "rgba(255, 255, 255, 0.5)",
                        font: {
                            size: 9,
                        },
                    },
                },
                y: {
                    grid: {
                        color: "rgba(255, 255, 255, 0.05)",
                        borderDash: [5, 5],
                    },
                    ticks: {
                        color: "rgba(255, 255, 255, 0.5)",
                        font: {
                            size: 10,
                        },
                        callback: function (value) {
                            return "$ " + formatNumber(value);
                        },
                    },
                },
            },
            interaction: {
                mode: "index",
                intersect: false,
            },
            animation: {
                duration: 1000,
            },
        },
    });
}

function updateChartData(chart, newData) {
    if (!chart || !chart.data) {
        console.error("Invalid chart object for update");
        return;
    }

    // Extract new x and y values
    const labels = newData.map((point) => point.x);
    const values = newData.map((point) => point.y);

    // Update the chart data
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;

    // Force chart update
    chart.update("none"); // Use 'none' for instant update
}

// Fungsi untuk menghasilkan data sampel
function generateSampleData(points, min, max) {
    const data = [];
    let currentValue = min + (Math.random() * (max - min)) / 2;
    const now = new Date();

    for (let i = points - 1; i >= 0; i--) {
        // Random walk with trend
        const change = (Math.random() * (max - min)) / 20 - (max - min) / 40;
        currentValue += change;

        // Keep within bounds
        if (currentValue < min)
            currentValue = min + (Math.random() * (max - min)) / 10;
        if (currentValue > max)
            currentValue = max - (Math.random() * (max - min)) / 10;

        // Create timestamp (going backward in time)
        const timestamp = new Date(now);
        if (points <= 24) {
            // Hourly for 1d
            timestamp.setHours(now.getHours() - i);
        } else if (points <= 7) {
            // Daily for 1w
            timestamp.setDate(now.getDate() - i);
        } else if (points <= 30) {
            // Daily for 1m
            timestamp.setDate(now.getDate() - i);
        } else {
            // Monthly for 1y
            timestamp.setMonth(now.getMonth() - i);
        }

        let label;
        if (points <= 24) {
            label = timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        } else if (points <= 7) {
            label = timestamp.toLocaleDateString([], { weekday: "short" });
        } else if (points <= 30) {
            label = timestamp.toLocaleDateString([], {
                month: "short",
                day: "numeric",
            });
        } else {
            label = timestamp.toLocaleDateString([], {
                month: "short",
                year: "2-digit",
            });
        }

        data.push({
            x: label,
            y: currentValue,
            timestamp: timestamp,
        });
    }

    return data;
}

function formatNumber(num) {
    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
}


// Function to fetch whale transactions data from CoinGecko
async function fetchWhaleTransactions() {
    try {
        // Get top coins from CoinGecko
        const response = await fetch(
            "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1"
        );
        const coins = await response.json();

        // Create simulated whale transactions
        displayWhaleTransactions(generateWhaleTransactions(coins));
    } catch (error) {
        console.error("Error fetching whale data:", error);
        document.getElementById("whale-alert-container").innerHTML =
            '<p class="error-message">Failed to load whale transactions</p>';
    }
}

// Generate whale transactions based on real coins
function generateWhaleTransactions(coins) {
    const transactions = [];
    const exchanges = [
        "Binance",
        "Coinbase",
        "Kraken",
        "Unknown Wallet",
        "Huobi",
        "FTX",
    ];

    coins.slice(0, 5).forEach((coin) => {
        // Create 1 transaction per coin
        const amount = (Math.random() * 1000 + 500).toFixed(2);
        const value = (amount * coin.current_price).toFixed(0);
        const fromIndex = Math.floor(Math.random() * exchanges.length);
        let toIndex;
        do {
            toIndex = Math.floor(Math.random() * exchanges.length);
        } while (toIndex === fromIndex);

        transactions.push({
            symbol: coin.symbol.toUpperCase(),
            amount: amount,
            value: value,
            from: exchanges[fromIndex],
            to: exchanges[toIndex],
            time: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600),
            // Fix iconUrl reference
            iconUrl: coin.image, // Changed from 'image' to 'iconUrl'
        });
    });

    // Sort by time (most recent first)
    return transactions.sort((a, b) => b.time - a.time);
}

// Display whale transactions in the alert container
function displayWhaleTransactions(transactions) {
    const container = document.getElementById("whale-alert-container");
    if (!container) return;

    container.innerHTML = "";

    // Create a wrapper for the alerts
    const alertsWrapper = document.createElement("div");
    alertsWrapper.className = "whale-alerts-wrapper";

    // Take only the 3 most recent transactions to display
    transactions.slice(0, 3).forEach((tx) => {
        const isSmallScreen = window.innerWidth <= 480;
        const alertItem = document.createElement("div");
        alertItem.className = "whale-alert-item";
        
        // Truncate addresses for cleaner display
        const fromAddress = isSmallScreen ? tx.from.substring(0, 5) + '...' : 
                           tx.from.length > 8 ? tx.from.substring(0, 8) + '...' : tx.from;
        const toAddress = isSmallScreen ? tx.to.substring(0, 5) + '...' : 
                         tx.to.length > 8 ? tx.to.substring(0, 8) + '...' : tx.to;
        
        // Format amount to be more compact
        const formattedAmount = formatCompactNumber(tx.amount);
        
        alertItem.innerHTML = `
            <div class="alert-coin">
                <img src="${tx.iconUrl}" alt="${tx.symbol}" class="coin-icon">
                <span>${tx.symbol}</span>
            </div>
            <div class="alert-info">
                <div class="alert-amount">${formattedAmount} ${tx.symbol}</div>
                <div class="alert-path">
                    <span>${fromAddress}</span>
                    <span>→</span>
                    <span>${toAddress}</span>
                </div>
                <div class="alert-time">${formatTimeAgo(tx.time)}</div>
            </div>
        `;

        alertsWrapper.appendChild(alertItem);
    });

    container.appendChild(alertsWrapper);
}

// Helper function to format numbers in a more compact way
function formatCompactNumber(num) {
    num = parseFloat(num);
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    } else {
        return num.toFixed(2);
    }
}

// Format time ago
function formatTimeAgo(timestamp) {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);

    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

// Call the function when page loads
document.addEventListener("DOMContentLoaded", function () {
    // Your existing code that runs on page load

    // Add whale transactions fetching
    fetchWhaleTransactions();

    // Update transactions every 5 minutes
    setInterval(fetchWhaleTransactions, 5 * 60 * 1000);
});


// nambahin news feed preview 


// Function to fetch crypto news from CryptoCompare
async function fetchCryptoNews() {
    try {
        // Use CryptoCompare news API
        const response = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=popular&limit=3');
        const data = await response.json();

        if (data && data.Data && data.Data.length > 0) {
            displayCryptoNews(data.Data);
        } else {
            throw new Error('No news data available');
        }
    } catch (error) {
        console.error('Error fetching crypto news:', error);
        document.getElementById('crypto-news-container').innerHTML =
            '<p class="error-message">Failed to load latest news</p>';
    }
}

// Display crypto news in the container
function displayCryptoNews(newsItems) {
    const container = document.getElementById('crypto-news-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Display only the first 2 news items to avoid overcrowding
    const itemsToDisplay = newsItems.slice(0, 2);
    
    itemsToDisplay.forEach(item => {
        const newsElement = document.createElement('div');
        newsElement.className = 'crypto-news-item';
        
        // Fix the image property reference and use imageurl if available
        const imageUrl = item.imageurl || item.image || 'https://via.placeholder.com/300x200?text=Blockchain+News';
        
        // Limit title and excerpt length to prevent layout issues
        const title = truncateText(item.title, 80);
        const excerpt = truncateText(item.body || item.description || 'Read more about this cryptocurrency news article...', 120);
        const publishDate = item.published_on ? new Date(item.published_on * 1000).toLocaleDateString() : new Date().toLocaleDateString();
        
        newsElement.innerHTML = `
            <div class="news-image">
                <img src="${imageUrl}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=Blockchain+News'">
            </div>
            <h4 class="news-title">${title}</h4>
            <p class="news-excerpt">${excerpt}</p>
            <div class="news-meta">
                <span>${publishDate}</span>
                <a href="${item.url}" target="_blank" rel="noopener">Read more</a>
            </div>
        `;
        
        container.appendChild(newsElement);
    });
    
    // Add a "View all news" link at the bottom
    const viewAllLink = document.createElement('a');
    viewAllLink.href = './news/news.html';
    viewAllLink.className = 'view-all-news';
    viewAllLink.textContent = 'View all news';
    container.appendChild(viewAllLink);
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Call news fetching when page loads
document.addEventListener('DOMContentLoaded', function () {
    // Your existing code that runs on page load

    // Add whale transactions fetching
    fetchWhaleTransactions();

    // Add crypto news fetching
    fetchCryptoNews();

    // Update data every 5 minutes
    setInterval(() => {
        fetchWhaleTransactions();
        fetchCryptoNews();
    }, 5 * 60 * 1000);
});




// Testimonial slider functionality
document.addEventListener('DOMContentLoaded', function() {
    const testimonials = document.querySelectorAll('.testimonial');
    const dots = document.querySelectorAll('.slider-dot');
    let currentIndex = 0;
    const intervalTime = 5000; // Change slides every 5 seconds
    let slideInterval;

    // Function to show a specific testimonial
    function showTestimonial(index) {
        // Hide all testimonials and deactivate all dots
        testimonials.forEach(testimonial => {
            testimonial.classList.remove('active');
        });
        dots.forEach(dot => {
            dot.classList.remove('active');
        });

        // Show the selected testimonial and activate the corresponding dot
        testimonials[index].classList.add('active');
        dots[index].classList.add('active');
        currentIndex = index;
    }

    // Set up click handlers for the dots
    dots.forEach(dot => {
        dot.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            showTestimonial(index);
            resetInterval(); // Reset the timer when manually changing slides
        });
    });

    // Function to advance to the next slide
    function nextSlide() {
        currentIndex = (currentIndex + 1) % testimonials.length;
        showTestimonial(currentIndex);
    }

    // Function to reset the interval timer
    function resetInterval() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, intervalTime);
    }

    // Start the automatic slider
    function startSlider() {
        showTestimonial(0); // Start with the first testimonial
        slideInterval = setInterval(nextSlide, intervalTime);
    }

    // Initialize the slider
    startSlider();

    // Pause the slider when the user hovers over it
    const sliderContainer = document.querySelector('.testimonial-slider');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', function() {
            clearInterval(slideInterval);
        });
        
        sliderContainer.addEventListener('mouseleave', function() {
            resetInterval();
        });
    }
});

// Add event listener to adjust UI on window resize
window.addEventListener('resize', function() {
    // If whale alerts are displayed, refresh them with appropriate formatting
    const whaleAlertContainer = document.getElementById("whale-alert-container");
    if (whaleAlertContainer && whaleAlertContainer.querySelector('.whale-alerts-wrapper')) {
        fetchWhaleTransactions();
    }
});




