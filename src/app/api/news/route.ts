import { NextResponse } from 'next/server';

export type NewsCategory = 'market' | 'listing' | 'security' | 'maintenance' | 'general';

export interface NewsArticle {
    id: string;
    title: string;
    summary: string;
    content: string;
    category: NewsCategory;
    isPinned: boolean;
    isImportant: boolean;
    publishedAt: string;
    author: string;
    imageUrl?: string;
}

// Mock news data
let newsArticles: NewsArticle[] = [
    {
        id: '1',
        title: 'Bitcoin Reaches New All-Time High',
        summary: 'BTC crosses $100,000 milestone amid institutional adoption surge',
        content: 'Bitcoin has reached a new all-time high of $105,000, driven by increased institutional adoption and ETF inflows...',
        category: 'market',
        isPinned: true,
        isImportant: true,
        publishedAt: new Date().toISOString(),
        author: 'Fort Knox Team',
        imageUrl: '/news/bitcoin-ath.jpg',
    },
    {
        id: '2',
        title: 'New Token Listing: SHIB/USDT',
        summary: 'Shiba Inu now available for trading on Fort Knox Exchange',
        content: 'We are excited to announce that Shiba Inu (SHIB) is now listed on Fort Knox Exchange...',
        category: 'listing',
        isPinned: false,
        isImportant: false,
        publishedAt: new Date(Date.now() - 86400000).toISOString(),
        author: 'Fort Knox Team',
    },
    {
        id: '3',
        title: 'Security Update: Enhanced 2FA',
        summary: 'New biometric authentication options now available',
        content: 'We have enhanced our security features with biometric authentication support...',
        category: 'security',
        isPinned: true,
        isImportant: true,
        publishedAt: new Date(Date.now() - 172800000).toISOString(),
        author: 'Security Team',
    },
];

// GET /api/news - List all news articles
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        let filtered = newsArticles;
        if (category && category !== 'all') {
            filtered = newsArticles.filter(article => article.category === category);
        }

        // Sort by pinned first, then by date
        filtered.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        });

        return NextResponse.json({
            success: true,
            articles: filtered,
            total: filtered.length,
        });
    } catch (error) {
        console.error('News fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch news' },
            { status: 500 }
        );
    }
}

// POST /api/news - Create new article (admin only)
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const newArticle: NewsArticle = {
            id: Date.now().toString(),
            title: body.title,
            summary: body.summary,
            content: body.content,
            category: body.category || 'general',
            isPinned: body.isPinned || false,
            isImportant: body.isImportant || false,
            publishedAt: new Date().toISOString(),
            author: body.author || 'Fort Knox Team',
            imageUrl: body.imageUrl,
        };

        newsArticles.unshift(newArticle);

        return NextResponse.json({
            success: true,
            article: newArticle,
        });
    } catch (error) {
        console.error('News creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create article' },
            { status: 500 }
        );
    }
}

// DELETE /api/news - Delete article
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Article ID required' },
                { status: 400 }
            );
        }

        newsArticles = newsArticles.filter(article => article.id !== id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('News deletion error:', error);
        return NextResponse.json(
            { error: 'Failed to delete article' },
            { status: 500 }
        );
    }
}
