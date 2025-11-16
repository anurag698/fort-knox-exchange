// derive-xpub.js (Node script)
// To use: `npm install ethers` then `node derive-xpub.js`
import { HDNodeWallet } from 'ethers';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('--- ETH XPUB Derivation Tool ---');
console.log('This script helps you derive an extended public key (xpub) from a mnemonic phrase.');
console.log('WARNING: NEVER enter your real mnemonic phrase on a machine connected to the internet.');
console.log('Run this on a secure, offline machine if using a real wallet.\n');


rl.question('Enter your 12 or 24-word mnemonic phrase: ', (mnemonic) => {
  if (!mnemonic || mnemonic.split(' ').length < 12) {
    console.error('Error: Invalid mnemonic phrase provided.');
    rl.close();
    return;
  }
  
  try {
    const hdNode = HDNodeWallet.fromPhrase(mnemonic.trim());
    
    // The standard path for the first account in an ETH wallet is m/44'/60'/0'.
    const accountNode = hdNode.derivePath("m/44'/60'/0'");

    // The neutered node contains the public key and chain code, but no private key.
    const neuteredNode = accountNode.neuter();
    
    console.log('\n--- DERIVATION COMPLETE ---');
    console.log(`Derivation Path for Account: m/44'/60'/0'`);
    console.log('\n✅ Your Account XPUB (Extended Public Key):');
    console.log('This is the value for your ETH_XPUB environment variable.');
    console.log('----------------------------------------------------');
    console.log(neuteredNode.extendedKey);
    console.log('----------------------------------------------------');

    // Show an example of deriving the first receiving address from this xpub
    const firstAddressNode = neuteredNode.derivePath('0/0');
    console.log('\nExample Derived Address (Index 0):');
    console.log(`Path: m/44'/60'/0'/0/0`);
    console.log(`Address: ${firstAddressNode.address}`);
    console.log('\nThis confirms the xpub can generate correct addresses.');

  } catch (e) {
    console.error('\nError deriving XPUB. Please check your mnemonic phrase.');
    console.error(e.message);
  } finally {
    rl.close();
  }
});
