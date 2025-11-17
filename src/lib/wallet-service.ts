
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { ethers, JsonRpcProvider } from 'ethers';
import Safe, { EthersAdapter, SafeFactory } from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';
import type { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types';

const POLYGON_RPC_URL = process.env.BSC_RPC_URL || 'https://polygon-rpc.com';
const SAFE_TX_SERVICE_URL = 'https://safe-transaction-polygon.safe.global';

// The address of the Gnosis Safe Multisig treasury on Polygon
export const SAFE_TREASURY_ADDRESS = '0xAfD446a25f06D306656CAc1A857dEA397886Bd7c';

/**
 * Initializes the required SDKs for interacting with the Gnosis Safe.
 * This is a server-side function and requires a hot wallet private key.
 * @returns An object containing the initialized SDKs and the signer address.
 */
async function getSafeSDK() {
  const provider = new JsonRpcProvider(POLYGON_RPC_URL);
  const privateKey = process.env.HOT_WALLET_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('HOT_WALLET_PRIVATE_KEY environment variable is not set.');
  }

  const signer = new ethers.Wallet(privateKey, provider);
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });

  const safeService = new SafeApiKit({
    txServiceUrl: SAFE_TX_SERVICE_URL,
    ethAdapter,
  });

  const protocolKit = await Safe.create({
    ethAdapter,
    safeAddress: SAFE_TREASURY_ADDRESS,
  });

  return { protocolKit, safeService, signerAddress: signer.address };
}

/**
 * Creates a Safe transaction proposal for a given set of transactions.
 * @param safeTransactionData - An array of transactions to be included in the proposal.
 * @returns The Safe transaction hash of the created proposal.
 */
export async function createSafeTransaction(
  safeTransactionData: SafeTransactionDataPartial[]
) {
  const { protocolKit, safeService, signerAddress } = await getSafeSDK();

  const safeTransaction = await protocolKit.createTransaction({
    safeTransactionData,
  });
  const safeTxHash = await protocolKit.getTransactionHash(safeTransaction);
  const senderSignature = await protocolKit.signHash(safeTxHash);

  await safeService.proposeTransaction({
    safeAddress: SAFE_TREASURY_ADDRESS,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: signerAddress,
    senderSignature: senderSignature.data,
  });

  return safeTxHash;
}

/**
 * Fetches pending transactions from the Gnosis Safe transaction service.
 * @returns A list of pending transactions.
 */
export async function getPendingSafeTransactions() {
  const { safeService } = await getSafeSDK();
  const pendingTxs = await safeService.getPendingTransactions(
    SAFE_TREASURY_ADDRESS
  );
  return pendingTxs.results;
}

/**
 * Executes a confirmed Gnosis Safe transaction.
 * @param safeTxHash - The hash of the transaction to execute.
 * @returns The transaction receipt.
 */
export async function executeSafeTransaction(safeTxHash: string) {
  const { protocolKit, safeService } = await getSafeSDK();
  const safeTransaction = await safeService.getTransaction(safeTxHash);
  const isReady = await protocolKit.isTransactionReady(safeTransaction);

  if (isReady) {
    const txResponse = await protocolKit.executeTransaction(safeTransaction);
    const receipt = await txResponse.transactionResponse?.wait();
    return receipt;
  } else {
    throw new Error('Transaction is not ready to be executed.');
  }
}

/**
 * Sweeps funds from a hot wallet to the Safe treasury if the balance exceeds a threshold.
 * This is a placeholder for the full sweeper bot logic.
 */
export async function sweeperBot() {
  console.log('Running sweeper bot logic...');
  // In a real implementation:
  // 1. Get hot wallet balance for various tokens.
  // 2. If balance > threshold, create a transfer transaction.
  // 3. Call createSafeTransaction() to propose the sweep.
  const { firestore } = getFirebaseAdmin();
  // Example: sweep 10 USDT if hot wallet has > 100
  // const usdtAddress = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
  // const sweepTx = { to: usdtAddress, value: '0', data: '...transferData' };
  // await createSafeTransaction([sweepTx]);
  console.log('Sweeper bot finished.');
}

/**
 * This function is responsible for finalizing a trade on-chain by broadcasting the transaction
 * and reconciling the state in Firestore.
 * @param dexTxId - The ID of the dex_transaction document in Firestore.
 * @returns The on-chain transaction hash.
 */
export async function broadcastAndReconcileTransaction(
  dexTxId: string
): Promise<string> {
  const { firestore } = getFirebaseAdmin();
  const privateKey = process.env.HOT_WALLET_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('HOT_WALLET_PRIVATE_KEY is not set on the server.');
  }

  const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);

  const txDocRef = firestore.collection('dex_transactions').doc(dexTxId);

  try {
    const txDoc = await txDocRef.get();
    if (!txDoc.exists)
      throw new Error(`Dex transaction ${dexTxId} not found.`);

    const txData = txDoc.data();
    if (!txData || txData.status !== 'BUILT' || !txData.oneinchPayload) {
      throw new Error(
        `Transaction ${dexTxId} is not in a broadcastable state.`
      );
    }

    const { oneinchPayload: tx, orderId } = txData;

    const txResponse = await wallet.sendTransaction({
      to: tx.to,
      data: tx.data,
      value: tx.value,
      gasPrice: tx.gasPrice,
      gasLimit: tx.gas ? BigInt(tx.gas) + BigInt(50000) : undefined,
    });

    await txDocRef.update({
      status: 'BROADCASTED',
      onchainTxHash: txResponse.hash,
    });

    const receipt = await txResponse.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error(`Transaction ${txResponse.hash} failed on-chain.`);
    }

    // In a real scenario, this would involve more complex logic
    // to reconcile balances based on the exact trade outcome.
    await txDocRef.update({ status: 'CONFIRMED' });
    await firestore
      .collectionGroup('orders')
      .where('id', '==', orderId)
      .limit(1)
      .get()
      .then(snapshot => {
        if (!snapshot.empty) {
          snapshot.docs[0].ref.update({ status: 'FILLED' });
        }
      });

    return txResponse.hash;
  } catch (error) {
    console.error(`[WalletService] Error for ${dexTxId}:`, error);
    await txDocRef.update({ status: 'FAILED' });
    throw error;
  }
}
