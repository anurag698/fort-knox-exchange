# Fort Knox Exchange Deployment Guide

This guide outlines the essential steps for securely deploying and managing the Fort Knox Exchange application, focusing on the handling of cryptographic keys and operational procedures.

## 1. How to Generate Production Mnemonic Offline

The master mnemonic is the ultimate root of all user deposit addresses. It must be generated and stored with extreme care.

**Procedure:**

1.  **Prepare an Offline Machine:** Use a brand new, air-gapped computer that has never been and will never be connected to the internet. A Raspberry Pi Zero or a fresh laptop is a good choice.
2.  **Install Node.js:** Transfer a verified Node.js installer to the offline machine via a USB drive.
3.  **Transfer Script:** Copy the `scripts/generate-test-mnemonic.ts` script (and its dependencies) to the offline machine.
4.  **Generate Mnemonic:** Run the script to generate a new 24-word (256-bit) mnemonic.
    ```bash
    # On the offline machine
    node scripts/generate-test-mnemonic.ts
    ```
5.  **Record Mnemonic:** Write the 24-word phrase down on paper or stamp it into metal. Store it in multiple secure, physically separate locations (e.g., bank safe deposit boxes). This is your ultimate backup.
6.  **Derive XPUB:** The script will also output the master extended public key (XPUB) for the `m/44'/60'/0'` path. This is your `BSC_XPUB`. Record this digitally and transfer it to your development machine. The mnemonic itself **never** leaves the offline machine.

## 2. How to Store Mnemonic in Google Secret Manager

For production environments, the master mnemonic should be loaded from a secure, audited secret store, not from an environment variable.

**Procedure:**

1.  **Go to Google Secret Manager:** In your Google Cloud project, navigate to "Security" > "Secret Manager".
2.  **Create a New Secret:**
    *   **Name:** `exchange-master-mnemonic`
    *   **Secret value:** Paste the 24-word mnemonic phrase.
    *   Leave other settings as default and create the secret.
3.  **Grant Access:** Grant the IAM service account that runs your application (e.g., your App Hosting or Cloud Run service account) the **"Secret Manager Secret Accessor"** role for this specific secret.
4.  **Update Server Code (Future):** Modify your server's startup logic to fetch this secret from Secret Manager instead of relying on `process.env.MASTER_MNEMONIC`.

## 3. How to Add `BSC_XPUB` to Firebase Studio Env

The `BSC_XPUB` is safe to use as an environment variable as it cannot sign transactions.

**Procedure:**

1.  Open your Firebase Studio project.
2.  Navigate to **Workspace > Environment**.
3.  Click **Add variable**.
    *   **Key:** `BSC_XPUB`
    *   **Value:** Paste the `xpub...` string you derived in Step 1.
4.  Add other necessary variables like `BSC_RPC_URL` and `FIREBASE_PROJECT_ID`.
5.  **Save** the environment variables.
6.  **Important:** You must **Stop** and then **Start** the preview server for the new variables to be loaded.

## 4. How to Test on BSC Testnet

1.  **Generate Testnet Keys:** Use the `generate-test-mnemonic.ts` script to create a *separate* set of test keys.
2.  **Set Testnet Env Vars:** In your `.env` file or a separate Firebase Studio environment, set `BSC_XPUB` to your testnet XPUB. Set `BSC_RPC_URL` to a testnet RPC, like `https://data-seed-prebsc-1-s1.binance.org:8545/`.
3.  **Get Faucet Funds:** Use a BSC Testnet Faucet to send test BNB to a few of your derived deposit addresses.
4.  **Run Scanner:** Execute the sweep script against the testnet to verify it detects the balances.

## 5. How to Deploy

The Fort Knox Exchange is set up for deployment with Firebase App Hosting.

**Procedure:**

1.  **Login to Firebase:**
    ```bash
    firebase login
    ```
2.  **Initialize Firebase (if not already done):**
    ```bash
    firebase init hosting
    ```
    *   Select your Firebase project.
    *   When asked for the public directory, enter `.next`.
    *   Configure as a single-page app (rewrite all urls to /index.html)? **No**.
    *   Set up automatic builds and deploys with GitHub? **(Optional)**
3.  **Deploy:**
    ```bash
    firebase deploy --only hosting
    ```
    Firebase App Hosting will automatically build your Next.js application and deploy it. Your API routes will be available under the same domain.
4.  **Deploy Firestore Rules:**
    ```bash
    firebase deploy --only firestore:rules
    ```

## 6. Monitoring & Logging Setup

*   **Firebase Console:** Monitor API route invocations and function logs in the Firebase console under the "Logs" section for your App Hosting backend.
*   **Google Cloud Logging:** For more advanced queries, use Google Cloud Logging to search for specific logs, like `[DEPOSIT]`, `[RATE-LIMIT]`, or `[CRITICAL]`.

## 7. Sweep Procedure using Hardware Wallet

For maximum security, the master private keys should never touch a networked machine.

**Procedure:**

1.  **Run the Scanner:** Run the `scripts/sweep-deposits.ts` script on a secure machine. This script is read-only and only checks balances. It will output a list of addresses with funds.
2.  **Use a Hardware Wallet:** On your offline machine where the mnemonic is stored (or a hardware wallet initialized with that mnemonic), manually construct and sign transactions to move funds from the identified deposit addresses to your secure hot or cold wallet address.
3.  **Broadcast Transactions:** Use a tool like MetaMask or a trusted public node to broadcast the signed, raw transactions.

This manual, air-gapped process ensures that the keys that can move funds are never exposed to an online environment.
