# 🚀 Fort Knox Exchange: Comprehensive Development & Design Brief

## 1. Project Vision & App Name

**App Name**: Fort Knox Exchange

**Vision**: To create a secure, professional, and ultra-modern cryptocurrency trading platform that combines the reliability and feature set of top-tier centralized exchanges with the flexibility of decentralized finance. The user experience should feel premium, responsive, and intuitive, catering to both novice and professional traders.

---

## 2. Core Features

### 2.1. User Experience & Authentication
- **Secure Authentication**: Robust user sign-up, login, and profile management using Firebase Authentication (Email/Password).
- **User Profiles**: Manageable user profiles with username, KYC status, and referral codes.
- **Role-Based Access**: Clear distinction between `USER` and `ADMIN` roles, enforced by Firestore Security Rules.

### 2.2. Trading & Markets
- **Pro Trading UI**: A comprehensive, single-page trading interface featuring a real-time chart, order book, recent trades, and order management panels.
- **Market Data**: Real-time display of market data including order books, trades, and advanced price charts powered by live WebSocket streams from sources like MEXC.
- **Decentralized Swap**: A simplified swap widget for non-custodial token exchanges, powered by the 1inch aggregator for best-rate discovery.
- **Hybrid Execution**: A sophisticated routing engine that executes trades either on the internal Fort Knox order book or through an external liquidity provider like 1inch, ensuring optimal price and execution.
- **Internal-Only Markets**: Special support for flagship assets (e.g., NOMOX-USDT) where all trades are executed exclusively on the internal matching engine, while still using external data for charting and market visualization.


### 2.3. Wallet & Funds Management
- **Balance Management**: Securely track user balances for various crypto assets. All balance updates are atomic and handled exclusively by the backend to ensure consistency.
- **Deposit System**: Generate unique, per-user, per-asset deposit addresses.
- **Withdrawal System**: Enable users to request withdrawals to external addresses, subject to an AI-powered moderation and admin approval queue.

### 2.4. Administration & Compliance
- **Admin Dashboard**: A dedicated interface for administrators to manage users, review KYC submissions, and moderate withdrawal requests.
- **AI-Powered Moderation**: A Genkit-based AI flow to analyze withdrawal requests, assess risk levels (Low, Medium, High, Critical), and flag suspicious activity to aid in KYC/AML compliance.

---

## 3. Design & Style Guidelines

The aesthetic is a dark, premium, and futuristic "glass-morphism" look, conveying security and professionalism.

- **Primary Color**: Deep Blue (`#1A237E`) - Conveys trust and security.
- **Background Color**: Light Gray (`#F5F5F5`) for the light theme and a very dark blue/gray (`#0D0D12`) for the dark theme.
- **Accent Color**: Vibrant Teal (`#00B0FF` for neon effects) - Used for interactive elements, CTAs, and chart highlights.
- **Highlight/Special Colors**: Gold (`#E4B649`), Profit Green (`#26a69a` / `#00ffbf`), Loss Red (`#ef5350` / `#ff4668`).
- **Typography**: `Inter` for all body and headline text. `Sora` or `Outfit` for branding.
- **Iconography**: `lucide-react` for a clean, consistent icon set.
- **UI Components**: Primarily use pre-built **ShadCN UI** components, styled to match the theme. Emphasize rounded corners, subtle shadows, and glowing borders for active elements.
- **Data Presentation**: Prioritize clarity and readability with well-organized tables, charts, and forms.

---

## 4. Technical Architecture & Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Library**: ShadCN UI
- **Backend Services**: Firebase (Authentication, Firestore, Cloud Functions for server actions)
- **Generative AI**: Google Genkit
- **Real-time Data**: WebSockets (connected to MEXC for market data).
- **Charting Library**: `lightweight-charts`.
- **DEX Aggregation**: 1inch API for external liquidity.

---

## 5. Key Component Breakdown & Logic

### 5.1. Pro Trading Page (`/trade/[marketId]`)
- **`ProTradingLayout.tsx`**: The main grid layout orchestrating all trading components.
- **`ChartShell.tsx` & `ChartEngine.tsx`**: A two-part component. `ChartShell` acts as a wrapper that detects the environment and safely lazy-loads `ChartEngine`. The `ChartEngine` contains the full `lightweight-charts` implementation and is only rendered in environments that support WebSockets (i.e., not Firebase Studio preview).
- **Chart Engine Features**:
    - **Real-time Candles**: Live data streamed via WebSocket from MEXC.
    - **Technical Indicators**: Toggleable SMA, EMA, RSI, and Bollinger Bands.
    - **Drawing Tools**: Interactive, on-chart tools for drawing trendlines, rays, horizontal lines, and rectangles.
    - **Trade Markers**: Visual buy/sell arrows rendered on the chart for each executed trade.
    - **Position PnL Overlay**: A real-time overlay showing average entry price, floating PnL percentage and value, and a shaded profit/loss zone.
    - **Multi-Entry Support**: Ability to visualize and average multiple position entries.
    - **Multiple TP/SL Targets**: Draggable, independent Take-Profit and Stop-Loss lines with dynamic PnL labels.
    - **Liquidation Line**: A visual warning line and "danger zone" that shows the projected liquidation price.
    - **Chart-Based Trading**:
        - **Click-to-Order**: Place limit orders by `Alt+Clicking` on the chart.
        - **Drag-to-Modify**: Modify pending order prices by dragging them.
        - **Bracket Orders**: Create linked Entry, TP, and SL orders by `Shift+Dragging` on the chart.
- **`MarketHeader.tsx`**: Displays the current market, price, 24h stats, and includes a market selector popover.
- **`Orderbook.tsx`**: Displays live bid/ask walls with depth visualization.
- **`RecentTrades.tsx`**: A real-time feed of the latest market trades.
- **`OrderForm.tsx`**: A tabbed form for placing Market and Limit orders.
- **`UserTrades.tsx`**: A panel for displaying the user's open orders and trade history for the current market.

### 5.2. Firestore Data Model
- `/users/{userId}`: Stores `UserProfile` data.
- `/users/{userId}/balances/{assetId}`: Stores a user's balance for a specific asset.
- `/users/{userId}/orders/{orderId}`: Stores individual user orders.
- `/users/{userId}/withdrawals/{withdrawalId}`: Stores user withdrawal requests.
- `/assets/{assetId}`: Public collection of supported cryptocurrencies.
- `/markets/{marketId}`: Public collection of supported trading pairs.
- `/market_data/{marketId}`: Public collection for real-time market statistics.
- `/trades/{tradeId}`: Global collection of all executed trades for auditing.
- **Security**: All user-specific data is protected by Firestore Security Rules, allowing a user to only access their own documents. Admins have broader access.

This document provides a complete overview of the Fort Knox Exchange, its features, and its technical implementation, serving as the source of truth for all development efforts.
