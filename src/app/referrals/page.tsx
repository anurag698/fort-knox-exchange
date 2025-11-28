'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, DollarSign, Users, TrendingUp, Gift } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface ReferralData {
    referralCode: string;
    totalReferrals: number;
    activeReferrals: number;
    totalEarnings: number;
    availableBalance: number;
    lifetimeCommission: number;
    currentTier: number;
    referredUsers: Array<{
        id: string;
        username: string;
        joinedAt: string;
        tradingVolume: number;
        commission: number;
    }>;
}

export default function ReferralPage() {
    const { toast } = useToast();
    const [data, setData] = useState<ReferralData | null>(null);
    const [copied, setCopied] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchReferralData();
    }, []);

    const fetchReferralData = async () => {
        try {
            const response = await fetch('/api/referrals?userId=user1');
            const result = await response.json();
            setData(result.data);
        } catch (error) {
            console.error('Failed to fetch referral data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyReferralLink = () => {
        if (!data) return;
        const link = `${window.location.origin}?ref=${data.referralCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        toast({
            title: 'Link Copied!',
            description: 'Referral link copied to clipboard',
        });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWithdraw = async () => {
        if (!data || !withdrawAmount) return;

        try {
            const response = await fetch('/api/referrals/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'user1',
                    amount: parseFloat(withdrawAmount),
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: 'Withdrawal Requested',
                    description: result.message,
                });
                setWithdrawAmount('');
                fetchReferralData();
            } else {
                toast({
                    title: 'Error',
                    description: result.error,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to process withdrawal',
                variant: 'destructive',
            });
        }
    };

    if (isLoading || !data) {
        return <div className="flex items-center justify-center h-96">Loading...</div>;
    }

    return (
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    Referral Program
                </h1>
                <p className="text-muted-foreground">
                    Earn rewards by inviting friends to trade
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalReferrals}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.activeReferrals} active traders
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${data.availableBalance.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Ready to withdraw</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lifetime Earnings</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${data.lifetimeCommission.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">All-time commission</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tier Level</CardTitle>
                        <Gift className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Tier {data.currentTier}</div>
                        <p className="text-xs text-muted-foreground">Commission rate: {20 + (data.currentTier - 1) * 5}%</p>
                    </CardContent>
                </Card>
            </div>

            {/* Referral Link */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Referral Link</CardTitle>
                    <CardDescription>Share this link to earn commissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            readOnly
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${data.referralCode}`}
                            className="font-mono"
                        />
                        <Button onClick={copyReferralLink} variant="outline">
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">Referral Code: {data.referralCode}</Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Withdraw Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Withdraw Earnings</CardTitle>
                    <CardDescription>
                        Minimum withdrawal: $10 USDT
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            placeholder="Amount (USDT)"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            max={data.availableBalance}
                        />
                        <Button
                            onClick={handleWithdraw}
                            disabled={!withdrawAmount || parseFloat(withdrawAmount) > data.availableBalance}
                        >
                            Withdraw
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Referred Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Referred Users</CardTitle>
                    <CardDescription>Track your referrals and their trading activity</CardDescription>
                </CardHeader>
                <CardContent>
                    {data.referredUsers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No referrals yet. Share your link to get started!
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Trading Volume</TableHead>
                                    <TableHead className="text-right">Your Commission</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.referredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.username}</TableCell>
                                        <TableCell>{new Date(user.joinedAt).toLocaleDateString()}</TableCell>
                                        <TableCell>${user.tradingVolume.toLocaleString()}</TableCell>
                                        <TableCell className="text-right text-green-600 font-medium">
                                            ${user.commission.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
                <CardHeader>
                    <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex gap-2">
                        <div className="font-bold text-primary">1.</div>
                        <div>Share your unique referral link with friends</div>
                    </div>
                    <div className="flex gap-2">
                        <div className="font-bold text-primary">2.</div>
                        <div>When they sign up and trade, you earn commission on their trading fees</div>
                    </div>
                    <div className="flex gap-2">
                        <div className="font-bold text-primary">3.</div>
                        <div>Unlock higher commission rates as you refer more users</div>
                    </div>
                    <div className="flex gap-2">
                        <div className="font-bold text-primary">4.</div>
                        <div>Withdraw your earnings anytime (minimum $10 USDT)</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
