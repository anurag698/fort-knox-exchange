'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Crown, TrendingUp, Shield, Zap, Check } from 'lucide-react';

interface VipTier {
    name: string;
    level: number;
    requirements: {
        tradingVolume30d: number;
        minBalance: number;
    };
    benefits: {
        makerFeeDiscount: number;
        takerFeeDiscount: number;
        withdrawalFeeDiscount: number;
        dailyWithdrawalLimit: number;
        prioritySupport: boolean;
        apiAccess: boolean;
    };
    color: string;
}

interface UserVipData {
    currentTier: string;
    tradingVolume30d: number;
    currentBalance: number;
    nextTier: string;
    progressToNext: number;
}

export default function VipPage() {
    const [userData, setUserData] = useState<UserVipData | null>(null);
    const [tiers, setTiers] = useState<Record<string, VipTier> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchVipData();
    }, []);

    const fetchVipData = async () => {
        try {
            const response = await fetch('/api/vip?userId=user1');
            const data = await response.json();
            setUserData(data.userVip);
            setTiers(data.tiers);
        } catch (error) {
            console.error('Failed to fetch VIP data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || !userData || !tiers) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const currentTierData = tiers[userData.currentTier];
    const nextTierData = userData.nextTier ? tiers[userData.nextTier] : null;

    return (
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Crown className="h-8 w-8 text-yellow-500" />
                    VIP Membership
                </h1>
                <p className="text-muted-foreground">
                    Unlock exclusive benefits and rewards
                </p>
            </div>

            {/* Current Tier Card */}
            <Card className="border-2" style={{ borderColor: currentTierData.color }}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Crown className="h-6 w-6" style={{ color: currentTierData.color }} />
                                {currentTierData.name} Member
                            </CardTitle>
                            <CardDescription>Your current VIP tier</CardDescription>
                        </div>
                        <Badge
                            className="text-lg px-4 py-2"
                            style={{ backgroundColor: currentTierData.color, color: '#000' }}
                        >
                            Level {currentTierData.level}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">30-Day Trading Volume</p>
                            <p className="text-2xl font-bold">${userData.tradingVolume30d.toLocaleString()}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Current Balance</p>
                            <p className="text-2xl font-bold">${userData.currentBalance.toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Progress to Next Tier */}
            {nextTierData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Progress to {nextTierData.name}</CardTitle>
                        <CardDescription>Keep trading to unlock the next tier</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>Overall Progress</span>
                                <span className="font-medium">{userData.progressToNext}%</span>
                            </div>
                            <Progress value={userData.progressToNext} className="h-3" />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Trading Volume Needed</p>
                                <p className="text-lg font-medium">
                                    ${(nextTierData.requirements.tradingVolume30d - userData.tradingVolume30d).toLocaleString()} more
                                </p>
                                <Progress
                                    value={(userData.tradingVolume30d / nextTierData.requirements.tradingVolume30d) * 100}
                                    className="h-2"
                                />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Balance Needed</p>
                                <p className="text-lg font-medium">
                                    ${Math.max(0, nextTierData.requirements.minBalance - userData.currentBalance).toLocaleString()} more
                                </p>
                                <Progress
                                    value={(userData.currentBalance / nextTierData.requirements.minBalance) * 100}
                                    className="h-2"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Current Benefits */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Benefits</CardTitle>
                    <CardDescription>Exclusive perks for {currentTierData.name} members</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="flex items-start gap-3">
                            <div className="rounded-full bg-primary/10 p-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">Trading Fee Discount</p>
                                <p className="text-sm text-muted-foreground">
                                    Maker: {currentTierData.benefits.makerFeeDiscount}% off
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Taker: {currentTierData.benefits.takerFeeDiscount}% off
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="rounded-full bg-primary/10 p-2">
                                <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">Withdrawal Benefits</p>
                                <p className="text-sm text-muted-foreground">
                                    {currentTierData.benefits.withdrawalFeeDiscount}% fee discount
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    ${currentTierData.benefits.dailyWithdrawalLimit.toLocaleString()} daily limit
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="rounded-full bg-primary/10 p-2">
                                <Shield className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">Priority Support</p>
                                <p className="text-sm text-muted-foreground">
                                    {currentTierData.benefits.prioritySupport ? (
                                        <span className="text-green-600 flex items-center gap-1">
                                            <Check className="h-4 w-4" /> Enabled
                                        </span>
                                    ) : (
                                        'Not available'
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="rounded-full bg-primary/10 p-2">
                                <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">API Access</p>
                                <p className="text-sm text-muted-foreground">
                                    {currentTierData.benefits.apiAccess ? (
                                        <span className="text-green-600 flex items-center gap-1">
                                            <Check className="h-4 w-4" /> Enabled
                                        </span>
                                    ) : (
                                        'Not available'
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* All Tiers Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>VIP Tier Comparison</CardTitle>
                    <CardDescription>See what you can unlock</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        {Object.entries(tiers).map(([key, tier]) => (
                            <div
                                key={key}
                                className={`p-4 rounded-lg border-2 ${key === userData.currentTier ? 'border-primary' : 'border-border'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Crown className="h-5 w-5" style={{ color: tier.color }} />
                                    <h3 className="font-bold">{tier.name}</h3>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Requirements:</p>
                                        <p className="font-medium">${tier.requirements.tradingVolume30d.toLocaleString()} volume</p>
                                        <p className="font-medium">${tier.requirements.minBalance.toLocaleString()} balance</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Fee Discounts:</p>
                                        <p>Maker: {tier.benefits.makerFeeDiscount}%</p>
                                        <p>Taker: {tier.benefits.takerFeeDiscount}%</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
