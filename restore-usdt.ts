import dotenv from 'dotenv';
import path from 'path';

// Load env vars BEFORE other imports
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });
console.log('Loading .env.local from:', envLocalPath);
dotenv.config({ path: envLocalPath, override: true });

async function restoreUsdt() {
    // Dynamic import to ensure env vars are loaded
    const { getContainer } = await import('./src/lib/azure/cosmos');

    const container = getContainer('balances');
    const userId = 'koYMfUXThha6d1AZTKpgTg7cgYj1';
    const standardId = 'balance-koYMfUXThha6d1AZTKpgTg7cgYj1-USDT';

    console.log(`Restoring USDT for user ${userId}...`);

    try {
        const { resource: bal } = await container.item(standardId, userId).read();
        if (bal) {
            console.log(`Current Balance: ${bal.available}`);
            bal.available = 10;
            await container.item(standardId, userId).replace(bal);
            console.log(`✅ Updated USDT balance to 10`);
        } else {
            console.log('⚠️ USDT balance not found, cannot update.');
        }
    } catch (e: any) {
        console.log('⚠️ Error updating USDT:', e.message);
    }

    // Verify
    const { resource: finalBal } = await container.item(standardId, userId).read();
    console.log(`Final Balance on DB: ${finalBal?.available}`);
}

restoreUsdt().catch(console.error);
