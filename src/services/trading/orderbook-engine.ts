
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { v4 as uuidv4 } from "uuid";
import type { Order } from "@/lib/types";


/**
 * Places a new limit order into the user's subcollection in Firestore.
 * @param order - The order details, excluding system-generated fields.
 * @returns The fully constructed order object that was saved.
 */
export const placeLimitOrder = async (order: Omit<Order, "id" | "createdAt" | "updatedAt" | "filledAmount" | "status">) => {
  const { firestore } = getFirebaseAdmin();
  const id = uuidv4();

  const fullOrder: Omit<Order, 'createdAt' | 'updatedAt'> & { id: string } = {
    id,
    userId: order.userId,
    marketId: order.marketId,
    side: order.side,
    type: 'LIMIT',
    price: order.price,
    quantity: order.quantity,
    filledAmount: 0,
    status: "OPEN",
  };

  const orderRef = firestore.collection('users').doc(order.userId).collection('orders').doc(id);
  
  // In a real implementation, you would lock user funds in this transaction
  await orderRef.set({
      ...fullOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
  });

  return fullOrder;
};

/**
 * Matches compatible buy and sell orders for a given market pair.
 * This function is designed to be called by a scheduled worker.
 * @param marketId - The market pair to match orders for (e.g., "ETH-USDT").
 */
export const matchOrders = async (marketId: string) => {
  const { firestore, FieldValue } = getFirebaseAdmin();
  
  // Find the highest-priced open buy order
  const buyQuery = firestore.collectionGroup("orders")
    .where("marketId", "==", marketId)
    .where("side", "==", "BUY")
    .where("status", "in", ["OPEN", "PARTIAL"])
    .orderBy("price", "desc")
    .limit(1);

  // Find the lowest-priced open sell order
  const sellQuery = firestore.collectionGroup("orders")
    .where("marketId", "==", marketId)
    .where("side", "==", "SELL")
    .where("status", "in", ["OPEN", "PARTIAL"])
    .orderBy("price", "asc")
    .limit(1);
    
  const [buySnap, sellSnap] = await Promise.all([buyQuery.get(), sellQuery.get()]);

  if (buySnap.empty || sellSnap.empty) {
      console.log(`[Matcher] No matching orders for ${marketId}.`);
      return;
  }

  const buyOrder = buySnap.docs[0].data() as Order;
  const sellOrder = sellSnap.docs[0].data() as Order;

  // If the highest bid is less than the lowest ask, there's no trade.
  if (buyOrder.price! < sellOrder.price!) {
    console.log(`[Matcher] No price overlap for ${marketId}. Highest bid: ${buyOrder.price}, aowest ask: ${sellOrder.price}`);
    return;
  }
  
  console.log(`[Matcher] Match found for ${marketId}! Price: ${sellOrder.price}`);

  // Trade occurs at the price of the older order (sell order in this logic)
  const executionPrice = sellOrder.price!;
  const availableToBuy = buyOrder.quantity - buyOrder.filledAmount;
  const availableToSell = sellOrder.quantity - sellOrder.filledAmount;
  const fillAmount = Math.min(availableToBuy, availableToSell);

  if (fillAmount <= 0) return;

  const tradeId = uuidv4();
  
  await firestore.runTransaction(async (transaction) => {
    const buyerRef = firestore.collection('users').doc(buyOrder.userId).collection('orders').doc(buyOrder.id);
    const sellerRef = firestore.collection('users').doc(sellOrder.userId).collection('orders').doc(sellOrder.id);

    // Update buy order
    const newBuyFilled = buyOrder.filledAmount + fillAmount;
    transaction.update(buyerRef, {
        filledAmount: newBuyFilled,
        status: newBuyFilled >= buyOrder.quantity ? "FILLED" : "PARTIAL",
        updatedAt: FieldValue.serverTimestamp(),
    });

    // Update sell order
    const newSellFilled = sellOrder.filledAmount + fillAmount;
    transaction.update(sellerRef, {
        filledAmount: newSellFilled,
        status: newSellFilled >= sellOrder.quantity ? "FILLED" : "PARTIAL",
        updatedAt: FieldValue.serverTimestamp(),
    });
    
    // Create a record of the trade
    const tradeRef = firestore.collection('trades').doc(tradeId);
    transaction.set(tradeRef, {
        id: tradeId,
        marketId,
        buyOrderId: buyOrder.id,
        sellOrderId: sellOrder.id,
        amount: fillAmount,
        price: executionPrice,
        total: fillAmount * executionPrice,
        createdAt: FieldValue.serverTimestamp(),
    });
    
    // Settle balances
    await settleTrade(transaction, {
        buyerId: buyOrder.userId,
        sellerId: sellOrder.userId,
        marketId,
        amount: fillAmount,
        price: executionPrice,
    });
  });
  
  console.log(`[Matcher] Trade executed: ${fillAmount} of ${marketId} at ${executionPrice}`);
};

/**
 * Updates user balances within a Firestore transaction after a trade.
 * @param transaction - The Firestore transaction object.
 * @param params - The details of the trade settlement.
 */
export const settleTrade = async (
  transaction: FirebaseFirestore.Transaction,
  params: {
    buyerId: string;
    sellerId: string;
    marketId: string;
    amount: number;
    price: number;
  }
) => {
    const { firestore, FieldValue } = getFirebaseAdmin();
    const { buyerId, sellerId, marketId, amount, price } = params;
    const [baseAsset, quoteAsset] = marketId.split("-");

    const quoteAmount = amount * price;

    const buyerBaseRef = firestore.collection('users').doc(buyerId).collection('balances').doc(baseAsset);
    const buyerQuoteRef = firestore.collection('users').doc(buyerId).collection('balances').doc(quoteAsset);
    const sellerBaseRef = firestore.collection('users').doc(sellerId).collection('balances').doc(baseAsset);
    const sellerQuoteRef = firestore.collection('users').doc(sellerId).collection('balances').doc(quoteAsset);

    // Debit buyer's quote asset (funds were locked)
    transaction.update(buyerQuoteRef, { locked: FieldValue.increment(-quoteAmount) });
    // Credit buyer's base asset
    transaction.set(buyerBaseRef, { available: FieldValue.increment(amount) }, { merge: true });

    // Debit seller's base asset (funds were locked)
    transaction.update(sellerBaseRef, { locked: FieldValue.increment(-amount) });
    // Credit seller's quote asset
    transaction.set(sellerQuoteRef, { available: FieldValue.increment(quoteAmount) }, { merge: true });
};
