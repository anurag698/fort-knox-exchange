// scripts/test-safe-init.ts
import { initSafeClient, isSafeDeployed, getPendingTransactions } from "../src/lib/wallet-service";
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

(async () => {
  try {
    console.log("Attempting to initialize Safe client...");
    const { signer } = await initSafeClient();
    console.log("✅ Backend signer address:", await signer.getAddress());
    
    const deployed = await isSafeDeployed();
    console.log("✅ Safe deployed on chain?", deployed);

    const pending = await getPendingTransactions(5, 0);
    console.log("✅ Pending txs (sample):", pending?.results?.length ?? 0);
    console.log("\n🚀 Init OK!");

  } catch (e) {
    console.error("\n❌ Init failed:", e);
    process.exit(1);
  }
})();
