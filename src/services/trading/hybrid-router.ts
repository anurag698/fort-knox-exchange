
'use server';

import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { performMarketSwap, getDexQuote } from "./dex-aggregator";
import { placeLimitOrder, matchOrders } from "./orderbook-engine";
import { ethers } from "ethers";
import type { Order } from '@/lib/types';

/**
 * HYBRID ROUTER ENGINE
 *
 * This engine decides:
 * 1) Should an order go to the internal orderbook?
 * 2) Should it be routed to a DEX aggregator?
 * 3) Or both? (split routing - future feature)
 */

/**
 * STEP 1 — Check internal orderbook best prices
 */
export const getOrderbookTop = async (marketId: string) => {
  const { firestore } = getFirebaseAdmin();

  // Best bid (highest price a buyer is willing to pay)
  const buyQuery = firestore
    .collectionGroup("orders")
    .where("marketId", "==", marketId)
    .where("side", "==", "BUY")
    .where("status", "in", ["OPEN", "PARTIAL"])
    .orderBy("price", "desc")
    .limit(1);

  // Best ask (lowest price a seller is willing to accept)
  const sellQuery = firestore
    .collectionGroup("orders")
    .where("marketId", "==", marketId)
    .where("side", "==", "SELL")
    .where("status", "in", ["OPEN", "PARTIAL"])
    .orderBy("price", "asc")
    .limit(1);

  const [buySnap, sellSnap] = await Promise.all([buyQuery.get(), sellQuery.get()]);

  const bestBid = buySnap.empty ? null : buySnap.docs[0].data() as Order;
  const bestAsk = sellSnap.empty ? null : sellSnap.docs[0].data() as Order;

  return { bestBid, bestAsk };
};

/**
 * STEP 2 — Decide Best Route (CEX / DEX / Hybrid)
 */
export const routeOrder = async ({
  userId,
  marketId,
  side,
  quantity,
  chainId,
  fromToken,
  toToken,
}: {
  userId: string;
  marketId: string;
  side: "BUY" | "SELL";
  quantity: number;
  chainId: number;
  fromToken: string; // contract address
  toToken: string; // contract address
}) => {
  const { bestBid, bestAsk } = await getOrderbookTop(marketId);

  // BUY order logic: A buyer wants the LOWEST price.
  if (side === "BUY") {
    const internalPrice = bestAsk?.price; // Lowest sell price on our book
    const externalPrice = await getDexPrice(fromToken, toToken, quantity, chainId);

    // If internal book has sellers AND their price is better (lower) than the DEX
    if (internalPrice && internalPrice <= externalPrice) {
      console.log(`[Router] Internal route is better for BUY. Internal: ${internalPrice}, External: ${externalPrice}`);
      return await cexPlaceOrder(userId, marketId, "BUY", quantity, internalPrice);
    }
    
    // Otherwise, DEX provides a better rate or is the only option
    console.log(`[Router] External route is better for BUY. Internal: ${internalPrice}, External: ${externalPrice}`);
    return await dexRoute(userId, fromToken, toToken, quantity, chainId);
  }

  // SELL order logic: A seller wants the HIGHEST price.
  if (side === "SELL") {
    const internalPrice = bestBid?.price; // Highest buy price on our book
    const externalPrice = await getDexPrice(fromToken, toToken, quantity, chainId);

    // If internal book has buyers AND their price is better (higher) than the DEX
    if (internalPrice && internalPrice >= externalPrice) {
      console.log(`[Router] Internal route is better for SELL. Internal: ${internalPrice}, External: ${externalPrice}`);
      return await cexPlaceOrder(userId, marketId, "SELL", quantity, internalPrice);
    }
    
    // Otherwise, DEX provides a better rate or is the only option
    console.log(`[Router] External route is better for SELL. Internal: ${internalPrice}, External: ${externalPrice}`);
    return await dexRoute(userId, fromToken, toToken, quantity, chainId);
  }
};

/**
 * STEP 3 — Internal CEX Limit Order placement
 */
export const cexPlaceOrder = async (
  userId: string,
  marketId: string,
  side: "BUY" | "SELL",
  quantity: number,
  price: number
) => {
  const order = await placeLimitOrder({
    userId,
    marketId,
    side,
    price,
    quantity,
    type: 'LIMIT', // Routing a market order internally becomes a limit order at the best price
    filledAmount: 0,
    status: 'OPEN'
  });

  // Try immediate matching
  await matchOrders(marketId);

  return {
    engine: "CEX_ORDERBOOK",
    order,
  };
};

/**
 * STEP 4 — Fetch external DEX market price (quote)
 */
export const getDexPrice = async (
  fromToken: string,
  toToken: string,
  amount: number,
  chainId: number
): Promise<number> => {
  try {
    const { firestore } = getFirebaseAdmin();
    // This is simplified. In a real app, you'd fetch decimals from DB.
    const fromAssetDoc = await firestore.collection('assets').where('contractAddress', '==', fromToken).limit(1).get();
    const fromDecimals = fromAssetDoc.docs[0]?.data()?.decimals || 18;
    
    const weiAmount = ethers.parseUnits(amount.toString(), fromDecimals).toString();

    const quote = await getDexQuote({
      chainId,
      fromTokenAddress: fromToken,
      toTokenAddress: toToken,
      amount: weiAmount,
    });
    
    const toAssetDoc = await firestore.collection('assets').where('contractAddress', '==', toToken).limit(1).get();
    const toDecimals = toAssetDoc.docs[0]?.data()?.decimals || 18;

    // Calculate implied price considering decimals
    const amountIn = ethers.formatUnits(weiAmount, fromDecimals);
    const amountOut = ethers.formatUnits(quote.toAmount, toDecimals);
    
    const price = parseFloat(amountOut) / parseFloat(amountIn);
    return price;

  } catch (e) {
    console.error('[Router] Failed to get DEX price quote:', e);
    // If quote fails, return a price that makes the internal route less favorable.
    // For a buy, return a very high price. For a sell, a very low price.
    // We can simplify this to just return Infinity/0.
    return Infinity;
  }
};

/**
 * STEP 5 — Execute Swap via DEX aggregator
 */
export const dexRoute = async (
  userId: string, // Although not used for signing, it's good for logging/auditing
  fromToken: string,
  toToken: string,
  amount: number,
  chainId: number
) => {
  const { firestore } = getFirebaseAdmin();
  const hotWalletAddress = process.env.HOT_WALLET_ADDRESS;
  if (!hotWalletAddress) throw new Error("HOT_WALLET_ADDRESS not configured.");

  const fromAssetDoc = await firestore.collection('assets').where('contractAddress', '==', fromToken).limit(1).get();
  const fromDecimals = fromAssetDoc.docs[0]?.data()?.decimals || 18;
  
  const weiAmount = ethers.parseUnits(amount.toString(), fromDecimals).toString();

  const trade = await performMarketSwap({
    chainId,
    fromToken: fromToken,
    toToken: toToken,
    amount: weiAmount,
    fromAddress: hotWalletAddress,
    slippage: 1,
  });

  // Here you would add logic to reconcile the user's off-chain balance
  // after the on-chain trade is confirmed. For now, we return the trade result.
  console.log(`[Router] DEX route executed for user ${userId}. Trade:`, trade);

  return {
    engine: "DEX_AGGREGATOR",
    trade,
  };
};
