
export type Market = {
  id: string;
  baseAssetId: string;
  quoteAssetId: string;
  minOrderSize: number;
  pricePrecision: number;
  quantityPrecision: number;
  makerFee: number;
  takerFee: number;
  createdAt: string;
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
