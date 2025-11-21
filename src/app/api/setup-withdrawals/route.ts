import { NextResponse } from 'next/server';
import { cosmosClient, databaseId } from '@/lib/azure/cosmos';

export async function GET() {
    try {
        console.log('Setting up Withdrawals container...');

        const { database } = await cosmosClient.databases.createIfNotExists({
            id: databaseId,
        });

        const { container } = await database.containers.createIfNotExists({
            id: 'withdrawals',
            partitionKey: { paths: ['/userId'] },
        });

        return NextResponse.json({
            status: 'success',
            message: 'Withdrawals container setup complete',
            containerId: container.id,
            databaseId: database.id,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Setup error:', error);
        return NextResponse.json(
            {
                status: 'error',
                error: error.message,
                details: error.stack
            },
            { status: 500 }
        );
    }
}
