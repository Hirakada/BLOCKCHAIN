console.log("market.js loaded");

let cachedMarketData = null;
let cachedTotalMarketCap = null;

document.addEventListener("DOMContentLoaded", function () {
    loadMarketData();
    fetchWhaleTransactions();
    loadExchanges();
    
    // Atur tombol refresh untuk transaksi whale
    const refreshButton = document.getElementById('refresh-whale-alerts');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            this.classList.add('refreshing');
            fetchWhaleTransactions().then(() => {
                setTimeout(() => {
                    this.classList.remove('refreshing');
                }, 1000);
            });
        });
    }
    
    // Refresh data setiap 5 menit
    setInterval(fetchWhaleTransactions, 5 * 60 * 1000);
});

async function loadMarketData() {
    const container = document.getElementById("market-table-container");
    const summary = document.getElementById("market-summary");
    
    container.innerHTML = '<div style="text-align:center;padding:2rem;">Memuat data pasar...</div>';
    summary.innerHTML = '<div style="text-align:center;padding:2rem;">Memuat ringkasan...</div>';
    
    try {
        console.log("Fetching data from CoinGecko...");
        const summaryPromise = fetch("https://api.coingecko.com/api/v3/global")
            .then(response => {
                console.log("CoinGecko response status:", response.status);
                if (!response.ok) throw new Error("Gagal mengambil data global");
                return response.json();
            });
        
        console.log("Fetching data from CryptoCompare...");
        const tablePromise = fetch(
            "https://min-api.cryptocompare.com/data/top/mktcapfull?limit=20&tsym=USD&api_key=SOSO-0ce237c06c284fb4afd341dcfaedc17a"
        ).then(response => {
            console.log("CryptoCompare response status:", response.status);
            if (!response.ok) throw new Error("Error API: " + response.status);
            return response.json();
        });
        
        // Tunggu kedua permintaan selesai
        const [summaryResult, tableResult] = await Promise.all([summaryPromise, tablePromise]);
        console.log("CoinGecko summaryResult:", summaryResult);
        console.log("CryptoCompare tableResult:", tableResult);
        
        // Proses data ringkasan CoinGecko
        if (!summaryResult || !summaryResult.data || !summaryResult.data.total_market_cap || !summaryResult.data.total_volume || !summaryResult.data.market_cap_percentage) {
            throw new Error("Format data global CoinGecko tidak sesuai.");
        }
        const summaryData = summaryResult.data;
        const totalMarketCap = summaryData.total_market_cap.usd;
        const totalVolume = summaryData.total_volume.usd;
        const btcDominance = summaryData.market_cap_percentage.btc;
        
        // Perbarui bagian ringkasan dengan data CoinGecko
        summary.innerHTML = `
            <div class="market-summary-box">
                <div class="market-summary-title">Total Kapitalisasi Pasar</div>
                <div class="market-summary-value">$${formatNumber(totalMarketCap)}</div>
            </div>
            <div class="market-summary-box">
                <div class="market-summary-title">Volume Trading 24h</div>
                <div class="market-summary-value">$${formatNumber(totalVolume)}</div>
            </div>
            <div class="market-summary-box">
                <div class="market-summary-title">Dominasi Bitcoin</div>
                <div class="market-summary-value">${btcDominance.toFixed(2)}%</div>
            </div>
        `;
        
        // Proses data tabel CryptoCompare
        if (!tableResult.Data || !Array.isArray(tableResult.Data)) {
            throw new Error("Data tidak valid dari CryptoCompare");
        }
        const tableData = tableResult.Data.slice(0, 30).map((item) => ({
            name: item.CoinInfo.FullName,
            symbol: item.CoinInfo.Name,
            image: `https://www.cryptocompare.com${item.CoinInfo.ImageUrl}`,
            price: item.RAW?.USD?.PRICE || 0,
            change_1h: item.RAW?.USD?.CHANGEPCTHOUR || 0,
            change_24h: item.RAW?.USD?.CHANGEPCT24HOUR || 0,
            change_7d: item.RAW?.USD?.CHANGEPCTDAY || 0, 
            market_cap: item.RAW?.USD?.MKTCAP || 0,
            volume_24h: item.RAW?.USD?.TOTALVOLUME24H || 0,
            supply: item.RAW?.USD?.SUPPLY || 0,
            max_supply: item.RAW?.USD?.MAXSUPPLY || 0
        }));
        
        // Perbarui tabel dengan data CryptoCompare
        cachedMarketData = tableData;
        cachedTotalMarketCap = totalMarketCap;
        container.innerHTML = createMarketTable(tableData, totalMarketCap);
        
    } catch (err) {
        console.error("Error in loadMarketData:", err);
        container.innerHTML = `<div style="color:#e53935;text-align:center;padding:2rem;">Gagal memuat data pasar.<br>${err.message}</div>`;
        summary.innerHTML = `<div style="color:#e53935;text-align:center;padding:2rem;">Gagal memuat ringkasan.<br>${err.message}</div>`;
    }
}

