document.addEventListener('DOMContentLoaded', function () {
    // Inisialisasi dengan berita "Semua"
    fetchCryptoNews();
    
    // Atur event listener untuk tab kategori
    setupCategoryTabs();
    
    // Atur auto-refresh setiap 3 menit
    setInterval(fetchCryptoNews, 180000);
    
    // Atur tombol refresh manual
    setupRefreshButton();
});

let allNewsData = []; // Simpan semua data berita
let currentCategory = 'All'; // Lacak kategori yang dipilih saat ini

function setupRefreshButton() {
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            this.classList.add('refreshing');
            fetchCryptoNews().then(() => {
                setTimeout(() => {
                    this.classList.remove('refreshing');
                    updateLastUpdatedTime();
                }, 1000);
            });
        });
    }
}

function setupCategoryTabs() {
    const tabs = document.querySelectorAll('.news-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Perbarui gaya tab aktif
            document.querySelector('.news-tab.active').classList.remove('active');
            this.classList.add('active');
            
            // Perbarui kategori saat ini dan filter berita
            currentCategory = this.dataset.category;
            filterNewsByCategory(currentCategory);
        });
    });
}

function updateLastUpdatedTime() {
    const timeElement = document.getElementById('last-updated-time');
    if (timeElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        timeElement.textContent = timeString;
    }
}

async function fetchCryptoNews() {
    try {
        document.getElementById('news-cards-container').innerHTML = '<div class="loading-indicator">Memuat berita...</div>';
        
        const response = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN&extraParams=BlockChain');
        const data = await response.json();
        
        if (data.Data && data.Data.length > 0) {
            // Simpan semua data berita dan tampilkan yang difilter
            allNewsData = data.Data.slice(0, 32); // Simpan lebih banyak artikel berita
            filterNewsByCategory(currentCategory);
            updateLastUpdatedTime();
            return true;
        } else {
            document.getElementById('news-cards-container').innerHTML = '<p class="error-message">Tidak ada berita ditemukan.</p>';
            return false;
        }
    } catch (error) {
        console.error("Error mengambil berita:", error);
        document.getElementById('news-cards-container').innerHTML = '<p class="error-message">Error memuat berita. Silakan coba lagi.</p>';
        return false;
    }
}

function filterNewsByCategory(category) {
    if (category === 'All') {
        renderNewsCards(allNewsData);
        return;
    }
    
    // Filter berita berdasarkan kategori yang dipilih
    const filteredNews = allNewsData.filter(news => {
        const categories = news.categories.split('|');
        return categories.some(cat => cat.toLowerCase().includes(category.toLowerCase()));
    });
    
    if (filteredNews.length > 0) {
        renderNewsCards(filteredNews);
    } else {
        document.getElementById('news-cards-container').innerHTML = 
            `<p class="no-results">Tidak ada berita ditemukan dalam kategori "${category}".</p>`;
    }
}

function renderNewsCards(newsArray) {
    const container = document.getElementById('news-cards-container');
    container.innerHTML = '';
    
    newsArray.forEach(news => {
        const date = new Date(news.published_on * 1000);
        const formattedTime = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const formattedDate = date.toLocaleDateString();
        
        const card = document.createElement('div');
        card.className = 'news-card';
        card.innerHTML = `
            <img src="${news.imageurl}" alt="${news.title}" class="news-card-image" onerror="this.src='../assets/news-placeholder.jpg'">
            <div class="news-card-content">
                <span class="news-card-category">${getCategoryBadge(news.categories)}</span>
                <h3 class="news-card-title">${news.title}</h3>
                <div class="news-card-excerpt">${truncateText(news.body, 120)}</div>
                <div class="news-card-meta">
                    <span class="source">${news.source_info.name}</span>
                    <span class="date">${formattedDate} ${formattedTime}</span>
                </div>
                <a href="${news.url}" target="_blank" class="news-card-link">Baca Selengkapnya</a>
            </div>
        `;
        
        // Buat seluruh kartu dapat diklik
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('news-card-link')) {
                window.open(news.url, '_blank');
            }
        });
        
        container.appendChild(card);
    });
}

function getCategoryBadge(categories) {
    const primaryCategory = categories.split('|')[0];
    return primaryCategory;
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
