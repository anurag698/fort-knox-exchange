
import { ethers } from 'ethers';
import { getFirebaseAdmin } from './firebase-admin';

// This is a placeholder for a secure way to get your RPC provider URL.
// In production, this should come from a configuration file or environment variable.
const POLYGON_RPC_URL = 'https://polygon-rpc.com';

/**
 * Simulates a secure wallet service.
 * In a real application, this logic would live in a separate, highly secure
 * environment (like a dedicated Cloud Run instance or a hardware security module)
 * and would access private keys from a secret manager.
 *
 * For this prototype, it reads the private key from an environment variable.
 * **WARNING: This is not secure for production use.**
 */
class WalletService {
    private wallet: ethers.Wallet;
    private provider: ethers.JsonRpcProvider;
    private firestore: FirebaseFirestore.Firestore;

    constructor() {
        const privateKey = process.env.HOT_WALLET_PRIVATE_KEY;
        if (!privateKey) {
            console.warn("HOT_WALLET_PRIVATE_KEY is not set. The WalletService will not be able to sign transactions.");
            // Create a dummy wallet to avoid crashing the server
            this.wallet = ethers.Wallet.createRandom();
        } else {
            this.wallet = new ethers.Wallet(privateKey);
        }
        
        this.provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
        this.wallet = this.wallet.connect(this.provider);
        this.firestore = getFirebaseAdmin().firestore;
    }

    /**
     * Fetches a built transaction from Firestore, signs it, and broadcasts it.
     * @param dexTxId The ID of the document in the `dex_transactions` collection.
     * @returns The on-chain transaction hash.
     */
    async broadcastTransaction(dexTxId: string): Promise<string> {
        console.log(`[WalletService] Broadcasting transaction for dexTxId: ${dexTxId}`);

        const txDocRef = this.firestore.collection('dex_transactions').doc(dexTxId);
        const txDoc = await txDocRef.get();

        if (!txDoc.exists) {
            throw new Error(`[WalletService] Dex transaction document ${dexTxId} not found.`);
        }

        const txData = txDoc.data();
        if (!txData || txData.status !== 'BUILT' || !txData.oneinchPayload) {
            throw new Error(`[WalletService] Transaction ${dexTxId} is not in a broadcastable state.`);
        }

        // The payload from 1inch is already the transaction object
        const tx = txData.oneinchPayload;

        console.log('[WalletService] Signing transaction:', tx);
        
        const txResponse = await this.wallet.sendTransaction({
            to: tx.to,
            data: tx.data,
            value: tx.value,
            gasPrice: tx.gasPrice,
            gasLimit: tx.gas ? BigInt(tx.gas) + BigInt(50000) : undefined // Add a buffer to the gas limit
        });

        console.log(`[WalletService] Transaction sent. Hash: ${txResponse.hash}`);

        // Update the document with the hash and new status
        await txDocRef.update({
            status: 'BROADCASTED',
            onchainTxHash: txResponse.hash,
        });

        return txResponse.hash;
    }
}

// Singleton instance of the wallet service
const walletService = new WalletService();

// Export a function that uses the singleton, making it easier to mock in tests
export const broadcastTransaction = (dexTxId: string) => {
    return walletService.broadcastTransaction(dexTxId);
}
