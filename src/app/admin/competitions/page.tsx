'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2, Trophy } from 'lucide-react';
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

interface Competition {
    id: string;
    title: string;
    description: string;
    type: string;
    status: string;
    startDate: string;
    endDate: string;
    prizePool: number;
    participants: number;
}

export default function AdminCompetitionsPage() {
    const { toast } = useToast();
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'volume',
        startDate: '',
        endDate: '',
        prizePool: '',
        minTradingVolume: '1000',
        prizes: [
            { rank: 1, prize: '', description: '1st Place' },
            { rank: 2, prize: '', description: '2nd Place' },
            { rank: 3, prize: '', description: '3rd Place' },
        ],
    });

    useEffect(() => {
        fetchCompetitions();
    }, []);

    const fetchCompetitions = async () => {
        try {
            const response = await fetch('/api/competitions');
            const data = await response.json();
            setCompetitions(data.competitions || []);
        } catch (error) {
            console.error('Failed to fetch competitions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/competitions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    prizePool: parseFloat(formData.prizePool),
                    minTradingVolume: parseFloat(formData.minTradingVolume),
                    prizes: formData.prizes.map(p => ({
                        ...p,
                        prize: parseFloat(p.prize),
                    })),
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Competition Created',
                    description: 'Trading competition has been created successfully.',
                });
                setIsDialogOpen(false);
                fetchCompetitions();
                setFormData({
                    title: '',
                    description: '',
                    type: 'volume',
                    startDate: '',
                    endDate: '',
                    prizePool: '',
                    minTradingVolume: '1000',
                    prizes: [
                        { rank: 1, prize: '', description: '1st Place' },
                        { rank: 2, prize: '', description: '2nd Place' },
                        { rank: 3, prize: '', description: '3rd Place' },
                    ],
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create competition',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this competition?')) return;

        try {
            await fetch(`/api/competitions?id=${id}`, { method: 'DELETE' });
            toast({
                title: 'Competition Deleted',
                description: 'Competition has been removed.',
            });
            fetchCompetitions();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete competition',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                        Competition Management
                    </h1>
                    <p className="text-muted-foreground">
                        Create and manage trading competitions
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={fetchCompetitions}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Competition
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>Create Trading Competition</DialogTitle>
                                <DialogDescription>
                                    Set up a new competition to engage your traders
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Competition Title</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="BTC Trading Championship"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        rows={2}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Compete for prizes by trading BTC pairs"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Competition Type</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="volume">Trading Volume</SelectItem>
                                                <SelectItem value="profit">Most Profitable</SelectItem>
                                                <SelectItem value="trades">Number of Trades</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="prizePool">Total Prize Pool ($)</Label>
                                        <Input
                                            id="prizePool"
                                            type="number"
                                            value={formData.prizePool}
                                            onChange={(e) => setFormData({ ...formData, prizePool: e.target.value })}
                                            placeholder="10000"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Start Date</Label>
                                        <Input
                                            id="startDate"
                                            type="datetime-local"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">End Date</Label>
                                        <Input
                                            id="endDate"
                                            type="datetime-local"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="minVolume">Minimum Trading Volume ($)</Label>
                                    <Input
                                        id="minVolume"
                                        type="number"
                                        value={formData.minTradingVolume}
                                        onChange={(e) => setFormData({ ...formData, minTradingVolume: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Prize Distribution</Label>
                                    <div className="space-y-2">
                                        {formData.prizes.map((prize, index) => (
                                            <div key={index} className="grid grid-cols-3 gap-2">
                                                <Input
                                                    placeholder="Rank"
                                                    value={prize.description}
                                                    onChange={(e) => {
                                                        const newPrizes = [...formData.prizes];
                                                        newPrizes[index].description = e.target.value;
                                                        setFormData({ ...formData, prizes: newPrizes });
                                                    }}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Prize Amount"
                                                    value={prize.prize}
                                                    onChange={(e) => {
                                                        const newPrizes = [...formData.prizes];
                                                        newPrizes[index].prize = e.target.value;
                                                        setFormData({ ...formData, prizes: newPrizes });
                                                    }}
                                                    required
                                                />
                                                <span className="text-sm text-muted-foreground flex items-center">
                                                    Rank #{prize.rank}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Competition
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Competitions</CardTitle>
                    <CardDescription>Manage all trading competitions</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : competitions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No competitions created yet
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Prize Pool</TableHead>
                                    <TableHead>Participants</TableHead>
                                    <TableHead>Dates</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {competitions.map((competition) => (
                                    <TableRow key={competition.id}>
                                        <TableCell className="font-medium">{competition.title}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{competition.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    competition.status === 'active' ? 'default' :
                                                        competition.status === 'upcoming' ? 'secondary' : 'outline'
                                                }
                                            >
                                                {competition.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-green-600 font-medium">
                                            ${competition.prizePool.toLocaleString()}
                                        </TableCell>
                                        <TableCell>{competition.participants.toLocaleString()}</TableCell>
                                        <TableCell className="text-sm">
                                            {new Date(competition.startDate).toLocaleDateString()} -
                                            {new Date(competition.endDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(competition.id)}
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
