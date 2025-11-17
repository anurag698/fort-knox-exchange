
import { ethers } from "ethers";
import Safe, { EthersAdapter } from "@safe-global/protocol-kit";
import { SafeAccountConfig } from "@safe-global/protocol-kit";

const RPC_URL = process.env.RPC_URL!;
const SAFE_ADDRESS = process.env.SAFE_ADDRESS!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;

if (!RPC_URL || !SAFE_ADDRESS || !PRIVATE_KEY) {
  throw new Error("Missing env variables in wallet.ts");
}

// Provider + Signer (your hot wallet)
export const provider = new ethers.JsonRpcProvider(RPC_URL);
export const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// Safe SDK instance
export const getSafe = async () => {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });

  return await Safe.create({
    ethAdapter,
    safeAddress: SAFE_ADDRESS,
  });
};

// Generate deposit wallet for user
export const createUserWallet = async (userId: string) => {
  const wallet = ethers.Wallet.createRandom();

  return {
    userId,
    address: wallet.address,
    privateKey: wallet.privateKey, // store encrypted in Firestore/KMS
  };
};

// Get deposit address (retrieved from DB in production)
export const getUserAddress = async (userWallet: any) => {
  return userWallet.address;
};

// Transfer ETH
export const sendETH = async (to: string, amountEth: string) => {
  const tx = await signer.sendTransaction({
    to,
    value: ethers.parseEther(amountEth),
  });

  return await tx.wait();
};

// Transfer ERC20 tokens
export const sendERC20 = async (tokenAddress: string, to: string, amount: string) => {
  const abi = [
    "function transfer(address to, uint256 amount) public returns (bool)",
  ];
  const contract = new ethers.Contract(tokenAddress, abi, signer);

  const tx = await contract.transfer(to, amount);
  return await tx.wait();
};

// Sweep funds from user wallet → SAFE
export const sweepToSafe = async (privateKey: string) => {
  const userWallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(userWallet.address);

  if (balance === 0n) {
    return { status: "no_funds" };
  }

  // leave small gas buffer
  const gasPrice = await provider.getGasPrice();
  const txCost = gasPrice * BigInt(21000);
  const sweepAmount = balance - txCost;

  if (sweepAmount <= 0n) {
    return { status: "not_enough_for_gas" };
  }

  const tx = await userWallet.sendTransaction({
    to: SAFE_ADDRESS,
    value: sweepAmount,
  });

  return await tx.wait();
};

// Execute transaction FROM the safe
export const safeTransferETH = async (to: string, amountEth: string) => {
  const safe = await getSafe();

  const safeTx = await safe.createTransaction({
    transactions: [
      {
        to,
        value: ethers.parseEther(amountEth).toString(),
        data: "0x",
      },
    ],
  });

  const txResponse = await safe.executeTransaction(safeTx);
  return txResponse;
};

// Auto-repair (nonce reset)
export const repairSafe = async () => {
  const safe = await getSafe();
  const nonce = await safe.getNonce();

  return { nonce };
};
