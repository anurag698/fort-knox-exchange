
// src/app/api/deposit-address/route.ts
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { deriveBtcAddressFromXpub } from '@/lib/btc-address';
import * as bip32 from 'bip32';
import secp from 'secp256k1';
import * as ethUtil from 'ethereumjs-util';

// Helper: standardize incoming asset key (accept asset, token, assetId)
function normalizeInput(body: any) {
  const userId = body?.userId || body?.uid || body?.user || null;
  const assetId = (body?.assetId || body?.asset || body?.token || body?.symbol || null);
  return { userId, assetId };
}

function toEthAddressFromPub(pubKeyBuffer: Buffer): string {
  let uncompressed: Buffer;
  if (pubKeyBuffer.length === 33) {
    // convert compressed -> uncompressed using secp256k1
    uncompressed = Buffer.from(secp.publicKeyConvert(pubKeyBuffer, false)); // 65 bytes
  } else if (pubKeyBuffer.length === 65) {
    uncompressed = pubKeyBuffer;
  } else {
    throw new Error('unexpected pubkey length: ' + pubKeyBuffer.length);
  }
  // drop 0x04 prefix if present
  const pubNoPrefix = uncompressed.length === 65 ? uncompressed.slice(1) : uncompressed;
  const hash = ethUtil.keccak256(pubNoPrefix);
  return ethUtil.toChecksumAddress('0x' + hash.slice(-20).toString('hex'));
}

function deriveAddressFromXpubSmart(xpub: string, index: number): string {
  const node = bip32.fromBase58(xpub);
  // If xpub.depth >= 4 it's likely at m/44'/60'/0'/0 (external chain included)
  const assumeIncludesExternal = node.depth >= 4;
  let child;
  if (assumeIncludesExternal) {
    // node.derive(index) => m/.../0/index
    child = node.derive(index);
  } else {
    // node.derive(0).derive(index) => m/.../0/index
    child = node.derive(0).derive(index);
  }
  if (!child || !child.publicKey) throw new Error('derived child missing publicKey');
  return toEthAddressFromPub(child.publicKey);
}


export async function POST(request: Request) {
  const admin = getFirebaseAdmin();
  
  if (!admin) {
    console.error("[deposit-address] FATAL: Firebase Admin SDK is not available. Check server configuration.");
    return NextResponse.json({
      error: "Service Unavailable",
      detail: "The server's backend connection is not configured. Please contact support.",
    }, { status: 503 });
  }

  const { firestore, FieldValue } = admin;

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

  const bscXpub = process.env.BSC_XPUB; // Using BSC_XPUB for EVM chains
  const btcXpub = process.env.BTC_XPUB;

  try {
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
        if (!bscXpub) {
            const errorDetail = 'BSC_XPUB (for EVM addresses) environment variable is not configured on the server.';
            console.error(`[deposit-address] Configuration Error: ${errorDetail}`);
            return NextResponse.json({ error: 'Server Configuration Incomplete', detail: errorDetail }, { status: 503 });
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

            const derivedAddress = deriveAddressFromXpubSmart(bscXpub, newIndex);

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
        if (!btcXpub) {
          const errorDetail = 'BTC_XPUB environment variable is not configured on the server.';
          console.error(`[deposit-address] Configuration Error: ${errorDetail}`);
          return NextResponse.json({ error: 'Server Configuration Incomplete', detail: errorDetail }, { status: 503 });
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
        BSC_XPUB: !!process.env.BSC_XPUB,
        BTC_XPUB: !!process.env.BTC_XPUB,
        FIREBASE_SERVICE_ACCOUNT_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      }
    });

    return NextResponse.json({
      error: "Internal Server Error",
      detail: errorMessage,
    }, { status: 500 });
  }
}
