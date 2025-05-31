document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Show corresponding content
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // If we're on the research detail page
    if (document.querySelector('.research-detail-container')) {
        renderResearchDetail();
    }
    
    
});

// Research data
const researchData = {
    "basic-blockchain": {
        img: "/assets/research-img-1.jpg",
        badge: "Internal Research",
        badgeClass: "internal",
        title: "Pemahaman Dasar Blockchain",
        date: "Des 29, 2024",
        content: `<p>Blockchain adalah teknologi yang menjadi fondasi utama dari mata uang kripto seperti Bitcoin dan Ethereum. Teknologi ini memungkinkan pencatatan data secara terdesentralisasi, transparan, dan aman.</p>
        <div class="pdf-container">
            <div class="pdf-controls">
                <button class="pdf-btn" id="prev-page">Previous</button>
                <span class="page-info">Page <span id="page-num">1</span> of <span id="page-count">6</span></span>
                <button class="pdf-btn" id="next-page">Next</button>
                <a href="../assets/MelekFinance Research-1.pdf" download class="pdf-btn download-btn">Download PDF</a>
            </div>
            <iframe src="../assets/MelekFinance Research-1.pdf" class="pdf-embed" id="pdf-embed"></iframe>
        </div>`
    },
    "stablecoin-volatility": {
        img: "/assets/research-img-2.jpg",
        badge: "Internal Research",
        badgeClass: "internal",
        title: "Stablecoin dan Volatilitas Pasar Kripto",
        date: "Des 20, 2024",
        content: `<p>Stablecoin adalah aset kripto yang nilainya dipatok pada aset stabil seperti dolar AS. Penelitian ini membahas peran stablecoin dalam mengurangi volatilitas pasar kripto dan tantangan regulasi yang dihadapi.</p>
        <ul>
            <li>Jenis-jenis stablecoin</li>
            <li>Dampak stablecoin pada pasar</li>
            <li>Risiko dan regulasi</li>
        </ul>`
    },
    "getting-started-crypto": {
        img: "/assets/research-img-3.jpg",
        badge: "Free Research",
        badgeClass: "free",
        title: "Pengenalan Dasar Cryptocurrency",
        date: "May 21, 2025",
        content: `<p>A beginner's guide to understanding cryptocurrency and blockchain technology. Learn the basics, how to buy, store, and use crypto safely.</p> 
        <div class="pdf-container">
            <div class="pdf-controls">
                <button class="pdf-btn" id="prev-page">Previous</button>
                <span class="page-info">Page <span id="page-num">1</span> of <span id="page-count">6</span></span>
                <button class="pdf-btn" id="next-page">Next</button>
                <a href="../assets/free-research.pdf" download class="pdf-btn download-btn">Download PDF</a>
            </div>
            <iframe src="../assets/free-research.pdf" class="pdf-embed" id="pdf-embed"></iframe>
        </div>`
    },
    "market-overview": {
        img: "/assets/research-img-4.jpg",
        badge: "Free Research",
        badgeClass: "free",
        title: "Market Overview",
        date: "May 19, 2025",
        content: `<p>Weekly market overview and key insights for cryptocurrency traders. Includes internal forecasting price trends, major news, and analysis.</p> <div class="pdf-container">
            <div class="pdf-controls">
                <button class="pdf-btn" id="prev-page">Previous</button>
                <span class="page-info">Page <span id="page-num">1</span> of <span id="page-count">6</span></span>
                <button class="pdf-btn" id="next-page">Next</button>
                <a href="../assets/free-overview.pdf" download class="pdf-btn download-btn">Download PDF</a>
            </div>
            <iframe src="../assets/free-overview.pdf" class="pdf-embed" id="pdf-embed"></iframe>
        </div>`
    },
    "advanced-trading": {
        img: "/assets/research-img-5.jpg",
        badge: "Premium Research",
        badgeClass: "premium",
        title: "Advanced Trading Strategies",
        date: "March 13, 2024",
        content: `<p>Exclusive insights into advanced trading techniques and market analysis. For experienced traders seeking an edge.</p> 
        <div class="pdf-container">
            <div class="pdf-controls">
                <button class="pdf-btn" id="prev-page">Previous</button>
                <span class="page-info">Page <span id="page-num">1</span> of <span id="page-count">6</span></span>
                <button class="pdf-btn" id="next-page">Next</button>
                <a href="../assets/Trading-Strategy.pdf" download class="pdf-btn download-btn">Download PDF</a>
            </div>
            <iframe src="../assets/Trading-Strategy.pdf" class="pdf-embed" id="pdf-embed"></iframe>
        </div>`
    },
    "institutional-investment": {
        img: "/assets/research-img-6.jpg",
        badge: "Premium Research",
        badgeClass: "premium",
        title: "Institutional Investment Guide",
        date: "March 11, 2024",
        content: `<p>Detailed analysis of institutional investment opportunities in crypto markets. Covers trends, risks, and strategies.</p> 
        <div class="pdf-container">
            <div class="pdf-controls">
                <button class="pdf-btn" id="prev-page">Previous</button>
                <span class="page-info">Page <span id="page-num">1</span> of <span id="page-count">6</span></span>
                <button class="pdf-btn" id="next-page">Next</button>
                <a href="../assets/SMC-Strategy.pdf" download class="pdf-btn download-btn">Download PDF</a>
            </div>
            <iframe src="../assets/SMC-Strategy.pdf" class="pdf-embed" id="pdf-embed"></iframe>
        </div>`
    }
};

