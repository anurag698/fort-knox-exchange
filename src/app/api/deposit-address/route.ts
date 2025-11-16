
// diagnostic block — paste at top of src/app/api/deposit-address/route.ts
import { NextResponse } from "next/server";

(function diagEnv() {
  try {
    // boolean presence + length (not contents) for safety
    const report = {
      NODE_ENV: process.env.NODE_ENV || null,
      NEXT_PUBLIC_BASE_URL: !!process.env.NEXT_PUBLIC_BASE_URL,
      ETH_XPUB_present: !!process.env.ETH_XPUB,
      ETH_XPUB_length: process.env.ETH_XPUB ? process.env.ETH_XPUB.length : 0,
      ETH_NETWORK_RPC_present: !!process.env.ETH_NETWORK_RPC,
      FIREBASE_SERVICE_ACCOUNT_JSON_present: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      FIREBASE_SERVICE_ACCOUNT_JSON_length: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? process.env.FIREBASE_SERVICE_ACCOUNT_JSON.length : 0,
      GOOGLE_APPLICATION_CREDENTIALS_present: !!process.env.GOOGLE_APPLICATION_CREDENTIALS
    };
    // Log to server console
    console.info('[deposit-address:env-report]', JSON.stringify(report));
  } catch (e) {
    console.error('[deposit-address:env-report:error]', String(e));
  }
})();

// server-side: src/app/api/deposit-address/route.ts
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { deriveEthAddressFromXpub } from '@/lib/eth-address';
import { deriveBtcAddressFromXpub } from '@/lib/btc-address';

// Helper: standardize incoming asset key (accept asset, token, assetId)
function normalizeInput(body: any) {
  const userId = body?.userId || body?.uid || body?.user || null;
  const assetId = (body?.assetId || body?.asset || body?.token || body?.symbol || null);
  return { userId, assetId };
}


export async function POST(request: Request) {
  try {
    const { firestore, FieldValue } = getFirebaseAdmin();
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    const { userId, assetId } = normalizeInput(body);

    if (!userId || !assetId) {
      return NextResponse.json({ error: 'userId and assetId are required.' }, { status: 400 });
    }
    
    const symbol = String(assetId).toUpperCase();
    console.info('[deposit-address] request', { userId, assetId: symbol });

    const assetsCol = firestore.collection('assets');
    const assetQuery = assetsCol.where('symbol', '==', symbol).limit(1);
    const assetSnapshot = await assetQuery.get();

    if (assetSnapshot.empty) {
      return NextResponse.json({ error: `Unsupported asset: ${symbol}` }, { status: 400 });
    }

    const assetData = assetSnapshot.docs[0].data();
    console.info('[deposit-address] token metadata', assetData ? assetData : 'not found');
    
    const chainType = assetData.symbol === 'BTC' ? 'BTC' : 'ETH';

    if (chainType === 'ETH') {
        const ethXpub = process.env.ETH_XPUB;
        if (!ethXpub) {
            const errorMessage = 'ETH_XPUB environment variable is not configured on the server.';
            console.error(`[deposit-address] FATAL ERROR: ${errorMessage}`);
            return NextResponse.json({ error: 'Server Configuration Incomplete', detail: errorMessage }, { status: 500 });
        }

        const address = await firestore.runTransaction(async (tx) => {
            const addressesCol = firestore.collection('addresses');
            const existingAddressQuery = addressesCol.where('userId', '==', userId).where('coin', '==', 'ETH').limit(1);
            const existingAddrSnap = await tx.get(existingAddressQuery);

            if (!existingAddrSnap.empty) {
                return existingAddrSnap.docs[0].data().address;
            }

            const ethIndexRef = firestore.collection('addressIndexes').doc('ETH');
            const ethIdxSnap = await tx.get(ethIndexRef);
            const lastIndex = ethIdxSnap.exists ? Number(ethIdxSnap.data()?.lastIndex ?? -1) : -1;
            const newIndex = lastIndex + 1;

            const derivedAddress = deriveEthAddressFromXpub(ethXpub, newIndex);

            if (!ethIdxSnap.exists) {
                tx.set(ethIndexRef, { lastIndex: newIndex, createdAt: FieldValue.serverTimestamp() });
            } else {
                tx.update(ethIndexRef, { lastIndex: newIndex });
            }

            const newAddrRef = firestore.collection('addresses').doc(derivedAddress);
            tx.set(newAddrRef, {
                coin: 'ETH',
                userId,
                index: newIndex,
                createdAt: FieldValue.serverTimestamp(),
                used: false,
            });

            return derivedAddress;
        });

        return NextResponse.json({ address, chain: 'ETH' });
    }

    if (chainType === 'BTC') {
        const btcXpub = process.env.BTC_XPUB;
        if (!btcXpub) {
             const errorMessage = 'BTC_XPUB environment variable is not configured on the server.';
            console.error(`[deposit-address] FATAL ERROR: ${errorMessage}`);
            return NextResponse.json({ error: 'Server Configuration Incomplete', detail: errorMessage }, { status: 500 });
        }

        const address = await firestore.runTransaction(async (tx) => {
            const btcIndexRef = firestore.collection('addressIndexes').doc('BTC');
            const btcIdxSnap = await tx.get(btcIndexRef);
            const lastIndex = btcIdxSnap.exists ? Number(btcIdxSnap.data()?.lastIndex ?? -1) : -1;
            const newIndex = lastIndex + 1;

            const derivedAddress = deriveBtcAddressFromXpub(btcXpub, newIndex);

            if (!btcIdxSnap.exists) {
                tx.set(btcIndexRef, { lastIndex: newIndex, createdAt: FieldValue.serverTimestamp() });
            } else {
                tx.update(btcIndexRef, { lastIndex: newIndex });
            }
            
            const newAddrRef = firestore.collection('addresses').doc(derivedAddress);
            tx.set(newAddrRef, {
                coin: 'BTC',
                userId,
                index: newIndex,
                createdAt: FieldValue.serverTimestamp(),
                used: false,
            });

            return derivedAddress;
        });

        return NextResponse.json({ address, chain: 'BTC' });
    }

    return NextResponse.json({ error: `Unsupported chain type for asset ${symbol}` }, { status: 400 });
  } catch (err: any) {
    const errorMessage = err?.message || 'An unknown error occurred.';
    console.error("[deposit-address] FATAL ERROR:", {
      message: errorMessage,
      stack: err?.stack,
      env: {
        ETH_XPUB: !!process.env.ETH_XPUB,
        BTC_XPUB: !!process.env.BTC_XPUB,
        ETH_NETWORK_RPC: !!process.env.ETH_NETWORK_RPC,
        FIREBASE_SERVICE_ACCOUNT_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
        GOOGLE_APPLICATION_CREDENTIALS: !!process.env.GOOGLE_APPLICATION_CREDENTIALS
      }
    });

    return NextResponse.json({
      error: "Internal Server Error",
      detail: errorMessage,
    }, { status: 500 });
  }
}
