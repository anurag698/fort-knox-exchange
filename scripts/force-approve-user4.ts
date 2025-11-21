// Force approve KYC user using CosmosClient directly
import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE_ID || 'fortknox';
const containerId = 'users';
const TARGET_USER_ID = 'koYMfUXThha6d1AZTKpgTg7cgYj1';

async function forceApprove() {
    const client = new CosmosClient({ endpoint, key });
    const container = client.database(databaseId).container(containerId);
    console.log('Fetching user...');
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
    await container.item(TARGET_USER_ID, TARGET_USER_ID).replace(updatedUser);
    console.log('User approved successfully via replace.');
}

forceApprove().catch(console.error);
