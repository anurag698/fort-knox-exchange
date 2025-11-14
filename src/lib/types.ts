
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
