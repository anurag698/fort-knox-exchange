
import {
  HybridOrderRequest,
  ValidatedOrder,
} from "./order-types";

export function validateHybridOrder(req: HybridOrderRequest): ValidatedOrder {
  const errors: string[] = [];

  if (!req.userId) errors.push("Missing userId.");
  if (!req.marketId) errors.push("Missing marketId.");
  if (!req.side) errors.push("Missing side.");
  if (!req.type) errors.push("Missing type.");
  if (!req.quantity || req.quantity <= 0) errors.push("Invalid quantity.");

  // LIMIT price rules
  if (req.type === "LIMIT" || req.type === "STOP_LIMIT" || req.type === "TAKE_PROFIT_LIMIT") {
    if (!req.price || req.price <= 0) {
      errors.push("Price must be provided for limit orders.");
    }
  }

  // STOP / TAKE-PROFIT rules
  if (
    req.type === "STOP_MARKET" ||
    req.type === "STOP_LIMIT" ||
    req.type === "TAKE_PROFIT_MARKET" ||
    req.type === "TAKE_PROFIT_LIMIT"
  ) {
    if (!req.triggerPrice || req.triggerPrice <= 0) {
      errors.push("triggerPrice is required for stop/TP orders.");
    }
  }

  // Trailing Stop Rules
  if (req.type === "TRAILING_STOP") {
    if (!req.trailValue && !req.trailPercent) {
      errors.push("TRAILING_STOP requires trailValue or trailPercent.");
    }
  }

  // Post-only rule only valid for LIMIT orders
  if (req.postOnly && req.type !== "LIMIT") {
    errors.push("postOnly is only valid for LIMIT orders.");
  }

  // Time-In-Force default
  const tif = req.timeInForce ?? "GTC";

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  // Return sanitized object
  return {
    ...req,
    price: req.price ?? null,
    triggerPrice: req.triggerPrice ?? null,
    timeInForce: tif,
    postOnly: req.postOnly ?? false,
    reduceOnly: req.reduceOnly ?? false,
  };
}
