"use client";

import { useState } from "react";
import { Asset } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { coinIcons } from "@/components/markets/markets-table";
import { DepositModal, WithdrawModal } from "./transfer-modals";
import { useRouter } from "next/navigation";

interface AssetListProps {
    assets: Asset[];
    prices?: Record<string, number>;
}

export function AssetList({ assets, prices = {} }: AssetListProps) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [modalType, setModalType] = useState<"deposit" | "withdraw" | null>(null);

    const filteredAssets = assets.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.symbol.toLowerCase().includes(search.toLowerCase())
    );

    const openModal = (type: "deposit" | "withdraw", asset: Asset) => {
        setSelectedAsset(asset);
        setModalType(type);
    };

    const closeModal = () => {
        setModalType(null);
        setSelectedAsset(null);
    };

    return (
        <div className="w-full flex flex-col gap-4">
            {/* Controls */}
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Assets</h2>
                <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search coin..."
                        className="pl-9 bg-card/50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-4">Asset</div>
                <div className="col-span-3 text-right">Balance</div>
                <div className="col-span-3 text-right">Value</div>
                <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-2">
                {filteredAssets.map((asset) => {
                    const Icon = coinIcons[asset.symbol] || coinIcons.DEFAULT;
                    // Use real price if available, fallback to 0
                    const price = prices[asset.symbol] || 0;
                    const value = (asset.free + asset.locked) * price;

                    return (
                        <div
                            key={asset.id}
                            className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-xl bg-card/50 hover:bg-card border border-transparent hover:border-primary/10 transition-all items-center group"
                        >
                            {/* Asset Info */}
                            <div className="col-span-1 md:col-span-4 flex items-center gap-3">
                                <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                    {typeof Icon === 'string' ? (
                                        <AvatarImage src={Icon} />
                                    ) : (
                                        <Icon className="h-10 w-10" />
                                    )}
                                    <AvatarFallback>{asset.symbol[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-bold text-base">{asset.symbol}</span>
                                    <span className="text-xs text-muted-foreground">{asset.name}</span>
                                </div>
                            </div>

                            {/* Balance */}
                            <div className="col-span-1 md:col-span-3 flex flex-row md:flex-col justify-between md:justify-center md:text-right">
                                <span className="md:hidden text-muted-foreground text-sm">Balance</span>
                                <div className="flex flex-col">
                                    <span className="font-mono font-medium">{(asset.free + asset.locked).toLocaleString()}</span>
                                    <span className="text-xs text-muted-foreground">Locked: {asset.locked}</span>
                                </div>
                            </div>

                            {/* Value */}
                            <div className="col-span-1 md:col-span-3 flex flex-row md:flex-col justify-between md:justify-center md:text-right">
                                <span className="md:hidden text-muted-foreground text-sm">Value</span>
                                <span className="font-mono font-medium">${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>

                            {/* Actions */}
                            <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                                    title="Deposit"
                                    onClick={() => openModal('deposit', asset)}
                                >
                                    <ArrowDownLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                                    title="Withdraw"
                                    onClick={() => openModal('withdraw', asset)}
                                >
                                    <ArrowUpRight className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                                    title="Trade"
                                    onClick={() => router.push(`/trade/${asset.symbol}-USDT`)}
                                >
                                    <ArrowRightLeft className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modals */}
            <DepositModal
                isOpen={modalType === 'deposit'}
                onClose={closeModal}
                asset={selectedAsset!}
            />
            <WithdrawModal
                isOpen={modalType === 'withdraw'}
                onClose={closeModal}
                asset={selectedAsset!}
                balance={selectedAsset?.free || 0}
            />
        </div>
    );
}
