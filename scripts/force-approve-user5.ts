// Force approve KYC user using queryItems and upsertItem with relative import
import { queryItems, upsertItem } from '../src/lib/azure/cosmos';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TARGET_USER_ID = 'koYMfUXThha6d1AZTKpgTg7cgYj1';

async function forceApprove() {
    console.log('Fetching user via query...');
    const users = await queryItems<any>('users', 'SELECT * FROM c WHERE c.id = @id', [{ name: '@id', value: TARGET_USER_ID }]);
    const user = users[0];
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
    await upsertItem('users', updatedUser);
    console.log('User approved successfully via upsert.');
}

forceApprove().catch(console.error);
