'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2, TrendingUp } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

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
    isActive: boolean;
}

export default function AdminStakingPage() {
    const { toast } = useToast();
    const [pools, setPools] = useState<StakingPool[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        token: 'BTC',
        name: '',
        type: 'flexible',
        apy: '',
        lockDays: '',
        minStake: '',
        maxStake: '',
    });

    useEffect(() => {
        fetchPools();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/staking/pools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    apy: parseFloat(formData.apy),
                    lockDays: formData.type === 'locked' ? parseInt(formData.lockDays) : undefined,
                    minStake: parseFloat(formData.minStake),
                    maxStake: parseFloat(formData.maxStake),
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Pool Created',
                    description: 'Staking pool has been created successfully.',
                });
                setIsDialogOpen(false);
                fetchPools();
                setFormData({
                    token: 'BTC',
                    name: '',
                    type: 'flexible',
                    apy: '',
                    lockDays: '',
                    minStake: '',
                    maxStake: '',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create pool',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this pool?')) return;

        try {
            await fetch(`/api/staking/pools?id=${id}`, { method: 'DELETE' });
            toast({
                title: 'Pool Deleted',
                description: 'Staking pool has been removed.',
            });
            fetchPools();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete pool',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                        <TrendingUp className="h-8 w-8 text-green-500" />
                        Staking Pool Management
                    </h1>
                    <p className="text-muted-foreground">
                        Create and manage staking pools
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Pool
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>Create Staking Pool</DialogTitle>
                                <DialogDescription>
                                    Set up a new staking pool for users to earn rewards
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="token">Token</Label>
                                        <Select
                                            value={formData.token}
                                            onValueChange={(value) => setFormData({ ...formData, token: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                                                <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                                                <SelectItem value="USDT">Tether (USDT)</SelectItem>
                                                <SelectItem value="BNB">BNB</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="type">Type</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="flexible">Flexible</SelectItem>
                                                <SelectItem value="locked">Locked</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Pool Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="BTC Flexible Staking"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="apy">APY (%)</Label>
                                        <Input
                                            id="apy"
                                            type="number"
                                            step="0.1"
                                            value={formData.apy}
                                            onChange={(e) => setFormData({ ...formData, apy: e.target.value })}
                                            placeholder="5.5"
                                            required
                                        />
                                    </div>

                                    {formData.type === 'locked' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="lockDays">Lock Days</Label>
                                            <Input
                                                id="lockDays"
                                                type="number"
                                                value={formData.lockDays}
                                                onChange={(e) => setFormData({ ...formData, lockDays: e.target.value })}
                                                placeholder="30"
                                                required={formData.type === 'locked'}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="minStake">Min Stake</Label>
                                        <Input
                                            id="minStake"
                                            type="number"
                                            step="0.0001"
                                            value={formData.minStake}
                                            onChange={(e) => setFormData({ ...formData, minStake: e.target.value })}
                                            placeholder="0.001"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="maxStake">Max Stake</Label>
                                        <Input
                                            id="maxStake"
                                            type="number"
                                            step="0.01"
                                            value={formData.maxStake}
                                            onChange={(e) => setFormData({ ...formData, maxStake: e.target.value })}
                                            placeholder="100"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Pool
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Staking Pools</CardTitle>
                    <CardDescription>Manage all staking pools</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : pools.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No staking pools created yet
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Pool Name</TableHead>
                                    <TableHead>Token</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>APY</TableHead>
                                    <TableHead>Total Staked</TableHead>
                                    <TableHead>Participants</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pools.map((pool) => (
                                    <TableRow key={pool.id}>
                                        <TableCell className="font-medium">{pool.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{pool.token}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={pool.type === 'flexible' ? 'default' : 'secondary'}>
                                                {pool.type === 'flexible' ? 'Flexible' : `${pool.lockDays}d Locked`}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-green-600 font-bold">
                                            {pool.apy}%
                                        </TableCell>
                                        <TableCell>
                                            {pool.totalStaked.toLocaleString()} {pool.token}
                                        </TableCell>
                                        <TableCell>{pool.participants.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(pool.id)}
                                            >
                                                <Trash2 className="h-4 w-4  text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
