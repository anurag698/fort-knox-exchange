
export type OrderSide = "BUY" | "SELL";

export type OrderType =
  | "LIMIT"
  | "MARKET"
  | "STOP_MARKET"
  | "STOP_LIMIT"
  | "TAKE_PROFIT_MARKET"
  | "TAKE_PROFIT_LIMIT"
  | "OCO"
  | "TRAILING_STOP";

export type TimeInForce = "GTC" | "IOC" | "FOK";

export interface HybridOrderRequest {
  userId: string;
  marketId: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;

  price?: number | null;         // Limit-only
  triggerPrice?: number | null;  // Stop/TP orders
  timeInForce?: TimeInForce;
  postOnly?: boolean;
  reduceOnly?: boolean;

  // Optional: For trailing stops
  trailValue?: number | null;
  trailPercent?: number | null;
}

export interface HybridOrderResponse {
  orderId: string;
  status: "ACCEPTED" | "REJECTED";
  message?: string;
}

export interface ValidatedOrder extends HybridOrderRequest {
  price: number | null;
  triggerPrice: number | null;
  timeInForce: TimeInForce;
  postOnly: boolean;
  reduceOnly: boolean;
}
