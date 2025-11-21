import { HDNodeWallet } from 'ethers';

/**
 * Generates a deposit address from an XPUB and index.
 * Currently supports EVM-compatible chains (BSC, ETH, etc.) using HDNodeWallet.
 * 
 * @param xpub The extended public key (xpub)
 * @param index The derivation index (account/address index)
 * @returns The generated address string
 */
export function getDepositAddress(xpub: string, index: number): string {
    try {
        // For EVM chains, we can derive from the xpub.
        // Note: ethers.js HDNodeWallet can derive from xpub.
        // Path: m/0/index (standard external chain)

        // If xpub is not provided or invalid, return a mock for dev
        if (!xpub || xpub.includes('mock')) {
            console.warn('Using mock address generation due to missing/mock XPUB');
            return `0x${'0'.repeat(36)}${index.toString(16).padStart(4, '0')}`;
        }

        const node = HDNodeWallet.fromExtendedKey(xpub);
        const child = node.deriveChild(0).deriveChild(index);
        return child.address;
    } catch (error) {
        console.error('Failed to generate deposit address:', error);
        // Fallback for safety
        return `0xErrorGeneratingAddress_${index}`;
    }
}
