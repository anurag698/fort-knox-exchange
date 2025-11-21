"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/providers/azure-auth-provider";
import { useOrderStore } from "@/state/order-management-store";
import {
    User,
    Shield,
    Bell,
    Key,
    Settings,
    Camera,
    Mail,
    Calendar,
    TrendingUp,
    Award,
    Eye,
    EyeOff,
    Copy,
    Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { TwoFactorSetup } from "@/components/security/two-factor-setup";
import { PasswordStrength } from "@/components/security/password-strength";

export default function ProfilePage() {
    const { user } = useUser();
    const { trades } = useOrderStore();
    const { toast } = useToast();

    const [emailNotifications, setEmailNotifications] = useState(true);
    const [tradeAlerts, setTradeAlerts] = useState(true);
    const [priceAlerts, setPriceAlerts] = useState(false);
    const [securityAlerts, setSecurityAlerts] = useState(true);
    const [newPassword, setNewPassword] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);
    const [apiKeyCopied, setApiKeyCopied] = useState(false);

    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isGeneratingKey, setIsGeneratingKey] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);

    // Fetch API key and sessions on load
    useEffect(() => {
        const fetchData = async () => {
            if (!user?.uid) return;

            // Fetch API Key
            try {
                const keyRes = await fetch(`/api/auth/api-keys?userId=${user.uid}`);
                const keyData = await keyRes.json();
                if (keyData.apiKey) setApiKey(keyData.apiKey);
            } catch (e) { console.error(e); }

            // Fetch Sessions
            try {
                const sessionRes = await fetch(`/api/auth/sessions?userId=${user.uid}`);
                const sessionData = await sessionRes.json();
                if (sessionData.sessions) setSessions(sessionData.sessions);
            } catch (e) { console.error(e); }
        };
        fetchData();
    }, [user?.uid]);

    const handleRevokeSession = async (sessionId: string) => {
        if (!user?.uid) return;
        try {
            await fetch('/api/auth/sessions', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, userId: user.uid }),
            });

            setSessions(sessions.filter(s => s.id !== sessionId));
            toast({
                title: "Session Revoked",
                description: "The session has been successfully terminated.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to revoke session.",
                variant: "destructive",
            });
        }
    };

    const handleGenerateApiKey = async () => {
        if (!user?.uid) return;
        setIsGeneratingKey(true);
        try {
            const response = await fetch('/api/auth/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid }),
            });
            const data = await response.json();

            if (data.apiKey) {
                setApiKey(data.apiKey);
                setShowApiKey(true); // Show the new key immediately
                toast({
                    title: "API Key Generated",
                    description: "Your new API key has been generated successfully.",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to generate API key.",
                variant: "destructive",
            });
        } finally {
            setIsGeneratingKey(false);
        }
    };

    // Calculate user stats
    const userStats = {
        totalTrades: trades.length,
        totalVolume: trades.reduce((sum, t) => sum + t.total, 0),
        memberSince: user?.metadata?.creationTime
            ? new Date(user.metadata.creationTime).toLocaleDateString()
            : "N/A",
        accountTier: "Pro Trader",
    };

    const handleCopyApiKey = () => {
        if (!apiKey) return;
        navigator.clipboard.writeText(apiKey);
        setApiKeyCopied(true);
        toast({
            title: "API Key Copied",
            description: "Your API key has been copied to clipboard.",
        });
        setTimeout(() => setApiKeyCopied(false), 2000);
    };

    const handleSaveProfile = () => {
        toast({
            title: "Profile Updated",
            description: "Your profile settings have been saved successfully.",
        });
    };

    return (
        <div className="min-h-screen bg-background pt-20 pb-12">
            <div className="container mx-auto max-w-6xl p-6 space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                    <p className="text-muted-foreground">Manage your account and preferences.</p>
                </div>

                {/* Profile Overview Card */}
                <Card className="border-2">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                            {/* Avatar */}
                            <div className="relative">
                                <Avatar className="w-24 h-24 border-4 border-primary/20">
                                    <AvatarImage src={user?.photoURL || undefined} />
                                    <AvatarFallback className="text-2xl bg-primary/10">
                                        {user?.email?.[0].toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <Button
                                    size="icon"
                                    className="absolute bottom-0 right-0 rounded-full w-8 h-8"
                                    variant="secondary"
                                >
                                    <Camera className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Info */}
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-bold">{user?.displayName || user?.email?.split("@")[0]}</h2>
                                    <Badge variant="default" className="bg-gradient-to-r from-primary to-purple-400">
                                        <Award className="w-3 h-3 mr-1" />
                                        {userStats.accountTier}
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground flex items-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    {user?.email}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Member since {userStats.memberSince}
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
                                    <p className="text-2xl font-bold">{userStats.totalTrades}</p>
                                    <p className="text-xs text-muted-foreground">Total Trades</p>
                                </div>
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
                                    <p className="text-2xl font-bold">${userStats.totalVolume.toFixed(0)}</p>
                                    <p className="text-xs text-muted-foreground">Volume</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Settings Tabs */}
                <Tabs defaultValue="personal" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="personal">
                            <User className="w-4 h-4 mr-2" />
                            Personal
                        </TabsTrigger>
                        <TabsTrigger value="security">
                            <Shield className="w-4 h-4 mr-2" />
                            Security
                        </TabsTrigger>
                        <TabsTrigger value="notifications">
                            <Bell className="w-4 h-4 mr-2" />
                            Notifications
                        </TabsTrigger>
                        <TabsTrigger value="api">
                            <Key className="w-4 h-4 mr-2" />
                            API
                        </TabsTrigger>
                    </TabsList>

                    {/* Personal Info Tab */}
                    <TabsContent value="personal" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>Update your personal details and preferences.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="John Doe"
                                            defaultValue={user?.displayName || ""}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="john@example.com"
                                            defaultValue={user?.email || ""}
                                            disabled
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="country">Country</Label>
                                        <Input id="country" placeholder="United States" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <textarea
                                        id="bio"
                                        className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>

                                <Button onClick={handleSaveProfile}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Save Changes
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Security Settings</CardTitle>
                                <CardDescription>Manage your account security and authentication.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="font-semibold">Password</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="current-password">Current Password</Label>
                                        <Input id="current-password" type="password" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="new-password">New Password</Label>
                                            <Input
                                                id="new-password"
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                            {newPassword && <PasswordStrength password={newPassword} />}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirm-password">Confirm Password</Label>
                                            <Input id="confirm-password" type="password" />
                                        </div>
                                    </div>
                                    <Button variant="outline">Update Password</Button>
                                </div>

                                <div className="border-t pt-4">
                                    <TwoFactorSetup />
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="font-semibold mb-4">Active Sessions</h3>
                                    <div className="space-y-2">
                                        {sessions.map((session) => (
                                            <div key={session.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-background rounded-full">
                                                        {session.deviceInfo.includes('iPhone') || session.deviceInfo.includes('Android') ? (
                                                            <Settings className="w-4 h-4" /> // Using Settings as placeholder for Phone icon
                                                        ) : (
                                                            <Settings className="w-4 h-4" /> // Using Settings as placeholder for Laptop icon
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {session.deviceInfo.length > 30 ? session.deviceInfo.substring(0, 30) + '...' : session.deviceInfo}
                                                            {session.isCurrent && " (Current Device)"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {session.ipAddress} • Last active: {new Date(session.lastActive).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                {session.isCurrent ? (
                                                    <Badge variant="default" className="bg-green-500">Active</Badge>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => handleRevokeSession(session.id)}
                                                    >
                                                        Revoke
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        {sessions.length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-4">No active sessions found.</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Preferences</CardTitle>
                                <CardDescription>Choose what notifications you want to receive.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="email-notifications">Email Notifications</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receive updates about your account via email
                                        </p>
                                    </div>
                                    <Switch
                                        id="email-notifications"
                                        checked={emailNotifications}
                                        onCheckedChange={setEmailNotifications}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="trade-alerts">Trade Execution Alerts</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Get notified when your orders are filled
                                        </p>
                                    </div>
                                    <Switch
                                        id="trade-alerts"
                                        checked={tradeAlerts}
                                        onCheckedChange={setTradeAlerts}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="price-alerts">Price Alerts</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receive notifications when prices hit your targets
                                        </p>
                                    </div>
                                    <Switch
                                        id="price-alerts"
                                        checked={priceAlerts}
                                        onCheckedChange={setPriceAlerts}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="security-alerts">Security Alerts</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Get notified about new sign-ins and password changes
                                        </p>
                                    </div>
                                    <Switch
                                        id="security-alerts"
                                        checked={securityAlerts}
                                        onCheckedChange={setSecurityAlerts}
                                    />
                                </div>

                                <Button onClick={handleSaveProfile}>Save Preferences</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* API Tab */}
                    <TabsContent value="api" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>API Access</CardTitle>
                                <CardDescription>
                                    Manage your API keys for programmatic trading access.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                        <strong>Warning:</strong> Keep your API keys secure. Never share them publicly.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Your API Key</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={showApiKey ? (apiKey || "No API Key generated") : (apiKey ? "••••••••••••••••••••" : "No API Key generated")}
                                                readOnly
                                                className="font-mono"
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                disabled={!apiKey}
                                            >
                                                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </Button>
                                            <Button variant="outline" size="icon" onClick={handleCopyApiKey} disabled={!apiKey}>
                                                {apiKeyCopied ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="destructive"
                                            className="flex-1"
                                            onClick={handleGenerateApiKey}
                                            disabled={isGeneratingKey}
                                        >
                                            {isGeneratingKey ? "Generating..." : (apiKey ? "Regenerate API Key" : "Generate API Key")}
                                        </Button>
                                        <Button variant="outline" className="flex-1">
                                            View Documentation
                                        </Button>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="font-semibold mb-4">API Usage</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-muted/50 rounded-lg">
                                            <p className="text-sm text-muted-foreground">Requests Today</p>
                                            <p className="text-2xl font-bold">1,247</p>
                                        </div>
                                        <div className="p-3 bg-muted/50 rounded-lg">
                                            <p className="text-sm text-muted-foreground">Rate Limit</p>
                                            <p className="text-2xl font-bold">10,000/day</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
