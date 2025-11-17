import { generateMnemonic, mnemonicToXpub, deriveAddressFromXpub } from '../src/lib/wallet';

console.log('--- TEST MNEMONIC AND XPUB GENERATOR ---');
console.warn('⚠️ WARNING: DO NOT use this mnemonic or these keys in a production environment. For testing purposes only.');

async function generateTestData() {
    try {
        // 1. Generate a new mnemonic
        const mnemonic = generateMnemonic(128); // 12 words
        console.log('\n✅ Generated Test Mnemonic (12 words):');
        console.log('----------------------------------------------------');
        console.log(mnemonic);
        console.log('----------------------------------------------------');

        // 2. Convert to XPUB
        const xpub = mnemonicToXpub(mnemonic);
        console.log('\n✅ Corresponding Account XPUB (for BSC_XPUB env var):');
        console.log('Derivation Path: m/44\'/60\'/0\'');
        console.log('----------------------------------------------------');
        console.log(xpub);
        console.log('----------------------------------------------------');


        // 3. Show first 5 deposit addresses
        console.log('\n✅ First 5 Derived Deposit Addresses:');
        for (let i = 0; i < 5; i++) {
            const address = deriveAddressFromXpub(xpub, i);
            console.log(`Index ${i} (Path m/44'/60'/0'/0/${i}): ${address}`);
        }
        
        console.log('\nSetup complete. You can now use this XPUB in your .env file for testing.');

    } catch (e: any) {
        console.error('\n❌ Error generating test data:', e.message);
    }
}

generateTestData();
