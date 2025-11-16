
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { seedInitialData } from "@/lib/seed-data";
import axios from 'axios';

type FormState = {
  status: 'success' | 'error' | 'idle';
  message: string;
  data?: any;
}

export async function seedDatabase(prevState: any, formData: FormData) {
  try {
    const { firestore, FieldValue } = getFirebaseAdmin();
    await seedInitialData(firestore, FieldValue);
    return { status: 'success', message: 'Database seeded successfully!' };
  } catch (error: any) {
    return { status: 'error', message: error.message || 'Failed to seed database.' };
  }
}


export async function updateMarketData(prevState: any, formData: FormData) {
  try {
    const { firestore, FieldValue } = getFirebaseAdmin();
    const marketsSnapshot = await firestore.collection('markets').limit(1).get();
    
    if (marketsSnapshot.empty) {
      console.log('No markets found. Seeding initial database data...');
      await seedInitialData(firestore, FieldValue);
      console.log('Database seeded successfully. Proceeding to update market data...');
    }

    const batch = firestore.batch();
    const marketDataCol = firestore.collection('market_data');

    const response = await axios.get(`https://api.binance.com/api/v3/ticker/24hr`);

    const tickers: any[] = response.data;
    const tickerMap = new Map(tickers.map(t => [t.symbol, t]));

    const allMarketsSnapshot = await firestore.collection('markets').get();

    for (const doc of allMarketsSnapshot.docs) {
      // The market ID is already in the correct format, e.g., "BTC-USDT".
      // We just need to remove the hyphen for the Binance API symbol.
      const symbol = doc.id.replace('-', '');
      const ticker = tickerMap.get(symbol);

      if (ticker) {
        const marketData = {
          id: doc.id,
          price: parseFloat(ticker.lastPrice),
          priceChangePercent: parseFloat(ticker.priceChangePercent),
          high: parseFloat(ticker.highPrice),
          low: parseFloat(ticker.lowPrice),
          volume: parseFloat(ticker.volume),
          marketCap: 0, 
          lastUpdated: FieldValue.serverTimestamp(),
        };
        const docRef = marketDataCol.doc(doc.id);
        batch.set(docRef, marketData, { merge: true });
      }
    }
    
    await batch.commit();

    revalidatePath('/markets');
    return { status: 'success', message: 'Market data updated successfully!' };

  } catch (error: any) {
    console.error("Market Data Update Error:", error);
    const errorMessage = error.response?.data?.msg || error.message || 'Failed to update market data.';
    return { status: 'error', message: errorMessage };
  }
}

