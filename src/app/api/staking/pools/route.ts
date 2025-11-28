import { NextResponse } from 'next/server';

export type StakingType = 'flexible' | 'locked';
export type StakingStatus = 'active' | 'completed' | 'cancelled';

export interface StakingPool {
    id: string;
    token: string;
    name: string;
    type: StakingType;
    apy: number;
    lockDays?: number;
    minStake: number;
    maxStake: number;
    totalStaked: number;
    participants: number;
    isActive: boolean;
}

export interface UserStake {
    id: string;
    poolId: string;
    poolName: string;
    token: string;
    amount: number;
    apy: number;
    startDate: string;
    endDate?: string;
    status: StakingStatus;
    earnedRewards: number;
    type: StakingType;
}

// Mock staking pools
let stakingPools: StakingPool[] = [
    {
        id: '1',
        token: 'BTC',
        name: 'BTC Flexible Staking',
        type: 'flexible',
        apy: 5.5,
        minStake: 0.001,
        maxStake: 100,
        totalStaked: 245.5,
        participants: 1247,
        isActive: true,
    },
    {
        id: '2',
        token: 'BTC',
        name: 'BTC 30-Day Locked',
        type: 'locked',
        apy: 8.5,
        lockDays: 30,
        minStake: 0.01,
        maxStake: 50,
        totalStaked: 189.2,
        participants: 892,
        isActive: true,
    },
    {
        id: '3',
        token: 'ETH',
        name: 'ETH Flexible Staking',
        type: 'flexible',
        apy: 6.0,
        minStake: 0.01,
        maxStake: 1000,
        totalStaked: 3421.8,
        participants: 2156,
        isActive: true,
    },
    {
        id: '4',
        token: 'ETH',
        name: 'ETH 90-Day Locked',
        type: 'locked',
        apy: 12.0,
        lockDays: 90,
        minStake: 0.1,
        maxStake: 500,
        totalStaked: 1895.6,
        participants: 743,
        isActive: true,
    },
    {
        id: '5',
        token: 'USDT',
        name: 'USDT 60-Day Locked',
        type: 'locked',
        apy: 15.0,
        lockDays: 60,
        minStake: 100,
        maxStake: 100000,
        totalStaked: 2567890,
        participants: 5432,
        isActive: true,
    },
];

// Mock user stakes
const mockUserStakes: UserStake[] = [
    {
        id: '1',
        poolId: '1',
        poolName: 'BTC Flexible Staking',
        token: 'BTC',
        amount: 0.5,
        apy: 5.5,
        startDate: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
        status: 'active',
        earnedRewards: 0.00226,
        type: 'flexible',
    },
    {
        id: '2',
        poolId: '3',
        poolName: 'ETH Flexible Staking',
        token: 'ETH',
        amount: 2.5,
        apy: 6.0,
        startDate: new Date(Date.now() - 1296000000).toISOString(), // 15 days ago
        status: 'active',
        earnedRewards: 0.00616,
        type: 'flexible',
    },
];

// GET /api/staking/pools - List all staking pools
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        let filtered = stakingPools.filter(pool => pool.isActive);
        if (token) {
            filtered = filtered.filter(pool => pool.token === token);
        }

        return NextResponse.json({
            success: true,
            pools: filtered,
            total: filtered.length,
        });
    } catch (error) {
        console.error('Staking pools fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch pools' }, { status: 500 });
    }
}

// POST /api/staking/pools - Create pool (admin)
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const newPool: StakingPool = {
            id: Date.now().toString(),
            token: body.token,
            name: body.name,
            type: body.type,
            apy: body.apy,
            lockDays: body.lockDays,
            minStake: body.minStake,
            maxStake: body.maxStake,
            totalStaked: 0,
            participants: 0,
            isActive: true,
        };

        stakingPools.unshift(newPool);

        return NextResponse.json({
            success: true,
            pool: newPool,
        });
    } catch (error) {
        console.error('Pool creation error:', error);
        return NextResponse.json({ error: 'Failed to create pool' }, { status: 500 });
    }
}

// DELETE /api/staking/pools - Delete pool
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Pool ID required' }, { status: 400 });
        }

        stakingPools = stakingPools.filter(pool => pool.id !== id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Pool deletion error:', error);
        return NextResponse.json({ error: 'Failed to delete pool' }, { status: 500 });
    }
}
