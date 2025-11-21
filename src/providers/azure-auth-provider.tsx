'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AccountInfo } from '@azure/msal-browser';
import { msalInstance, initializeMsal, loginRequest } from '@/lib/azure/auth';

interface AzureUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    emailVerified: boolean;
    photoURL?: string | null;
    metadata?: {
        creationTime?: string;
        lastSignInTime?: string;
    };
}

interface AuthContextType {
    user: AzureUser | null;
    isUserLoading: boolean;
    requires2FA: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    verify2FA: (code: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function convertAccountToUser(account: AccountInfo | null): AzureUser | null {
    if (!account) return null;

    return {
        uid: account.homeAccountId || account.localAccountId,
        email: account.username || null,
        displayName: account.name || null,
        emailVerified: true, // Azure AD B2C handles email verification
        photoURL: null, // Azure AD B2C doesn't return photo in idToken by default
        metadata: {
            creationTime: new Date().toISOString(), // Mock creation time as we don't get it from token
            lastSignInTime: new Date().toISOString(),
        },
    };
}

export function AzureAuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AzureUser | null>(null);
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [requires2FA, setRequires2FA] = useState(false);

    const check2FAStatus = async (userId: string) => {
        try {
            const response = await fetch(`/api/auth/2fa/status?userId=${userId}`);
            const data = await response.json();
            return data.enabled;
        } catch (error) {
            console.error('Failed to check 2FA status:', error);
            return false;
        }
    };

    const handleUserAuth = async (account: AccountInfo) => {
        const userData = convertAccountToUser(account);
        if (userData) {
            const is2FAEnabled = await check2FAStatus(userData.uid);
            if (is2FAEnabled) {
                setRequires2FA(true);
            }
            setUser(userData);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                await initializeMsal();
                const accounts = msalInstance.getAllAccounts();
                if (accounts.length > 0) {
                    await handleUserAuth(accounts[0]);
                }
            } catch (error) {
                console.error('Failed to initialize MSAL:', error);
            } finally {
                setIsUserLoading(false);
            }
        };

        init();

        // Listen for account changes
        const callbackId = msalInstance.addEventCallback(async (event: any) => {
            if (event.eventType === 'msal:loginSuccess' || event.eventType === 'msal:acquireTokenSuccess') {
                const account = event.payload?.account;
                if (account) {
                    await handleUserAuth(account);
                }
            } else if (event.eventType === 'msal:logoutSuccess') {
                setUser(null);
                setRequires2FA(false);
            }
        });

        return () => {
            if (callbackId) {
                msalInstance.removeEventCallback(callbackId);
            }
        };
    }, []);

    const signIn = useCallback(async () => {
        try {
            const response = await msalInstance.loginPopup(loginRequest);
            if (response?.account) {
                await handleUserAuth(response.account);
            }
        } catch (error) {
            console.error('Sign in failed:', error);
            throw error;
        }
    }, []);

    const signOut = useCallback(async () => {
        try {
            await msalInstance.logoutPopup({
                mainWindowRedirectUri: '/',
            });
            setUser(null);
            setRequires2FA(false);
        } catch (error) {
            console.error('Sign out failed:', error);
            throw error;
        }
    }, []);

    const verify2FA = useCallback(async (code: string): Promise<boolean> => {
        if (!user) return false;

        try {
            // We need to fetch the secret from the server to verify
            // But wait, the server verifies it. We just send the code.
            // We need a verify endpoint that doesn't require the secret in the body (unlike setup)
            // The setup endpoint required secret because it wasn't saved yet.
            // The login verification should look up the secret from DB.

            // Let's assume we update the verify endpoint or create a new one.
            // Actually, the existing verify endpoint takes `secret` in body.
            // We should modify the verify endpoint to optionally look up secret if not provided.

            // For now, let's try to hit the verify endpoint.
            // If we need to change the endpoint, we will.

            const response = await fetch('/api/auth/2fa/verify-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    token: code
                }),
            });

            if (response.ok) {
                setRequires2FA(false);
                return true;
            }
            return false;
        } catch (error) {
            console.error('2FA verification failed:', error);
            return false;
        }
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, isUserLoading, requires2FA, signIn, signOut, verify2FA }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook to use the auth context (drop-in replacement for Firebase useUser)
export function useUser() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useUser must be used within an AzureAuthProvider');
    }
    return context;
}
