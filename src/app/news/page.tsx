'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Newspaper,
    TrendingUp,
    Bell,
    Shield,
    Settings as SettingsIcon,
    Calendar,
    Pin
} from 'lucide-react';

interface NewsArticle {
    id: string;
    title: string;
    summary: string;
    content: string;
    category: string;
    isPinned: boolean;
    isImportant: boolean;
    publishedAt: string;
    author: string;
    imageUrl?: string;
}

export default function NewsPage() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchNews();
    }, [selectedCategory]);

    const fetchNews = async () => {
        try {
            const response = await fetch(`/api/news?category=${selectedCategory}`);
            const data = await response.json();
            setArticles(data.articles || []);
        } catch (error) {
            console.error('Failed to fetch news:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'market':
                return <TrendingUp className="h-4 w-4" />;
            case 'listing':
                return <Newspaper className="h-4 w-4" />;
            case 'security':
                return <Shield className="h-4 w-4" />;
            case 'maintenance':
                return <SettingsIcon className="h-4 w-4" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'market':
                return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'listing':
                return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'security':
                return 'bg-red-500/10 text-red-600 border-red-500/20';
            case 'maintenance':
                return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
            default:
                return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
        }
    };

    return (
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Newspaper className="h-8 w-8" />
                    News & Announcements
                </h1>
                <p className="text-muted-foreground">
                    Stay updated with the latest market news and platform updates
                </p>
            </div>

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="all">All News</TabsTrigger>
                    <TabsTrigger value="market">Market</TabsTrigger>
                    <TabsTrigger value="listing">Listings</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                    <TabsTrigger value="general">General</TabsTrigger>
                </TabsList>

                <TabsContent value={selectedCategory} className="mt-6">
                    {isLoading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : articles.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12">
                                <p className="text-muted-foreground">No news articles found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {articles.map((article) => (
                                <Card
                                    key={article.id}
                                    className={`transition-all hover:shadow-lg ${article.isImportant ? 'border-primary border-2' : ''
                                        }`}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {article.isPinned && (
                                                        <Pin className="h-4 w-4 text-primary" />
                                                    )}
                                                    <Badge
                                                        variant="outline"
                                                        className={`${getCategoryColor(article.category)} flex items-center gap-1`}
                                                    >
                                                        {getCategoryIcon(article.category)}
                                                        {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                                                    </Badge>
                                                    {article.isImportant && (
                                                        <Badge variant="destructive">Important</Badge>
                                                    )}
                                                </div>
                                                <CardTitle className="text-xl">{article.title}</CardTitle>
                                                <CardDescription className="mt-2">
                                                    {article.summary}
                                                </CardDescription>
                                            </div>
                                            {article.imageUrl && (
                                                <div className="w-32 h-24 rounded-lg bg-muted flex items-center justify-center">
                                                    <Newspaper className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(article.publishedAt).toLocaleDateString()}
                                                </span>
                                                <span>By {article.author}</span>
                                            </div>
                                            <Button variant="ghost" size="sm">
                                                Read More
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
