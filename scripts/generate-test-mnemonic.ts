
import * as bip39 from "bip39";
import * as bip32 from "bip32";

async function main() {
  const mnemonic = bip39.generateMnemonic();
  console.log("TESTNET MNEMONIC (DO NOT USE IN PRODUCTION):");
  console.log(mnemonic);

  const seed = await bip39.mnemonicToSeed(mnemonic);
  const root = bip32.fromSeed(seed);

  const xpub = root.derivePath("m/44'/60'/0'").neutered().toBase58();
  console.log("\nYour XPUB:");
  console.log(xpub);

  console.log("\nPaste this XPUB into your .env under BSC_XPUB=");
}

main();