// Get id from URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function renderResearchDetail() {
    const id = getQueryParam('id');
    const data = researchData[id];
    const container = document.querySelector('.research-detail-container');
    
    if (!data) {
        container.innerHTML = `<div class="research-card"><h3>Research Not Found</h3><a href='research.html' class='card-btn'>Back to Research</a></div>`;
        return;
    }
    
    container.innerHTML = `
        <div class="research-card research-detail-card">
            <a href="research.html" class="back-link">&larr; Back to Research</a>
            <img class="card-img" src="${data.img}" alt="Research Thumbnail" />
            <span class="badge ${data.badgeClass}">${data.badge}</span>
            <h3>${data.title}</h3>
            <div class="meta">
                <span>${data.date}</span>
            </div>
            <div class="detail-content">${data.content}</div>
        </div>
    `;

    // If this is the blockchain research, set up PDF navigation
    if (id === 'basic-blockchain') {
        setupPdfNavigation();
    }
}

function setupPdfNavigation() {
    // Increased timeout to ensure PDF has time to load
    setTimeout(() => {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pageNum = document.getElementById('page-num');
        const pageCount = document.getElementById('page-count');
        const pdfEmbed = document.getElementById('pdf-embed');
        
        // Check if elements exist
        if (!prevBtn || !nextBtn || !pageNum || !pageCount || !pdfEmbed) {
            console.error('PDF navigation elements not found');
            return;
        }
        
        let currentPage = 1;
        const totalPages = parseInt(pageCount.textContent);
        
        prevBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                updatePage();
            }
        });
        
        nextBtn.addEventListener('click', function() {
            if (currentPage < totalPages) {
                currentPage++;
                updatePage();
            }
        });
        
        function updatePage() {
            pageNum.textContent = currentPage;
            
            // Create a new embed element with the updated page parameter
            const newPdfEmbed = document.createElement('embed');
            newPdfEmbed.src = `./assets/MelekFinance-Research-1.pdf#page=${currentPage}`;
            newPdfEmbed.type = "application/pdf";
            newPdfEmbed.className = "pdf-embed";
            newPdfEmbed.id = "pdf-embed";
            
            // Replace the old embed with the new one
            pdfEmbed.parentNode.replaceChild(newPdfEmbed, pdfEmbed);
        }
    }, 1000); // Increased timeout to 1 second
}

function populateResearchGrid() {
    // Research data objects organized by category
    const researchItems = {
        internal: [
            {
                id: "basic-blockchain",
                img: "https://source.unsplash.com/600x300/?blockchain,crypto",
                badge: "Internal Research",
                badgeClass: "internal",
                title: "Pemahaman Dasar Blockchain",
                date: "Des 24, 2024",
                description: "Pengenalan konsep blockchain dan aplikasinya pada mata uang kripto."
            },
            {
                id: "stablecoin-volatility",
                img: "https://source.unsplash.com/600x300/?blockchain,technology",
                badge: "Internal Research",
                badgeClass: "internal",
                title: "Stablecoin dan Volatilitas Pasar Kripto",
                date: "Des 20, 2024",
                description: "Analisis mendalam tentang stablecoin dan dampaknya pada pasar kripto."
            }
        ],
        free: [
            {
                id: "getting-started-crypto",
                img: "https://source.unsplash.com/600x300/?cryptocurrency,beginner",
                badge: "Free Research",
                badgeClass: "free",
                title: "Getting Started with Crypto",
                date: "March 12, 2024",
                description: "A beginner's guide to cryptocurrency and blockchain."
            },
            {
                id: "market-overview",
                img: "https://source.unsplash.com/600x300/?market,overview",
                badge: "Free Research",
                badgeClass: "free",
                title: "Market Overview",
                date: "March 14, 2024",
                description: "Weekly market insights and price analysis."
            }
        ],
        premium: [
            {
                id: "advanced-trading",
                img: "https://source.unsplash.com/600x300/?trading,crypto",
                badge: "Penelitian Premium",
                badgeClass: "premium",
                title: "Strategi Trading Lanjutan",
                date: "13 Maret 2024",
                description: "Teknik trading profesional untuk trader berpengalaman."
            },
            {
                id: "institutional-investment",
                img: "https://source.unsplash.com/600x300/?institutional,investment",
                badge: "Penelitian Premium",
                badgeClass: "premium",
                title: "Panduan Investasi Institusional",
                date: "11 Maret 2024",
                description: "Pendekatan strategis untuk investor institusional dalam crypto."
            }
        ]
    };

    // Create card grid for each tab content
    for (const [category, items] of Object.entries(researchItems)) {
        const tabContent = document.getElementById(category);
        if (tabContent) {
            const grid = document.createElement('div');
            grid.className = 'research-grid';
            
            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'research-card';
                card.innerHTML = `
                    <img class="card-img" src="${item.img}" alt="${item.title}" />
                    <span class="badge ${item.badgeClass}">${item.badge}</span>
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                    <div class="meta">
                        <span>${item.date}</span>
                    </div>
                    <a href="researchDetail.html?id=${item.id}" class="card-btn">Read More</a>
                `;
                grid.appendChild(card);
            });
            
            tabContent.appendChild(grid);
        }
    }
}




