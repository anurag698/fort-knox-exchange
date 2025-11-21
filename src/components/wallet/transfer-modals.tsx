"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, ArrowRight, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Asset } from "@/lib/types";

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset?: Asset;
}

export function DepositModal({ isOpen, onClose, asset }: DepositModalProps) {
    const [copied, setCopied] = useState(false);
    const address = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"; // Mock address

    const handleCopy = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        toast.success("Address copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] glass border-primary/20">
                <DialogHeader>
                    <DialogTitle>Deposit {asset?.symbol}</DialogTitle>
                    <DialogDescription>
                        Send only {asset?.name} ({asset?.symbol}) to this address.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-4">
                    {/* QR Code Placeholder */}
                    <div className="flex justify-center">
                        <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-lg flex items-center justify-center">
                            {/* Simulated QR Code */}
                            <div className="w-full h-full bg-neutral-900 rounded-lg opacity-10 pattern-dots" />
                            <span className="absolute text-black font-bold opacity-50">QR CODE</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Deposit Address</Label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 p-3 rounded-lg bg-muted/50 font-mono text-xs break-all border border-border">
                                {address}
                            </div>
                            <Button size="icon" variant="outline" onClick={handleCopy}>
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>Sending any other coin or token to this address may result in the loss of your deposit.</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset?: Asset;
    balance: number;
}

export function WithdrawModal({ isOpen, onClose, asset, balance }: WithdrawModalProps) {
    const [amount, setAmount] = useState("");
    const [address, setAddress] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleWithdraw = () => {
        if (!amount || !address) return;
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            toast.success(`Withdrawal of ${amount} ${asset?.symbol} initiated`);
            onClose();
        }, 1500);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] glass border-primary/20">
                <DialogHeader>
                    <DialogTitle>Withdraw {asset?.symbol}</DialogTitle>
                    <DialogDescription>
                        Available Balance: {balance} {asset?.symbol}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Address</Label>
                        <Input
                            placeholder={`Enter ${asset?.symbol} Address`}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Amount</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pr-16"
                            />
                            <button
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary font-medium hover:underline"
                                onClick={() => setAmount(balance.toString())}
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>Network Fee</span>
                        <span>0.0005 {asset?.symbol}</span>
                    </div>
                </div>

                <Button
                    className="w-full gap-2"
                    onClick={handleWithdraw}
                    disabled={isLoading || !amount || !address}
                >
                    {isLoading ? "Processing..." : "Confirm Withdrawal"}
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
