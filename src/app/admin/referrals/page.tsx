'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2 } from 'lucide-react';

interface ReferralSettings {
    enabled: boolean;
    defaultCommissionRate: number;
    tier1Rate: number;
    tier2Rate: number;
    tier3Rate: number;
    tier4Rate: number;
    tier1Threshold: number;
    tier2Threshold: number;
    tier3Threshold: number;
    minimumWithdrawal: number;
    cookieDuration: number;
}

export default function AdminReferralSettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<ReferralSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/admin/referral-settings');
            const data = await response.json();
            setSettings(data.settings);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);

        try {
            const response = await fetch('/api/admin/referral-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Settings Saved',
                    description: 'Referral settings updated successfully.',
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

    const updateSetting = (key: keyof ReferralSettings, value: any) => {
        if (!settings) return;
        setSettings({ ...settings, [key]: value });
    };

    if (isLoading || !settings) {
        return <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>;
    }

    return (
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">
                        Referral Program Settings
                    </h1>
                    <p className="text-muted-foreground">
                        Configure commission rates and referral tiers
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

            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Program Status</CardTitle>
                        <CardDescription>Enable or disable the referral program</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <Label className="text-base">Referral Program Enabled</Label>
                            <Switch
                                checked={settings.enabled}
                                onCheckedChange={(checked) => updateSetting('enabled', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Commission Tiers</CardTitle>
                        <CardDescription>
                            Set commission rates based on number of referrals
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tier1Rate">Tier 1 Rate (%)</Label>
                                <Input
                                    id="tier1Rate"
                                    type="number"
                                    step="1"
                                    value={settings.tier1Rate}
                                    onChange={(e) => updateSetting('tier1Rate', parseFloat(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    1-{settings.tier1Threshold} referrals
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tier1Threshold">Tier 1 Max Referrals</Label>
                                <Input
                                    id="tier1Threshold"
                                    type="number"
                                    value={settings.tier1Threshold}
                                    onChange={(e) => updateSetting('tier1Threshold', parseInt(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tier2Rate">Tier 2 Rate (%)</Label>
                                <Input
                                    id="tier2Rate"
                                    type="number"
                                    step="1"
                                    value={settings.tier2Rate}
                                    onChange={(e) => updateSetting('tier2Rate', parseFloat(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {settings.tier1Threshold + 1}-{settings.tier2Threshold} referrals
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tier2Threshold">Tier 2 Max Referrals</Label>
                                <Input
                                    id="tier2Threshold"
                                    type="number"
                                    value={settings.tier2Threshold}
                                    onChange={(e) => updateSetting('tier2Threshold', parseInt(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tier3Rate">Tier 3 Rate (%)</Label>
                                <Input
                                    id="tier3Rate"
                                    type="number"
                                    step="1"
                                    value={settings.tier3Rate}
                                    onChange={(e) => updateSetting('tier3Rate', parseFloat(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {settings.tier2Threshold + 1}-{settings.tier3Threshold} referrals
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tier3Threshold">Tier 3 Max Referrals</Label>
                                <Input
                                    id="tier3Threshold"
                                    type="number"
                                    value={settings.tier3Threshold}
                                    onChange={(e) => updateSetting('tier3Threshold', parseInt(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tier4Rate">Tier 4 Rate (%)</Label>
                            <Input
                                id="tier4Rate"
                                type="number"
                                step="1"
                                value={settings.tier4Rate}
                                onChange={(e) => updateSetting('tier4Rate', parseFloat(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">
                                {settings.tier3Threshold + 1}+ referrals
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Withdrawal Settings</CardTitle>
                        <CardDescription>Configure earning withdrawal rules</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="minWithdrawal">Minimum Withdrawal (USDT)</Label>
                            <Input
                                id="minWithdrawal"
                                type="number"
                                value={settings.minimumWithdrawal}
                                onChange={(e) => updateSetting('minimumWithdrawal', parseFloat(e.target.value))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cookieDuration">Referral Cookie Duration (days)</Label>
                            <Input
                                id="cookieDuration"
                                type="number"
                                value={settings.cookieDuration}
                                onChange={(e) => updateSetting('cookieDuration', parseInt(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">
                                How long referral tracking lasts after clicking link
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
