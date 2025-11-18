
import {
  HybridOrderRequest,
  HybridOrderResponse,
} from "./order-types";

export async function submitHybridOrder(
  order: HybridOrderRequest
): Promise<HybridOrderResponse> {
  const res = await fetch("/api/trade/hybrid", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });

  return res.json();
}
