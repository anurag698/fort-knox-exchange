import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import rateLimit from "@/lib/rate-limit";
import { getDepositAddress } from "@/lib/wallet";

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
  maxRequests: 5,
});

export async function GET(req: Request) {
  try {
    const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = getAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const userId = decoded.uid;

    await limiter.check(userId);

    const db = getFirestore();
    const userRef = db.collection("users").doc(userId);
    const addrRef = userRef.collection("deposit_addresses").doc("bsc");

    const snapshot = await addrRef.get();

    let depositAddress;
    let index;

    if (snapshot.exists) {
      const data = snapshot.data();
      depositAddress = data?.address;
      index = data?.index;
    } else {
      const metaRef = db.collection("internal").doc("bsc");
      await db.runTransaction(async (tx) => {
        const metaSnap = await tx.get(metaRef);
        const currentIndex = metaSnap.exists ? metaSnap.data().lastIndex || 0 : 0;
        index = currentIndex + 1;

        depositAddress = getDepositAddress(process.env.BSC_XPUB!, index);

        tx.set(metaRef, { lastIndex: index });
        tx.set(addrRef, { index, address: depositAddress });
      });
    }

    return NextResponse.json({ address: depositAddress, index });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
