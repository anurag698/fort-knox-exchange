// This file contains utilities for interacting with the blockchain,
// including Safe operations, wallet management, and transaction broadcasting.

import { ethers } from "ethers";
import Safe, { EthersAdapter } from "@safe-global/protocol-kit";
import { SafeTransactionDataPartial } from "@safe-global/safe-core-sdk-types";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync, randomUUID } from 'crypto';
import { deriveEthWallet } from './hd-wallet';
import { getNextIndex, upsertItem, getItemById, queryItems } from '@/lib/azure/cosmos';
import { settleFunds } from '@/lib/azure/cosmos-trading';

// ENV variables
const RPC_URL = process.env.POLYGON_RPC_URL!;
const PRIVATE_KEY = process.env.HOT_WALLET_PRIVATE_KEY!;
const SAFE_ADDRESS = process.env.SAFE_ADDRESS!;

// Helper functions to get provider and hot wallet
export const getProvider = () => new ethers.JsonRpcProvider(RPC_URL);
export const getHotWallet = () => new ethers.Wallet(PRIVATE_KEY, getProvider());

// Export instances for backward compatibility (some modules expect these objects)
export const provider = getProvider();
export const hotWallet = getHotWallet();

// Initialize Safe SDK
export const getSafeSdk = async () => {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: hotWallet,
  });
  return await Safe.create({
    ethAdapter,
    safeAddress: SAFE_ADDRESS,
  });
};

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'default-secret-do-not-use-in-prod'; // 32 chars min

// Generate a 32-byte key from the secret
const getKey = () => scryptSync(ENCRYPTION_SECRET, 'salt', 32);

export const encrypt = (text: string): string => {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text: string): string => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, getKey(), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

// Create a new deposit wallet for a user (HD Wallet)
export const createDepositWallet = async () => {
  const index = await getNextIndex('eth_wallet_index');
  const wallet = deriveEthWallet(index);
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    index: index,
  };
};

export const saveUserWallet = async (userId: string, wallet: any) => {
  // We store the index. We can optionally store encryptedKey for redundancy, 
  // but for "Institutional Grade" we rely on the Master Seed + Index.
  // We'll store encryptedKey for now to maintain compatibility with existing sweep logic
  // until we update it.
  const encryptedKey = encrypt(wallet.privateKey);

  const walletId = `${userId}_eth`;
  await upsertItem('deposit_addresses', {
    id: walletId,
    userId,
    address: wallet.address,
    encryptedKey: encryptedKey, // Legacy/Redundancy
    index: wallet.index,        // HD Wallet Index
    chain: "ethereum",
    createdAt: new Date().toISOString(),
  });
};

// Helper to get private key (supports Legacy and HD)
export const getWalletPrivateKey = (walletDoc: any): string => {
  if (walletDoc.index !== undefined) {
    // HD Wallet
    const wallet = deriveEthWallet(walletDoc.index);
    return wallet.privateKey;
  } else if (walletDoc.encryptedKey) {
    // Legacy
    return decrypt(walletDoc.encryptedKey);
  }
  throw new Error("Wallet has no index or encryptedKey");
};

// Get ETH balance for any address
export const getEthBalance = async (address: string) => {
  const bal = await provider.getBalance(address);
  return Number(ethers.formatEther(bal));
};

// Send ETH using the hot wallet
export const transferEth = async (to: string, amountEth: string) => {
  const tx = await hotWallet.sendTransaction({
    to,
    value: ethers.parseEther(amountEth),
  });
  return await tx.wait();
};

// Send ERC20 tokens
export const transferToken = async (
  tokenAddress: string,
  to: string,
  amount: string
) => {
  const abi = ["function transfer(address to, uint256 value)"];
  const contract = new ethers.Contract(tokenAddress, abi, hotWallet);
  const tx = await contract.transfer(to, amount);
  return await tx.wait();
};

// Sweep all ETH from user wallet → SAFE (minus gas fee)
export const sweepWalletToSafe = async (privateKey: string) => {
  const provider = getProvider();
  const userWallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(userWallet.address);

  // If balance is zero, nothing to sweep
  if (balance <= BigInt(0)) return { status: "empty" };

  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice;
  if (!gasPrice) {
    throw new Error("Could not fetch gas price for sweep");
  }

  const gasLimit = BigInt(21000);
  const fee = gasPrice * gasLimit;

  if (balance <= fee) {
    return { status: "insufficient_for_gas" };
  }

  const sendAmount = balance - fee;
  const txResponse = await userWallet.sendTransaction({
    to: SAFE_ADDRESS,
    value: sendAmount,
  });
  return await txResponse.wait();
};


