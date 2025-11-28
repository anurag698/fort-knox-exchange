'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Users, Calendar, DollarSign, Medal, Clock } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import Link from 'next/link';

interface Competition {
    id: string;
    title: string;
    description: string;
    type: string;
    status: string;
    startDate: string;
    endDate: string;
    prizePool: number;
    prizes: Array<{ rank: number; prize: number; description: string }>;
    minTradingVolume: number;
    participants: number;
}

interface Participant {
    rank: number;
    username: string;
    volume: number;
    profit: number;
    trades: number;
    prize?: number;
}

export default function CompetitionsPage() {
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
    const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCompetitions();
    }, []);

    const fetchCompetitions = async () => {
        try {
            const response = await fetch('/api/competitions');
            const data = await response.json();
            setCompetitions(data.competitions || []);

            // Auto-select first active competition
            const active = data.competitions.find((c: Competition) => c.status === 'active');
            if (active) {
                fetchCompetitionDetails(active.id);
            }
        } catch (error) {
            console.error('Failed to fetch competitions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCompetitionDetails = async (id: string) => {
        try {
            const response = await fetch(`/api/competitions?id=${id}`);
            const data = await response.json();
            setSelectedCompetition(data.competition);
            setLeaderboard(data.leaderboard || []);
        } catch (error) {
            console.error('Failed to fetch competition details:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-500">Live Now</Badge>;
            case 'upcoming':
                return <Badge variant="secondary">Upcoming</Badge>;
            case 'ended':
                return <Badge variant="outline">Ended</Badge>;
            default:
                return null;
        }
    };

    const getTimeRemaining = (endDate: string) => {
        const end = new Date(endDate).getTime();
        const now = Date.now();
        const diff = end - now;

        if (diff <= 0) return 'Ended';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}d ${hours}h remaining`;
        return `${hours}h remaining`;
    };

    return (
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                    Trading Competitions
                </h1>
                <p className="text-muted-foreground">
                    Compete with traders worldwide and win prizes
                </p>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="ended">Ended</TabsTrigger>
                </TabsList>

                {['active', 'upcoming', 'ended'].map((status) => (
                    <TabsContent key={status} value={status} className="mt-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {competitions
                                .filter(c => c.status === status)
                                .map((competition) => (
                                    <Card
                                        key={competition.id}
                                        className="cursor-pointer hover:shadow-lg transition-all"
                                        onClick={() => fetchCompetitionDetails(competition.id)}
                                    >
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <Trophy className="h-8 w-8 text-yellow-500" />
                                                {getStatusBadge(competition.status)}
                                            </div>
                                            <CardTitle className="mt-4">{competition.title}</CardTitle>
                                            <CardDescription>{competition.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <DollarSign className="h-4 w-4" />
                                                    Prize Pool
                                                </span>
                                                <span className="font-bold text-green-600">
                                                    ${competition.prizePool.toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <Users className="h-4 w-4" />
                                                    Participants
                                                </span>
                                                <span className="font-medium">
                                                    {competition.participants.toLocaleString()}
                                                </span>
                                            </div>

                                            {competition.status === 'active' && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-1 text-muted-foreground">
                                                        <Clock className="h-4 w-4" />
                                                        Time Left
                                                    </span>
                                                    <span className="font-medium text-orange-600">
                                                        {getTimeRemaining(competition.endDate)}
                                                    </span>
                                                </div>
                                            )}

                                            <Button className="w-full mt-4" variant={status === 'active' ? 'default' : 'outline'}>
                                                {status === 'active' ? 'View Leaderboard' : 'View Details'}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            {/* Selected Competition Details */}
            {selectedCompetition && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Live Leaderboard</CardTitle>
                            <CardDescription>
                                Top traders for {selectedCompetition.title}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">Rank</TableHead>
                                        <TableHead>Trader</TableHead>
                                        <TableHead className="text-right">Volume</TableHead>
                                        <TableHead className="text-right">Trades</TableHead>
                                        <TableHead className="text-right">Prize</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaderboard.map((participant) => (
                                        <TableRow key={participant.rank}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {participant.rank <= 3 && (
                                                        <Medal
                                                            className={`h-5 w-5 ${participant.rank === 1 ? 'text-yellow-500' :
                                                                    participant.rank === 2 ? 'text-gray-400' :
                                                                        'text-amber-600'
                                                                }`}
                                                        />
                                                    )}
                                                    <span className="font-bold">#{participant.rank}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{participant.username}</TableCell>
                                            <TableCell className="text-right">
                                                ${participant.volume.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">{participant.trades}</TableCell>
                                            <TableCell className="text-right">
                                                {participant.prize ? (
                                                    <span className="font-bold text-green-600">
                                                        ${participant.prize.toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Prize Distribution</CardTitle>
                            <CardDescription>Rewards for top performers</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {selectedCompetition.prizes.map((prize, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                >
                                    <div>
                                        <p className="font-medium">{prize.description}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {prize.rank === 1 ? '1st' : prize.rank === 2 ? '2nd' : prize.rank === 3 ? '3rd' : `${prize.rank}th`} Place
                                        </p>
                                    </div>
                                    <span className="font-bold text-green-600">
                                        ${prize.prize.toLocaleString()}
                                    </span>
                                </div>
                            ))}

                            <div className="pt-4 mt-4 border-t">
                                <Button className="w-full" size="lg">
                                    Join Competition
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