function createMarketTable(data, totalMarketCap) {
    if (window.innerWidth <= 600) {
        return createMarketCards(data, totalMarketCap);
    }
    return `
    <table class="market-table">
        <thead>
            <tr>
                <th>Asset</th>
                <th>Price</th>
                <th>1h %</th>
                <th>24h %</th>
                <th>7d %</th>
                <th>Market Cap</th>
                <th>Volume (24h)</th>
                <th>Circulating Supply</th>
            </tr>
        </thead>
        <tbody>
            ${data
                .map(
                    (c) => {
                        let barWidth = 0;
                        if (c.max_supply && c.max_supply > 0) {
                            barWidth = Math.min((c.supply / c.max_supply) * 100, 100);
                        } else {
                            barWidth = Math.min((c.market_cap / totalMarketCap) * 100 * 3, 100); 
                        }
                        return `
                            <tr>
                                <td>
                                    <img src="${c.image}" class="crypto-icon" alt="${c.symbol}" />
                                    <span class="crypto-name">${c.name}</span>
                                    <span class="crypto-symbol">${c.symbol}</span>
                                </td>
                                <td>$${formatNumber(c.price)}</td>
                                <td class="${c.change_1h >= 0 ? "price-up" : "price-down"}">${c.change_1h >= 0 ? "+" : ""}${c.change_1h.toFixed(2)}%</td>
                                <td class="${c.change_24h >= 0 ? "price-up" : "price-down"}">${c.change_24h >= 0 ? "+" : ""}${c.change_24h.toFixed(2)}%</td>
                                <td class="${c.change_7d >= 0 ? "price-up" : "price-down"}">${c.change_7d >= 0 ? "+" : ""}${c.change_7d.toFixed(2)}%</td>
                                <td>$${formatNumber(c.market_cap)}</td>
                                <td>$${formatNumber(c.volume_24h)}</td>
                                <td>
                                    ${formatNumber(c.supply)} ${c.symbol}
                                    <div class="market-bar-bg">
                                        <div class="market-bar" style="width:${barWidth}%"></div>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }
                )
                .join("")}
        </tbody>
    </table>
    `;
}

function createMarketCards(data, totalMarketCap) {
    return `
    <div class="market-card-list">
        ${data.map(c => {
            let barWidth = 0;
            if (c.max_supply && c.max_supply > 0) {
                barWidth = Math.min((c.supply / c.max_supply) * 100, 100);
            } else {
                barWidth = Math.min((c.market_cap / totalMarketCap) * 100 * 3, 100);
            }
            return `
                <div class="market-card">
                    <div class="market-card-header">
                        <img src="${c.image}" class="crypto-icon" alt="${c.symbol}" />
                        <div>
                            <div class="crypto-name">${c.name}</div>
                            <div class="crypto-symbol">${c.symbol}</div>
                        </div>
                    </div>
                    <div class="market-card-row"><span>Price:</span> <span>$${formatNumber(c.price)}</span></div>
                    <div class="market-card-row"><span>1h %:</span> <span class="${c.change_1h >= 0 ? "price-up" : "price-down"}">${c.change_1h >= 0 ? "+" : ""}${c.change_1h.toFixed(2)}%</span></div>
                    <div class="market-card-row"><span>24h %:</span> <span class="${c.change_24h >= 0 ? "price-up" : "price-down"}">${c.change_24h >= 0 ? "+" : ""}${c.change_24h.toFixed(2)}%</span></div>
                    <div class="market-card-row"><span>7d %:</span> <span class="${c.change_7d >= 0 ? "price-up" : "price-down"}">${c.change_7d >= 0 ? "+" : ""}${c.change_7d.toFixed(2)}%</span></div>
                    <div class="market-card-row"><span>Market Cap:</span> <span>$${formatNumber(c.market_cap)}</span></div>
                    <div class="market-card-row"><span>Volume (24h):</span> <span>$${formatNumber(c.volume_24h)}</span></div>
                    <div class="market-card-row"><span>Circulating Supply:</span> <span>${formatNumber(c.supply)} ${c.symbol}</span></div>
                    <div class="market-bar-bg">
                        <div class="market-bar" style="width:${barWidth}%"></div>
                    </div>
                </div>
            `;
        }).join("")}
    </div>
    `;
}

function formatNumber(num) {
    if (!num) return "-";
    if (num > 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num > 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num > 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num > 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toLocaleString();
}

// Fungsi untuk mengambil data transaksi whale dari CoinGecko
async function fetchWhaleTransactions() {
    const container = document.getElementById('whale-alerts-list');
    if (!container) return;
    
    container.innerHTML = '<div class="whale-alert-loading">Memuat transaksi whale...</div>';
    
    try {
        // This also uses CoinGecko and might be affected by rate limits.
        const response = await fetch(
            "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1"
        );
        
        if (!response.ok) {
            throw new Error(`Error API CoinGecko: ${response.status}`);
        }
        
        const coins = await response.json();
        
        displayWhaleTransactions(generateWhaleTransactions(coins));
        return true;
    } catch (error) {
        console.error("Error mengambil data whale:", error);
        container.innerHTML = '<div class="whale-alert-loading">Gagal memuat transaksi whale.</div>';
        return false;
    }
}

// Generate whale transactions based on real coins from CoinGecko
function generateWhaleTransactions(coins) {
    const transactions = [];
    const exchangeTypes = ["transfer", "exchange", "unknown"];
    const blockchains = {
        "bitcoin": "Bitcoin",
        "ethereum": "Ethereum",
        "binancecoin": "BSC",
        "ripple": "Ripple",
        "cardano": "Cardano",
        "solana": "Solana",
        "polkadot": "Polkadot",
        "dogecoin": "Dogecoin",
        "tron": "Tron",
        "polygon": "Polygon"
    };

    // Generate 1-2 transactions per coin for variety
    coins.forEach((coin) => {
        
        const transactionsPerCoin = Math.floor(Math.random() * 2) + 1;
        
        for (let i = 0; i < transactionsPerCoin; i++) {
            
            let amount;
            if (coin.current_price > 1000) {
                // For high-value coins like BTC
                amount = (Math.random() * 100 + 10).toFixed(2);
            } else if (coin.current_price > 100) {
                // For medium-value coins
                amount = (Math.random() * 1000 + 100).toFixed(2);
            } else if (coin.current_price > 1) {
                // For lower-value coins
                amount = (Math.random() * 10000 + 1000).toFixed(2);
            } else {
                // For very low-value coins
                amount = (Math.random() * 1000000 + 100000).toFixed(2);
            }

            
            const value = (amount * coin.current_price).toFixed(0);
            

            if (value > 100000) {
                const type = exchangeTypes[Math.floor(Math.random() * exchangeTypes.length)];
                const blockchain = blockchains[coin.id] || coin.name;
                
                const timeAgo = Math.floor(Math.random() * 180); 
                
                transactions.push({
                    type: type,
                    amount: `${formatNumber(amount)} ${coin.symbol.toUpperCase()}`,
                    value: `$${formatNumber(value)}`,
                    blockchain: blockchain,
                    time: formatTimeAgo(timeAgo),
                    coin: coin
                });
            }
        }
    });

    // Sort by time (most recent first) and take top 7 transactions
    return transactions
        .sort((a, b) => {
            const timeA = parseInt(a.time.split(' ')[0]);
            const timeB = parseInt(b.time.split(' ')[0]);
            return timeA - timeB;
        })
        .slice(0, 7);
}

// Display whale transactions in the alert container
function displayWhaleTransactions(transactions) {
    const container = document.getElementById('whale-alerts-list');
    if (!container) return;

    if (transactions.length === 0) {
        container.innerHTML = '<div class="whale-alert-loading">No significant whale transactions found.</div>';
        return;
    }

    container.innerHTML = '';

    transactions.forEach((tx) => {
        const alertElement = document.createElement('div');
        alertElement.className = 'whale-alert';
        
        alertElement.innerHTML = `
            <div class="whale-alert-type ${tx.type}">${tx.type}</div>
            <div class="whale-alert-amount">${tx.amount}</div>
            <div class="whale-alert-value">${tx.value}</div>
            <div class="whale-alert-details">
                <span class="whale-alert-blockchain">${tx.blockchain}</span>
                <span class="whale-alert-time">${tx.time}</span>
            </div>
        `;
        
        container.appendChild(alertElement);
    });
}

// Fungsi untuk memformat waktu yang lalu
function formatTimeAgo(minutes) {
    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes} menit yang lalu`;
    return `${Math.floor(minutes / 60)} jam yang lalu`;
}

