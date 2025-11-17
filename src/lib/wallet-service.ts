
// src/lib/wallet-service.ts
import { ethers } from "ethers";
import Safe, { EthersAdapter } from "@safe-global/protocol-kit";
import SafeServiceClient from "@safe-global/api-kit"; // Service client
import { getFirebaseAdmin } from '@/lib/firebase-admin';

// env (make sure .env has these)
const RPC_URL = process.env.POLYGON_RPC_URL!;
const SAFE_ADDRESS = process.env.SAFE_ADDRESS!;
const HOT_WALLET_PRIVATE_KEY = process.env.HOT_WALLET_PRIVATE_KEY!;

// --- Basic init ---
export const initSafeClient = async () => {
  if (!RPC_URL || !SAFE_ADDRESS || !HOT_WALLET_PRIVATE_KEY) {
    throw new Error("Missing required ENV variables (POLYGON_RPC_URL, SAFE_ADDRESS, HOT_WALLET_PRIVATE_KEY)");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(HOT_WALLET_PRIVATE_KEY, provider);

  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });

  const safeSdk = await Safe.create({
    ethAdapter,
    safeAddress: SAFE_ADDRESS,
  });

  // NOTE: use Safe Transaction Service for Polygon (official endpoint)
  const safeService = new SafeServiceClient({
    txServiceUrl: "https://safe-transaction-polygon.safe.global",
    ethAdapter,
  });

  return { provider, signer, safeSdk, safeService };
};

// --- Utility: build ERC20 transfer calldata ---
export const buildErc20TransferData = (tokenAddress: string, to: string, amountWei: string) => {
  const erc20Abi = [
    "function transfer(address to, uint256 value) returns (bool)",
    "function decimals() view returns (uint8)",
  ];
  const iface = new ethers.Interface(erc20Abi);
  return iface.encodeFunctionData("transfer", [to, amountWei]);
};

// --- Create a Safe transaction object (not proposed) ---
export const createSafeTx = async (to: string, value: string = "0", data: string = "0x") => {
  const { safeSdk } = await initSafeClient();
  const safeTransactionData = { to, value, data };
  const safeTx = await safeSdk.createTransaction({ safeTransactionData });
  return safeTx;
};

// --- Propose a Safe tx: backend signs (Owner 1) and pushes to Safe Transaction Service ---
export const proposeSafeTx = async (to: string, value: string = "0", data: string = "0x") => {
  const { safeSdk, safeService, signer } = await initSafeClient();

  const safeTx = await safeSdk.createTransaction({
    safeTransactionData: { to, value, data },
  });

  // get hash and sign it with backend (owner1)
  const safeTxHash = await safeSdk.getTransactionHash(safeTx);
  const signature = await safeSdk.signTransactionHash(safeTxHash);

  // propose to the Safe Transaction Service so UI/other signers can find it
  await safeService.proposeTransaction({
    safeAddress: SAFE_ADDRESS,
    safeTransactionData: safeTx.data,
    safeTxHash,
    senderAddress: await signer.getAddress(),
    signature: signature.data,
  });

  return { safeTxHash, safeTxData: safeTx.data };
};

// --- Execute Safe tx (once enough confirmations exist) ---
export const executeSafeTx = async (safeTxHash: string) => {
  const { safeService, safeSdk } = await initSafeClient();

  // fetch tx details from tx service
  const txDetails = await safeService.getTransaction(safeTxHash);

  // txDetails.data contains the safeTransactionData
  const safeTx = await safeSdk.createTransaction({ safeTransactionData: txDetails.data! });

  const execResult = await safeSdk.executeTransaction(safeTx);
  // return the execution tx hash on-chain
  return execResult.transactionHash ?? execResult.hash ?? execResult;
};

// --- Get pending transactions (useful for admin UI) ---
export const getPendingTransactions = async (limit = 20, offset = 0) => {
  const { safeService } = await initSafeClient();
  const resp = await safeService.getPendingTransactions(SAFE_ADDRESS, { limit, offset });
  return resp;
};

