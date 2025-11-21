"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/providers/azure-auth-provider";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";
import { Loader2, ShieldCheck, ShieldAlert, Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function TwoFactorSetup() {
    const { user } = useUser();
    const { toast } = useToast();

    const [isEnabled, setIsEnabled] = useState(false); // In real app, init from user profile
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const startSetup = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/2fa/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.uid,
                    email: user?.email
                }),
            });

            const data = await response.json();

            if (data.secret && data.otpauthUrl) {
                setSecret(data.secret);
                // Generate QR code data URL
                const url = await QRCode.toDataURL(data.otpauthUrl);
                setQrCodeUrl(url);
                setIsSettingUp(true);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to start 2FA setup. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const verifyAndEnable = async () => {
        if (!verificationCode || !secret) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.uid,
                    token: verificationCode,
                    secret: secret
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsEnabled(true);
                setIsSettingUp(false);
                setVerificationCode("");
                toast({
                    title: "Success",
                    description: "Two-Factor Authentication has been enabled!",
                });
            } else {
                toast({
                    title: "Verification Failed",
                    description: data.error || "Invalid code. Please try again.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to verify code. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const disable2FA = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/2fa/verify', { // Using verify route DELETE method
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.uid }),
            });

            if (response.ok) {
                setIsEnabled(false);
                toast({
                    title: "2FA Disabled",
                    description: "Two-Factor Authentication has been turned off.",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to disable 2FA.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const copySecret = () => {
        if (secret) {
            navigator.clipboard.writeText(secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex gap-3 items-start">
                <div className={`mt-1 p-2 rounded-full ${isEnabled ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {isEnabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                </div>
                <div>
                    <p className="font-medium">Two-Factor Authentication (2FA)</p>
                    <p className="text-sm text-muted-foreground">
                        {isEnabled
                            ? "Your account is secured with 2FA."
                            : "Add an extra layer of security to your account."}
                    </p>
                </div>
            </div>

            {isEnabled ? (
                <Button variant="outline" onClick={disable2FA} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Disable
                </Button>
            ) : (
                <Dialog open={isSettingUp} onOpenChange={(open) => !open && setIsSettingUp(false)}>
                    <DialogTrigger asChild>
                        <Button onClick={startSetup} disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Enable 2FA
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
                            <DialogDescription>
                                Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col items-center gap-6 py-4">
                            {qrCodeUrl ? (
                                <div className="p-4 bg-white rounded-lg shadow-sm">
                                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                                </div>
                            ) : (
                                <div className="w-48 h-48 flex items-center justify-center bg-muted rounded-lg">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            )}

                            <div className="w-full space-y-2">
                                <Label className="text-xs text-muted-foreground text-center block">
                                    Can't scan? Enter this code manually:
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={secret || ""}
                                        readOnly
                                        className="font-mono text-center bg-muted"
                                    />
                                    <Button size="icon" variant="outline" onClick={copySecret}>
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="w-full space-y-2">
                                <Label htmlFor="code">Verification Code</Label>
                                <Input
                                    id="code"
                                    placeholder="Enter 6-digit code"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="text-center text-lg tracking-widest"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsSettingUp(false)}>Cancel</Button>
                            <Button onClick={verifyAndEnable} disabled={verificationCode.length !== 6 || isLoading}>
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Verify & Enable
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
