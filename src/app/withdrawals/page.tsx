'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/providers/azure-auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Withdrawal {
    id: string;
    chain: string;
    amount: number;
    destinationAddress: string;
    status: 'pending' | 'processing' | 'broadcasted' | 'confirmed' | 'failed' | 'cancelled';
    networkFee: number;
    totalDeducted: number;
    txHash?: string;
    requestedAt: string;
    failureReason?: string;
}

const CHAINS = ['ETH', 'MATIC', 'BSC', 'BTC'] as const;
type Chain = typeof CHAINS[number];

export default function WithdrawalsPage() {
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();
    const [selectedChain, setSelectedChain] = useState<Chain>('ETH');
    const [amount, setAmount] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [estimatedFee, setEstimatedFee] = useState<number | null>(null);
    const [kycStatus, setKycStatus] = useState<'none' | 'pending' | 'approved' | 'rejected' | null>(null);

    // Check KYC Status
    useEffect(() => {
        const checkKYC = async () => {
            if (!user) return;
            try {
                const res = await fetch(`/api/kyc/status?userId=${user.uid}`);
                if (res.ok) {
                    const data = await res.json();
                    setKycStatus(data.kycStatus);
                }
            } catch (error) {
                console.error('Error checking KYC:', error);
            }
        };
        checkKYC();
    }, [user]);

    // Fetch withdrawal history
    const fetchWithdrawals = async () => {
        if (!user) return;

        try {
            const res = await fetch(`/api/withdrawals?userId=${user.uid}`);
            if (res.ok) {
                const data = await res.json();
                setWithdrawals(data.withdrawals || []);
            }
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchWithdrawals();
        }
    }, [user]);

    // Estimate fees when chain changes (simple static estimation for UI feedback)
    useEffect(() => {
        // In a real app, we'd call an API to get dynamic fee estimates
        // For now, we'll use the same logic as the backend service
        const estimateFee = () => {
            switch (selectedChain) {
                case 'ETH': return 0.002;
                case 'BSC': return 0.001;
                case 'MATIC': return 0.01;
                case 'BTC': return 0.0001;
                default: return 0;
            }
        };
        setEstimatedFee(estimateFee());
    }, [selectedChain]);

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!amount || parseFloat(amount) <= 0) {
            toast({ title: 'Invalid Amount', description: 'Please enter a valid amount', variant: 'destructive' });
            return;
        }

        if (!address) {
            toast({ title: 'Invalid Address', description: 'Please enter a destination address', variant: 'destructive' });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/withdrawals/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    chain: selectedChain,
                    amount: parseFloat(amount),
                    destinationAddress: address
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast({ title: 'Success', description: 'Withdrawal requested successfully' });
                setAmount('');
                setAddress('');
                fetchWithdrawals();
                // Switch to history tab
                const historyTab = document.querySelector('[value="history"]') as HTMLElement;
                if (historyTab) historyTab.click();
            } else {
                toast({ title: 'Error', description: data.error || 'Failed to request withdrawal', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Error requesting withdrawal', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!user) return;

        if (!confirm('Are you sure you want to cancel this withdrawal?')) return;

        try {
            const res = await fetch(`/api/withdrawals/${id}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid })
            });

            if (res.ok) {
                toast({ title: 'Cancelled', description: 'Withdrawal cancelled' });
                fetchWithdrawals();
            } else {
                const data = await res.json();
                toast({ title: 'Error', description: data.error || 'Failed to cancel withdrawal', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Error cancelling withdrawal', variant: 'destructive' });
        }
    };

    const getStatusColor = (status: Withdrawal['status']) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/10 text-yellow-500';
            case 'processing': return 'bg-blue-500/10 text-blue-500';
            case 'broadcasted': return 'bg-purple-500/10 text-purple-500';
            case 'confirmed': return 'bg-green-500/10 text-green-500';
            case 'failed': return 'bg-red-500/10 text-red-500';
            case 'cancelled': return 'bg-gray-500/10 text-gray-500';
        }
    };

    const getChainColor = (chain: string) => {
        switch (chain) {
            case 'ETH': return 'bg-purple-500/10 text-purple-500';
            case 'MATIC': return 'bg-indigo-500/10 text-indigo-500';
            case 'BSC': return 'bg-amber-500/10 text-amber-500';
            case 'BTC': return 'bg-orange-500/10 text-orange-500';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    };

    if (!user) {
        return (
            <div className="container max-w-4xl mx-auto px-4 py-8">
                <Card>
                    <CardContent className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">Please sign in to withdraw funds</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-6xl mx-auto px-4 py-8">
            {/* KYC Blocking Dialog */}
            <AlertDialog open={kycStatus !== null && kycStatus !== 'approved'}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-yellow-500" />
                            Identity Verification Required
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            To ensure the security of your funds and comply with regulations,
                            you must complete Identity Verification (KYC) before making withdrawals.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => router.push('/kyc')}>
                            Complete Verification
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Withdrawals</h1>
                <p className="text-muted-foreground">
                    Withdraw your cryptocurrency to an external wallet
                </p>
            </div>

            <Tabs defaultValue="withdraw" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="withdraw">Request Withdrawal</TabsTrigger>
                    <TabsTrigger value="history">Withdrawal History</TabsTrigger>
                </TabsList>

                {/* Request Withdrawal Tab */}
                <TabsContent value="withdraw" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Request Withdrawal</CardTitle>
                            <CardDescription>
                                Select asset and enter destination address
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleWithdraw} className="space-y-6">
                                {/* Chain Selector */}
                                <div className="space-y-2">
                                    <Label>Asset / Network</Label>
                                    <div className="flex gap-2">
                                        {CHAINS.map((chain) => (
                                            <Button
                                                key={chain}
                                                type="button"
                                                variant={selectedChain === chain ? 'default' : 'outline'}
                                                onClick={() => setSelectedChain(chain)}
                                            >
                                                {chain}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Amount Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount</Label>
                                    <div className="relative">
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="any"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="pr-16"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                                            {selectedChain}
                                        </div>
                                    </div>
                                    {estimatedFee && (
                                        <p className="text-xs text-muted-foreground">
                                            Estimated Network Fee: ~{estimatedFee} {selectedChain}
                                        </p>
                                    )}
                                </div>

                                {/* Address Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="address">Destination Address</Label>
                                    <Input
                                        id="address"
                                        placeholder={`Enter ${selectedChain} address`}
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                    />
                                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                                        ⚠️ Ensure the address is correct. Withdrawals cannot be reversed.
                                    </p>
                                </div>

                                <Button type="submit" className="w-full" disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowUpRight className="mr-2 h-4 w-4" />
                                            Withdraw Funds
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Withdrawal History</CardTitle>
                                <CardDescription>View status of your withdrawal requests</CardDescription>
                            </div>
                            <Button size="sm" variant="outline" onClick={fetchWithdrawals}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {withdrawals.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No withdrawals found.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {withdrawals.map((wd) => (
                                        <div
                                            key={wd.id}
                                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Badge className={getChainColor(wd.chain)}>
                                                        {wd.chain}
                                                    </Badge>
                                                    <Badge className={getStatusColor(wd.status)}>
                                                        {wd.status}
                                                    </Badge>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-semibold">
                                                        {wd.amount} {wd.chain}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(wd.requestedAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs">To: {wd.destinationAddress}</span>
                                                    <span className="text-xs">Fee: {wd.networkFee} {wd.chain}</span>
                                                </div>

                                                {wd.status === 'pending' && (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="h-7 text-xs"
                                                        onClick={() => handleCancel(wd.id)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}

                                                {wd.txHash && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-xs"
                                                        onClick={() => window.open(`https://${wd.chain === 'ETH' ? 'etherscan.io' : wd.chain === 'BSC' ? 'bscscan.com' : wd.chain === 'MATIC' ? 'polygonscan.com' : 'mempool.space'}/tx/${wd.txHash}`, '_blank')}
                                                    >
                                                        View Transaction <ExternalLink className="ml-1 h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>

                                            {wd.failureReason && (
                                                <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {wd.failureReason}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
