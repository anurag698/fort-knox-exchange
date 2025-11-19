// ======================================================
// Trade Events Emitter (Simple Global Bus)
// ======================================================

import { Trade } from "./types";

type Listener = (t: Trade) => void;

const listeners: Listener[] = [];

export function onTrade(listener: Listener) {
  listeners.push(listener);
}

export function emitTrade(trade: Trade) {
  for (const l of listeners) {
    l(trade);
  }
}
