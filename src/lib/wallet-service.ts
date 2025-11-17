import { ethers } from "ethers";
import Safe, { EthersAdapter } from "@safe-global/protocol-kit";
import { SafeTransactionDataPartial } from "@safe-global/safe-core-sdk-types";
import { getFirebaseAdmin } from "@/lib/firebase-admin";


// ENV
const RPC_URL = process.env.RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const SAFE_ADDRESS = process.env.SAFE_ADDRESS!;

if (!RPC_URL || !PRIVATE_KEY || !SAFE_ADDRESS) {
  throw new Error("Missing ENV variables in wallet-service.ts");
}

// Provider + Hot Wallet Signer
export const provider = new ethers.JsonRpcProvider(RPC_URL);
export const hotWallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Init SAFE
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

// Create a new deposit wallet for a user
export const createDepositWallet = () => {
  const wallet = ethers.Wallet.createRandom();

  return {
    address: wallet.address,
    privateKey: wallet.privateKey, // store encrypted (NOT raw)
  };
};

export const saveUserWallet = async (userId: string, wallet: any) => {
  const { firestore } = getFirebaseAdmin()!;
  await firestore.collection("users").doc(userId).collection("wallet").doc("eth").set({
    address: wallet.address,
    encryptedKey: wallet.privateKey, // later use encryption/KMS
    createdAt: new Date(),
    chain: "ethereum",
  });
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
  const userWallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(userWallet.address);

  if (balance <= 0n) return { status: "empty" };

  const gasPrice = await provider.getGasPrice();
  const gasLimit = 21000n;
  const fee = gasPrice * gasLimit;

  if (balance <= fee) {
    return { status: "insufficient_for_gas" };
  }

  const sendAmount = balance - fee;

  const tx = await userWallet.sendTransaction({
    to: SAFE_ADDRESS,
    value: sendAmount,
  });

  return await tx.wait();
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
