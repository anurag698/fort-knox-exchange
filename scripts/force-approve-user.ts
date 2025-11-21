
import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE_ID || 'fortknox';

const client = new CosmosClient({ endpoint, key });

const TARGET_USER_ID = 'koYMfUXThha6d1AZTKpgTg7cgYj1';

async function forceApprove() {
    console.log('Connecting to Cosmos DB...');
    const database = client.database(databaseId);
    const container = database.container('users');

    console.log(`Fetching user ${TARGET_USER_ID}...`);
    const { resource: user } = await container.item(TARGET_USER_ID, TARGET_USER_ID).read();

    if (!user) {
        console.error('User not found!');
        return;
    }

    console.log(`Current status: ${user.kycStatus}`);

    const updatedUser = {
        ...user,
        kycStatus: 'approved',
        kycData: {
            ...user.kycData,
            reviewedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
    };

    console.log('Updating user...');
    await container.item(user.id, user.id).replace(updatedUser);
    console.log('User approved successfully.');
}

forceApprove().catch(console.error);
