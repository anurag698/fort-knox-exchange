import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://fortknox.exchange';

    // Static routes
    const routes = [
        '',
        '/markets',
        '/wallet',
        '/analytics',
        '/history',
        '/leaderboard',
        '/copy-trading',
        '/login',
        '/signup',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic routes (e.g., markets)
    // In a real app, we would fetch these from an API
    const marketRoutes = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'BNB-USDT'].map((symbol) => ({
        url: `${baseUrl}/trade/${symbol}`,
        lastModified: new Date(),
        changeFrequency: 'always' as const,
        priority: 0.9,
    }));

    return [...routes, ...marketRoutes];
}
