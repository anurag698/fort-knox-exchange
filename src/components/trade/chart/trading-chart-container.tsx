"use client";

// Placeholder for the main trading chart container
export default function TradingChart({ pair }: { pair: string }) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-background">
            <p className="text-muted-foreground">Trading Chart for {pair} will load here.</p>
        </div>
    );
}
