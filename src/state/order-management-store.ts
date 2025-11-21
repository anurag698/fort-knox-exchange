import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Trade {
    id: string;
    pair: string;
    side: 'buy' | 'sell';
    price: number;
    quantity: number;
    total: number;
    timestamp: number;
    status: 'pending' | 'completed' | 'failed';
}

interface OrderState {
    trades: Trade[];
    isLoading: boolean;
    addTrade: (trade: Trade) => void;
    setLoading: (loading: boolean) => void;
    clearTrades: () => void;
}

export const useOrderStore = create<OrderState>()(
    persist(
        (set) => ({
            trades: [],
            isLoading: false,
            addTrade: (trade) =>
                set((state) => ({
                    trades: [trade, ...state.trades].slice(0, 50), // Keep last 50 trades
                })),
            setLoading: (loading) => set({ isLoading: loading }),
            clearTrades: () => set({ trades: [] }),
        }),
        {
            name: 'fort-knox-order-store',
        }
    )
);
