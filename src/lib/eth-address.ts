
import { HDNodeWallet } from 'ethers';

/**
 * deriveEthAddressFromXpub(xpub, index)
 * - xpub: extended public key derived for path m/44'/60'/0'/0  (so you then derive /index)
 * - index: integer
 *
 * If you don't have an ETH xpub, best practice is to keep seed/private key in a KMS/HSM
 * and expose a server-only derive API. This util assumes xpub is compatible with HDNode.fromExtendedKey.
 */
export function deriveEthAddressFromXpub(xpub: string, index: number) {
  if (!xpub) throw new Error('ETH_XPUB required');
  const node = HDNodeWallet.fromExtendedKey(xpub); // accepts xpub-like extended keys
  // If the xpub points to m/44'/60'/0'/0 then derive `/${index}`
  const child = node.derivePath(`${index}`);
  return child.address.toLowerCase();
}
