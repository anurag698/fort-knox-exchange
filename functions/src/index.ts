
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { ethers } from "ethers";
import { safeSendEth, safeSendToken } from "./lib/wallet-service";

// --- Initialize Firebase Admin SDK ---
admin.initializeApp();
const db = admin.firestore();

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
        // This is a placeholder for the sweep function
        // await sweepWalletToSafe(privateKey);
        console.log(`[SWEEP] Placeholder: Would sweep from wallet of user ${userId}`);
      }
    }

  } catch (err: any) {
    console.error("[CRITICAL] Unhandled error in depositWebhook:", err.message, err.stack);
    // Do not send error response here as we've already sent 200 OK.
  }
});


export const processWithdrawals = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async () => {
    const pending = await db
      .collection("withdrawals")
      .where("status", "==", "approved")
      .limit(1)
      .get();

    if (pending.empty) return;

    const doc = pending.docs[0];
    const data = doc.data();

    const { address, amount, token } = data;

    try {
      await doc.ref.update({ status: "processing" });

      let tx;

      if (token === "ETH") {
        tx = await safeSendEth(address, amount.toString());
      } else {
        // ERC20
        tx = await safeSendToken(token, address, amount.toString());
      }

      await doc.ref.update({
        status: "completed",
        txHash: tx.hash
      });

    } catch (err) {
      await doc.ref.update({
        status: "failed",
        error: String(err)
      });
    }
  });
