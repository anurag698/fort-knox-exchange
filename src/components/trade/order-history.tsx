"use client";

import { useState, useEffect } from "react";
import { Clock, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";

interface Trade {
    orderId: string;
    symbol: string;
    side: "BUY" | "SELL";
    type: "LIMIT" | "MARKET";
    price?: number;
    quantity: number;
    filled: number;
    status: string;
    createdAt: string;
    txHash?: string;
}

interface OrderHistoryProps {
    userId: string;
    side?: "BUY" | "SELL";
}

export function OrderHistory({ userId, side }: OrderHistoryProps) {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<"ALL" | "FILLED" | "CANCELLED">("ALL");
    const [symbolFilter, setSymbolFilter] = useState("");

    // Fetch order history
    const fetchHistory = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ userId });

            if (filter !== "ALL") {
                params.append("status", filter);
            }

            if (symbolFilter) {
                params.append("symbol", symbolFilter);
            }

            const response = await fetch(`/api/orders?${params}`);
            const data = await response.json();

            if (data.status === "success") {
                // Filter out open/partial orders
                let completedOrders = data.orders.filter(
                    (o: Trade) => o.status === "FILLED" || o.status === "CANCELLED"
                );

                // Filter by side if provided
                if (side) {
                    completedOrders = completedOrders.filter((o: Trade) => o.side === side);
                }

                setTrades(completedOrders);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [userId, filter, symbolFilter, side]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "FILLED":
                return "bg-green-500/10 text-green-400 border-green-500/20";
            case "CANCELLED":
                return "bg-red-500/10 text-red-400 border-red-500/20";
            default:
                return "bg-gray-500/10 text-gray-400 border-gray-500/20";
        }
    };

    return (
        <div className="bg-gray-900 rounded-lg border border-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    {side === "BUY" ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : side === "SELL" ? (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                    ) : (
                        <Clock className="w-5 h-5" />
                    )}
                    {side ? `${side === "BUY" ? "Buy" : "Sell"} History` : "Order History"}
                </h3>

                <div className="flex items-center gap-3">
                    {/* Symbol Filter */}
                    <input
                        type="text"
                        placeholder="Filter by symbol..."
                        value={symbolFilter}
                        onChange={(e) => setSymbolFilter(e.target.value.toUpperCase())}
                        className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />

                    {/* Status Filter */}
                    <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                        {["ALL", "FILLED", "CANCELLED"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${filter === f
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-800">
                            <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase">
                                Time
                            </th>
                            <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase">
                                Symbol
                            </th>
                            <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase">
                                Side
                            </th>
                            <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase">
                                Type
                            </th>
                            <th className="text-right p-3 text-xs font-medium text-gray-400 uppercase">
                                Price
                            </th>
                            <th className="text-right p-3 text-xs font-medium text-gray-400 uppercase">
                                Quantity
                            </th>
                            <th className="text-right p-3 text-xs font-medium text-gray-400 uppercase">
                                Filled
                            </th>
                            <th className="text-center p-3 text-xs font-medium text-gray-400 uppercase">
                                Status
                            </th>
                            <th className="text-center p-3 text-xs font-medium text-gray-400 uppercase">
                                TX
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={9} className="text-center p-8 text-gray-400">
                                    Loading history...
                                </td>
                            </tr>
                        ) : trades.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="text-center p-8 text-gray-400">
                                    No order history
                                </td>
                            </tr>
                        ) : (
                            trades.map((trade) => (
                                <tr
                                    key={trade.orderId}
                                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                                >
                                    <td className="p-3">
                                        <span className="text-gray-400 text-sm">
                                            {formatDate(trade.createdAt)}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span className="text-white font-medium">{trade.symbol}</span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-1.5">
                                            {trade.side === "BUY" ? (
                                                <TrendingUp className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <TrendingDown className="w-4 h-4 text-red-400" />
                                            )}
                                            <span
                                                className={`text-sm font-semibold ${trade.side === "BUY" ? "text-green-400" : "text-red-400"
                                                    }`}
                                            >
                                                {trade.side}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className="text-gray-400 text-sm">{trade.type}</span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <span className="text-white">
                                            ${trade.price?.toLocaleString() || "Market"}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right text-white">{trade.quantity}</td>
                                    <td className="p-3 text-right">
                                        <span
                                            className={`font-medium ${trade.filled === trade.quantity
                                                ? "text-green-400"
                                                : "text-yellow-400"
                                                }`}
                                        >
                                            {trade.filled}
                                        </span>
                                        <span className="text-gray-500 text-sm ml-1">
                                            ({((trade.filled / trade.quantity) * 100).toFixed(0)}%)
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex justify-center">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                                    trade.status
                                                )}`}
                                            >
                                                {trade.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        {trade.txHash ? (
                                            <div className="flex justify-center">
                                                <a
                                                    href={`https://polygonscan.com/tx/${trade.txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 hover:bg-gray-700 rounded transition-colors group"
                                                    title="View on Polygonscan"
                                                >
                                                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="flex justify-center">
                                                <span className="text-gray-600 text-xs">Internal</span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            {trades.length > 0 && (
                <div className="p-3 border-t border-gray-800 text-sm text-gray-400 flex items-center justify-between">
                    <span>
                        Showing {trades.length} completed order{trades.length !== 1 ? "s" : ""}
                    </span>
                    <button
                        onClick={fetchHistory}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            )}
        </div>
    );
}
