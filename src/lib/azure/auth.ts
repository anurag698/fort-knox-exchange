// Azure AD B2C Authentication Configuration
import { PublicClientApplication, Configuration, AuthenticationResult } from '@azure/msal-browser';

// MSAL Configuration
const msalConfig: Configuration = {
    auth: {
        clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID || 'dummy-client-id',
        authority: process.env.NEXT_PUBLIC_AZURE_AD_AUTHORITY || 'https://login.microsoftonline.com/common',
        redirectUri: process.env.NEXT_PUBLIC_AZURE_AD_REDIRECT_URI || 'http://localhost:9002',
        knownAuthorities: [process.env.NEXT_PUBLIC_AZURE_AD_KNOWN_AUTHORITY || 'login.microsoftonline.com'],
    },
    cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false,
    },
};

// Create the MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
export async function initializeMsal() {
    await msalInstance.initialize();
    await msalInstance.handleRedirectPromise();
}

// Login request scopes
export const loginRequest = {
    scopes: ['openid', 'profile', 'email'],
};

// Sign in user
export async function signIn(): Promise<AuthenticationResult | null> {
    try {
        return await msalInstance.loginPopup(loginRequest);
    } catch (error) {
        console.error('Login failed:', error);
        return null;
    }
}

// Sign out user
export async function signOut() {
    try {
        await msalInstance.logoutPopup({
            mainWindowRedirectUri: '/',
        });
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// Get current user account
export function getCurrentUser() {
    const accounts = msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
}

// Acquire token silently
export async function acquireToken() {
    const account = getCurrentUser();
    if (!account) return null;

    try {
        const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account,
        });
        return response.accessToken;
    } catch (error) {
        console.error('Token acquisition failed:', error);
        // Fallback to interactive login
        try {
            const response = await msalInstance.acquireTokenPopup(loginRequest);
            return response.accessToken;
        } catch (popupError) {
            console.error('Interactive token acquisition failed:', popupError);
            return null;
        }
    }
}
