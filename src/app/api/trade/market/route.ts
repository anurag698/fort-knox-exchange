
import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { performMarketSwap } from "@/services/trading/dex-aggregator";
import { ethers } from "ethers";

export async function POST(req: Request) {
  const { firestore, FieldValue } = getFirebaseAdmin();

  try {
    const { userId, fromToken, toToken, amount, chainId = 137 } = await req.json();

    if (!userId || !fromToken || !toToken || !amount) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const hotWalletAddress = process.env.HOT_WALLET_ADDRESS;
    if (!hotWalletAddress) {
      throw new Error("HOT_WALLET_ADDRESS is not configured on the server.");
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Invalid amount specified." }, { status: 400 });
    }
    
    // Get token info from assets collection to find decimals
    const fromTokenDoc = await firestore.collection('assets').doc(fromToken).get();
    const toTokenDoc = await firestore.collection('assets').doc(toToken).get();

    if (!fromTokenDoc.exists || !toTokenDoc.exists) {
        return NextResponse.json({ error: "Invalid token specified." }, { status: 400 });
    }
    
    const fromTokenData = fromTokenDoc.data();
    const toTokenData = toTokenDoc.data();
    const fromTokenDecimals = fromTokenData?.decimals || 18;
    const toTokenDecimals = toTokenData?.decimals || 18;

    let tradeResult;
    
    await firestore.runTransaction(async (transaction) => {
        const balanceRef = firestore.collection("users").doc(userId).collection("balances").doc(fromToken);
        const balanceSnap = await transaction.get(balanceRef);
        
        if (!balanceSnap.exists) {
            throw new Error(`No balance found for ${fromToken}.`);
        }

        const userBalance = balanceSnap.data()?.available || 0;
        if (userBalance < amountNum) {
            throw new Error(`Insufficient balance. You have ${userBalance} ${fromToken}, but need ${amountNum}.`);
        }
        
        // 1. Lock user's funds
        transaction.update(balanceRef, {
            available: FieldValue.increment(-amountNum),
            locked: FieldValue.increment(amountNum)
        });

        // The on-chain swap will happen outside the transaction
    });

    try {
        // 2. Execute market swap via aggregator
        const weiAmount = ethers.parseUnits(amount.toString(), fromTokenDecimals).toString();

        tradeResult = await performMarketSwap({
            chainId,
            fromToken: fromTokenData.contractAddress,
            toToken: toTokenData.contractAddress,
            amount: weiAmount,
            fromAddress: hotWalletAddress,
            slippage: 1,
        });

        // 3. Settle balances post-trade
        const outputAmount = Number(ethers.formatUnits(tradeResult.amountOut, toTokenDecimals));

        await firestore.runTransaction(async (transaction) => {
            const fromBalanceRef = firestore.collection("users").doc(userId).collection("balances").doc(fromToken);
            const toBalanceRef = firestore.collection("users").doc(userId).collection("balances").doc(toToken);

            // Finalize 'from' token balance
            transaction.update(fromBalanceRef, {
                locked: FieldValue.increment(-amountNum)
            });
            
            // Add 'to' token balance
            transaction.set(toBalanceRef, {
                available: FieldValue.increment(outputAmount)
            }, { merge: true });
            
            // Log trade history
            const historyRef = firestore.collection("users").doc(userId).collection("tradeHistory").doc();
            transaction.set(historyRef, {
                id: historyRef.id,
                type: "market",
                fromToken,
                toToken,
                amountIn: amountNum,
                amountOut: outputAmount,
                price: tradeResult.price,
                txHash: tradeResult.txHash,
                createdAt: FieldValue.serverTimestamp(),
            });
        });

        return NextResponse.json({
            status: "success",
            trade: { ...tradeResult, amountIn: amount, amountOut: outputAmount },
        }, { status: 200 });

    } catch (tradeError: any) {
        // If trade fails, revert the balance lock
        const balanceRef = firestore.collection("users").doc(userId).collection("balances").doc(fromToken);
        await firestore.runTransaction(async (t) => {
            t.update(balanceRef, {
                locked: FieldValue.increment(-amountNum),
                available: FieldValue.increment(amountNum)
            });
        });
        throw tradeError; // Re-throw to be caught by outer catch block
    }

  } catch (err: any) {
    console.error("[MARKET ORDER API ERROR]:", err);
    return NextResponse.json(
      { error: "Market order failed", message: err.message },
      { status: 500 }
    );
  }
}
