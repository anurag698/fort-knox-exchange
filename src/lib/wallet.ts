import * as bip39 from "bip39";
import * as bip32 from "bip32";
import { ethers } from "ethers";

export function deriveXpubFromMnemonic(mnemonic: string): string {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic");
  }

  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed);

  // BSC / Ethereum derivation path
  const child = root.derivePath("m/44'/60'/0'");

  if (!child.neutered().toBase58()) {
    throw new Error("Failed to derive XPUB");
  }

  return child.neutered().toBase58();
}

export function getDepositAddress(xpub: string, index: number): string {
  const node = bip32.fromBase58(xpub);
  // Correctly derive external chain (0) first, then the address index.
  // This is the standard path for receiving addresses from an account-level XPUB.
  const child = node.derive(0).derive(index);

  const publicKey = ethers.utils.computePublicKey(child.publicKey, false);
  const address = ethers.utils.computeAddress(publicKey);

  return address;
}
