'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Crown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TierConfig {
    requirements: {
        tradingVolume30d: number;
        minBalance: number;
    };
    benefits: {
        makerFeeDiscount: number;
        takerFeeDiscount: number;
        withdrawalFeeDiscount: number;
        dailyWithdrawalLimit: number;
    };
}

type VipConfig = Record<string, TierConfig>;

export default function AdminVipPage() {
    const { toast } = useToast();
    const [config, setConfig] = useState<VipConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await fetch('/api/admin/vip-settings');
            const data = await response.json();
            setConfig(data.config);
        } catch (error) {
            console.error('Failed to fetch VIP config:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;
        setIsSaving(true);

        try {
            const response = await fetch('/api/admin/vip-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Settings Saved',
                    description: 'VIP tier settings updated successfully.',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save settings',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const updateTier = (tier: string, field: string, subfield: string, value: number) => {
        if (!config) return;

        setConfig({
            ...config,
            [tier]: {
                ...config[tier],
                [field]: {
                    ...config[tier][field as keyof TierConfig],
                    [subfield]: value,
                },
            },
        });
    };

    if (isLoading || !config) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const tiers = [
        { key: 'bronze', name: 'Bronze', color: '#CD7F32' },
        { key: 'silver', name: 'Silver', color: '#C0C0C0' },
        { key: 'gold', name: 'Gold', color: '#FFD700' },
        { key: 'platinum', name: 'Platinum', color: '#E5E4E2' },
        { key: 'diamond', name: 'Diamond', color: '#B9F2FF' },
    ];

    return (
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Crown className="h-8 w-8 text-yellow-500" />
                        VIP Tier Settings
                    </h1>
                    <p className="text-muted-foreground">
                        Configure requirements and benefits for each tier
                    </p>
                </div>

                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
                </Button>
            </div>

            <Tabs defaultValue="bronze" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    {tiers.map((tier) => (
                        <TabsTrigger key={tier.key} value={tier.key}>
                            {tier.name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {tiers.map((tier) => (
                    <TabsContent key={tier.key} value={tier.key}>
                        <div className="grid gap-4">
                            <Card style={{ borderLeft: `4px solid ${tier.color}` }}>
                                <CardHeader>
                                    <CardTitle>{tier.name} Tier Requirements</CardTitle>
                                    <CardDescription>
                                        Set the requirements to qualify for this tier
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor={`${tier.key}-volume`}>
                                                30-Day Trading Volume (USDT)
                                            </Label>
                                            <Input
                                                id={`${tier.key}-volume`}
                                                type="number"
                                                value={config[tier.key].requirements.tradingVolume30d}
                                                onChange={(e) =>
                                                    updateTier(tier.key, 'requirements', 'tradingVolume30d', parseFloat(e.target.value))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`${tier.key}-balance`}>
                                                Minimum Balance (USDT)
                                            </Label>
                                            <Input
                                                id={`${tier.key}-balance`}
                                                type="number"
                                                value={config[tier.key].requirements.minBalance}
                                                onChange={(e) =>
                                                    updateTier(tier.key, 'requirements', 'minBalance', parseFloat(e.target.value))
                                                }
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card style={{ borderLeft: `4px solid ${tier.color}` }}>
                                <CardHeader>
                                    <CardTitle>{tier.name} Tier Benefits</CardTitle>
                                    <CardDescription>
                                        Configure the benefits for this tier
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor={`${tier.key}-maker`}>
                                                Maker Fee Discount (%)
                                            </Label>
                                            <Input
                                                id={`${tier.key}-maker`}
                                                type="number"
                                                step="1"
                                                min="0"
                                                max="100"
                                                value={config[tier.key].benefits.makerFeeDiscount}
                                                onChange={(e) =>
                                                    updateTier(tier.key, 'benefits', 'makerFeeDiscount', parseFloat(e.target.value))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`${tier.key}-taker`}>
                                                Taker Fee Discount (%)
                                            </Label>
                                            <Input
                                                id={`${tier.key}-taker`}
                                                type="number"
                                                step="1"
                                                min="0"
                                                max="100"
                                                value={config[tier.key].benefits.takerFeeDiscount}
                                                onChange={(e) =>
                                                    updateTier(tier.key, 'benefits', 'takerFeeDiscount', parseFloat(e.target.value))
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor={`${tier.key}-withdrawal-discount`}>
                                                Withdrawal Fee Discount (%)
                                            </Label>
                                            <Input
                                                id={`${tier.key}-withdrawal-discount`}
                                                type="number"
                                                step="1"
                                                min="0"
                                                max="100"
                                                value={config[tier.key].benefits.withdrawalFeeDiscount}
                                                onChange={(e) =>
                                                    updateTier(tier.key, 'benefits', 'withdrawalFeeDiscount', parseFloat(e.target.value))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`${tier.key}-withdrawal-limit`}>
                                                Daily Withdrawal Limit (USDT)
                                            </Label>
                                            <Input
                                                id={`${tier.key}-withdrawal-limit`}
                                                type="number"
                                                value={config[tier.key].benefits.dailyWithdrawalLimit}
                                                onChange={(e) =>
                                                    updateTier(tier.key, 'benefits', 'dailyWithdrawalLimit', parseFloat(e.target.value))
                                                }
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
