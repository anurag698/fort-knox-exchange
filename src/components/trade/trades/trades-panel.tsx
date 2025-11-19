"use client";

// Placeholder for the recent trades panel (tape)
export default function TradesPanel({ pair }: { pair: string }) {
    return (
        <div className="p-4 h-full">
            <h3 className="font-semibold text-sm">Market Trades</h3>
            <div className="mt-4 text-xs text-muted-foreground">
                Live trade feed for {pair} will be here.
            </div>
        </div>
    );
}
