// src/components/trade/chart/chart-event-bus.ts
/**
 * A simple, strongly-typed event bus for chart-related events.
 * This allows decoupled communication between the MarketDataService and the ChartEngine.
 */
type EventMap = Record<string, any>;
type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T> = (params: T) => void;

interface Emitter<T extends EventMap> {
  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
  off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
  emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
}

function createEmitter<T extends EventMap>(): Emitter<T> {
  const listeners: { [K in keyof T]?: Array<(p: T[K]) => void> } = {};

  return {
    on(eventName, fn) {
      listeners[eventName] = (listeners[eventName] || []).concat(fn);
    },
    off(eventName, fn) {
      listeners[eventName] = (listeners[eventName] || []).filter(
        (f) => f !== fn
      );
    },
    emit(eventName, params) {
      (listeners[eventName] || []).forEach(function (fn) {
        fn(params);
      });
    },
  };
}

// Define your specific chart events here
export interface ChartEvents {
  ticker: (data: any) => void;
  trade: (data: any) => void;
  depth: (data: { bids: any[]; asks: any[] }) => void;
  kline: (data: any) => void;
}

export const ChartEventBus = createEmitter<ChartEvents>();
