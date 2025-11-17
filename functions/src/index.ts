
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { ethers } from "ethers";

// --- Initialize Firebase Admin SDK ---
admin.initializeApp();
const db = admin.firestore();

// --- Wallet Service Imports (Simplified and inlined for Cloud Function) ---
const RPC_URL = process.env.RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const SAFE_ADDRESS = process.env.SAFE_ADDRESS!;

if (!RPC_URL || !PRIVATE_KEY || !SAFE_ADDRESS) {
  console.error("CRITICAL: Missing ENV variables for wallet service.");
}

const provider = new ethers.JsonRpcProvider(RPC_URL);

// --- Core Wallet Functions for the Webhook ---

/**
 * Sweeps all ETH from a user's deposit wallet to the main SAFE treasury.
 * @param privateKey The private key of the deposit wallet to sweep.
 * @returns A promise that resolves with the transaction receipt or a status object.
 */
const sweepWalletToSafe = async (privateKey: string) => {
  if (!PRIVATE_KEY) {
      console.error("[SWEEP] Hot wallet private key is not configured.");
      return { status: "error", message: "Hot wallet not configured." };
  }
  const userWallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(userWallet.address);

  if (balance <= 0n) {
    console.log(`[SWEEP] No balance to sweep for address ${userWallet.address}`);
    return { status: "empty" };
  }

  const gasPrice = (await provider.getFeeData()).gasPrice;
  if(!gasPrice) {
    console.error("[SWEEP] Could not fetch gas price.");
    return { status: "error", message: "Could not fetch gas price." };
  }
  const gasLimit = 21000n;
  const fee = gasPrice * gasLimit;

  if (balance <= fee) {
    console.warn(`[SWEEP] Insufficient balance for gas fee. Address: ${userWallet.address}, Balance: ${balance}, Fee: ${fee}`);
    return { status: "insufficient_for_gas" };
  }

  const sweepAmount = balance - fee;

  try {
    const tx = await userWallet.sendTransaction({
      to: SAFE_ADDRESS,
      value: sweepAmount,
    });
    console.log(`[SWEEP] Sweeping ${ethers.formatEther(sweepAmount)} ETH from ${userWallet.address} to SAFE. Tx: ${tx.hash}`);
    return await tx.wait();
  } catch (error) {
    console.error(`[SWEEP] Failed to sweep wallet ${userWallet.address}:`, error);
    return { status: "error", message: "Sweep transaction failed." };
  }
};


// --- The Firebase Cloud Function for Webhooks ---

export const depositWebhook = functions.https.onRequest(async (req, res) => {
  // Respond quickly to the webhook provider
  res.status(200).json({ success: true, message: "Webhook received and processing initiated." });

  try {
    const body = req.body;
    const events = body?.data ?? [];

    if (!Array.isArray(events) || events.length === 0) {
      console.log("Webhook received with no valid events.");
      return;
    }

    for (const event of events) {
      const to = event?.to?.toLowerCase();
      const value = event?.value;
      const tokenAddress = event?.contractAddress?.toLowerCase() ?? "eth"; // 'eth' for native currency

      if (!to || !value) {
          console.log("Skipping event with missing 'to' or 'value'.", event);
          continue;
      }
      
      console.log(`Processing deposit: To=${to}, Value=${value}, Token=${tokenAddress}`);

      // 1. Find the user by their deposit wallet address
      const walletQuery = await db
        .collectionGroup("wallet")
        .where("address", "==", to)
        .limit(1)
        .get();

      if (walletQuery.empty) {
        console.warn(`[DEPOSIT] Deposit received for an unknown address: ${to}. No user found.`);
        continue; // Skip to the next event
      }

      const userWalletDoc = walletQuery.docs[0];
      const userWalletData = userWalletDoc.data();
      const userId = userWalletDoc.ref.parent.parent?.id;

      if (!userId) {
          console.error(`[DEPOSIT] Could not determine userId for wallet doc: ${userWalletDoc.ref.path}`);
          continue;
      }
      
      // IMPORTANT: In a real app, the private key MUST be stored encrypted (e.g., using Google KMS)
      // and decrypted here just before use.
      const privateKey = userWalletData.encryptedKey;
      if (!privateKey) {
          console.error(`[DEPOSIT] Missing private key for user ${userId}. Cannot sweep.`);
          // Still credit balance, but log error for manual intervention.
      }
      
      const isNativeEth = tokenAddress === 'eth';
      const assetId = isNativeEth ? 'ETH' : tokenAddress; // Normalize asset ID

      // 2. Credit User's Balance in Firestore
      const amount = ethers.formatUnits(value, isNativeEth ? 18 : 6); // Assuming 18 for ETH, 6 for ERC20s like USDC/USDT
      const balanceRef = db.collection("users").doc(userId).collection("balances").doc(assetId);
      
      await db.runTransaction(async (transaction) => {
          const balanceDoc = await transaction.get(balanceRef);
          const currentBalance = balanceDoc.exists ? balanceDoc.data()?.available || 0 : 0;
          const newBalance = currentBalance + parseFloat(amount);
          
          transaction.set(balanceRef, {
              available: newBalance,
              lastDepositAt: new Date(),
              assetId: assetId,
          }, { merge: true });
      });

      console.log(`[DEPOSIT] Credited ${amount} ${assetId} to user ${userId}.`);

      // 3. Auto-sweep funds from the deposit wallet to the Safe treasury
      if (privateKey && isNativeEth) { // Only sweep native ETH for now
        await sweepWalletToSafe(privateKey);
      }
    }

  } catch (err: any) {
    console.error("[CRITICAL] Unhandled error in depositWebhook:", err.message, err.stack);
    // Do not send error response here as we've already sent 200 OK.
  }
});
