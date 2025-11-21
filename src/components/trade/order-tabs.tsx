"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from '@/providers/azure-auth-provider';
import { OpenOrdersTable } from "./open-orders-table";
import { OrderHistory } from "./order-history";
import { DepositHistory } from "./deposit-history";
import { WithdrawalHistory } from "./withdrawal-history";
import { ListOrdered, History, TrendingUp, TrendingDown, ArrowDownToLine, ArrowUpFromLine, Target } from "lucide-react";

interface OrderTabsProps {
    marketId: string;
}

export function OrderTabs({ marketId }: OrderTabsProps) {
    const { user } = useUser();
    const userId = user?.uid || "demo-user";

    return (
        <div className="h-full flex flex-col bg-card">
            <Tabs defaultValue="open-orders" className="h-full flex flex-col">
                <div className="w-full overflow-x-auto bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border-b border-primary/20">
                    <TabsList className="w-max justify-start rounded-none bg-transparent h-10 p-0 px-2">
                        <TabsTrigger
                            value="open-orders"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 h-10 text-xs whitespace-nowrap hover:bg-primary/5 transition-all group"
                        >
                            <ListOrdered className="h-3.5 w-3.5 mr-1.5 group-data-[state=active]:text-primary" />
                            Open Orders
                        </TabsTrigger>
                        <TabsTrigger
                            value="order-history"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 h-10 text-xs whitespace-nowrap hover:bg-primary/5 transition-all group"
                        >
                            <History className="h-3.5 w-3.5 mr-1.5 group-data-[state=active]:text-primary" />
                            All History
                        </TabsTrigger>
                        <TabsTrigger
                            value="buy-history"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 h-10 text-xs whitespace-nowrap hover:bg-primary/5 transition-all group"
                        >
                            <TrendingUp className="h-3.5 w-3.5 mr-1.5 group-data-[state=active]:text-green-500" />
                            Buy History
                        </TabsTrigger>
                        <TabsTrigger
                            value="sell-history"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 h-10 text-xs whitespace-nowrap hover:bg-primary/5 transition-all group"
                        >
                            <TrendingDown className="h-3.5 w-3.5 mr-1.5 group-data-[state=active]:text-red-500" />
                            Sell History
                        </TabsTrigger>
                        <TabsTrigger
                            value="deposit-history"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 h-10 text-xs whitespace-nowrap hover:bg-primary/5 transition-all group"
                        >
                            <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5 group-data-[state=active]:text-primary" />
                            Deposits
                        </TabsTrigger>
                        <TabsTrigger
                            value="withdrawal-history"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 h-10 text-xs whitespace-nowrap hover:bg-primary/5 transition-all group"
                        >
                            <ArrowUpFromLine className="h-3.5 w-3.5 mr-1.5 group-data-[state=active]:text-primary" />
                            Withdrawals
                        </TabsTrigger>
                        <TabsTrigger
                            value="positions"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 h-10 text-xs whitespace-nowrap hover:bg-primary/5 transition-all group"
                        >
                            <Target className="h-3.5 w-3.5 mr-1.5 group-data-[state=active]:text-primary" />
                            Positions (0)
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="open-orders" className="flex-1 m-0 p-2 overflow-hidden">
                    <OpenOrdersTable userId={userId} />
                </TabsContent>

                <TabsContent value="order-history" className="flex-1 m-0 p-2 overflow-hidden">
                    <OrderHistory userId={userId} />
                </TabsContent>

                <TabsContent value="buy-history" className="flex-1 m-0 p-2 overflow-hidden">
                    <OrderHistory userId={userId} side="BUY" />
                </TabsContent>

                <TabsContent value="sell-history" className="flex-1 m-0 p-2 overflow-hidden">
                    <OrderHistory userId={userId} side="SELL" />
                </TabsContent>

                <TabsContent value="deposit-history" className="flex-1 m-0 p-2 overflow-hidden">
                    <DepositHistory userId={userId} />
                </TabsContent>

                <TabsContent value="withdrawal-history" className="flex-1 m-0 p-2 overflow-hidden">
                    <WithdrawalHistory userId={userId} />
                </TabsContent>

                <TabsContent value="positions" className="flex-1 m-0 p-3 overflow-y-auto">
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Target className="h-8 w-8 text-primary/50" />
                        </div>
                        <p className="text-xs">No open positions</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
