
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
    private wallet?: ethers.Wallet;
    private provider: ethers.JsonRpcProvider;
    private firestore?: FirebaseFirestore.Firestore;
    private FieldValue?: any;
    private initialized = false;

    constructor() {
        // Defer heavy initialization to an explicit init method
        this.provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    }
    
    private init() {
        if (this.initialized) {
            return;
        }

        const { firestore, FieldValue } = getFirebaseAdmin();
        this.firestore = firestore;
        this.FieldValue = FieldValue;

        const privateKey = process.env.HOT_WALLET_PRIVATE_KEY;
        if (!privateKey) {
            console.warn("HOT_WALLET_PRIVATE_KEY is not set. The WalletService will not be able to sign transactions.");
            // Create a random wallet for non-signing purposes if no key is provided
            this.wallet = ethers.Wallet.createRandom(this.provider);
        } else {
            this.wallet = new ethers.Wallet(privateKey, this.provider);
        }

        this.initialized = true;
    }

    /**
     * Fetches a built transaction from Firestore, signs it, broadcasts it,
     * waits for confirmation, and reconciles the trade.
     * @param dexTxId The ID of the document in the `dex_transactions` collection.
     * @returns The on-chain transaction hash.
     */
    async broadcastAndReconcileTransaction(dexTxId: string): Promise<string> {
        this.init(); // Ensure services are initialized
        
        if (!this.firestore || !this.wallet) {
            throw new Error("WalletService not properly initialized. Check server configuration.");
        }

        console.log(`[WalletService] Broadcasting and reconciling transaction for dexTxId: ${dexTxId}`);

        const txDocRef = this.firestore.collection('dex_transactions').doc(dexTxId);

        try {
            const txDoc = await txDocRef.get();

            if (!txDoc.exists) {
                throw new Error(`[WalletService] Dex transaction document ${dexTxId} not found.`);
            }

            const txData = txDoc.data();
            if (!txData || txData.status !== 'BUILT' || !txData.oneinchPayload) {
                throw new Error(`[WalletService] Transaction ${dexTxId} is not in a broadcastable state.`);
            }
            
            const { oneinchPayload: tx, orderId } = txData;

            console.log('[WalletService] Signing transaction:', tx);
            
            const txResponse = await this.wallet.sendTransaction({
                to: tx.to,
                data: tx.data,
                value: tx.value,
                gasPrice: tx.gasPrice,
                gasLimit: tx.gas ? BigInt(tx.gas) + BigInt(50000) : undefined // Add a buffer
            });

            console.log(`[WalletService] Transaction sent. Hash: ${txResponse.hash}. Updating status to BROADCASTED.`);
            await txDocRef.update({
                status: 'BROADCASTED',
                onchainTxHash: txResponse.hash,
            });

            console.log(`[WalletService] Waiting for transaction confirmation for hash: ${txResponse.hash}`);
            const receipt = await txResponse.wait();

            if (!receipt || receipt.status !== 1) {
                throw new Error(`Transaction ${txResponse.hash} failed on-chain.`);
            }

            console.log(`[WalletService] Transaction ${txResponse.hash} confirmed. Reconciling trade...`);
            
            await this.reconcileTrade(orderId, txResponse.hash);

            await txDocRef.update({ status: 'CONFIRMED' });

            return txResponse.hash;
        } catch (error) {
            console.error(`[WalletService] Error during broadcast/reconciliation for ${dexTxId}:`, error);
            await txDocRef.update({ status: 'FAILED' });
            // In a real app, you would also need to revert the locked funds here.
            throw error; // Re-throw the error to be caught by the server action
        }
    }

    private async reconcileTrade(orderId: string, txHash: string) {
        if (!this.firestore || !this.FieldValue) throw new Error("Firestore not initialized for reconcileTrade.");

        // We need to find the user ID from the order. Since orders are now in a subcollection,
        // we must query the collection group.
        const orderQuery = this.firestore.collectionGroup('orders').where('id', '==', orderId).limit(1);
        const orderSnapshot = await orderQuery.get();

        if (orderSnapshot.empty) {
            throw new Error(`Order ${orderId} not found anywhere for reconciliation.`);
        }

        const orderDoc = orderSnapshot.docs[0];
        const orderRef = orderDoc.ref;
        
        await this.firestore.runTransaction(async (t) => {
            const orderSnap = await t.get(orderRef); // get the order again within the transaction
            if (!orderSnap.exists) throw new Error(`Order ${orderId} not found for reconciliation.`);
            
            const order = orderSnap.data()!;
            const { userId, quantity, marketId, side } = order;
            const [baseAssetId, quoteAssetId] = marketId.split('-');
            
            const srcAssetId = side === 'BUY' ? quoteAssetId : baseAssetId;
            const dstAssetId = side === 'BUY' ? baseAssetId : quoteAssetId;
            
            // This is a simplification. A real implementation would parse the tx receipt
            // to find the exact amount of dstAssetId received. Here, we assume the quoted amount.
            // For a market BUY, 'quantity' is the amount of quote asset to spend.
            // For a market SELL, 'quantity' is the amount of base asset to sell.
            const amountSpent = quantity;
            // Let's pretend we got 1:1 for simplicity; a real app needs a price or receipt data.
            const amountReceived = quantity;

            const srcBalanceRef = this.firestore!.collection('users').doc(userId).collection('balances').doc(srcAssetId);
            const dstBalanceRef = this.firestore!.collection('users').doc(userId).collection('balances').doc(dstAssetId);

            const srcBalanceSnap = await t.get(srcBalanceRef);
            if (!srcBalanceSnap.exists) throw new Error (`Source balance ${srcAssetId} not found for user ${userId}`);

            // Finalize source balance: move from locked to spent
            t.update(srcBalanceRef, {
                locked: this.FieldValue.increment(-amountSpent),
                updatedAt: this.FieldValue.serverTimestamp(),
            });
            
            // Finalize destination balance: add received amount
            t.set(dstBalanceRef, {
                available: this.FieldValue.increment(amountReceived)
            }, { merge: true });

            // Update order status
            t.update(orderRef, {
                status: 'FILLED',
                filledAmount: quantity, // Simplified
                updatedAt: this.FieldValue.serverTimestamp(),
            });

            // Create ledger entry
            const ledgerRef = this.firestore!.collection('users').doc(userId).collection('ledgerEntries').doc();
            t.set(ledgerRef, {
                id: ledgerRef.id,
                userId,
                assetId: dstAssetId,
                type: 'TRADE_SETTLEMENT',
                amount: amountReceived,
                orderId: orderId,
                description: `Market ${side} ${baseAssetId} settled.`,
                createdAt: this.FieldValue.serverTimestamp(),
            });
        });
        console.log(`[WalletService] Successfully reconciled order ${orderId}.`);
    }
}

// Singleton instance of the wallet service
let walletService: WalletService | null = null;

function getWalletService() {
    if (!walletService) {
        walletService = new WalletService();
    }
    return walletService;
}


// Export a function that uses the singleton, making it easier to mock in tests
export const broadcastAndReconcileTransaction = (dexTxId: string) => {
    return getWalletService().broadcastAndReconcileTransaction(dexTxId);
}
