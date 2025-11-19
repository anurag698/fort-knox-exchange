# ⭐ Fort Knox Exchange: Complete Feature Breakdown

This document provides a comprehensive overview of all features and capabilities built into the Fort Knox Exchange application.

---

## 1. Core User & Account Management

The platform is built around a secure and robust user account system powered by Firebase.

- **Secure Authentication**: Users can sign up and sign in using Email and Password through a dedicated `/auth` page. The system is secured by Firebase Authentication.
- **User Profiles**: Every user has a profile (`/settings`) storing their username, email, and KYC status. Usernames can be updated.
- **Referral System**: Each user is automatically assigned a unique referral code to encourage new user acquisition.
- **Role-Based Access Control (RBAC)**: The system distinguishes between `USER` and `ADMIN` roles. Firestore Security Rules are configured to enforce strict permissions, ensuring users can only access their own data, while admins have elevated privileges.

---

## 2. Professional Trading Interface

The heart of the application is the professional trading UI, designed to be on par with leading centralized exchanges.

- **Modular Trading Layout**: A multi-panel layout (`/trade/[marketId]`) that includes an advanced chart, order book, recent trades feed, and order management panels.
- **Market Selection**: A searchable popover in the header allows users to easily switch between different trading pairs (e.g., BTC-USDT, ETH-USDT).
- **Real-Time Data Feeds**:
    - **Order Book**: Live bid and ask walls with depth visualization, streamed directly via WebSocket.
    - **Recent Trades**: A real-time feed of the latest market trades for the selected pair.
- **Order Forms**: Tabbed forms for placing **Market** and **Limit** orders. Includes a percentage slider to quickly select order size based on available balance.
- **Balance Display**: A dedicated panel shows the user's available balances for the base and quote assets of the current market.

---

## 3. Advanced Charting Engine

The charting component is a custom-built, high-performance engine using Lightweight Charts, providing a feature set that rivals professional desktop applications.

- **Real-Time Candlestick Chart**: Live candle updates streamed via a MEXC Kline WebSocket, with a fallback to REST polling to ensure compatibility in all environments (including Firebase Studio).
- **Technical Indicators**: A full suite of toggleable technical indicators, including:
    - Simple Moving Average (SMA 5, SMA 20)
    - Exponential Moving Average (EMA 20, EMA 50)
    - Bollinger Bands (BB)
    - Relative Strength Index (RSI) displayed in a separate pane.
- **Interactive Drawing Tools**: Users can draw directly on the chart using tools like:
    - Trendline
    - Ray
    - Horizontal Line
    - Rectangle
- **On-Chart Trade Execution Markers**: Visual arrows (`⬆` for buy, `⬇` for sell) are plotted directly on the chart at the moment a trade is executed, providing clear visual feedback.
- **Live PnL (Profit and Loss) Overlay**:
    - For open positions, the chart displays a **blended average entry price line**.
    - A floating label shows the real-time unrealized PnL (both percentage and currency value).
    - The background is shaded green (for profit) or red (for loss) between the entry price and the current price.
- **Interactive Order Management**:
    - **Draggable TP/SL Lines**: Users can set, drag, and modify Take-Profit and Stop-Loss lines directly on the chart.
    - **Multi-Entry Support**: The chart can visualize multiple position entries and calculates a volume-weighted average price for accurate PnL tracking.
    - **Multiple TP Targets**: Users can set several partial take-profit targets (TP1, TP2, etc.), each with its own draggable line and PnL projection.
    - **Liquidation Price Visualization**: A distinct warning line and a "danger zone" overlay appear on the chart to show the projected liquidation price, with opacity increasing as the current price gets closer.
    - **On-Chart Order Placement**:
        - **Limit Orders**: Users can `Alt+Click` on the chart to instantly place a limit order at a specific price.
        - **Bracket Orders**: Users can `Shift+Drag` to create a complete bracket order (Entry, TP, and SL) in a single, fluid motion.

---

## 4. Wallet & Funds Management

A comprehensive system for managing user funds securely and transparently.

- **Centralized Balances**: All user asset balances are stored securely in Firestore, with clear separation between `available` and `locked` (in-order) funds.
- **Deposit System**: Users can generate unique deposit addresses for various assets to fund their accounts. The system uses a hierarchical deterministic (HD) wallet structure for generating these addresses.
- **Withdrawal Workflow**:
    - Users can submit withdrawal requests to an external address, which requires KYC verification.
    - All withdrawal requests enter a moderation queue for administrative review.
- **AI-Powered Withdrawal Moderation**: A Genkit-based AI flow automatically analyzes every withdrawal request. It assesses risk factors (e.g., user history, amount, KYC status) and flags suspicious requests with a `Low`, `Medium`, `High`, or `Critical` risk level to assist admins.
- **Complete Transaction History**: The `/ledger` page provides a detailed, immutable record of every transaction on a user's account, including deposits, withdrawals, and trade settlements.

---

## 5. Decentralized Swap

For users who prefer non-custodial trading, the platform integrates a decentralized exchange aggregator.

- **1inch-Powered Swap Widget**: The `/swap` page features a widget that connects directly to the user's MetaMask (or other Web3) wallet.
- **Best Rate Execution**: It uses the 1inch API to find the most efficient trading routes across multiple decentralized exchanges, ensuring the user gets the best possible rate for their on-chain swap.

---

## 6. Administration & Security

A dedicated back-office area for platform management and compliance.

- **Admin Dashboard**: A secure `/admin` page provides an overview of platform statistics, including total users, active markets, and pending withdrawals.
- **User Management**: Admins can view a list of all users, inspect individual user profiles, and manage their KYC status (approve/reject).
- **Withdrawal Moderation Queue**: The dashboard presents all pending withdrawal requests, prioritized and enriched with AI risk analysis, allowing admins to approve or reject them efficiently.
- **Firestore Security Rules**: The entire database is protected by comprehensive security rules that enforce user data isolation and grant admins appropriate access, ensuring data integrity and privacy.
