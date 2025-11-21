"use client";

import { useAssets } from "@/hooks/use-assets";
import { useMarkets } from "@/hooks/use-markets";
import { WalletOverview } from "@/components/wallet/wallet-overview";
import { AssetList } from "@/components/wallet/asset-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/providers/azure-auth-provider";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useMarketDataStore } from "@/state/market-data-store";

export default function WalletPage() {
    const { user, isUserLoading } = useUser();
    const { data: assets, isLoading: isAssetsLoading } = useAssets();
    const { data: markets } = useMarkets();
    const tickerMap = useMarketDataStore(state => state.ticker);
    const router = useRouter();

    const prices = useMemo(() => {
        const map: Record<string, number> = { 'USDT': 1 };

        if (markets) {
            markets.forEach(market => {
                if (market.quoteAssetId === 'USDT') {
                    // Try to get live price from ticker, fallback to 0
                    const ticker = tickerMap[market.id];
                    if (ticker) {
                        map[market.baseAssetId] = ticker.lastPrice;
                    } else {
                        // Fallback to approximate prices if no live data yet
                        // This prevents zero balance flash
                        const mockPrices: Record<string, number> = {
                            'BTC': 65000, 'ETH': 3500, 'SOL': 150, 'BNB': 600, 'DOGE': 0.15
                        };
                        map[market.baseAssetId] = mockPrices[market.baseAssetId] || 0;
                    }
                }
            });
        }
        return map;
    }, [markets, tickerMap]);

    // Calculate Totals
    const totalBalanceUsd = assets?.reduce((sum, asset) => {
        const price = prices[asset.symbol] || 0;
        return sum + (asset.free + asset.locked) * price;
    }, 0) || 0;

    const btcPrice = prices['BTC'] || 65000;
    const totalBalanceBtc = totalBalanceUsd / btcPrice;

    if (isUserLoading || isAssetsLoading) {
        return (
            <div className="container mx-auto max-w-7xl p-6 space-y-8 pt-24">
                <Skeleton className="w-full h-64 rounded-2xl" />
                <div className="space-y-4">
                    <Skeleton className="w-full h-16 rounded-xl" />
                    <Skeleton className="w-full h-16 rounded-xl" />
                    <Skeleton className="w-full h-16 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-20 pb-12">
            <div className="container mx-auto max-w-7xl p-6 space-y-8">

                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
                    <p className="text-muted-foreground">Manage your crypto assets and portfolio.</p>
                </div>

                {/* Overview Card */}
                <WalletOverview
                    totalBalanceUsd={totalBalanceUsd}
                    totalBalanceBtc={totalBalanceBtc}
                    onDeposit={() => { }}
                    onWithdraw={() => { }}
                />

                {/* Assets Table */}
                <AssetList assets={assets || []} prices={prices} />

            </div>
        </div>
    );
}
