/**
 * BSC HD Wallet Utilities for Fort Knox Exchange
 * 
 * SECURITY: This module handles sensitive cryptographic operations.
 * - Never log private keys, mnemonics, or extended keys
 * - Only expose public keys (XPUB) and addresses
 * - Use server-side only (never expose to client)
 */

import * as bip39 from 'bip39';
import { HDNode, utils } from 'ethers';

// BSC uses Ethereum's derivation path
const BSC_DERIVATION_PATH = "m/44'/60'/0'";

/**
 * Convert a BIP39 mnemonic to an extended public key (XPUB)
 * @param mnemonic - 12 or 24 word mnemonic phrase
 * @returns Extended public key string
 * @throws Error if mnemonic is invalid
 */
export async function mnemonicToXpub(mnemonic: string): Promise<string> {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  // Generate seed from mnemonic
  const seed = await bip39.mnemonicToSeed(mnemonic);
  
  // Create HD root node
  const root = HDNode.fromSeed(seed);
  
  // Derive to BSC path and return neutered (public-only) key
  const node = root.derivePath(BSC_DERIVATION_PATH);
  
  return node.neuter().extendedKey;
}

/**
 * Derive a BSC address from XPUB at a specific index
 * @param xpub - Extended public key
 * @param index - Child index (0-based)
 * @returns Checksummed BSC address
 * @throws Error if xpub is invalid or index is negative
 */
export function deriveAddressFromXpub(xpub: string, index: number): string {
  if (index < 0) {
    throw new Error('Index must be non-negative');
  }

  try {
    // Load the public node
    const node = HDNode.fromExtendedKey(xpub);
    
    // Derive child at path 0/{index}
    const child = node.derivePath(`0/${index}`);
    
    // Return checksummed address
    return utils.getAddress(child.address);
  } catch (error) {
    throw new Error(`Failed to derive address: ${error}`);
  }
}

/**
 * Validate a BSC/Ethereum address
 * @param address - Address to validate
 * @returns true if valid
 */
export function isValidBSCAddress(address: string): boolean {
  try {
    utils.getAddress(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a new BIP39 mnemonic (for testing/setup only)
 * @param strength - Bit strength (128 = 12 words, 256 = 24 words)
 * @returns New mnemonic phrase
 */
export function generateMnemonic(strength: number = 256): string {
  return bip39.generateMnemonic(strength);
}