
import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE_ID || 'fortknox';

const client = new CosmosClient({ endpoint, key });

async function checkUserStatus() {
    console.log('Connecting to Cosmos DB...');
    const database = client.database(databaseId);
    const container = database.container('users');

    console.log('Querying all users...');
    const { resources: users } = await container.items
        .query("SELECT c.id, c.email, c.kycStatus FROM c")
        .fetchAll();

    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
        console.log(`- ID: ${user.id}, Email: ${user.email}, Status: ${user.kycStatus}`);
    });
}

checkUserStatus().catch(console.error);
