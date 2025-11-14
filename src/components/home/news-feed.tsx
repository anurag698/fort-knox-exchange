
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const mockNews = [
    { id: 1, title: "BNB Surpasses 930 USDT with a Narrowed 2.53% Decrease in 24 Hours" },
    { id: 2, title: "Bitcoin(BTC) Surpasses 97,000 USDT with a Narrowed 4.16% Decrease in 24 Hours" },
    { id: 3, title: "U.S. Stock Market Declines Amid Fed Rate Concerns" },
    { id: 4, title: "Federal Reserve Considers Short-Term Securities Amid Inflation Concerns" },
];


export function NewsFeed() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">News</CardTitle>
        <Button variant="link" size="sm" asChild>
            <Link href="#">View All <ArrowRight className="h-3 w-3 ml-1" /></Link>
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
            {mockNews.map(newsItem => (
                <li key={newsItem.id} className="text-sm hover:underline cursor-pointer">
                    {newsItem.title}
                </li>
            ))}
        </ul>
      </CardContent>
    </Card>
  );
}
