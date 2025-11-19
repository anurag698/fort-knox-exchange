
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
// Removed firebase-admin imports as they should not be in client-facing actions.
import axios from 'axios';

type FormState = {
  status: 'success' | 'error' | 'idle';
  message: string;
  data?: any;
}

// These functions now call internal API routes instead of using the Admin SDK directly.
export async function seedDatabase(prevState: any, formData: FormData): Promise<FormState> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/seed-database`, { method: 'POST' });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to seed database.');
    }
    return { status: 'success', message: 'Database seeded successfully!' };
  } catch (error: any) {
    return { status: 'error', message: error.message || 'Failed to seed database.' };
  }
}

export async function updateMarketData(prevState: any, formData: FormData): Promise<FormState> {
  try {
     const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/update-market-data`, { method: 'POST' });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update market data.');
    }
    revalidatePath('/markets');
    return { status: 'success', message: 'Market data updated successfully!' };
  } catch (error: any) {
    return { status: 'error', message: error.message || 'Failed to update market data.' };
  }
}

const updateUserProfileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long."),
  userId: z.string(),
});

export async function updateUserProfile(prevState: any, formData: FormData) {
  const validatedFields = updateUserProfileSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: 'Invalid data.',
    };
  }
  
  const { username, userId } = validatedFields.data;

  try {
     const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/user/update-profile`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, username })
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update profile.');
    }
    revalidatePath('/settings');
    return {
      status: 'success',
      message: `Username updated successfully.`,
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Failed to update profile.',
    };
  }
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
        return { status: 'error', message: firstError };
    }
    
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/trade/market`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validatedFields.data),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to place market order.');
        }
        
        const result = await res.json();
        
        revalidatePath('/trade');
        return {
            status: 'success',
            message: `Market ${result.trade.side} order executed. TxHash: ${result.trade.txHash.slice(0,10)}...`,
        };

    } catch (serverError: any) {
        return { status: 'error', message: serverError.message || 'Failed to place market order.' };
    }
}
