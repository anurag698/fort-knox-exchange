import { NextResponse } from 'next/server';

export type CompetitionType = 'volume' | 'profit' | 'trades';
export type CompetitionStatus = 'upcoming' | 'active' | 'ended';

export interface Competition {
    id: string;
    title: string;
    description: string;
    type: CompetitionType;
    status: CompetitionStatus;
    startDate: string;
    endDate: string;
    prizePool: number;
    prizes: Array<{
        rank: number;
        prize: number;
        description: string;
    }>;
    minTradingVolume: number;
    eligiblePairs?: string[];
    participants: number;
    bannerImage?: string;
}

export interface CompetitionParticipant {
    userId: string;
    username: string;
    rank: number;
    volume: number;
    profit: number;
    trades: number;
    prize?: number;
}

// Mock competitions data
let competitions: Competition[] = [
    {
        id: '1',
        title: 'BTC Trading Championship',
        description: 'Compete for $10,000 in prizes! Top traders by volume on BTC pairs win big.',
        type: 'volume',
        status: 'active',
        startDate: new Date(Date.now() - 86400000).toISOString(),
        endDate: new Date(Date.now() + 604800000).toISOString(), // 7 days from now
        prizePool: 10000,
        prizes: [
            { rank: 1, prize: 5000, description: '1st Place' },
            { rank: 2, prize: 3000, description: '2nd Place' },
            { rank: 3, prize: 1500, description: '3rd Place' },
            { rank: 10, prize: 50, description: '4th-10th Place (each)' },
        ],
        minTradingVolume: 1000,
        eligiblePairs: ['BTC-USDT'],
        participants: 1247,
        bannerImage: '/competitions/btc-championship.jpg',
    },
    {
        id: '2',
        title: 'Altcoin Season Rally',
        description: 'Trade altcoins and win! Most profitable trader takes home $5,000.',
        type: 'profit',
        status: 'upcoming',
        startDate: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
        endDate: new Date(Date.now() + 777600000).toISOString(),
        prizePool: 5000,
        prizes: [
            { rank: 1, prize: 2500, description: '1st Place' },
            { rank: 2, prize: 1500, description: '2nd Place' },
            { rank: 3, prize: 1000, description: '3rd Place' },
        ],
        minTradingVolume: 500,
        participants: 0,
    },
];

// Mock leaderboard data
const mockLeaderboard: CompetitionParticipant[] = [
    { userId: '1', username: 'CryptoKing', rank: 1, volume: 2500000, profit: 15000, trades: 342, prize: 5000 },
    { userId: '2', username: 'MoonTrader', rank: 2, volume: 1800000, profit: 12500, trades: 289, prize: 3000 },
    { userId: '3', username: 'DiamondHands', rank: 3, volume: 1500000, profit: 10200, trades: 256, prize: 1500 },
    { userId: '4', username: 'BTCMaxi', rank: 4, volume: 1200000, profit: 8900, trades: 198 },
    { userId: '5', username: 'AltcoinHunter', rank: 5, volume: 950000, profit: 7200, trades: 176 },
];

// GET /api/competitions - List competitions
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const id = searchParams.get('id');

        // Get specific competition
        if (id) {
            const competition = competitions.find(c => c.id === id);
            if (!competition) {
                return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
            }
            return NextResponse.json({
                success: true,
                competition,
                leaderboard: mockLeaderboard,
            });
        }

        // Filter by status
        let filtered = competitions;
        if (status && status !== 'all') {
            filtered = competitions.filter(c => c.status === status);
        }

        return NextResponse.json({
            success: true,
            competitions: filtered,
            total: filtered.length,
        });
    } catch (error) {
        console.error('Competitions fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch competitions' }, { status: 500 });
    }
}

// POST /api/competitions - Create competition (admin)
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const newCompetition: Competition = {
            id: Date.now().toString(),
            title: body.title,
            description: body.description,
            type: body.type || 'volume',
            status: 'upcoming',
            startDate: body.startDate,
            endDate: body.endDate,
            prizePool: body.prizePool,
            prizes: body.prizes || [],
            minTradingVolume: body.minTradingVolume || 0,
            eligiblePairs: body.eligiblePairs,
            participants: 0,
            bannerImage: body.bannerImage,
        };

        competitions.unshift(newCompetition);

        return NextResponse.json({
            success: true,
            competition: newCompetition,
        });
    } catch (error) {
        console.error('Competition creation error:', error);
        return NextResponse.json({ error: 'Failed to create competition' }, { status: 500 });
    }
}

// DELETE /api/competitions - Delete competition
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Competition ID required' }, { status: 400 });
        }

        competitions = competitions.filter(c => c.id !== id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Competition deletion error:', error);
        return NextResponse.json({ error: 'Failed to delete competition' }, { status: 500 });
    }
}
