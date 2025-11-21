// Cleanup duplicate balances
import dotenv from 'dotenv';
import path from 'path';

// Load env vars BEFORE other imports
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });
console.log('Loading .env.local from:', envLocalPath);
dotenv.config({ path: envLocalPath, override: true });

async function cleanupBalances() {
    // Dynamic import to ensure env vars are loaded
    const { getContainer } = await import('./src/lib/azure/cosmos');

    const container = getContainer('balances');
    const userId = 'koYMfUXThha6d1AZTKpgTg7cgYj1';

    // 1. Update standard POL balance to 4.81
    try {
        const standardId = 'balance-koYMfUXThha6d1AZTKpgTg7cgYj1-POL';
        const { resource: standardBal } = await container.item(standardId, userId).read();
        if (standardBal) {
            standardBal.available = 4.81;
            await container.item(standardId, userId).replace(standardBal);
            console.log('✅ Updated standard POL balance to 4.81');
        } else {
            console.log('⚠️ Standard POL balance not found, creating...');
            await container.items.create({
                id: standardId,
                userId,
                assetId: 'POL',
                available: 4.81,
                locked: 0,
                updatedAt: new Date().toISOString()
            });
            console.log('✅ Created standard POL balance');
        }
    } catch (e: any) {
        console.log('⚠️ Error updating standard POL:', e.message);
    }

    // 2. Delete old POL balance
    try {
        await container.item('koYMfUXThha6d1AZTKpgTg7cgYj1_POL', userId).delete();
        console.log('✅ Deleted old POL balance');
    } catch (e: any) {
        console.log('⚠️ Could not delete old POL (maybe already gone):', e.message);
    }

    // 3. Delete old USDT balance (3.04)
    try {
        await container.item('82b81b46-93fb-453f-84cc-38994c690175', userId).delete();
        console.log('✅ Deleted old USDT balance (3.04)');
    } catch (e: any) {
        console.log('⚠️ Could not delete old USDT:', e.message);
    }

    console.log('\n✨ Cleanup complete! Checking remaining balances...\n');

    // Query remaining balances
    const { resources } = await container.items
        .query({
            query: 'SELECT * FROM c WHERE c.userId = @userId AND (c.available > 0 OR c.locked > 0)',
            parameters: [{ name: '@userId', value: userId }]
        })
        .fetchAll();

    console.log('Final balances:');
    for (const bal of resources) {
        console.log(`  ${bal.assetId || bal.asset}: ${bal.available} (locked: ${bal.locked})`);
    }
}

cleanupBalances().catch(console.error);
