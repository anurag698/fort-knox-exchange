"use client";

import React from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OrderConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    orderDetails: {
        side: "BUY" | "SELL";
        type: "LIMIT" | "MARKET";
        quantity: number;
        price?: number;
        total: number;
        market: string;
    };
}

export function OrderConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    orderDetails,
}: OrderConfirmationDialogProps) {
    const { side, type, quantity, price, total, market } = orderDetails;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Confirm {side} Order
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3 text-sm">
                            <p>Please review your order details:</p>

                            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Market:</span>
                                    <span className="font-semibold">{market}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Side:</span>
                                    <span className={side === "BUY" ? "text-green-500 font-semibold" : "text-red-500 font-semibold"}>
                                        {side}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Type:</span>
                                    <span className="font-semibold">{type}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Amount:</span>
                                    <span className="font-semibold">{quantity.toFixed(6)}</span>
                                </div>

                                {type === "LIMIT" && price && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Price:</span>
                                        <span className="font-semibold">{price.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between pt-2 border-t border-border">
                                    <span className="text-muted-foreground font-semibold">Total:</span>
                                    <span className="font-bold">{total.toFixed(2)} USDT</span>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                {side === "BUY"
                                    ? "By confirming, you will buy the specified amount."
                                    : "By confirming, you will sell the specified amount."}
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={side === "BUY" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
                    >
                        Confirm {side}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
