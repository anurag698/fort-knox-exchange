

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { EnrichedMarket } from "@/app/markets/page";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight, Bitcoin, Circle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";


// Mock icons for coins - you would replace these with real image URLs
const coinIcons: { [key: string]: React.ElementType | string } = {
  BTC: Bitcoin,
  ETH: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/eth.png',
  USDT: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/usdt.png',
  SOL: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/sol.png',
  ADA: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/ada.png',
  MATIC: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/matic.png',
  DOGE: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/doge.png',
  XRP: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/xrp.png',
  DOT: 'https://cdn.jsdelivrnet/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/dot.png',
  LINK: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/link.png',
  SHIB: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/shib.png',
  AVAX: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/avax.png',
  LTC: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/ltc.png',
  TRX: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/trx.png',
  UNI: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/uni.png',
  BNB: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/bnb.png',
  BCH: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/bch.png',
  XLM: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/xlm.png',
  ATOM: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/atom.png',
  FIL: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/fil.png',
  NEAR: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/near.png',
  APT: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/apt.png',
  IMX: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/imx.png',
  SUI: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/sui.png',
  SAND: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/sand.png',
  AAVE: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/aave.png',
  MKR: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/mkr.png',
  MANA: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/mana.png',
  FTM: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/ftm.png',
  DEFAULT: Circle,
};

interface MarketStatCardProps {
    title: string;
    markets: EnrichedMarket[];
    isLoading: boolean;
}

export function MarketStatCard({ title, markets, isLoading }: MarketStatCardProps) {
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-4 mt-2">
                    {[...Array(4)].map((_, i) => (
                         <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-6 rounded-full" />
                                <Skeleton className="h-4 w-12" />
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-3 w-10" />
                            </div>
                        </div>
                    ))}
                </div>
            )
        }

        return (
            <ul className="space-y-2">
                {markets.map(market => {
                    const data = market.marketData;
                    if (!data) return null;
                    const priceChangeColor = data.priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500';
                    const Icon = coinIcons[market.baseAsset?.symbol || 'DEFAULT'] || coinIcons.DEFAULT;

                    return (
                        <li key={market.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                 <Avatar className="h-6 w-6">
                                    {typeof Icon === 'string' ? (
                                        <AvatarImage src={Icon} alt={market.baseAsset?.name} />
                                    ) : (
                                        <Icon className="h-6 w-6" />
                                    )}
                                    <AvatarFallback>{market.baseAsset?.symbol.slice(0, 2)}</AvatarFallback>
                                </Avatar>
                                <span className="font-semibold">{market.baseAsset?.symbol}</span>
                            </div>
                            <div className="text-right font-mono">
                                <div>${data.price.toFixed(market.pricePrecision)}</div>
                                <div className={priceChangeColor}>{data.priceChangePercent.toFixed(2)}%</div>
                            </div>
                        </li>
                    )
                })}
            </ul>
        )
    }
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md font-semibold">{title}</CardTitle>
                 <Button variant="link" size="sm" className="p-0 h-auto text-xs" asChild>
                    <Link href="#">More <ArrowRight className="h-3 w-3 ml-1" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
}
