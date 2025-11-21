
import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE_ID || 'fortknox';

const client = new CosmosClient({ endpoint, key });

async function approvePendingKYC() {
    console.log('Connecting to Cosmos DB...');
    const database = client.database(databaseId);
    const container = database.container('users');

    console.log('Querying pending KYC requests...');
    const { resources: users } = await container.items
        .query("SELECT * FROM c WHERE c.kycStatus = 'pending'")
        .fetchAll();

    console.log(`Found ${users.length} pending requests.`);

    for (const user of users) {
        console.log(`Approving user: ${user.id} (${user.email})`);

        const updatedUser = {
            ...user,
            kycStatus: 'approved',
            kycData: {
                ...user.kycData,
                reviewedAt: new Date().toISOString()
            },
            updatedAt: new Date().toISOString()
        };

        await container.item(user.id, user.id).replace(updatedUser);
        console.log(`User ${user.id} approved.`);
    }

    console.log('Done.');
}

approvePendingKYC().catch(console.error);
