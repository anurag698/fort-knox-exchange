
import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE_ID || 'fortknox';

async function checkWithdrawals() {
    console.log('Connecting to Cosmos DB...');
    const client = new CosmosClient({ endpoint, key });
    const container = client.database(databaseId).container('withdrawals');

    console.log('Querying all withdrawals...');
    const { resources: withdrawals } = await container.items
        .query("SELECT * FROM c")
        .fetchAll();

    console.log(`Found ${withdrawals.length} withdrawals:`);
    withdrawals.forEach(w => {
        console.log(`- ID: ${w.id}, User: ${w.userId}, Amount: ${w.amount} ${w.assetId}, Status: ${w.status}, AI Risk: ${w.aiRiskLevel}`);
    });
}

checkWithdrawals().catch(console.error);
