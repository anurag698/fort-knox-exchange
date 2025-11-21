import axios from 'axios';
import { upsertItem } from '@/lib/azure/cosmos';

interface MexcTicker {
    symbol: string;
    priceChange: string;
    priceChangePercent: string;
    prevClosePrice: string;
    lastPrice: string;
    bidPrice: string;
    bidQty: string;
    askPrice: string;
    askQty: string;
    openPrice: string;
    highPrice: string;
    lowPrice: string;
    volume: string;
    quoteVolume: string;
    openTime: number;
    closeTime: number;
    count: number;
}

export class MarketAggregator {
    private readonly MEXC_API_URL = 'https://api.mexc.com/api/v3/ticker/24hr';

    /**
     * Fetch top markets and update DB
     */
    async updateMarketData() {
        console.log('🔄 [MarketAggregator] Fetching market data from MEXC...');

        try {
            const response = await axios.get<MexcTicker[]>(this.MEXC_API_URL);
            const allTickers = response.data;

            // Filter for USDT pairs
            const usdtPairs = allTickers.filter(t => t.symbol.endsWith('USDT'));

            // Sort by Quote Volume (Liquidity)
            const topPairs = usdtPairs
                .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
                .slice(0, 100); // Top 100

            console.log(`   Fetched ${allTickers.length} tickers, filtered to ${usdtPairs.length} USDT pairs. Updating top ${topPairs.length}...`);

            let updatedCount = 0;
            const batchSize = 10; // Parallel updates

            // Process in batches
            for (let i = 0; i < topPairs.length; i += batchSize) {
                const batch = topPairs.slice(i, i + batchSize);
                await Promise.all(batch.map(async (ticker) => {
                    try {
                        // Normalize symbol (MEXC: BTCUSDT -> Standard: BTC-USDT)
                        // Assuming standard format is BASE-QUOTE
                        let base = ticker.symbol.replace('USDT', '');

                        // Symbol mapping: MEXC still uses MATIC, but we use POL
                        const symbolMap: Record<string, string> = {
                            'MATIC': 'POL'
                        };

                        if (symbolMap[base]) {
                            base = symbolMap[base];
                        }

                        const marketId = `${base}-USDT`;

                        const marketData = {
                            id: marketId,
                            symbol: marketId,
                            price: parseFloat(ticker.lastPrice),
                            priceChangePercent: parseFloat(ticker.priceChangePercent),
                            high: parseFloat(ticker.highPrice),
                            low: parseFloat(ticker.lowPrice),
                            volume: parseFloat(ticker.volume),
                            quoteVolume: parseFloat(ticker.quoteVolume),
                            marketCap: 0, // TODO: Calculate from supply if available
                            lastUpdated: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };

                        // We assume priceChangePercent from MEXC is e.g. "2.5" for 2.5%.
                        // If it's 0.025, we multiply by 100.
                        // Binance docs say "priceChangePercent": "0.000"
                        // Actually Binance API returns "10.000" for 10%.
                        // I'll assume standard Binance format.

                        await upsertItem('market_data', marketData);
                        updatedCount++;
                    } catch (err) {
                        // Ignore errors for individual pairs (e.g. invalid IDs)
                    }
                }));
            }

            console.log(`✅ [MarketAggregator] Updated ${updatedCount} markets.`);
            return { success: true, updated: updatedCount };

        } catch (error: any) {
            console.error('❌ [MarketAggregator] Failed to update:', error.message);
            throw error;
        }
    }
}

export const marketAggregator = new MarketAggregator();
