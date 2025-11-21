"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TwoFactorVerificationModalProps {
    isOpen: boolean;
    onVerify: (code: string) => Promise<boolean>;
    onCancel: () => void;
}

export function TwoFactorVerificationModal({ isOpen, onVerify, onCancel }: TwoFactorVerificationModalProps) {
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleVerify = async () => {
        if (code.length !== 6) return;

        setIsLoading(true);
        try {
            const success = await onVerify(code);
            if (!success) {
                toast({
                    title: "Verification Failed",
                    description: "Invalid 2FA code. Please try again.",
                    variant: "destructive",
                });
                setCode("");
            }
        } catch (error) {
            console.error("Verification error:", error);
            toast({
                title: "Error",
                description: "An error occurred during verification.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        Two-Factor Authentication
                    </DialogTitle>
                    <DialogDescription>
                        Enter the 6-digit code from your authenticator app to continue.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="2fa-code">Verification Code</Label>
                        <Input
                            id="2fa-code"
                            placeholder="000000"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && code.length === 6) {
                                    handleVerify();
                                }
                            }}
                        />
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleVerify} disabled={code.length !== 6 || isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Verify
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
