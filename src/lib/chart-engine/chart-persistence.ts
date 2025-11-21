// src/lib/chart-engine/chart-persistence.ts

export interface ChartState {
    symbol: string;
    interval: string;
    chartType: "candlestick" | "line" | "area" | "heikin_ashi";
    indicators: string[]; // List of active indicator IDs
    drawings: any[]; // Saved drawings
}

const STORAGE_KEY_PREFIX = "fkx_chart_state_";

export class ChartPersistence {
    static saveState(symbol: string, state: Partial<ChartState>) {
        if (typeof window === "undefined") return;

        const key = `${STORAGE_KEY_PREFIX}${symbol}`;
        try {
            const existing = this.loadState(symbol) || {};
            const merged = { ...existing, ...state };
            localStorage.setItem(key, JSON.stringify(merged));
            console.log(`[Persistence] Saved state for ${symbol}`, merged);
        } catch (e) {
            console.warn("Failed to save chart state", e);
        }
    }

    static loadState(symbol: string): Partial<ChartState> | null {
        if (typeof window === "undefined") return null;

        const key = `${STORAGE_KEY_PREFIX}${symbol}`;
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            console.warn("Failed to load chart state", e);
            return null;
        }
    }
}
