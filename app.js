const API_URL = '/api/quotes';

const tickerMapping = {
    'GC=F': 'Gold',
    'SI=F': 'Silver',
    'GBPUSD=X': 'GBP/USD',
    'NATP.L': 'NATP ETF',
    'SMGB.L': 'SMGB ETF',
    'EQQQ.L': 'EQQQ ETF',
    'GOOG': 'Alphabet Inc.',
    'PLTR': 'Palantir Tech',
    'NVDA': 'NVIDIA Corp'
};

const formatCurrency = (value, currency) => {
    if (!value) return 'N/A';
    // Simple formatter, can be expanded based on currency needed
    const symbol = currency === 'GBP' || currency === 'GBp' ? '£' : '$';
    // If GBp (pence), convert to pounds or specific formatting if desired. 
    // Yahoo often returns GBp for LSE stocks. Let's keep it simple for now or normalize.
    // Usually ETFs in London trade in pence (GBp) or USD.

    return `${symbol}${value.toFixed(2)}`;
};

const formatChange = (change, percent) => {
    if (change === undefined || percent === undefined) return { text: 'N/A', class: '' };

    const isUp = change >= 0;
    const sign = isUp ? '+' : '';
    const className = isUp ? 'up' : 'down';

    return {
        text: `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`,
        class: className
    };
};

async function fetchQuotes() {
    const container = document.getElementById('cards-container');
    const lastUpdated = document.getElementById('last-updated');
    const refreshBtn = document.getElementById('refresh-btn');

    // UI Loading state
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<span class="icon">⌛</span> Updating...';

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        container.innerHTML = '';

        data.forEach(item => {
            const friendlyName = tickerMapping[item.symbol] || item.shortName || item.symbol;

            if (item.error) {
                const card = document.createElement('div');
                card.className = 'card error-card';
                card.style.borderColor = '#fa4549';
                card.innerHTML = `
                    <div class="card-header">
                        <h2 class="symbol-name">${friendlyName}</h2>
                        <span class="symbol-ticker">${item.symbol}</span>
                    </div>
                    <div class="price-container">
                        <p class="price-change down" style="font-size: 0.9rem;">
                            ${item.error}
                        </p>
                    </div>
                `;
                container.appendChild(card);
                return;
            }

            const changeData = formatChange(item.change, item.changePercent);

            const card = document.createElement('div');
            card.className = 'card';
            card.style.cursor = 'pointer';
            card.onclick = () => showHistory(item.symbol, friendlyName);
            card.innerHTML = `
                <div class="card-header">
                    <h2 class="symbol-name">${friendlyName}</h2>
                    <span class="symbol-ticker">${item.symbol}</span>
                </div>
                <div class="price-container">
                    <p class="current-price">${formatCurrency(item.price, item.currency)}</p>
                    <p class="price-change ${changeData.class}">
                        ${changeData.text}
                    </p>
                </div>
            `;
            container.appendChild(card);
        });

        const now = new Date();
        lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;

    } catch (error) {
        console.error('Error fetching data:', error);
        container.innerHTML = '<div class="error">Failed to load data. Ensure backend is running.</div>';
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<span class="icon">↻</span> Refresh Prices';
    }
}

document.getElementById('refresh-btn').addEventListener('click', fetchQuotes);

// Initial load
fetchQuotes();

// Chart Logic
const backBtn = document.getElementById('back-btn');
const chartView = document.getElementById('chart-view');
const cardsContainerParent = document.querySelector('.container'); // Main view 
// note: index.html structure is .container -> .cards-grid. We want to toggle .container visibility or chart-view visibility. 
// Actually, looking at index.html, chart-view is separate. We should just show/hide chart-view.
// But we might want to hide the main dashboard content behind it or just overlay.
// CSS says fixed position covering 100%, so overlay is fine.

let priceChart = null;

async function showHistory(symbol, friendlyName) {
    chartView.classList.remove('hidden');

    // Fetch data
    try {
        const response = await fetch(`/api/history/${symbol}`);
        const historyData = await response.json();

        if (historyData.error) {
            console.error(historyData.error);
            return;
        }

        renderChart(historyData, friendlyName);
    } catch (error) {
        console.error('Error fetching history:', error);
    }
}

function renderChart(data, title) {
    const ctx = document.getElementById('priceChart').getContext('2d');

    // Destroy previous chart if exists
    if (priceChart) {
        priceChart.destroy();
    }

    const labels = data.map(point => new Date(point.date).toLocaleDateString());
    const prices = data.map(point => point.close);

    // Dynamic color for line based on trend? Let's just use accent color.
    const isUp = prices[prices.length - 1] >= prices[0];
    const borderColor = isUp ? '#3fb950' : '#f85149';
    const backgroundColor = isUp ? 'rgba(63, 185, 80, 0.1)' : 'rgba(248, 81, 73, 0.1)';

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${title} Price`,
                data: prices,
                borderColor: borderColor,
                backgroundColor: backgroundColor,
                borderWidth: 2,
                fill: true,
                tension: 0.1,
                pointRadius: 0 // hide points for cleaner look unless hovered
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                title: {
                    display: true,
                    text: `${title} - Last 30 Days`,
                    color: '#f0f6fc',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        color: '#30363d'
                    },
                    ticks: {
                        color: '#8b949e'
                    }
                },
                y: {
                    grid: {
                        color: '#30363d'
                    },
                    ticks: {
                        color: '#8b949e'
                    }
                }
            }
        }
    });
}

backBtn.addEventListener('click', () => {
    chartView.classList.add('hidden');
});

