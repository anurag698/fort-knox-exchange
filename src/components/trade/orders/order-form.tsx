"use client";

// Placeholder for the main order form component
export default function OrderForm({ pair }: { pair: string }) {
    return (
        <div className="p-4">
            <h3 className="font-semibold text-lg">Trade {pair}</h3>
            <div className="mt-4 text-sm text-muted-foreground">
                Order form (Limit, Market, Stop) will be here.
            </div>
        </div>
    );
}
