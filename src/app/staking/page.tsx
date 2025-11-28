'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    TrendingUp,
    DollarSign,
    Trophy,
    Calendar,
    Lock,
    Unlock,
    Loader2
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface StakingPool {
    id: string;
    token: string;
    name: string;
    type: string;
    apy: number;
    lockDays?: number;
    minStake: number;
    maxStake: number;
    totalStaked: number;
    participants: number;
}

interface UserStake {
    id: string;
    poolName: string;
    token: string;
    amount: number;
    apy: number;
    startDate: string;
    status: string;
    earnedRewards: number;
    type: string;
}

export default function StakingPage() {
    const { toast } = useToast();
    const [pools, setPools] = useState<StakingPool[]>([]);
    const [userStakes, setUserStakes] = useState<UserStake[]>([]);
    const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
    const [stakeAmount, setStakeAmount] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isStaking, setIsStaking] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        fetchPools();
        fetchUserStakes();
    }, []);

    const fetchPools = async () => {
        try {
            const response = await fetch('/api/staking/pools');
            const data = await response.json();
            setPools(data.pools || []);
        } catch (error) {
            console.error('Failed to fetch pools:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserStakes = async () => {
        try {
            const response = await fetch('/api/staking/user?userId=user1');
            const data = await response.json();
            setUserStakes(data.stakes || []);
        } catch (error) {
            console.error('Failed to fetch stakes:', error);
        }
    };

    const handleStake = async () => {
        if (!selectedPool || !stakeAmount) return;
        setIsStaking(true);

        try {
            const response = await fetch('/api/staking/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    poolId: selectedPool.id,
                    amount: parseFloat(stakeAmount),
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Staking Successful',
                    description: `Staked ${stakeAmount} ${selectedPool.token} successfully`,
                });
                setIsDialogOpen(false);
                setStakeAmount('');
                fetchUserStakes();
                fetchPools();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to stake tokens',
                variant: 'destructive',
            });
        } finally {
            setIsStaking(false);
        }
    };

    const handleUnstake = async (stakeId: string) => {
        if (!confirm('Are you sure you want to unstake?')) return;

        try {
            const response = await fetch(`/api/staking/user?stakeId=${stakeId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Unstaked Successfully',
                    description: data.message,
                });
                fetchUserStakes();
                fetchPools();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to unstake tokens',
                variant: 'destructive',
            });
        }
    };

    const getTotalStaked = () => {
        return userStakes.reduce((sum, stake) => sum + stake.amount, 0);
    };

    const getTotalEarned = () => {
        return userStakes.reduce((sum, stake) => sum + stake.earnedRewards, 0);
    };

    return (
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                    <TrendingUp className="h-8 w-8 text-green-500" />
                    Staking
                </h1>
                <p className="text-muted-foreground">
                    Earn passive income by staking your crypto
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{getTotalStaked().toFixed(4)} BTC</div>
                        <p className="text-xs text-muted-foreground">Across all pools</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {getTotalEarned().toFixed(5)} BTC
                        </div>
                        <p className="text-xs text-muted-foreground">Lifetime rewards</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Stakes</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userStakes.length}</div>
                        <p className="text-xs text-muted-foreground">Currently earning</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="pools" className="w-full">
                <TabsList>
                    <TabsTrigger value="pools">Available Pools</TabsTrigger>
                    <TabsTrigger value="mystakes">My Stakes</TabsTrigger>
                </TabsList>

                {/* Available Pools */}
                <TabsContent value="pools" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pools.map((pool) => (
                            <Card key={pool.id} className="hover:shadow-lg transition-all">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-full bg-primary/10 p-2">
                                                {pool.type === 'flexible' ? (
                                                    <Unlock className="h-5 w-5 text-primary" />
                                                ) : (
                                                    <Lock className="h-5 w-5 text-primary" />
                                                )}
                                            </div>
                                            <Badge variant={pool.type === 'flexible' ? 'default' : 'secondary'}>
                                                {pool.type === 'flexible' ? 'Flexible' : `${pool.lockDays}d Locked`}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardTitle className="mt-4">{pool.name}</CardTitle>
                                    <CardDescription className="text-3xl font-bold text-green-600">
                                        {pool.apy}% APY
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Min Stake</span>
                                        <span className="font-medium">{pool.minStake} {pool.token}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Total Staked</span>
                                        <span className="font-medium">{pool.totalStaked.toLocaleString()} {pool.token}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Participants</span>
                                        <span className="font-medium">{pool.participants.toLocaleString()}</span>
                                    </div>

                                    <Dialog open={isDialogOpen && selectedPool?.id === pool.id} onOpenChange={setIsDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                className="w-full mt-4"
                                                onClick={() => setSelectedPool(pool)}
                                            >
                                                Stake Now
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Stake {pool.token}</DialogTitle>
                                                <DialogDescription>
                                                    Enter the amount you want to stake in {pool.name}
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="amount">Amount ({pool.token})</Label>
                                                    <Input
                                                        id="amount"
                                                        type="number"
                                                        step="0.0001"
                                                        placeholder={`Min: ${pool.minStake}`}
                                                        value={stakeAmount}
                                                        onChange={(e) => setStakeAmount(e.target.value)}
                                                    />
                                                </div>

                                                <div className="rounded-lg bg-muted p-4 space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span>APY</span>
                                                        <span className="font-bold text-green-600">{pool.apy}%</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span>Lock Period</span>
                                                        <span className="font-medium">
                                                            {pool.type === 'flexible' ? 'Flexible' : `${pool.lockDays} days`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleStake} disabled={isStaking || !stakeAmount}>
                                                    {isStaking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Confirm Stake
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* My Stakes */}
                <TabsContent value="mystakes" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Stakes</CardTitle>
                            <CardDescription>Your currently staked positions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {userStakes.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No active stakes. Start earning by staking in available pools!
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Pool</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>APY</TableHead>
                                            <TableHead>Earned</TableHead>
                                            <TableHead>Start Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {userStakes.map((stake) => (
                                            <TableRow key={stake.id}>
                                                <TableCell className="font-medium">{stake.poolName}</TableCell>
                                                <TableCell>{stake.amount} {stake.token}</TableCell>
                                                <TableCell className="text-green-600 font-medium">
                                                    {stake.apy}%
                                                </TableCell>
                                                <TableCell className="text-green-600 font-bold">
                                                    +{stake.earnedRewards.toFixed(5)} {stake.token}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(stake.startDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleUnstake(stake.id)}
                                                    >
                                                        Unstake
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
