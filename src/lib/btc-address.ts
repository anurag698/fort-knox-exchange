
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';

const bip32 = BIP32Factory(ecc);

/**
 * deriveBtcAddressFromXpub(xpub, index, network)
 * - xpub: extended public key (xpub/ypub/zpub)
 * - index: integer index (unique per address)
 * - network: bitcoin.networks.bitcoin or bitcoin.networks.testnet
 */
export function deriveBtcAddressFromXpub(xpub: string, index: number, network = bitcoin.networks.bitcoin) {
  // Validate inputs
  if (!xpub || xpub.trim() === '') {
    throw new Error('BTC_XPUB is not configured or is empty. Please set the BTC_XPUB environment variable with a valid Bitcoin extended public key.');
  }

  if (index < 0 || !Number.isInteger(index)) {
    throw new Error(`Invalid address index: ${index}. Index must be a non-negative integer.`);
  }

  // Validate xpub format
  const trimmedXpub = xpub.trim();
  const validPrefixes = ['xpub', 'ypub', 'zpub', 'tpub', 'upub', 'vpub'];
  const hasValidPrefix = validPrefixes.some(prefix => trimmedXpub.startsWith(prefix));

  if (!hasValidPrefix) {
    throw new Error(`Invalid BTC_XPUB format. Extended public key must start with one of: ${validPrefixes.join(', ')}. Current value starts with: ${trimmedXpub.substring(0, 4)}`);
  }

  try {
    // Parse the extended public key
    const node = bip32.fromBase58(trimmedXpub, network);

    // Derive the child address (external chain 0, then address index)
    const child = node.derive(0).derive(index);

    // Create bech32 (P2WPKH) address for BTC
    const payment = bitcoin.payments.p2wpkh({ pubkey: child.publicKey, network });

    if (!payment.address) {
      throw new Error('Failed to generate BTC address from derived public key');
    }

    return payment.address;
  } catch (error: any) {
    // Provide more specific error messages
    if (error.message.includes('checksum')) {
      throw new Error(`Invalid BTC_XPUB: Checksum validation failed. The extended public key appears to be corrupted or invalid. Please verify your BTC_XPUB environment variable. Error: ${error.message}`);
    } else if (error.message.includes('Invalid')) {
      throw new Error(`Invalid BTC_XPUB format: ${error.message}. Please ensure you have a properly formatted Bitcoin extended public key.`);
    } else {
      throw new Error(`Failed to derive BTC address: ${error.message}`);
    }
  }
}
