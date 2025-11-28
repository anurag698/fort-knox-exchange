'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ExchangeSettings {
    // Branding
    exchangeName: string;
    tagline: string;
    logoUrl: string;
    primaryColor: string;

    // Trading Fees
    makerFee: number;
    takerFee: number;

    // Withdrawal Settings
    minWithdrawal: number;
    withdrawalFeePercentage: number;

    // Trading Limits
    maxDailyTradingVolume: number;
    maxSingleOrderSize: number;
    minOrderSize: number;

    // Feature Toggles
    enableSpotTrading: boolean;
    enableMarginTrading: boolean;
    enableFutures: boolean;
    enableStaking: boolean;
    enableP2P: boolean;
    enableCopyTrading: boolean;

    // System
    maintenanceMode: boolean;
    tradingHalted: boolean;
    kycRequired: boolean;
    twoFactorRequired: boolean;

    // Announcements
    systemAnnouncement: string;
    announcementEnabled: boolean;
}

export default function SettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<ExchangeSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/admin/settings');
            const data = await response.json();
            setSettings(data.settings);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            toast({
                title: 'Error',
                description: 'Failed to load settings',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);

        try {
            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Settings Saved',
                    description: 'Exchange settings have been updated successfully.',
                });
            } else {
                throw new Error(data.error);
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

    const updateSetting = (key: keyof ExchangeSettings, value: any) => {
        if (!settings) return;
        setSettings({ ...settings, [key]: value });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!settings) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Failed to load settings</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">
                        Exchange Settings
                    </h1>
                    <p className="text-muted-foreground">
                        Customize your exchange without touching code
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

            <Tabs defaultValue="branding" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                    <TabsTrigger value="fees">Fees & Limits</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="system">System</TabsTrigger>
                    <TabsTrigger value="announcements">Announcements</TabsTrigger>
                </TabsList>

                {/* Branding Tab */}
                <TabsContent value="branding">
                    <Card>
                        <CardHeader>
                            <CardTitle>Exchange Branding</CardTitle>
                            <CardDescription>
                                Customize your exchange's appearance and identity
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="exchangeName">Exchange Name</Label>
                                <Input
                                    id="exchangeName"
                                    value={settings.exchangeName}
                                    onChange={(e) => updateSetting('exchangeName', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tagline">Tagline</Label>
                                <Input
                                    id="tagline"
                                    value={settings.tagline}
                                    onChange={(e) => updateSetting('tagline', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="logoUrl">Logo URL</Label>
                                <Input
                                    id="logoUrl"
                                    value={settings.logoUrl}
                                    onChange={(e) => updateSetting('logoUrl', e.target.value)}
                                    placeholder="/logo.png"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="primaryColor">Primary Color (Hex)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="primaryColor"
                                        value={settings.primaryColor}
                                        onChange={(e) => updateSetting('primaryColor', e.target.value)}
                                        placeholder="#8B5CF6"
                                    />
                                    <div
                                        className="w-12 h-10 rounded border"
                                        style={{ backgroundColor: settings.primaryColor }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Fees & Limits Tab */}
                <TabsContent value="fees">
                    <div className="grid gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Trading Fees</CardTitle>
                                <CardDescription>Configure maker and taker fees (in %)</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="makerFee">Maker Fee (%)</Label>
                                        <Input
                                            id="makerFee"
                                            type="number"
                                            step="0.01"
                                            value={settings.makerFee}
                                            onChange={(e) => updateSetting('makerFee', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="takerFee">Taker Fee (%)</Label>
                                        <Input
                                            id="takerFee"
                                            type="number"
                                            step="0.01"
                                            value={settings.takerFee}
                                            onChange={(e) => updateSetting('takerFee', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Withdrawal Settings</CardTitle>
                                <CardDescription>Configure withdrawal limits and fees</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="minWithdrawal">Minimum Withdrawal (USDT)</Label>
                                        <Input
                                            id="minWithdrawal"
                                            type="number"
                                            value={settings.minWithdrawal}
                                            onChange={(e) => updateSetting('minWithdrawal', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="withdrawalFee">Withdrawal Fee (%)</Label>
                                        <Input
                                            id="withdrawalFee"
                                            type="number"
                                            step="0.1"
                                            value={settings.withdrawalFeePercentage}
                                            onChange={(e) =>
                                                updateSetting('withdrawalFeePercentage', parseFloat(e.target.value))
                                            }
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Trading Limits</CardTitle>
                                <CardDescription>Set order and volume limits</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="minOrderSize">Min Order (USDT)</Label>
                                        <Input
                                            id="minOrderSize"
                                            type="number"
                                            value={settings.minOrderSize}
                                            onChange={(e) => updateSetting('minOrderSize', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxOrderSize">Max Order (USDT)</Label>
                                        <Input
                                            id="maxOrderSize"
                                            type="number"
                                            value={settings.maxSingleOrderSize}
                                            onChange={(e) =>
                                                updateSetting('maxSingleOrderSize', parseFloat(e.target.value))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxDailyVolume">Max Daily Volume (USDT)</Label>
                                        <Input
                                            id="maxDailyVolume"
                                            type="number"
                                            value={settings.maxDailyTradingVolume}
                                            onChange={(e) =>
                                                updateSetting('maxDailyTradingVolume', parseFloat(e.target.value))
                                            }
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Features Tab */}
                <TabsContent value="features">
                    <Card>
                        <CardHeader>
                            <CardTitle>Feature Toggles</CardTitle>
                            <CardDescription>Enable or disable trading features</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base">Spot Trading</Label>
                                    <p className="text-sm text-muted-foreground">Basic buy/sell orders</p>
                                </div>
                                <Switch
                                    checked={settings.enableSpotTrading}
                                    onCheckedChange={(checked) => updateSetting('enableSpotTrading', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base">Margin Trading</Label>
                                    <p className="text-sm text-muted-foreground">Leveraged trading</p>
                                </div>
                                <Switch
                                    checked={settings.enableMarginTrading}
                                    onCheckedChange={(checked) => updateSetting('enableMarginTrading', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base">Futures Trading</Label>
                                    <p className="text-sm text-muted-foreground">Perpetual and futures contracts</p>
                                </div>
                                <Switch
                                    checked={settings.enableFutures}
                                    onCheckedChange={(checked) => updateSetting('enableFutures', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base">Staking</Label>
                                    <p className="text-sm text-muted-foreground">Earn rewards by staking</p>
                                </div>
                                <Switch
                                    checked={settings.enableStaking}
                                    onCheckedChange={(checked) => updateSetting('enableStaking', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base">P2P Trading</Label>
                                    <p className="text-sm text-muted-foreground">Peer-to-peer marketplace</p>
                                </div>
                                <Switch
                                    checked={settings.enableP2P}
                                    onCheckedChange={(checked) => updateSetting('enableP2P', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base">Copy Trading</Label>
                                    <p className="text-sm text-muted-foreground">Follow and copy expert traders</p>
                                </div>
                                <Switch
                                    checked={settings.enableCopyTrading}
                                    onCheckedChange={(checked) => updateSetting('enableCopyTrading', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* System Tab */}
                <TabsContent value="system">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Controls</CardTitle>
                            <CardDescription>Emergency controls and security settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Warning</AlertTitle>
                                <AlertDescription>
                                    These settings affect all users immediately. Use with caution.
                                </AlertDescription>
                            </Alert>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base">Maintenance Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Disable all trading and show maintenance message
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.maintenanceMode}
                                    onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base">Trading Halted</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Emergency stop - halt all trading immediately
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.tradingHalted}
                                    onCheckedChange={(checked) => updateSetting('tradingHalted', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base">KYC Required</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Require KYC verification for trading
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.kycRequired}
                                    onCheckedChange={(checked) => updateSetting('kycRequired', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base">2FA Required</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Force all users to enable 2FA
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.twoFactorRequired}
                                    onCheckedChange={(checked) => updateSetting('twoFactorRequired', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Announcements Tab */}
                <TabsContent value="announcements">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Announcements</CardTitle>
                            <CardDescription>
                                Display important messages to all users
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base">Show Announcement Banner</Label>
                                <Switch
                                    checked={settings.announcementEnabled}
                                    onCheckedChange={(checked) => updateSetting('announcementEnabled', checked)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="announcement">Announcement Message</Label>
                                <Textarea
                                    id="announcement"
                                    rows={4}
                                    value={settings.systemAnnouncement}
                                    onChange={(e) => updateSetting('systemAnnouncement', e.target.value)}
                                    placeholder="Enter your announcement message here..."
                                />
                                <p className="text-sm text-muted-foreground">
                                    This will be displayed as a banner on all pages
                                </p>
                            </div>

                            {settings.announcementEnabled && settings.systemAnnouncement && (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Preview</AlertTitle>
                                    <AlertDescription>{settings.systemAnnouncement}</AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
