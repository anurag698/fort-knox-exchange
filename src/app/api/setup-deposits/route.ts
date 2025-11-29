import { NextResponse } from 'next/server';
import { getDatabase, databaseId } from '@/lib/azure/cosmos';

export async function GET() {
    try {
        console.log('Setting up Deposit Addresses container...');

        const database = getDatabase();

        const { container } = await database.containers.createIfNotExists({
            id: 'deposit_addresses',
            partitionKey: { paths: ['/userId'] },
        });

        return NextResponse.json({
            status: 'success',
            message: 'Deposit Addresses container setup complete',
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
