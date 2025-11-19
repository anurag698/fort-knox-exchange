"use client";

// Placeholder for the order book panel
export default function OrderbookPanel({ pair }: { pair: string }) {
    return (
        <div className="p-4 h-full">
            <h3 className="font-semibold text-sm">Order Book</h3>
            <div className="mt-4 text-xs text-muted-foreground">
                Live order book for {pair} will be here.
            </div>
        </div>
    );
}
