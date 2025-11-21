// Azure Cosmos DB Client
import { CosmosClient, Database, Container } from '@azure/cosmos';

// Cosmos DB Configuration
const endpoint = process.env.AZURE_COSMOS_ENDPOINT || process.env.COSMOS_ENDPOINT || '';
const key = process.env.AZURE_COSMOS_KEY || process.env.COSMOS_KEY || '';
export const databaseId = process.env.AZURE_COSMOS_DATABASE_ID || process.env.COSMOS_DATABASE || 'fortknox';

// Create Cosmos Client only if credentials are provided
export const cosmosClient = (endpoint && key)
    ? new CosmosClient({ endpoint, key })
    : null;

// Get database reference
export function getDatabase(): Database {
    if (!cosmosClient) {
        throw new Error('Cosmos DB not configured. Set COSMOS_ENDPOINT and COSMOS_KEY environment variables.');
    }
    return cosmosClient.database(databaseId);
}

// Get container reference
export function getContainer(containerId: string): Container {
    return getDatabase().container(containerId);
}

// Utility: Query items
export async function queryItems<T>(
    containerId: string,
    query: string,
    parameters?: any[]
): Promise<T[]> {
    const container = getContainer(containerId);
    const { resources } = await container.items
        .query({
            query,
            parameters,
        })
        .fetchAll();
    return resources as T[];
}

// Utility: Get item by ID
export async function getItemById<T>(
    containerId: string,
    id: string,
    partitionKey: string
): Promise<T | null> {
    try {
        const container = getContainer(containerId);
        const { resource } = await container.item(id, partitionKey).read<T>();
        return resource || null;
    } catch (error: any) {
        if (error.code === 404) return null;
        throw error;
    }
}

// Utility: Create or update item
export async function upsertItem<T>(
    containerId: string,
    item: T
): Promise<T> {
    const container = getContainer(containerId);
    const { resource } = await container.items.upsert<T>(item);
    return resource as T;
}

// Utility: Delete item
export async function deleteItem(
    containerId: string,
    id: string,
    partitionKey: string
): Promise<void> {
    const container = getContainer(containerId);
    await container.item(id, partitionKey).delete();
}

// Initialize database and containers (run once on setup)
export async function initializeDatabase() {
    const { database } = await cosmosClient.databases.createIfNotExists({
        id: databaseId,
    });

    // Create containers if they don't exist
    await database.containers.createIfNotExists({
        id: 'users',
        partitionKey: { paths: ['/userId'] },
    });

    await database.containers.createIfNotExists({
        id: 'balances',
        partitionKey: { paths: ['/userId'] },
    });

    await database.containers.createIfNotExists({
        id: 'orders',
        partitionKey: { paths: ['/userId'] },
    });

    await database.containers.createIfNotExists({
        id: 'trades',
        partitionKey: { paths: ['/marketId'] }, // Keeping original partitionKey for trades
    });

    await database.containers.createIfNotExists({
        id: 'markets',
        partitionKey: { paths: ['/id'] },
    });

    await database.containers.createIfNotExists({
        id: 'market_data',
        partitionKey: { paths: ['/id'] },
    });

    await database.containers.createIfNotExists({
        id: 'deposits',
        partitionKey: { paths: ['/userId'] },
    });

    await database.containers.createIfNotExists({
        id: 'withdrawals',
        partitionKey: { paths: ['/userId'] },
    });

    await database.containers.createIfNotExists({
        id: 'deposit_addresses',
        partitionKey: { paths: ['/userId'] },
    });

    await database.containers.createIfNotExists({
        id: 'ledger',
        partitionKey: { paths: ['/userId'] },
    });

    await database.containers.createIfNotExists({
        id: 'assets',
        partitionKey: { paths: ['/id'] },
    });

    await database.containers.createIfNotExists({
        id: 'dex_transactions',
        partitionKey: { paths: ['/id'] },
    });

    await database.containers.createIfNotExists({
        id: 'fusion_orders',
        partitionKey: { paths: ['/userId'] },
    });

    await database.containers.createIfNotExists({
        id: 'counters',
        partitionKey: { paths: ['/id'] },
    });

    console.log('✅ Cosmos DB initialized with all containers');
}

// Utility: Get next HD Wallet index
export async function getNextIndex(counterId: string = 'hd_wallet_index'): Promise<number> {
    const container = getContainer('counters');

    // Retry loop for optimistic concurrency
    for (let i = 0; i < 5; i++) {
        try {
            const { resource: doc } = await container.item(counterId, counterId).read();

            let nextIndex = 0;
            if (doc) {
                nextIndex = (doc.value || 0) + 1;
                // Update with etag check (if doc exists)
                await container.item(counterId, counterId).replace({
                    id: counterId,
                    value: nextIndex
                }, { accessCondition: { type: 'IfMatch', condition: doc._etag } });
            } else {
                // Create if not exists
                await container.items.create({
                    id: counterId,
                    value: nextIndex
                });
            }

            return nextIndex;
        } catch (err: any) {
            if (err.code === 412) {
                // Precondition failed (concurrent update), retry
                continue;
            }
            throw err;
        }
    }
    throw new Error('Failed to get next index after retries');
}
