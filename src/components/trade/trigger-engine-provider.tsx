"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useMarketDataStore } from "@/lib/market-data-service";
import { submitHybridOrder } from "@/lib/order-client";
import { HybridOrderRequest, OrderType } from "@/lib/order-types";

type TriggerOrder = HybridOrderRequest & {
  id: string; // local ID
  parentOcoId?: string | null;
};

interface TriggerEngineCtx {
  addTriggerOrder: (o: TriggerOrder) => void;
  removeTriggerOrder: (id: string) => void;
  orders: TriggerOrder[];
}

const TriggerEngineContext = createContext<TriggerEngineCtx | null>(null);

export function useTriggerEngine() {
  const ctx = useContext(TriggerEngineContext);
  if (!ctx) throw new Error("useTriggerEngine must be inside provider");
  return ctx;
}

export function TriggerEngineProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<TriggerOrder[]>([]);
  const ticker = useMarketDataStore((s) => s.ticker);
  const lastPrice = ticker?.c ? parseFloat(ticker.c) : null;

  const checking = useRef(false);

  // Add a new trigger order (from order form UI)
  function addTriggerOrder(o: TriggerOrder) {
    setOrders((prev) => [...prev, o]);
  }

  function removeTriggerOrder(id: string) {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }

  // Core execution logic
  async function attemptExecute(order: TriggerOrder) {
    try {
      await submitHybridOrder(order);
      removeTriggerOrder(order.id);

      // OCO logic: cancel the other leg
      if (order.parentOcoId) {
        setOrders((prev) =>
          prev.filter((o) => o.parentOcoId !== order.parentOcoId)
        );
      }
    } catch (err) {
      console.error("Trigger execution error:", err);
    }
  }

  // The real-time price watcher
  useEffect(() => {
    if (!lastPrice) return;
    if (checking.current) return;

    checking.current = true;

    const toExecute: TriggerOrder[] = [];

    orders.forEach((o) => {
      const tp = o.triggerPrice ?? 0;

      // STOP ORDERS
      if (o.type === "STOP_MARKET" || o.type === "STOP_LIMIT") {
        if (o.side === "BUY" && lastPrice >= tp) toExecute.push(o);
        if (o.side === "SELL" && lastPrice <= tp) toExecute.push(o);
      }

      // TAKE PROFIT ORDERS
      if (
        o.type === "TAKE_PROFIT_MARKET" ||
        o.type === "TAKE_PROFIT_LIMIT"
      ) {
        if (o.side === "BUY" && lastPrice <= tp) toExecute.push(o);
        if (o.side === "SELL" && lastPrice >= tp) toExecute.push(o);
      }

      // TRAILING STOP
      if (o.type === "TRAILING_STOP") {
        // Trailing amount
        if (o.trailValue) {
          if (o.side === "BUY") {
            if (lastPrice <= tp) toExecute.push(o);
          } else {
            if (lastPrice >= tp) toExecute.push(o);
          }
        }

        // TODO trailing percent logic
      }
    });

    // Execute all eligible orders
    toExecute.forEach((o) => attemptExecute(o));

    checking.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastPrice, orders]);

  return (
    <TriggerEngineContext.Provider
      value={{ addTriggerOrder, removeTriggerOrder, orders }}
    >
      {children}
    </TriggerEngineContext.Provider>
  );
}
