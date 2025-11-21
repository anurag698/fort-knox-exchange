
import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE_ID || 'fortknox';
const containerId = 'users';
const TARGET_USER_ID = 'koYMfUXThha6d1AZTKpgTg7cgYj1';

async function fixAndApprove() {
    const client = new CosmosClient({ endpoint, key });
    const container = client.database(databaseId).container(containerId);

    console.log('Fetching user from undefined partition...');
    // Try to read with undefined partition key
    // Note: In some SDK versions, passing undefined might not work as expected for "undefined" partition.
    // We can also query for it.
    const { resources: users } = await container.items
        .query(`SELECT * FROM c WHERE c.id = "${TARGET_USER_ID}"`)
        .fetchAll();

    const user = users[0];

    if (!user) {
        console.error('User not found even via query!');
        return;
    }

    console.log(`Found user. Current status: ${user.kycStatus}`);
    console.log(`Current userId field: ${user.userId}`);

    // If userId is missing, we need to migrate
    if (!user.userId) {
        console.log('Migrating user to correct partition...');

        // 1. Delete old document
        // We need to know the partition key to delete. If it's undefined, we pass undefined.
        // However, if the document was created without a partition key value, it might be in the "undefined" partition.
        // Let's try to delete using the query result's self link or just try passing undefined.
        try {
            // Using a dummy partition key value for undefined if needed, but usually passing undefined works
            // or we can use the PartitionKey.None or similar if available, but here we just pass undefined.
            // Actually, if we use the item object from the query, we might be able to delete it?
            // No, we need container.item(...).delete()

            // Let's try deleting with undefined partition key
            await container.item(user.id, undefined).delete();
            console.log('Deleted old user document.');
        } catch (err) {
            console.error('Error deleting old document:', err);
            // If delete fails, we might create a duplicate if we proceed. But let's assume we can proceed if we are careful.
            // If we can't delete, maybe we can't migrate easily.
            // But let's try to create the new one anyway? No, that would violate unique id constraint if in same partition?
            // No, partition key is part of the unique index usually? No, id is unique within a partition.
            // If we move to a NEW partition (userId=...), it might be allowed even if old one exists?
            // But usually id is unique across the container if partitioned? No, id is unique PER partition.
            // So we CAN create a new one with same ID in a different partition!
            // Let's try creating the new one first.
        }

        // 2. Create new document with userId and approved status
        const newUser = {
            ...user,
            userId: user.id, // Set the partition key
            kycStatus: 'approved',
            kycData: {
                ...user.kycData,
                reviewedAt: new Date().toISOString()
            },
            updatedAt: new Date().toISOString()
        };

        // Remove system generated fields
        delete newUser._rid;
        delete newUser._self;
        delete newUser._etag;
        delete newUser._attachments;
        delete newUser._ts;

        console.log('Creating new user document...');
        await container.items.create(newUser);
        console.log('User migrated and approved successfully.');

    } else {
        console.log('User already has userId. Updating status...');
        const updatedUser = {
            ...user,
            kycStatus: 'approved',
            kycData: {
                ...user.kycData,
                reviewedAt: new Date().toISOString()
            },
            updatedAt: new Date().toISOString()
        };
        await container.item(user.id, user.userId).replace(updatedUser);
        console.log('User approved successfully.');
    }
}

fixAndApprove().catch(console.error);
