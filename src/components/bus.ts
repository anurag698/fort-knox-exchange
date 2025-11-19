'use client';

type Handler = (...args: any[]) => any;

class EventBus {
  private map = new Map<string, Set<Handler>>();
  on(event: string, fn: Handler) {
    const s = this.map.get(event) || new Set();
    s.add(fn);
    this.map.set(event, s);
  }
  off(event: string, fn?: Handler) {
    if (!fn) { this.map.delete(event); return; }
    const s = this.map.get(event); if (!s) return;
    s.delete(fn);
  }
  offSafe(event: string, fn?: Handler) { this.off(event, fn); }
  emit(event: string, payload?: any) {
    const s = this.map.get(event); if (!s) return;
    for (const fn of Array.from(s)) {
      try { fn(payload); } catch (e) { console.warn("bus handler failed", e); }
    }
  }
}
export const bus = new EventBus();
export default bus;
