import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface TradeConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    loading: boolean;
    tradeDetails: {
        pair: string;
        side: 'buy' | 'sell';
        price: number;
        quantity: number;
        total: number;
    } | null;
}

export function TradeConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    loading,
    tradeDetails,
}: TradeConfirmationDialogProps) {
    if (!tradeDetails) return null;

    const isBuy = tradeDetails.side === 'buy';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] glass border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Confirm Trade</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Please review your order details before confirming.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-gray-400">Pair</span>
                        <span className="font-medium">{tradeDetails.pair}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-gray-400">Side</span>
                        <span className={`font-medium uppercase ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                            {tradeDetails.side}
                        </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-gray-400">Price</span>
                        <span className="font-medium">${tradeDetails.price.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-gray-400">Quantity</span>
                        <span className="font-medium">{tradeDetails.quantity}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20 mt-2">
                        <span className="text-gray-300 font-medium">Total Value</span>
                        <span className="text-xl font-bold text-primary">
                            ${tradeDetails.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="border-white/10 hover:bg-white/5 hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`min-w-[100px] ${isBuy
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            'Confirm Order'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
