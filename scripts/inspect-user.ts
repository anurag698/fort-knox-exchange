
import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE_ID || 'fortknox';

const client = new CosmosClient({ endpoint, key });

async function inspectUser() {
    console.log('Connecting to Cosmos DB...');
    const database = client.database(databaseId);
    const container = database.container('users');

    console.log('Querying all users (cross-partition)...');
    const { resources: users } = await container.items
        .query("SELECT * FROM c")
        .fetchAll();

    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
        console.log(JSON.stringify(user, null, 2));
    });
}

inspectUser().catch(console.error);