// --- Example helper: propose ERC20 transfer from Safe (token -> recipient) ---
export const proposeErc20Transfer = async (tokenAddress: string, recipient: string, amountWei: string) => {
  const data = buildErc20TransferData(tokenAddress, recipient, amountWei);
  // value=0 because ERC20 uses token transfer
  return await proposeSafeTx(tokenAddress, "0", data);
};

// --- Small utility: check if Safe is deployed on-chain (reads bytecode of address) ---
export const isSafeDeployed = async () => {
  const { provider } = await initSafeClient();
  const code = await provider.getCode(SAFE_ADDRESS);
  // if code is "0x" or "0x0" it's not deployed
  return code && code !== "0x" && code !== "0x0";
};

/**
 * Sweeps funds from the hot wallet to the Safe treasury if the balance exceeds a threshold.
 * This function is a placeholder for a full sweeper bot implementation.
 * In a real scenario, this would be triggered by a cron job.
 */
export async function sweeperBot() {
  console.log('[SWEEPER] Running sweeper bot logic...');
  const { firestore } = getFirebaseAdmin();
  const { provider, signer } = await initSafeClient();
  const hotWalletAddress = await signer.getAddress();

  // 1. Define sweep thresholds for different tokens
  const sweepThresholds = {
    'USDT': {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      threshold: 1000, // Sweep if over 1000 USDT
      decimals: 6,
    },
    'WMATIC': {
       address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
       threshold: 500, // Sweep if over 500 WMATIC
       decimals: 18,
    }
  };

  for (const [symbol, config] of Object.entries(sweepThresholds)) {
    try {
        // 2. Check hot wallet balance for the token
        const erc20 = new ethers.Contract(config.address, ['function balanceOf(address) view returns (uint256)'], provider);
        const balanceWei = await erc20.balanceOf(hotWalletAddress);
        const balance = parseFloat(ethers.formatUnits(balanceWei, config.decimals));

        console.log(`[SWEEPER] Hot wallet balance for ${symbol}: ${balance}`);

        // 3. If balance exceeds threshold, propose a sweep transaction
        if (balance > config.threshold) {
            console.log(`[SWEEPER] Threshold exceeded for ${symbol}. Proposing sweep...`);
            const amountToSweepWei = ethers.parseUnits((balance - (config.threshold * 0.95)).toString(), config.decimals);
            
            // Propose a transfer FROM the hot wallet TO the Safe
            // This is a standard ERC20 transfer, not a Safe transaction itself yet.
            // In a full implementation, you might have the hot wallet controlled by the Safe.
            // For now, we simulate proposing a transaction that would be executed by the hot wallet.
            const transferData = buildErc20TransferData(config.address, SAFE_ADDRESS, amountToSweepWei.toString());

            // Since the hot wallet is the signer, we just build and send, not propose to Safe Service.
            // For a true sweep TO the safe, it's a simple transfer.
            const tx = await signer.sendTransaction({
              to: config.address,
              data: transferData,
            });
            
            console.log(`[SWEEPER] Sweep transaction for ${symbol} sent. TxHash: ${tx.hash}`);

            // Log this action to Firestore for audit
            await firestore.collection('sweeper_log').add({
              symbol,
              amount: ethers.formatUnits(amountToSweepWei, config.decimals),
              hotWalletAddress,
              safeAddress: SAFE_ADDRESS,
              txHash: tx.hash,
              status: 'SENT',
              createdAt: new Date(),
            });
        }
    } catch (e) {
      console.error(`[SWEEPER] Error processing sweep for ${symbol}:`, e);
    }
  }

  console.log('[SWEEPER] Sweeper bot run finished.');
}


// Export types if needed
export default {
  initSafeClient,
  createSafeTx,
  proposeSafeTx,
  executeSafeTx,
  getPendingTransactions,
  proposeErc20Transfer,
  isSafeDeployed,
  sweeperBot,
};
