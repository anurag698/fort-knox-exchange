# Fort Knox Exchange

A secure, institutional-grade cryptocurrency exchange platform built with modern web technologies.

## Features

- **Real-time Trading:** High-performance order book and charting engine.
- **Secure Wallet:** HD Wallet architecture (BIP-39) with encrypted keys and cold storage integration.
- **Live Market Data:** Aggregated data from major exchanges (MEXC, Binance) via WebSocket and REST.
- **Institutional Security:** Deposit monitoring, withdrawal whitelisting (planned), and audit logs.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Shadcn UI.
- **Backend:** Next.js API Routes, Node.js.
- **Database:** Azure Cosmos DB (NoSQL).
- **Blockchain:** Ethers.js, BitcoinJS.
- **Integrations:** MEXC (Market Data), 1inch Fusion+ (Liquidity).

## Getting Started

### 1. Prerequisites

- Node.js 18+
- Azure Cosmos DB Account (or Emulator)

### 2. Environment Setup

Create a `.env` file in the root directory. You can use `.env.example` as a template.

**Critical Variables:**
```env
# Database
AZURE_COSMOS_ENDPOINT="your-endpoint"
AZURE_COSMOS_KEY="your-key"
AZURE_COSMOS_DATABASE_ID="fortknox"

# Wallet Security
ENCRYPTION_SECRET="your-32-char-secret"
HD_WALLET_MNEMONIC="your-24-word-mnemonic"

# Blockchain Monitoring (Optional but Recommended)
ETH_SCAN_API_KEY="your-etherscan-key"
BSC_SCAN_API_KEY="your-bscscan-key"
MATIC_SCAN_API_KEY="your-polygonscan-key"
```

### 3. Running the Application

**Start the Main Server:**
```bash
npm run dev
# Runs on http://localhost:3000
```

**Start the Deposit Monitor:**
This background worker scans for incoming crypto deposits.
```bash
npm run deposit-worker
```

### 4. Market Data

To populate the "Markets" page with live data, you need to trigger the aggregator.

**Manual Trigger:**
Open `http://localhost:3000/api/cron/update-markets`

**Automated:**
Set up a Cron Job to hit the above URL every 1 minute.

## Testing

See [TESTING_MEXC.md](TESTING_MEXC.md) for details on testing the market data integration.