// Helper number formatter
function formatNumberCompact(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Fungsi untuk mengambil dan menampilkan pertukaran crypto teratas
async function loadExchanges() {
    const exchangesContainer = document.getElementById('exchanges-grid');
    if (!exchangesContainer) return;
    
    exchangesContainer.innerHTML = '<div class="exchange-card-loading">Memuat data pertukaran...</div>';
    
    try {
        // Simulasi delay untuk UX yang lebih baik
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Data pertukaran statis
        const exchanges = [
            {
                name: "Binance",
                logo: "https://public.bnbstatic.com/image/cms/blog/20220322/071cdb9b-5a31-4db0-a27c-5abc70f7b5b4.png",
                country: "Cayman Islands",
                year: 2017,
                volume_24h: "$21.52B",
                trustScore: "high",
                features: ["Spot", "Futures", "NFT", "Staking"],
                url: "https://www.binance.com/"
            },
            {
                name: "Coinbase",
                logo: "https://images.ctfassets.net/q5ulk4bp65r7/1rFQCqoq8hipvVJSKdU3fQ/21ab733af7a8ab404e29b873ffb28348/coinbase-icon2.svg",
                country: "United States",
                year: 2012,
                volume_24h: "$3.85B",
                trustScore: "high",
                features: ["Spot", "Derivatives", "Staking"],
                url: "https://www.coinbase.com/"
            },
            {
                name: "Kraken",
                logo: "https://cryptologos.cc/logos/kraken-exchange-logo.png",
                country: "United States",
                year: 2011,
                volume_24h: "$1.17B",
                trustScore: "high",
                features: ["Spot", "Futures", "Margin"],
                url: "https://www.kraken.com/"
            },
            {
                name: "KuCoin",
                logo: "https://assets.staticimg.com/cms/media/1lB3PkckFDyfxz6VudCEoJMTRxDgvRu3KAnVzm99.svg",
                country: "Seychelles",
                year: 2017,
                volume_24h: "$1.28B",
                trustScore: "high",
                features: ["Spot", "Futures", "Lending"],
                url: "https://www.kucoin.com/"
            },
            {
                name: "Bybit",
                logo: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Bybit_Logo_Blue.svg",
                country: "Dubai",
                year: 2018,
                volume_24h: "$5.71B",
                trustScore: "high",
                features: ["Spot", "Futures", "Options"],
                url: "https://www.bybit.com/"
            },
            {
                name: "OKX",
                logo: "https://www.okx.com/cdn/assets/imgs/241/E5E2E2F6C3A9EBE4.png",
                country: "Seychelles",
                year: 2017,
                volume_24h: "$2.21B",
                trustScore: "high",
                features: ["Spot", "Futures", "DeFi"],
                url: "https://www.okx.com/"
            },
            {
                name: "Bitget",
                logo: "https://bitget-static.s3.ap-northeast-1.amazonaws.com/bitget/coin/project/bigtLogo.png",
                country: "Singapore",
                year: 2018,
                volume_24h: "$1.08B",
                trustScore: "high",
                features: ["Spot", "Futures", "Copy Trading"],
                url: "https://www.bitget.com/"
            },
            {
                name: "Gate.io",
                logo: "https://cryptologos.cc/logos/gate-io-exchange-logo.png",
                country: "Cayman Islands",
                year: 2013,
                volume_24h: "$950M",
                trustScore: "high",
                features: ["Spot", "Futures", "NFT"],
                url: "https://www.gate.io/"
            },
            {
                name: "Huobi",
                logo: "https://www.huobi.com/en-us/asset/logo/h5-light.svg",
                country: "Seychelles",
                year: 2013,
                volume_24h: "$860M",
                trustScore: "high",
                features: ["Spot", "Futures", "Options"],
                url: "https://www.htx.com/id-id"
            }
        ];
        
        exchangesContainer.innerHTML = '';
        
        exchanges.forEach(exchange => {
            const exchangeCard = document.createElement('div');
            exchangeCard.className = 'exchange-card';
            
            exchangeCard.innerHTML = `
                <div class="exchange-header">
                    <img src="${exchange.logo}" alt="${exchange.name}" class="exchange-logo" onerror="this.src='https://cryptologos.cc/logos/question-mark.svg'">
                    <div>
                        <div class="exchange-name">${exchange.name}</div>
                        <div class="exchange-country">${exchange.country} · Est. ${exchange.year}</div>
                    </div>
                </div>
                
                <div class="exchange-stats">
                    <div class="stat-item">
                        <div class="stat-label">24h Volume</div>
                        <div class="stat-value">${exchange.volume_24h}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Markets</div>
                        <div class="stat-value">${Math.floor(Math.random() * 300) + 400}</div>
                    </div>
                </div>
                
                <div class="exchange-features">
                    ${exchange.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                </div>
                
                <div class="trust-score">
                    <div class="trust-label">Trust Score</div>
                    <div class="trust-bar">
                        <div class="trust-bar-fill ${exchange.trustScore}"></div>
                    </div>
                </div>
                
                <a href="${exchange.url}" target="_blank" rel="noopener noreferrer" class="exchange-link">Visit Exchange</a>
            `;
            
            exchangesContainer.appendChild(exchangeCard);
        });
        
    } catch (error) {
        console.error("Error memuat pertukaran:", error);
        exchangesContainer.innerHTML = '<div class="exchange-card-loading">Gagal memuat data pertukaran.</div>';
    }
}

window.addEventListener('resize', () => {
    const container = document.getElementById("market-table-container");
    if (container && cachedMarketData && cachedTotalMarketCap) {
        container.innerHTML = createMarketTable(cachedMarketData, cachedTotalMarketCap);
    }
});

