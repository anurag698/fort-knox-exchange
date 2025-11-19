# 🚀 **FULL DEVELOPER PROMPT — FORT KNOX EXCHANGE TRADE PAGE**

**Paste this entire prompt in Cursor / Windsurf / Copilot Chat:**

---

### 🟦 **PROJECT CONTEXT**

You are building a professional crypto exchange trade page for **Fort Knox Exchange**.
Tech stack:

* Next.js 15 (App Router)
* TypeScript
* TailwindCSS
* Firebase (DB + Hosting + Functions)
* Client-side WebSockets for price feeds
* Lightweight-Charts for charting
* Modular + maintainable component architecture

This page should work like Binance/Bybit/OKX pro mode, but cleaner and faster.

---

## 🟩 **WHAT TO BUILD**

Generate a **complete trading interface** consisting of these modules:

### **1️⃣ Header Section**

* Pair selector (e.g., BTC/USDT)
* Current price, 24h high/low, change, volume
* Wallet balance summary
* Theme toggle
* User menu

---

### **2️⃣ Chart Section (center)**

Use **lightweight-charts** with:

* Candlestick series
* Realtime updates
* Timeframes: 1m, 5m, 15m, 1h, 4h, 1d
* Indicators (volume by default)
* Crosshair tooltip
* Depth chart toggle

---

### **3️⃣ Orderbook (left side)**

Two-column orderbook:

* Asks (red)
* Bids (green)
* Mid-price indicator
* Auto-scroll
* WebSocket-driven updates

---

### **4️⃣ Market Trades (right side)**

A compact tape of trades:

* Price (color-coded)
* Amount
* Time
* Smooth scroll animation

---

### **5️⃣ Buy/Sell Order Panel (bottom left)**

Tabs:

* Limit
* Market
* Stop-Limit

Inputs:

* Price
* Amount
* Total
* Slider for % balance
* Buy & Sell buttons

Backend actions:

* Submit order to Firebase Cloud Function
* Save order in `orders/{userId}`
* Trigger matching engine (mock for now)

---

### **6️⃣ Positions & Open Orders (bottom right)**

Tables for:

* Open orders
* Positions
* Order history
* Funding fees (if any)

---

## 🟦 **WEBSOCKET DATA STRUCTURE**

Expect price feed payload:

```ts
{
  pair: "BTC-USDT",
  price: number,
  bid: number,
  ask: number,
  bids: [ [price, size], ... ],
  asks: [ [price, size], ... ],
  trades: [
    { price, amount, timestamp, side }
  ],
  candle: {
    timeframe: "1m",
    open, high, low, close, volume, time
  }
}
```

Create TypeScript interfaces for every structure.

---

## 🟧 **COMPONENT ARCHITECTURE**

Generate these components inside `/src/components/trade/`:

### **Core**

* `ProTradingLayout.tsx`
* `Chart.tsx`
* `Orderbook.tsx`
* `MarketTrades.tsx`
* `BuySellPanel.tsx`
* `Positions.tsx`
* `OpenOrders.tsx`

### **UI Utilities**

* `Panel.tsx`
* `Card.tsx`
* `Dropdown.tsx`
* `Tabs.tsx`

### **Hooks**

* `useMarketFeed.ts` (WebSocket)
* `useCandleFeed.ts`
* `useOrderbookFeed.ts`
* `useTradesFeed.ts`

### **Firebase**

* `/src/lib/firebase.ts`
* Cloud Function: `/functions/placeOrder.ts`
* Cloud Function: `/functions/matchOrders.ts` (simple mock engine)

---

## 🟩 **STYLE REQUIREMENTS**

Use TailwindCSS with:

* Dark theme (#0D0D12)
* Neon blue & cyan highlights (#00B0FF, #32F0FF)
* Smooth gradients
* Glassmorphism cards for panels
* Minimal shadows
* Clean spacing
* Responsive grid layout

---

## 🟥 **ADVANCED LOGIC REQUIRED**

AI should generate:

### **1. WebSocket Realtime Engine**

* Auto-reconnect
* Heartbeat ping
* Incoming message parsing
* Dispatch to Zustand or Context state

### **2. Trade Matching Logic (Mock)**

* Match limit order
* Reduce order sizes
* Create trade fills

### **3. Chart Conversion Utilities**

Convert incoming candle data into lightweight-chart format.

### **4. Tooltip Fixes**

Fix issues:

* logicalRange null check
* barsInLogicalRange undefined
* seriesPrices undefined

### **5. Layout Responsiveness**

Desktop layout example:

```
+----------------------------------------------+
| Header                                       |
+--------------+-------------------+-----------+
| Orderbook    |      Chart        |  Trades   |
|              |                   |           |
+--------------+-------------------+-----------+
| Buy/Sell     | Positions         | OpenOrders|
+--------------+-------------------+-----------+
```

---

## 🟪 **DELIVERABLES**

Generate:

### ✔ Complete Next.js pages

### ✔ Complete components

### ✔ Hooks

### ✔ TypeScript interfaces

### ✔ Firebase backend functions

### ✔ Full styling (Tailwind)

### ✔ Dummy data or WebSocket mock server

---

## 🟫 **OUTPUT FORMAT**

* Provide files with paths
* Provide clean code blocks
* Explain integration
* Provide installation steps
* Provide run instructions

---

# END OF DEVELOPER PROMPT
