
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { ethers, JsonRpcProvider } from 'ethers';
import Safe, { EthersAdapter, SafeFactory } from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';
import type { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types';

const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
const SAFE_TX_SERVICE_URL = 'https://safe-transaction-polygon.safe.global';

// The address of the Gnosis Safe Multisig treasury on Polygon
export const SAFE_TREASURY_ADDRESS = process.env.SAFE_ADDRESS!;

/**
 * Initializes the required SDKs for interacting with the Gnosis Safe.
 * This is a server-side function and requires a hot wallet private key.
 * @returns An object containing the initialized SDKs and the signer.
 */
export async function initSafeClient() {
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

  return { protocolKit, safeService, signer };
}

/**
 * Creates a Safe transaction (but do not sign or propose)
 * @param to - The destination address.
 * @param value - The value to send (in wei).
 * @param data - The transaction data.
 * @returns The created Safe transaction object.
 */
export const createSafeTx = async (
  to: string,
  value: string = "0",
  data: string = "0x"
) => {
  const { protocolKit } = await initSafeClient();

  const safeTransactionData = { to, value, data };
  const safeTx = await protocolKit.createTransaction({ safeTransactionData });

  return safeTx;
};


/**
 * Proposes a Safe transaction to the Gnosis Safe service.
 * The backend's hot wallet will sign as the first owner.
 * @param to - The destination address.
 * @param value - The value to send (in wei).
 * @param data - The transaction data.
 * @returns The Safe transaction hash of the created proposal.
 */
export const proposeSafeTx = async (
  to: string,
  value: string = "0",
  data: string = "0x"
) => {
  const { protocolKit, safeService, signer } = await initSafeClient();

  const safeTx = await protocolKit.createTransaction({
    safeTransactionData: { to, value, data }
  });

  const safeTxHash = await protocolKit.getTransactionHash(safeTx);
  const signature = await protocolKit.signTransactionHash(safeTxHash);

  await safeService.proposeTransaction({
    safeAddress: SAFE_TREASURY_ADDRESS,
    safeTransactionData: safeTx.data,
    safeTxHash,
    senderAddress: await signer.getAddress(),
    signature: signature.data,
  });

  return safeTxHash;
};

/**
 * Executes a confirmed Gnosis Safe transaction.
 * @param safeTxHash - The hash of the transaction to execute.
 * @returns The transaction receipt hash.
 */
export const executeSafeTx = async (safeTxHash: string) => {
  const { safeService, protocolKit } = await initSafeClient();

  const txDetails = await safeService.getTransaction(safeTxHash);
  const isReady = await protocolKit.isTransactionReady(txDetails);

  if (isReady) {
    const exec = await protocolKit.executeTransaction(txDetails);
    const receipt = await exec.transactionResponse?.wait();
    return receipt?.hash;
  } else {
    throw new Error('Transaction is not ready to be executed. More signatures are required.');
  }
};


/**
 * Fetches pending transactions from the Gnosis Safe transaction service.
 * @returns A list of pending transactions.
 */
export async function getPendingSafeTransactions() {
  const { safeService } = await initSafeClient();
  const pendingTxs = await safeService.getPendingTransactions(
    SAFE_TREASURY_ADDRESS
  );
  return pendingTxs.results;
}


/**
 * Sweeps funds from a hot wallet to the Safe treasury if the balance exceeds a threshold.
 * This is a placeholder for the full sweeper bot logic.
 */
export async function sweeperBot() {
  console.log('Running sweeper bot logic...');
  const { signer } = await initSafeClient();
  const hotWalletAddress = await signer.getAddress();
  
  // In a real implementation, you would check balances of various ERC20 tokens.
  // For this example, we'll just check the native token (MATIC) balance.
  const balance = await signer.provider.getBalance(hotWalletAddress);
  
  // Set a threshold (e.g., 100 MATIC).
  const threshold = ethers.parseUnits("100", "ether");
  
  if (balance > threshold) {
    // If balance exceeds threshold, sweep the excess amount.
    const amountToSweep = balance - threshold;
    console.log(`Hot wallet balance ${ethers.formatEther(balance)} MATIC exceeds threshold. Sweeping ${ethers.formatEther(amountToSweep)} MATIC to treasury.`);
    
    try {
      const safeTxHash = await proposeSafeTx(
        SAFE_TREASURY_ADDRESS,
        amountToSweep.toString()
      );
      console.log(`Proposed sweep transaction to Safe. Tx Hash: ${safeTxHash}`);
      
      // You could store this hash in Firestore to track its status.
      const { firestore } = getFirebaseAdmin();
      await firestore.collection('sweeper_log').add({
        proposedAt: new Date(),
        amount: ethers.formatEther(amountToSweep),
        asset: 'MATIC',
        safeTxHash,
        status: 'PROPOSED'
      });

    } catch (error) {
      console.error("Failed to propose sweep transaction:", error);
    }
  } else {
    console.log(`Hot wallet balance ${ethers.formatEther(balance)} MATIC is below sweep threshold.`);
  }

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
  const { signer } = await initSafeClient();

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

    const txResponse = await signer.sendTransaction({
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
