
import { ethers } from 'ethers';
import { deriveAddressFromXpub } from '../src/lib/wallet';
import 'dotenv/config';

const BSC_XPUB = process.env.BSC_XPUB;
const BSC_RPC_URL = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org';
const HOT_WALLET_ADDRESS = process.env.HOT_WALLET_ADDRESS;

if (!BSC_XPUB || !HOT_WALLET_ADDRESS) {
  console.error("BSC_XPUB and HOT_WALLET_ADDRESS must be set in environment.");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);

/**
 * Sweeps funds from a given private key to the hot wallet.
 * @param privateKey The private key of the address to sweep.
 */
async function sweepToHotWallet(privateKey: string) {
  // THIS IS A PLACEHOLDER - In a real scenario, you would use a secure signer.
  // NEVER expose private keys in code or logs.
  console.log(`[SWEEP] Placeholder for sweeping from address with key: ${privateKey.substring(0,5)}...`);

  // Example logic:
  // const wallet = new ethers.Wallet(privateKey, provider);
  // const balance = await provider.getBalance(wallet.address);
  // const gasPrice = await provider.getGasPrice();
  // const gasLimit = 21000;
  // const gasCost = gasPrice.mul(gasLimit);
  // if (balance.gt(gasCost)) {
  //   const tx = await wallet.sendTransaction({
  //     to: HOT_WALLET_ADDRESS,
  //     value: balance.sub(gasCost),
  //     gasPrice,
  //     gasLimit,
  //   });
  //   console.log(`Sweeping ${ethers.formatEther(balance.sub(gasCost))} BNB to ${HOT_WALLET_ADDRESS}. Tx: ${tx.hash}`);
  //   await tx.wait();
  // }
}


async function scanAddresses() {
  console.log('Scanning for non-zero deposit addresses...');
  const nonZeroAddresses = [];
  const maxIndexToCheck = 10000; // The number of addresses to scan

  for (let i = 0; i < maxIndexToCheck; i++) {
    try {
      const address = deriveAddressFromXpub(BSC_XPUB!, i);
      const balance = await provider.getBalance(address);

      if (balance > 0) {
        console.log(`[FOUND] Address at index ${i} (${address}) has balance: ${ethers.formatEther(balance)} BNB`);
        nonZeroAddresses.push({ index: i, address, balance: balance.toString() });
      }

      if (i % 100 === 0 && i > 0) {
        console.log(`Scanned ${i} addresses...`);
      }
    } catch (error) {
      console.error(`Error scanning address at index ${i}:`, error);
      break;
    }
  }

  console.log('\n--- Scan Complete ---');
  if (nonZeroAddresses.length > 0) {
    console.log('Non-zero balance addresses found:');
    console.table(nonZeroAddresses.map(item => ({...item, balance: ethers.formatEther(item.balance)})));

    // In a real implementation, you would retrieve the private key for each index
    // from a secure source (like a hardware wallet or HSM) and call sweepToHotWallet.
    console.log('\nPlaceholder sweep process:');
    for (const item of nonZeroAddresses) {
        // You would get the private key for `item.index` here from your offline storage.
        await sweepToHotWallet(`placeholder_private_key_for_index_${item.index}`);
    }

  } else {
    console.log('No addresses with non-zero balances found.');
  }
}

scanAddresses().catch(console.error);
