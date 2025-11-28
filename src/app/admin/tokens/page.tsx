'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
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

interface Market {
    id: string;
    baseAsset: string;
    quoteAsset: string;
    minQuantity: number;
    maxQuantity: number;
    minPrice: number;
    maxPrice: number;
    status: string;
}

export default function TokenListingPage() {
    const { toast } = useToast();
    const [markets, setMarkets] = useState<Market[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        baseAsset: '',
        quoteAsset: 'USDT',
        minQuantity: '0.0001',
        maxQuantity: '1000000',
        minPrice: '0.01',
        maxPrice: '1000000',
    });

    const fetchMarkets = async () => {
        try {
            const response = await fetch('/api/admin/markets');
            const data = await response.json();
            setMarkets(data.markets || []);
        } catch (error) {
            console.error('Failed to fetch markets:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/admin/markets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    baseAsset: formData.baseAsset.toUpperCase(),
                    quoteAsset: formData.quoteAsset.toUpperCase(),
                    minQuantity: parseFloat(formData.minQuantity),
                    maxQuantity: parseFloat(formData.maxQuantity),
                    minPrice: parseFloat(formData.minPrice),
                    maxPrice: parseFloat(formData.maxPrice),
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Token Listed!',
                    description: `${formData.baseAsset}-${formData.quoteAsset} has been added to the exchange.`,
                });
                setIsDialogOpen(false);
                fetchMarkets();
                setFormData({
                    baseAsset: '',
                    quoteAsset: 'USDT',
                    minQuantity: '0.0001',
                    maxQuantity: '1000000',
                    minPrice: '0.01',
                    maxPrice: '1000000',
                });
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to list token',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An error occurred while listing the token',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (marketId: string) => {
        if (!confirm(`Are you sure you want to delist ${marketId}?`)) return;

        try {
            const response = await fetch(`/api/admin/markets?marketId=${marketId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast({
                    title: 'Token Delisted',
                    description: `${marketId} has been removed from the exchange.`,
                });
                fetchMarkets();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delist token',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">
                        Token Listing
                    </h1>
                    <p className="text-muted-foreground">
                        Add and manage trading pairs on your exchange
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={fetchMarkets}>
                            <Plus className="mr-2 h-4 w-4" />
                            List New Token
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>List New Token</DialogTitle>
                                <DialogDescription>
                                    Add a new trading pair to the exchange. All fields are required.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="baseAsset">Base Asset (Token Symbol)</Label>
                                        <Input
                                            id="baseAsset"
                                            placeholder="BTC"
                                            value={formData.baseAsset}
                                            onChange={(e) =>
                                                setFormData({ ...formData, baseAsset: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="quoteAsset">Quote Asset</Label>
                                        <Input
                                            id="quoteAsset"
                                            placeholder="USDT"
                                            value={formData.quoteAsset}
                                            onChange={(e) =>
                                                setFormData({ ...formData, quoteAsset: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="minQuantity">Min Quantity</Label>
                                        <Input
                                            id="minQuantity"
                                            type="number"
                                            step="0.0001"
                                            value={formData.minQuantity}
                                            onChange={(e) =>
                                                setFormData({ ...formData, minQuantity: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxQuantity">Max Quantity</Label>
                                        <Input
                                            id="maxQuantity"
                                            type="number"
                                            step="0.0001"
                                            value={formData.maxQuantity}
                                            onChange={(e) =>
                                                setFormData({ ...formData, maxQuantity: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="minPrice">Min Price (USDT)</Label>
                                        <Input
                                            id="minPrice"
                                            type="number"
                                            step="0.01"
                                            value={formData.minPrice}
                                            onChange={(e) =>
                                                setFormData({ ...formData, minPrice: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxPrice">Max Price (USDT)</Label>
                                        <Input
                                            id="maxPrice"
                                            type="number"
                                            step="0.01"
                                            value={formData.maxPrice}
                                            onChange={(e) =>
                                                setFormData({ ...formData, maxPrice: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    List Token
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listed Tokens</CardTitle>
                    <CardDescription>
                        Manage all trading pairs available on your exchange
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {markets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-muted-foreground mb-4">
                                No custom tokens listed yet. Click "List New Token" to add one.
                            </p>
                            <Button variant="outline" onClick={fetchMarkets}>
                                Load Markets
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Market</TableHead>
                                    <TableHead>Base Asset</TableHead>
                                    <TableHead>Quote Asset</TableHead>
                                    <TableHead>Min/Max Quantity</TableHead>
                                    <TableHead>Min/Max Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {markets.map((market) => (
                                    <TableRow key={market.id}>
                                        <TableCell className="font-medium">{market.id}</TableCell>
                                        <TableCell>{market.baseAsset}</TableCell>
                                        <TableCell>{market.quoteAsset}</TableCell>
                                        <TableCell>
                                            {market.minQuantity} - {market.maxQuantity}
                                        </TableCell>
                                        <TableCell>
                                            ${market.minPrice} - ${market.maxPrice}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={market.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                                {market.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(market.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
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
