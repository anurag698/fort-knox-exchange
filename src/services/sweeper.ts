import { ethers } from "ethers";

const HOT_WALLET_PK = process.env.HOT_WALLET_PRIVATE_KEY!;
const SAFE_ADDRESS = process.env.SAFE_ADDRESS!;
const RPC = process.env.POLYGON_RPC_URL!;

const erc20abi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

const TOKENS = {
  USDT: {
    address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3356", // USDT on Polygon
    threshold: "50" // minimum amount to sweep
  },
  USDC: {
    address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC on Polygon
    threshold: "50"
  }
};

const SLEEP = (ms: number) => new Promise(res => setTimeout(res, ms));

export const startSweeper = async () => {
  console.log("[Sweeper] Starting...");

  const provider = new ethers.JsonRpcProvider(RPC);
  const signer = new ethers.Wallet(HOT_WALLET_PK, provider);

  while (true) {
    for (const symbol of Object.keys(TOKENS)) {
      const token = TOKENS[symbol as keyof typeof TOKENS];
      const contract = new ethers.Contract(token.address, erc20abi, provider);

      const decimals = await contract.decimals();
      const balance = await contract.balanceOf(await signer.getAddress());
      const balanceReadable = parseFloat(ethers.formatUnits(balance, decimals));

      console.log(`[${symbol}] Hot Wallet Balance: ${balanceReadable}`);

      if (balanceReadable >= parseFloat(token.threshold)) {
        console.log(`[Sweeper] Threshold reached for ${symbol}. Sweeping…`);

        const amountToSend = balance - ethers.parseUnits("1", decimals); // keep 1 token buffer
        const tokenSigned = contract.connect(signer);

        const tx = await (tokenSigned as any).transfer(SAFE_ADDRESS, amountToSend);

        console.log(`[Sweeper] Sweep tx sent (${symbol}): ${tx.hash}`);
        await tx.wait();
        console.log(`[Sweeper] Sweep completed (${symbol})`);
      }
    }

    await SLEEP(60000); // check every 60 seconds
  }
};

// Allow CLI run
if (require.main === module) {
  startSweeper().catch(err => console.error("[Sweeper] ERROR:", err));
}
