import { NextResponse } from 'next/server';
import { upsertItem } from '@/lib/azure/cosmos';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const assets = [
            { id: 'BTC', symbol: 'BTC', name: 'Bitcoin', decimals: 8, type: 'CRYPTO' },
            { id: 'ETH', symbol: 'ETH', name: 'Ethereum', decimals: 18, type: 'CRYPTO' },
            { id: 'USDT', symbol: 'USDT', name: 'Tether', decimals: 6, type: 'STABLECOIN' },
            { id: 'POL', symbol: 'POL', name: 'Polygon', decimals: 18, type: 'CRYPTO', network: 'POLYGON' },
            { id: 'SOL', symbol: 'SOL', name: 'Solana', decimals: 9, type: 'CRYPTO' },
            { id: 'BNB', symbol: 'BNB', name: 'Binance Coin', decimals: 18, type: 'CRYPTO' },
            { id: 'XRP', symbol: 'XRP', name: 'Ripple', decimals: 6, type: 'CRYPTO' },
            { id: 'ADA', symbol: 'ADA', name: 'Cardano', decimals: 6, type: 'CRYPTO' },
            { id: 'DOGE', symbol: 'DOGE', name: 'Dogecoin', decimals: 8, type: 'CRYPTO' },
            { id: 'DOT', symbol: 'DOT', name: 'Polkadot', decimals: 10, type: 'CRYPTO' },
        ];

        const markets = [
            { id: 'BTC-USDT', baseAssetId: 'BTC', quoteAssetId: 'USDT', symbol: 'BTC-USDT', pricePrecision: 2, quantityPrecision: 6, minQuantity: 0.0001 },
            { id: 'ETH-USDT', baseAssetId: 'ETH', quoteAssetId: 'USDT', symbol: 'ETH-USDT', pricePrecision: 2, quantityPrecision: 4, minQuantity: 0.001 },
            { id: 'POL-USDT', baseAssetId: 'POL', quoteAssetId: 'USDT', symbol: 'POL-USDT', pricePrecision: 4, quantityPrecision: 2, minQuantity: 1 },
            { id: 'SOL-USDT', baseAssetId: 'SOL', quoteAssetId: 'USDT', symbol: 'SOL-USDT', pricePrecision: 2, quantityPrecision: 2, minQuantity: 0.1 },
            { id: 'BNB-USDT', baseAssetId: 'BNB', quoteAssetId: 'USDT', symbol: 'BNB-USDT', pricePrecision: 1, quantityPrecision: 3, minQuantity: 0.01 },
            { id: 'XRP-USDT', baseAssetId: 'XRP', quoteAssetId: 'USDT', symbol: 'XRP-USDT', pricePrecision: 4, quantityPrecision: 1, minQuantity: 10 },
            { id: 'ADA-USDT', baseAssetId: 'ADA', quoteAssetId: 'USDT', symbol: 'ADA-USDT', pricePrecision: 4, quantityPrecision: 1, minQuantity: 10 },
            { id: 'DOGE-USDT', baseAssetId: 'DOGE', quoteAssetId: 'USDT', symbol: 'DOGE-USDT', pricePrecision: 5, quantityPrecision: 0, minQuantity: 10 },
            { id: 'DOT-USDT', baseAssetId: 'DOT', quoteAssetId: 'USDT', symbol: 'DOT-USDT', pricePrecision: 3, quantityPrecision: 2, minQuantity: 1 },
        ];

        // Seed Assets
        for (const asset of assets) {
            await upsertItem('assets', asset);
        }

        // Seed Markets
        for (const market of markets) {
            await upsertItem('markets', market);
        }

        return NextResponse.json({
            success: true,
            message: `Seeded ${assets.length} assets and ${markets.length} markets.`,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Seeding failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
