
import bip32 from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';

/**
 * deriveBtcAddressFromXpub(xpub, index, network)
 * - xpub: extended public key (xpub/ypub/zpub)
 * - index: integer index (unique per address)
 * - network: bitcoin.networks.bitcoin or bitcoin.networks.testnet
 */
export function deriveBtcAddressFromXpub(xpub: string, index: number, network = bitcoin.networks.bitcoin) {
  if (!xpub) throw new Error('xpub required');
  const node = bip32.fromBase58(xpub, network);
  // external chain 0
  const child = node.derive(0).derive(index);
  // Create bech32 (P2WPKH) address
  const payment = bitcoin.payments.p2wpkh({ pubkey: child.publicKey, network });
  if (!payment.address) throw new Error('failed to derive btc address');
  return payment.address;
}
