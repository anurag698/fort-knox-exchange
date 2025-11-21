
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { DexBuildTxResponse } from '@/lib/dex/dex.types';
import { broadcastAndReconcileTransaction } from "@/lib/wallet-service";
import { lockFunds, unlockFunds } from "@/lib/azure/cosmos-balances";
import { upsertItem, queryItems } from "@/lib/azure/cosmos";
import type { Order, Asset, DexTransaction } from "@/lib/types";
import { randomUUID } from "crypto";

type FormState = {
  status: 'success' | 'error' | 'idle';
  message: string;
  data?: any;
}

const createOrderSchema = z.object({
  price: z.coerce.number().optional(),
  quantity: z.coerce.number().positive("Amount must be positive."),
  side: z.enum(['BUY', 'SELL']),
  marketId: z.string(),
  type: z.enum(['LIMIT', 'MARKET']),
  userId: z.string(),
});

export async function createMarketOrder(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = createOrderSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0] || 'Invalid data';
    return {
      status: 'error',
      message: firstError,
    };
  }

  const { quantity, side, marketId, userId } = validatedFields.data;

  if (!userId) {
    return { status: 'error', message: 'You must be logged in to place an order.' };
  }

  const [baseAssetId, quoteAssetId] = marketId.split('-');
  const orderId = randomUUID();

  try {
    const [srcToken, dstToken] = side === 'BUY'
      ? [quoteAssetId, baseAssetId]
      : [baseAssetId, quoteAssetId];

    const amountToLock = quantity;
    const assetToLock = srcToken;

    // Fetch assets from Cosmos DB
    const assets = await queryItems<Asset>('assets', 'SELECT * FROM c');
    const assetsMap = assets.reduce((acc, asset) => {
      acc[asset.id] = asset;
      return acc;
    }, {} as Record<string, Asset>);

    if (!assetsMap[srcToken] || !assetsMap[dstToken]) {
      throw new Error("Could not find token details for the market order.");
    }

    const assetData = assetsMap[srcToken];
    const decimals = assetData.decimals || 18;
    const amountInWei = (quantity * (10 ** decimals)).toString();

    // Lock funds
    try {
      await lockFunds(userId, assetToLock, amountToLock);
    } catch (error: any) {
      throw new Error(error.message || "Insufficient funds.");
    }

    // Create internal order document
    try {
      const newOrder: Order = {
        id: orderId,
        userId,
        marketId,
        side,
        type: 'MARKET',
        quantity,
        status: 'EXECUTING',
        filledAmount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await upsertItem('orders', newOrder);
    } catch (error) {
      await unlockFunds(userId, assetToLock, amountToLock);
      throw new Error("Failed to create order.");
    }

    // Execute via Fusion+ using Hot Wallet
    const { fusionOrderRouter } = await import('@/lib/1inch/fusion-router');
    const { ethers } = await import('ethers');
    const { getProvider } = await import('@/lib/wallet-service');

    const privateKey = process.env.HOT_WALLET_PRIVATE_KEY;
    if (!privateKey) throw new Error("HOT_WALLET_PRIVATE_KEY not set");

    const provider = getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);

    // Define signing function for Fusion+ router
    const signOrder = async (order: any, userAddress: string, quoteId: string) => {
      // 1inch Fusion Domain
      const domain = {
        name: "1inch Aggregation Router",
        version: "5",
        chainId: 137, // Hardcoded to Polygon for now
        verifyingContract: "0x1111111254fb6c44bAC0beD2854e76F90643097d"
      };

      // Fusion Order Types
      const types = {
        Order: [
          { name: "salt", type: "uint256" },
          { name: "makerAsset", type: "address" },
          { name: "takerAsset", type: "address" },
          { name: "maker", type: "address" },
          { name: "receiver", type: "address" },
          { name: "allowedSender", type: "address" },
          { name: "makingAmount", type: "uint256" },
          { name: "takingAmount", type: "uint256" },
          { name: "offsets", type: "uint256" },
          { name: "interactions", type: "bytes" },
        ]
      };

      const signature = await wallet.signTypedData(domain, types, order);
      // The callback return type in `fusion-router.ts` is `Promise<{ signature: string; quoteId: string }>`.
      // This seems redundant if the router handles the flow.
      // Let's check fusion-router.ts again.
      // Ah, the router passes `builtOrder.order` to `signOrder`.
      // The `quoteId` is needed for submission.
      // I should probably update `fusion-router.ts` to not require quoteId from signOrder, or just pass it through.
      // For now, I'll return an empty quoteId and let the router handle it? 
      // No, `signedOrder` needs `quoteId`.
      // The router has `quote.quoteId`.
      // Let's look at `fusion-router.ts`:
      // const { signature, quoteId } = await params.signOrder(...)
      // const signedOrder = { ..., quoteId }
      // So the router EXPECTS the signer to return the quoteId. This is a bit weird design in my router.
      // I should fix the router or just return the quoteId if I can access it.
      // But I can't access `quote` inside `signOrder` easily unless I capture it.
      // Actually, `fusionOrderRouter` *has* the quote.

      // FIX: I will pass the quoteId to the sign function in the router, or just use the one from scope.
      // But since I can't change the router right now without another tool call, I'll hack it:
      // I'll return the signature. The router uses the returned quoteId.
      // Wait, if I return a dummy quoteId, will it break?
      // The router uses: `quoteId` from the result of `signOrder`.
      // So I MUST return the correct quoteId.
      // But I don't have it here!

      // OK, I need to update `fusion-router.ts` to pass `quoteId` to `signOrder` or use the one it has.
      // This is a design flaw in my `FusionOrderRouter`.
      // I will fix `FusionOrderRouter` first.

      return { signature, quoteId: "placeholder" };
    };

    // WAIT: I should fix the router first.
    // Let's abort this replacement and fix the router.
    throw new Error("Aborting to fix router");

  } catch (serverError: any) {
    console.error("Create Market Order Error:", serverError);
    return {
      status: 'error',
      message: serverError.message || 'Failed to place market order.',
    };
  }
}


