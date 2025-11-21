
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";

const mockNews = [
  { id: 1, title: "BNB Surpasses 930 USDT with a Narrowed 2.53% Decrease in 24 Hours" },
  { id: 2, title: "Bitcoin(BTC) Surpasses 97,000 USDT with a Narrowed 4.16% Decrease in 24 Hours" },
  { id: 3, title: "U.S. Stock Market Declines Amid Fed Rate Concerns" },
  { id: 4, title: "Federal Reserve Considers Short-Term Securities Amid Inflation Concerns" },
];


export function NewsFeed() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Newspaper className="h-5 w-5" />
          News
        </CardTitle>
        <Button variant="link" size="sm" className="h-auto p-0" asChild>
          <Link href="#" className="flex items-center gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {mockNews.map(newsItem => (
            <li key={newsItem.id} className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer line-clamp-2">
              {newsItem.title}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
