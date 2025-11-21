
import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE_ID || 'fortknox';

async function initDb() {
    console.log('Initializing database...');
    const client = new CosmosClient({ endpoint, key });
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    console.log(`Database '${databaseId}' ready.`);

    const containers = [
        { id: 'users', partitionKey: '/userId' },
        { id: 'balances', partitionKey: '/userId' },
        { id: 'orders', partitionKey: '/userId' },
        { id: 'trades', partitionKey: '/marketId' },
        { id: 'markets', partitionKey: '/id' },
        { id: 'market_data', partitionKey: '/id' },
        { id: 'deposits', partitionKey: '/userId' },
        { id: 'withdrawals', partitionKey: '/userId' },
        { id: 'deposit_addresses', partitionKey: '/userId' },
        { id: 'ledger', partitionKey: '/userId' },
        { id: 'assets', partitionKey: '/id' },
        { id: 'dex_transactions', partitionKey: '/id' },
        { id: 'fusion_orders', partitionKey: '/userId' },
    ];

    for (const c of containers) {
        console.log(`Creating container '${c.id}'...`);
        await database.containers.createIfNotExists({
            id: c.id,
            partitionKey: { paths: [c.partitionKey] }
        });
        console.log(`Container '${c.id}' ready.`);
    }
    console.log('All containers initialized.');
}

initDb().catch(console.error);