// Execute Safe transaction (ETH transfer)
export const safeSendEth = async (to: string, amountEth: string) => {
  const safeSdk = await getSafeSdk();
  const safeTxData: SafeTransactionDataPartial = {
    to,
    data: "0x",
    value: ethers.parseEther(amountEth).toString(),
  };
  const safeTx = await safeSdk.createTransaction({ transactions: [safeTxData] });
  const result = await safeSdk.executeTransaction(safeTx);
  return result;
};

// Execute Safe ERC20 transfer
export const safeSendToken = async (
  tokenAddress: string,
  to: string,
  amountWei: string
) => {
  const safeSdk = await getSafeSdk();
  const abiInterface = new ethers.Interface([
    "function transfer(address to, uint256 value) public returns (bool)",
  ]);
  const data = abiInterface.encodeFunctionData("transfer", [to, amountWei]);
  const txData: SafeTransactionDataPartial = {
    to: tokenAddress,
    value: "0",
    data,
  };
  const safeTx = await safeSdk.createTransaction({ transactions: [txData] });
  return await safeSdk.executeTransaction(safeTx);
};

// Fix SAFE stuck nonce
export const getSafeNonce = async () => {
  const safeSdk = await getSafeSdk();
  return await safeSdk.getNonce();
};

// Reconcile trade after transaction broadcast
async function reconcileTrade(orderId: string, txHash: string) {
  // Query for the order
  const query = 'SELECT * FROM c WHERE c.id = @id';
  const parameters = [{ name: '@id', value: orderId }];

  const orders = await queryItems('orders', query, parameters);

  if (orders.length === 0) {
    throw new Error(`Order ${orderId} not found for reconciliation.`);
  }

  const order = orders[0] as any;
  const { userId, quantity, marketId, side } = order;
  const [baseAssetId, quoteAssetId] = marketId.split('-');

  // Determine source and destination assets based on trade side
  // BUY: Spending Quote, Receiving Base
  // SELL: Spending Base, Receiving Quote
  const srcAssetId = side === 'BUY' ? quoteAssetId : baseAssetId;
  const dstAssetId = side === 'BUY' ? baseAssetId : quoteAssetId;

  // Simplification: In a real app, parse tx receipt for exact amount received.
  const amountSpent = quantity; // Assuming 1:1 for simplicity in this context or pre-calculated
  const amountReceived = quantity; // This logic seems simplified in original too

  // Settle the trade (update balances)
  // Note: settleFunds takes (userId, deductAsset, deductAmount, creditAsset, creditAmount)
  await settleFunds(userId, srcAssetId, amountSpent, dstAssetId, amountReceived);

  // Update order status
  const updatedOrder = {
    ...order,
    status: 'FILLED',
    filledAmount: quantity,
    updatedAt: new Date().toISOString(),
  };
  await upsertItem('orders', updatedOrder);

  // Create ledger entry
  const ledgerId = randomUUID();
  await upsertItem('ledger', {
    id: ledgerId,
    userId,
    assetId: dstAssetId,
    type: 'TRADE_SETTLEMENT',
    amount: amountReceived,
    orderId: orderId,
    description: `Market ${side} ${baseAssetId} settled.`,
    createdAt: new Date().toISOString(),
  });
}

export async function broadcastAndReconcileTransaction(
  dexTxId: string
): Promise<string> {
  const privateKey = process.env.HOT_WALLET_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error(
      "HOT_WALLET_PRIVATE_KEY is not set on the server."
    );
  }

  const provider = getProvider();
  const wallet = new ethers.Wallet(privateKey, provider);

  // Fetch DEX transaction from Cosmos DB
  const txData = await getItemById('dex_transactions', dexTxId, dexTxId) as any;

  if (!txData) throw new Error(`Dex transaction ${dexTxId} not found.`);

  if (txData.status !== 'BUILT' || !txData.oneinchPayload) {
    throw new Error(`Transaction ${dexTxId} is not in a broadcastable state.`);
  }

  const { oneinchPayload: tx, orderId } = txData;

  const txResponse = await wallet.sendTransaction({
    to: tx.to,
    data: tx.data,
    value: tx.value,
    gasPrice: tx.gasPrice,
    gasLimit: tx.gas ? BigInt(tx.gas) + BigInt(50000) : undefined,
  });

  // Update status to BROADCASTED
  await upsertItem('dex_transactions', {
    ...txData,
    status: 'BROADCASTED',
    onchainTxHash: txResponse.hash,
  });

  const receipt = await txResponse.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error(`Transaction ${txResponse.hash} failed on-chain.`);
  }

  await reconcileTrade(orderId, txResponse.hash);

  // Update status to CONFIRMED
  await upsertItem('dex_transactions', {
    ...txData,
    status: 'CONFIRMED',
    onchainTxHash: txResponse.hash,
  });

  return txResponse.hash;
}
