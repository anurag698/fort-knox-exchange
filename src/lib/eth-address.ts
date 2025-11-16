
import { HDNodeWallet } from 'ethers';

/**
 * Derives a receiving ETH address from an account-level xpub.
 * This function assumes the provided xpub corresponds to a path like `m/44'/60'/0'`.
 * It will then derive addresses on the external chain (0) at the specified index.
 * The resulting derivation path will be `m/44'/60'/0'/0/{index}`.
 *
 * @param xpub The extended public key for the account. Must not include private key data.
 * @param index The sequential index for the address to derive.
 * @returns The derived Ethereum address as a lowercase string.
 */
export function deriveEthAddressFromXpub(xpub: string, index: number): string {
  if (!xpub) {
    throw new Error('ETH_XPUB environment variable is required for address derivation.');
  }
  if (index < 0 || !Number.isInteger(index)) {
    throw new Error('Address index must be a non-negative integer.');
  }

  try {
    // HDNodeWallet can parse an xpub string.
    const node = HDNodeWallet.fromExtendedKey(xpub);
    
    // Derive the standard path for receiving addresses (external chain).
    // The path "0/{index}" is relative to the node created from the xpub.
    const childNode = node.derivePath(`0/${index}`);
    
    // Return the checksum-cased address.
    return childNode.address;
    
  } catch (error: any) {
    console.error("Failed to derive ETH address from xpub.", { xpub, index, error: error.message });
    // This could happen if the xpub format is invalid.
    throw new Error(`Could not derive address. Please check the format of the provided ETH_XPUB. Error: ${error.message}`);
  }
}