const cancelOrderSchema = z.object({
  orderId: z.string(),
  userId: z.string(),
});

export async function cancelOrder(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = cancelOrderSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: 'Invalid data.',
    };
  }

  const { orderId, userId } = validatedFields.data;

  if (!userId) {
    return { status: 'error', message: 'Authentication required.' };
  }


  try {
    // Query for the order
    const query = 'SELECT * FROM c WHERE c.id = @id AND c.userId = @userId';
    const parameters = [
      { name: '@id', value: orderId },
      { name: '@userId', value: userId }
    ];

    const orders = await queryItems<Order>('orders', query, parameters);

    if (orders.length === 0) {
      return { status: 'error', message: 'Order not found.' };
    }

    const order = orders[0];

    if (order.status !== 'OPEN' && order.status !== 'PARTIAL') {
      return {
        status: 'error',
        message: `Order cannot be cancelled in its current state: ${order.status}`
      };
    }

    // Update order status
    const updatedOrder = {
      ...order,
      status: 'CANCELED' as const,
      updatedAt: new Date().toISOString()
    };
    await upsertItem('orders', updatedOrder);

    // TODO: Unlock user's funds
    // This should unlock the amount that was locked for this order
    // For now, we'll leave funds locked until a proper unlock mechanism is implemented
    // In production, you'd want to:
    // await unlockFunds(userId, assetToUnlock, amountToUnlock);

    revalidatePath('/trade');
    return {
      status: 'success',
      message: `Order ${orderId} cancelled.`,
    };
  } catch (error: any) {
    console.error("Cancel Order Error:", error);
    return {
      status: 'error',
      message: error.message || 'Failed to cancel order.',
    };
  }
}
