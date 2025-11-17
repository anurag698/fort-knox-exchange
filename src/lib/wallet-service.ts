// src/lib/wallet-service.ts
import { ethers } from "ethers";
import Safe, { EthersAdapter } from "@safe-global/protocol-kit";
import SafeServiceClient from "@safe-global/api-kit"; // Service client

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

// Export types if needed
export default {
  initSafeClient,
  createSafeTx,
  proposeSafeTx,
  executeSafeTx,
  getPendingTransactions,
  proposeErc20Transfer,
  isSafeDeployed,
};
