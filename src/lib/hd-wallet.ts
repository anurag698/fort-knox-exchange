import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import * as bip32 from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';

// Initialize BIP32
const bip32Factory = bip32.BIP32Factory(ecc);

// Environment variables
const MNEMONIC = process.env.HD_WALLET_MNEMONIC;

if (!MNEMONIC && process.env.NODE_ENV === 'production') {
    console.warn('WARNING: HD_WALLET_MNEMONIC is not set. HD Wallet features will fail.');
}

/**
 * Validate Mnemonic
 */
export const validateMnemonic = (mnemonic: string): boolean => {
    return bip39.validateMnemonic(mnemonic);
};

/**
 * Generate a new random mnemonic (for setup only)
 */
export const generateMnemonic = (): string => {
    return bip39.generateMnemonic(256); // 24 words
};

/**
 * Derive ETH Wallet at specific index
 * Path: m/44'/60'/0'/0/index
 */
export const deriveEthWallet = (index: number, mnemonic = MNEMONIC) => {
    if (!mnemonic) throw new Error('HD_WALLET_MNEMONIC is required');

    // Ethers v6 HDNodeWallet
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
    const path = `m/44'/60'/0'/0/${index}`;
    const child = hdNode.derivePath(path);

    return {
        address: child.address,
        privateKey: child.privateKey,
        path
    };
};

/**
 * Derive BTC Wallet (Segwit P2WPKH) at specific index
 * Path: m/84'/0'/0'/0/index (BIP84 for Native Segwit)
 * Or m/44'/0'/0'/0/index (Legacy) - We'll use Segwit (Bech32)
 */
export const deriveBtcWallet = (index: number, mnemonic = MNEMONIC, network = bitcoin.networks.bitcoin) => {
    if (!mnemonic) throw new Error('HD_WALLET_MNEMONIC is required');

    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const root = bip32Factory.fromSeed(seed);

    // BIP84: m / 84' / 0' / 0' / 0 / index
    const path = `m/84'/0'/0'/0/${index}`;
    const child = root.derivePath(path);

    const { address } = bitcoin.payments.p2wpkh({
        pubkey: child.publicKey,
        network
    });

    if (!address) throw new Error('Failed to generate BTC address');

    return {
        address,
        privateKey: child.toWIF(),
        path
    };
};
