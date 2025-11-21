
import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE_ID || 'fortknox';

const assets = [
    {
        id: 'BTC',
        symbol: 'BTC',
        name: 'Bitcoin',
        contractAddress: '',
        decimals: 8,
        createdAt: new Date().toISOString()
    },
    {
        id: 'ETH',
        symbol: 'ETH',
        name: 'Ethereum',
        contractAddress: '',
        decimals: 18,
        createdAt: new Date().toISOString()
    },
    {
        id: 'USDT',
        symbol: 'USDT',
        name: 'Tether',
        contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        decimals: 6,
        createdAt: new Date().toISOString()
    },
    {
        id: 'SOL',
        symbol: 'SOL',
        name: 'Solana',
        contractAddress: '',
        decimals: 9,
        createdAt: new Date().toISOString()
    },
    {
        id: 'BNB',
        symbol: 'BNB',
        name: 'Binance Coin',
        contractAddress: '',
        decimals: 18,
        createdAt: new Date().toISOString()
    }
];

async function seedAssets() {
    console.log('Seeding assets...');
    const client = new CosmosClient({ endpoint, key });
    const container = client.database(databaseId).container('assets');

    for (const asset of assets) {
        console.log(`Upserting ${asset.symbol}...`);
        await container.items.upsert(asset);
    }
    console.log('Assets seeded successfully.');
}

seedAssets().catch(console.error);
