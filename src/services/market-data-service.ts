// src/services/market-data-service.ts
"use client";

import { liveFeedBridge } from "@/services/live-feed-bridge";
import { bus } from "@/components/bus";

/**
 * market-data-service.ts (Part 13.7-F — File 2/4)
 *
 * Thin wrapper / public facade around the LiveFeedBridge singleton.
 * - Exposes startFeed(symbol, interval) and stopFeed()
 * - Emits simple status events via bus
 * - Provides subscribe / unsubscribe helpers for UI modules
 *
 * NOTE: we intentionally keep the API small and synchronous:
 *   marketDataService.startFeed("BTCUSDT", "1m");
 *   marketDataService.stopFeed();
 *
 * This matches the "A — Keep only new API" decision you made.
 */

type FeedStatus = "offline" | "mexc" | "fkx" | "connected";

class MarketDataServiceFacade {
  // forwarded status getter
  get status(): FeedStatus {
    return (liveFeedBridge as any).status ?? "offline";
  }

  /**
   * Start the unified feed for a symbol and interval.
   * This will stop any previous feed (singleton)
   */
  startFeed(symbol: string, interval = "1m") {
    try {
      const normalizedSymbol = symbol.replace("-", "").toUpperCase();
      liveFeedBridge.start(normalizedSymbol, interval);

      // Emit a central status (so UI components can show connect state)
      bus.emit("market-feed:status", {
        status: liveFeedBridge.status,
        symbol: normalizedSymbol,
        interval,
      });
    } catch (e) {
      console.error("[marketDataService] startFeed error", e);
      bus.emit("market-feed:status", { status: "offline", symbol, interval, error: String(e) });
    }

    return liveFeedBridge;
  }

  /**
   * Stops the active unified feed (if any).
   */
  stopFeed() {
    try {
      liveFeedBridge.stop();
      bus.emit("market-feed:status", { status: "offline" });
    } catch (e) {
      console.error("[marketDataService] stopFeed error", e);
    }
  }

  /**
   * Convenience wrapper to subscribe to unified events forwarded by the bridge.
   * Example: marketDataService.on("kline", cb)
   */
  on(event: string, cb: (...args: any[]) => void) {
    return bus.on(event, cb);
  }

  /**
   * Convenience wrapper to unsubscribe.
   */
  off(event: string, cb?: (...args: any[]) => void) {
    bus.off(event, cb as any);
  }

  /**
   * One-shot helper to fetch current feed status
   */
  getStatus() {
    return {
      status: liveFeedBridge.status,
    };
  }
}

export const marketDataService = new MarketDataServiceFacade();
export default marketDataService;
