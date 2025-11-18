export interface DepthPoint {
  price: number;
  volume: number;
}

export interface Trade {
  price: number;
  qty: number;
  side: 'buy' | 'sell';
  time: number;
}
