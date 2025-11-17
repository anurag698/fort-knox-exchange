import { ethers } from "ethers";

const HOT_KEY = process.env.HOT_WALLET_PRIVATE_KEY!;
const RPC = process.env.POLYGON_RPC_URL!;
const provider = new ethers.JsonRpcProvider(RPC);

const ERC20_ABI = [
  "function transfer(address to, uint256 value) returns (bool)",
  "function decimals() view returns (uint8)",
];

export const hotWalletWithdraw = async (
  tokenAddress: string,
  to: string,
  amount: string
) => {
  try {
    const signer = new ethers.Wallet(HOT_KEY, provider);

    // For USDT/USDC (6 decimals)
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const decimals = await contract.decimals();

    const amountWei = ethers.parseUnits(amount.toString(), decimals);

    console.log(`[HotWithdraw] Sending ${amount} tokens → ${to}`);

    const tx = await contract.transfer(to, amountWei);
    console.log(`[HotWithdraw] tx hash: ${tx.hash}`);

    await tx.wait();

    return {
      status: "SUCCESS",
      txHash: tx.hash,
    };
  } catch (err: any) {
    console.error("[HotWithdraw ERROR]", err.message || err);
    return {
      status: "ERROR",
      error: err.message,
    };
  }
};
