

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
  createdAt: string;
};

export type Order = {
  id: string;
  userId: string;
  marketId: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET';
  price?: number;
  quantity: number;
  status: 'OPEN' | 'PARTIAL' | 'FILLED' | 'CANCELED';
  filledAmount: number;
  createdAt: any;
  updatedAt: any;
};

export type Deposit = {
    id: string;
    userId: string;
    assetId: string;
    amount: number;
    status: 'REQUESTED' | 'PENDING' | 'COMPLETED' | 'FAILED';
    transactionHash?: string;
    createdAt: any;
    updatedAt: any;
};

export type Withdrawal = {
    id: string;
    userId: string;
    assetId: string;
    amount: number;
    status: 'REQUESTED' | 'PENDING' | 'APPROVED' | 'SENT' | 'REJECTED';
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
    kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    createdAt: any;
    updatedAt: any;
    referralCode?: string;
    isAdmin?: boolean;
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
