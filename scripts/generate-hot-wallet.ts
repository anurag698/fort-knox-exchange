// Hot Wallet Key Generator
// Run once to generate test keys for development

import { Wallet } from 'ethers';

console.log('🔑 Generating Hot Wallet Keys for Development\n');
console.log('⚠️  NEVER use these keys for production with real funds!\n');

// Generate EVM wallet (works for ETH, MATIC, BSC)
const evmWallet = Wallet.createRandom();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('EVM Hot Wallet (ETH, MATIC, BSC)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Address:     ${evmWallet.address}`);
console.log(`Private Key: ${evmWallet.privateKey}`);
console.log('');

console.log('📝 Add to .env.local:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`HOT_WALLET_PRIVATE_KEY_EVM=${evmWallet.privateKey}`);
console.log('');

console.log('💰 Fund this wallet on testnets:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Sepolia ETH:  https://sepoliafaucet.com/`);
console.log(`Mumbai MATIC: https://faucet.polygon.technology/`);
console.log(`BSC Testnet:  https://testnet.binance.org/faucet-smart`);
console.log('');

console.log('✅ Once funded, your exchange can process withdrawals!');
