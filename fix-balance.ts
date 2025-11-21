
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

import { CosmosClient } from '@azure/cosmos';

const ENDPOINT = "https://voice-bharat-cosmos.documents.azure.com:443/";
const KEY = "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcafACDbbeckvg==";
const DATABASE_ID = "fort-knox-db";

if (!ENDPOINT || !KEY || !DATABASE_ID) {
    console.error("Missing Cosmos DB environment variables.");
    process.exit(1);
}

const client = new CosmosClient({ endpoint: ENDPOINT, key: KEY });
const database = client.database(DATABASE_ID);
const container = database.container('balances');

async function main() {
    const userId = 'koYMfUXThha6d1AZTKpgTg7cgYj1';
    const assetId = 'USDT';
    const amountToDeduct = 3.09996443;

    console.log(`Correcting balance for user ${userId}...`);

    try {
        // Fetch current balance
        const { resources: balances } = await container.items
            .query({
                query: 'SELECT * FROM c WHERE c.userId = @userId AND c.assetId = @assetId',
                parameters: [{ name: '@userId', value: userId }, { name: '@assetId', value: assetId }]
            })
            .fetchAll();

        if (balances.length === 0) {
            console.error('Balance not found.');
            return;
        }

        const balanceDoc = balances[0];
        console.log(`Current Balance: ${balanceDoc.available}`);

        const newAvailable = balanceDoc.available - amountToDeduct;

        if (newAvailable < 0) {
            console.error('Insufficient funds for deduction (this should not happen if logic is correct).');
            // Force to 0 if slightly negative due to precision? No, be safe.
            return;
        }

        console.log(`New Balance will be: ${newAvailable}`);

        // Update balance
        const { resource: updated } = await container.item(balanceDoc.id, balanceDoc.userId).replace({
            ...balanceDoc,
            available: newAvailable,
            updatedAt: new Date().toISOString()
        });

        console.log('Balance updated successfully.');
        console.log(`Final Balance: ${updated.available}`);

    } catch (error) {
        console.error('Error updating balance:', error);
    }
}

main();
