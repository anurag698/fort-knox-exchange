// src/services/sweeper.ts
import { ethers } from "ethers";
import { initSafeClient } from "../lib/wallet-service";
import fetch from "node-fetch";

const HOT_WALLET_ADDRESS = process.env.HOT_WALLET_ADDRESS!;
const POLYGON_RPC = process.env.POLYGON_RPC_URL!;
const CHECK_INTERVAL_MS = 1000 * 60; // every 60s - adjust as needed

// thresholds per token contract (in token units, not wei)
const THRESHOLDS: { [tokenSymbol: string]: { address: string; minAmount: string } } = {
  USDT: { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", minAmount: "50" }, // 50 USDT on Polygon
  // add more tokens as needed
};

const erc20Abi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 value) returns (bool)"
];

const toWei = (amountStr: string, decimals: number) => {
  return ethers.parseUnits(amountStr, decimals).toString();
};

async function checkAndSweepForToken(provider: ethers.JsonRpcProvider, tokenInfo: { address: string; minAmount: string }) {
  const token = new ethers.Contract(tokenInfo.address, erc20Abi, provider);
  const decimals = await token.decimals();
  const balanceWei = await token.balanceOf(HOT_WALLET_ADDRESS);
  const balanceFloat = parseFloat(ethers.formatUnits(balanceWei, decimals));
  const thresholdFloat = parseFloat(tokenInfo.minAmount);

  if (balanceFloat >= thresholdFloat) {
    console.log(`[Sweeper] ${tokenInfo.address} balance ${balanceFloat} >= ${thresholdFloat}. Proposing sweep...`);
    // we convert thresholdFloat into wei amountToSweep = balance - keepBuffer
    const keepBuffer = ethers.parseUnits("10", decimals); // keep 10 tokens as buffer, adjust as needed
    
    if (balanceWei <= keepBuffer) {
        console.log("[Sweeper] Balance not high enough to sweep after buffer.");
        return;
    }
    
    const amountToSweepBn = balanceWei - keepBuffer;
    const amountWei = amountToSweepBn.toString();

    const signer = new ethers.Wallet(process.env.HOT_WALLET_PRIVATE_KEY!, provider);
    const tokenWithSigner = token.connect(signer) as ethers.Contract;
    
    try {
      const tx = await tokenWithSigner.transfer(process.env.SAFE_ADDRESS!, amountWei);
      console.log(`[Sweeper] Sent sweep tx hash: ${tx.hash}`);
      
      // Optionally wait for confirmation
      await tx.wait(1);
      console.log(`[Sweeper] Sweep confirmed on chain for token ${tokenInfo.address}`);
      // store tx in DB / logs
    } catch (err:any) {
      console.error("[Sweeper] error sending token transfer from hot->safe:", err.message ?? err);
      // fallback: log and alert ops.
    }
  } else {
    // console.log(`[Sweeper] ${tokenInfo.address} balance ${balanceFloat} below threshold ${thresholdFloat}`);
  }
}

export async function startSweeper() {
  console.log("[Sweeper] starting sweeper...");
  if (!POLYGON_RPC) {
    console.error("[Sweeper] POLYGON_RPC_URL is not set. Exiting.");
    return;
  }
  if (!HOT_WALLET_ADDRESS) {
      console.error("[Sweeper] HOT_WALLET_ADDRESS is not set. Exiting.");
      return;
  }
   if (!process.env.HOT_WALLET_PRIVATE_KEY) {
      console.error("[Sweeper] HOT_WALLET_PRIVATE_KEY is not set. Exiting.");
      return;
  }


  const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
  
  while (true) {
    try {
      for (const symbol of Object.keys(THRESHOLDS)) {
        const info = THRESHOLDS[symbol];
        await checkAndSweepForToken(provider, info);
      }
    } catch (e:any) {
      console.error("[Sweeper] top-level error", e.message ?? e);
    }
    await new Promise((r) => setTimeout(r, CHECK_INTERVAL_MS));
  }
}

// If you want to run it directly:
if (require.main === module) {
  require('dotenv').config({ path: '.env' });
  startSweeper().catch((e) => { console.error(e); process.exit(1); });
}