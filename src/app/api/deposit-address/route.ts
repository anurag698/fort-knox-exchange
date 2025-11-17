// src/app/api/deposit-address/route.ts
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { deriveAddressFromXpub, isValidBSCAddress } from '@/lib/wallet';

const BSC_XPUB = process.env.BSC_XPUB;
const BSC_DERIVATION_BASE = process.env.BSC_DERIVATION_BASE || "m/44'/60'/0'";

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 5;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(uid: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(uid);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitStore.set(uid, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}


export async function POST(request: Request) {
  const admin = getFirebaseAdmin();
  
  if (!admin) {
    return NextResponse.json({
      error: "Service Unavailable",
      detail: "The server's backend connection is not configured. Please contact support.",
    }, { status: 503 });
  }

  if (!BSC_XPUB) {
      console.error('[CRITICAL] BSC_XPUB environment variable is not set.');
      return NextResponse.json({ error: 'Server misconfigured', detail: 'The deposit service is not available.' }, { status: 500 });
  }

  const { firestore, auth, FieldValue } = admin;

  try {
    // 1. Verify Firebase Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Missing or invalid auth token' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error: any) {
      console.error('[AUTH] Token verification failed:', error.message);
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid token' }, { status: 401 });
    }
    const uid = decodedToken.uid;

    // 2. Rate Limiting
    if (!checkRateLimit(uid)) {
      console.warn(`[RATE-LIMIT] User ${uid} exceeded rate limit`);
      return NextResponse.json({ error: 'Too Many Requests', message: 'Please try again later' }, { status: 429 });
    }

    // 3. Parse Request Body
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Bad Request', message: 'Invalid JSON body' }, { status: 400 });
    }
    const assetId = (body?.assetId || 'BSC').toUpperCase();
    if (assetId !== 'BSC') {
        return NextResponse.json({ error: 'Unsupported Asset', message: 'Only BSC asset is supported for now.' }, { status: 400 });
    }
    
    const userRef = firestore.collection('users').doc(uid);
    const depositAddressCollectionRef = userRef.collection('deposit_addresses');

    // 4. Firestore Transaction to get existing or create new address
    const result = await firestore.runTransaction(async (transaction) => {
        const existingAddressQuery = depositAddressCollectionRef.where('assetId', '==', assetId).limit(1);
        const existingAddressSnap = await transaction.get(existingAddressQuery);
        
        if (!existingAddressSnap.empty) {
            const existingData = existingAddressSnap.docs[0].data();
            return { address: existingData.address, index: existingData.index, assetId: existingData.assetId };
        }

        const userDoc = await transaction.get(userRef);
        const userData = userDoc.exists ? userDoc.data() : {};
        let index = (userData?.depositIndexes?.bsc ?? -1) + 1;

        const derivedAddress = deriveAddressFromXpub(BSC_XPUB, index);
        if (!isValidBSCAddress(derivedAddress)) {
            throw new Error('Invalid address derived');
        }

        const newAddressRef = depositAddressCollectionRef.doc();
        transaction.set(newAddressRef, {
            address: derivedAddress,
            assetId,
            index,
            createdAt: FieldValue.serverTimestamp(),
            status: 'active',
            derivationPath: `${BSC_DERIVATION_BASE}/0/${index}`
        });

        transaction.set(userRef, { depositIndexes: { bsc: index } }, { merge: true });

        console.log(`[DEPOSIT] Generated address for uid=${uid} index=${index} asset=${assetId}`);
        return { address: derivedAddress, index, assetId };
    });

    return NextResponse.json(result, { status: 200 });

  } catch (err: any) {
    console.error('[deposit-address] FATAL ERROR:', err);
    return NextResponse.json({ error: 'internal_server_error', detail: err?.message || String(err) }, { status: 500 });
  }
}
