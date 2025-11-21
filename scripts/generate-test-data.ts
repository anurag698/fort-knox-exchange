// Quick Test Data Generator
// Creates mock deposits and balances for testing UI

import { createDeposit } from './src/lib/azure/cosmos-trading';
import { getContainer } from './src/lib/azure/cosmos';
import { v4 as uuidv4 } from 'uuid';

async function generateTestData(userId: string) {
    console.log('🧪 Generating test data...\n');

    // Create test balance
    console.log('📊 Creating test balance...');
    const balancesContainer = getContainer('balances');
    await balancesContainer.items.upsert({
        id: uuidv4(),
        userId,
        assetId: 'ETH',
        available: 1.5,
        locked: 0.2,
        updatedAt: new Date().toISOString(),
    });

    await balancesContainer.items.upsert({
        id: uuidv4(),
        userId,
        assetId: 'USDT',
        available: 5000,
        locked: 1000,
        updatedAt: new Date().toISOString(),
    });

    console.log('✅ Created balances: 1.5 ETH, 5000 USDT\n');

    // Create test deposits
    console.log('💰 Creating test deposits...');

    // Confirmed deposit
    await createDeposit({
        userId,
        chain: 'ETH',
        depositAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        amount: '1000000000000000000', // 1 ETH in wei
        amountNormalized: 1.0,
        status: 'credited',
        confirmations: 15,
        requiredConfirmations: 12,
        blockNumber: 12345678,
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        creditedAt: new Date(Date.now() - 3000000),
        metadata: {
            fromAddress: '0x1234567890123456789012345678901234567890',
            gasUsed: '21000',
            blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        },
    });

    // Pending deposit
    await createDeposit({
        userId,
        chain: 'MATIC',
        depositAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        amount: '5000000000000000000', // 5 MATIC
        amountNormalized: 5.0,
        status: 'confirming',
        confirmations: 50,
        requiredConfirmations: 128,
        blockNumber: 12345700,
        timestamp: new Date(Date.now() - 600000), // 10 mins ago
        metadata: {
            fromAddress: '0x9876543210987654321098765432109876543210',
            gasUsed: '21000',
            blockHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
    });

    console.log('✅ Created 2 test deposits (1 credited, 1 pending)\n');

    console.log('🎉 Test data generated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Visit http://localhost:9002/deposits');
    console.log('2. Sign in with Firebase');
    console.log('3. View your test deposits and balances');
}

// Get userId from command line
const userId = process.argv[2];

if (!userId) {
    console.error('❌ Error: Please provide userId');
    console.log('\nUsage: npx ts-node scripts/generate-test-data.ts YOUR_USER_ID');
    console.log('\nGet your userId from Firebase Auth after signing in');
    process.exit(1);
}

generateTestData(userId)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
