const express = require('express');
const cors = require('cors');
const yahooFinanceModule = require('yahoo-finance2').default;
const yahooFinance = new yahooFinanceModule();



const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('.')); // Serve static files from current directory

app.get('/api/quotes', async (req, res) => {
    const defaultSymbols = ['GC=F', 'SI=F', 'GBPUSD=X', 'NATP.L', 'SMGB.L', 'EQQQ.L', 'GOOG', 'PLTR', 'NVDA'];
    let symbols = req.query.symbols ? req.query.symbols.split(',') : defaultSymbols;

    try {
        const results = await Promise.all(symbols.map(async (symbol) => {
            try {
                const quote = await yahooFinance.quote(symbol);
                return {
                    symbol: symbol,
                    price: quote.regularMarketPrice,
                    change: quote.regularMarketChange,
                    changePercent: quote.regularMarketChangePercent,
                    currency: quote.currency,
                    shortName: quote.shortName
                };
            } catch (err) {
                console.error(`Error fetching data for ${symbol}:`, err);
                return { symbol: symbol, error: `Failed: ${err.message}` };
            }
        }));
        res.json(results);
    } catch (error) {
        console.error("Global error fetching quotes:", error);
        res.status(500).json({ error: 'Failed to fetch quotes' });
    }
});

app.get('/api/history/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    const period1 = new Date();
    period1.setMonth(period1.getMonth() - 1); // 1 month ago
    const period2 = new Date(); // now

    const queryOptions = {
        period1: period1.toISOString(),
        period2: period2.toISOString(),
        interval: '1d'
    };

    try {
        const result = await yahooFinance.chart(symbol, queryOptions);
        const quotes = result.quotes || [];
        const formattedResult = quotes.map(quote => ({
            date: quote.date,
            close: quote.close
        }));
        res.json(formattedResult);
    } catch (error) {
        console.error(`Error fetching history for ${symbol}:`, error);
        res.status(500).json({ error: 'Failed to fetch history', details: error.message, stack: error.toString() });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
