// MEXC Public API Service for Live Market Data
// Uses Next.js API routes as proxy to avoid CORS issues

const API_PROXY_BASE = '/api/mexc';

export interface MEXCTicker {
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
}

export interface MEXCKline {
    openTime: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
    closeTime: number;
    quoteAssetVolume: string;
    numberOfTrades: number;
    takerBuyBaseAssetVolume: string;
    takerBuyQuoteAssetVolume: string;
}

class MEXCAPIService {
    private proxyURL = API_PROXY_BASE;

    // Get 24hr ticker data for a symbol
    async get24hrTicker(symbol: string): Promise<MEXCTicker | null> {
        try {
            const response = await fetch(`${this.proxyURL}/ticker/${symbol}`);
            if (!response.ok) {
                console.error(`MEXC API error: ${response.status} ${response.statusText}`);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching MEXC ticker:', error);
            return null;
        }
    }

    // Get current price for a symbol
    async getCurrentPrice(symbol: string): Promise<{ symbol: string; price: string } | null> {
        try {
            const ticker = await this.get24hrTicker(symbol);
            if (!ticker) return null;
            return {
                symbol: ticker.symbol,
                price: ticker.lastPrice,
            };
        } catch (error) {
            console.error('Error fetching MEXC price:', error);
            return null;
        }
    }

    // Get klines/candlestick data
    async getKlines(symbol: string, interval: string = '1m', limit: number = 100): Promise<MEXCKline[]> {
        try {
            const response = await fetch(
                `${this.proxyURL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
            );
            if (!response.ok) {
                console.error(`MEXC API error: ${response.status} ${response.statusText}`);
                return [];
            }
            const data = await response.json();

            // Convert array format to object format
            return data.map((k: any[]) => ({
                openTime: k[0],
                open: k[1],
                high: k[2],
                low: k[3],
                close: k[4],
                volume: k[5],
                closeTime: k[6],
                quoteAssetVolume: k[7],
                numberOfTrades: k[8],
                takerBuyBaseAssetVolume: k[9],
                takerBuyQuoteAssetVolume: k[10],
            }));
        } catch (error) {
            console.error('Error fetching MEXC klines:', error);
            return [];
        }
    }

    // Get all tickers (for markets page)
    async getAllTickers(): Promise<MEXCTicker[]> {
        try {
            const response = await fetch(`${this.proxyURL}/ticker/all`);
            if (!response.ok) {
                console.error(`MEXC API error: ${response.status} ${response.statusText}`);
                return [];
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching all MEXC tickers:', error);
            return [];
        }
    }

    // Get order book depth
    async getDepth(symbol: string, limit: number = 20): Promise<{ bids: [string, string][]; asks: [string, string][] } | null> {
        try {
            const response = await fetch(`${this.proxyURL}/depth?symbol=${symbol}&limit=${limit}`);
            if (!response.ok) {
                console.error(`MEXC API error: ${response.status} ${response.statusText}`);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching MEXC depth:', error);
            return null;
        }
    }

    // Get recent trades
    async getRecentTrades(symbol: string, limit: number = 100): Promise<any[]> {
        try {
            const response = await fetch(`${this.proxyURL}/trades?symbol=${symbol}&limit=${limit}`);
            if (!response.ok) {
                console.error(`MEXC API error: ${response.status} ${response.statusText}`);
                return [];
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching MEXC trades:', error);
            return [];
        }
    }
}

export const mexcAPI = new MEXCAPIService();
export default mexcAPI;
