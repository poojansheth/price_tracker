const pkg = require('yahoo-finance2');

async function testHistory() {
    const symbol = 'GC=F';
    const period1 = new Date();
    period1.setMonth(period1.getMonth() - 1); // 1 month ago
    const period2 = new Date(); // now

    const queryOptions = {
        period1: period1.toISOString(),
        period2: period2.toISOString(),
        interval: '1d'
    };

    console.log("Using options:", queryOptions);

    try {
        const yf = new pkg.default();
        // Trying chart method
        console.log("Calling yf.chart...");
        const result = await yf.chart(symbol, queryOptions);

        console.log("Result keys:", Object.keys(result));
        if (result.quotes) {
            console.log("Quotes found:", result.quotes.length);
            console.log("First quote:", result.quotes[0]);
        }
    } catch (error) {
        console.error("Failed:", error);
        if (error.errors) console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
    }
}

testHistory();
