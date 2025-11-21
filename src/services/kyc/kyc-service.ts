import { User } from '@/lib/azure/cosmos-trading';
import { upsertItem, queryItems } from '@/lib/azure/cosmos';

export type KYCStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface KYCSubmissionData {
    fullName: string;
    dob: string;
    country: string;
    idType: 'passport' | 'national_id' | 'drivers_license';
    idNumber: string;
    documents: {
        front: string;
        back?: string;
        selfie: string;
    };
}

/**
 * Get user's KYC status
 */
export async function getKYCStatus(userId: string): Promise<User | null> {
    try {
        const users = await queryItems<User>(
            'users',
            'SELECT * FROM c WHERE c.id = @userId',
            [{ name: '@userId', value: userId }]
        );
        return users[0] || null;
    } catch (error) {
        console.error('Error fetching KYC status:', error);
        return null;
    }
}

/**
 * Submit KYC data
 */
export async function submitKYC(userId: string, email: string, data: KYCSubmissionData): Promise<User> {
    const existingUser = await getKYCStatus(userId);

    const now = new Date().toISOString();

    const user: User = {
        id: userId,
        userId: userId,
        email: email,
        kycStatus: 'pending',
        kycData: {
            ...data,
            submittedAt: now
        },
        createdAt: existingUser?.createdAt || now,
        updatedAt: now
    };

    return await upsertItem<User>('users', user);
}

/**
 * Approve KYC (Admin)
 */
export async function approveKYC(userId: string): Promise<User> {
    const user = await getKYCStatus(userId);
    if (!user) {
        throw new Error('User not found');
    }

    user.kycStatus = 'approved';
    user.kycData = {
        ...user.kycData!,
        reviewedAt: new Date().toISOString()
    };
    user.updatedAt = new Date().toISOString();

    return await upsertItem<User>('users', user);
}

/**
 * Reject KYC (Admin)
 */
export async function rejectKYC(userId: string, reason: string): Promise<User> {
    const user = await getKYCStatus(userId);
    if (!user) {
        throw new Error('User not found');
    }

    user.kycStatus = 'rejected';
    user.kycData = {
        ...user.kycData!,
        reviewedAt: new Date().toISOString(),
        rejectionReason: reason
    };
    user.updatedAt = new Date().toISOString();

    return await upsertItem<User>('users', user);
}
