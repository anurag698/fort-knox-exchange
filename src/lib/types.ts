

export type RawOrder = [string, string]; // [price, quantity]

export type ProcessedOrder = {
  price: number;
  quantity: number;
  total: number;
};

export type Market = {
  id: string;
  baseAssetId: string;
  quoteAssetId: string;
  minOrderSize: number;
  pricePrecision: number;
  quantityPrecision: number;
  makerFee: number;
  takerFee: number;
  createdAt: any;
};

export type Asset = {
  id: string;
  symbol: string;
  name: string;
  contractAddress: string;
  decimals: number;
  createdAt: string;
};

export type MarketData = {
  id: string;
  price: number;
  priceChangePercent: number;
  high: number;
  low: number;
  volume: number;
  marketCap: number;
  lastUpdated: any;
}

export type Order = {
  id: string;
  userId: string;
  marketId: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET';
  mode?: 'CUSTODIAL' | 'NON_CUSTODIAL';
  price?: number; // Optional for MARKET orders
  quantity: number;
  status: 'OPEN' | 'PARTIAL' | 'FILLED' | 'CANCELED' | 'EXECUTING' | 'FAILED';
  filledAmount: number;
  createdAt: any;
  updatedAt: any;
  meta?: any;
};

export type DexTransaction = {
  id: string;
  orderId: string;
  chainId: number;
  oneinchPayload: object; // The full payload from 1inch /swap endpoint
  txTo: string;
  txData: string;
  txValue: string;
  onchainTxHash?: string;
  status: 'BUILT' | 'BROADCASTED' | 'CONFIRMED' | 'FAILED';
  createdAt: any;
}

export type Deposit = {
    id: string;
    userId: string;
    assetId: string;
    amount: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    transactionHash?: string;
    createdAt: any;
    updatedAt: any;
};

export type Withdrawal = {
    id: string;
    userId: string;
    assetId: string;
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'SENT' | 'REJECTED' | 'FAILED';
    withdrawalAddress: string;
    transactionHash?: string;
    createdAt: any;
    updatedAt: any;
    aiRiskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
    aiReason?: string;
};

export type UserProfile = {
    id: string;
    email: string;
    username: string;
    kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT_STARTED';
    role?: 'USER' | 'ADMIN';
    createdAt: any;
    updatedAt: any;
    referralCode?: string;
};

export type LedgerEntry = {
  id: string;
  userId: string;
  assetId: string;
  type: string;
  amount: number;
  orderId?: string;
  depositId?: string;
  withdrawalId?: string;
  description?: string;
  createdAt: any;
};

export type Balance = {
  id: string;
  userId: string;
  assetId: string;
  available: number;
  locked: number;
  createdAt: any;
  updatedAt: any;
};

export type PriceAlert = {
    id: string;
    userId: string;
    marketId: string;
    condition: 'above' | 'below';
    price: number;
    enabled: boolean;
    createdAt: any;
    lastTriggeredAt: any;
};
