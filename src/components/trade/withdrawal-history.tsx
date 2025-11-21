"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, ExternalLink } from "lucide-react";

interface Withdrawal {
    id: string;
    assetId: string;
    amount: number;
    status: string;
    txHash?: string;
    toAddress?: string;
    withdrawalAddress?: string;
    createdAt: string;
    chain: string;
}

interface WithdrawalHistoryProps {
    userId: string;
}

export function WithdrawalHistory({ userId }: WithdrawalHistoryProps) {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/withdrawals?userId=${userId}`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setWithdrawals(data);
            }
        } catch (error) {
            console.error("Failed to fetch withdrawals:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [userId]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="bg-gray-900 rounded-lg border border-gray-800 h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-red-400" />
                    Withdrawal History
                </h3>
                <button
                    onClick={fetchHistory}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                    Refresh
                </button>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full">
                    <thead className="sticky top-0 bg-gray-900 z-10">
                        <tr className="border-b border-gray-800">
                            <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase">Time</th>
                            <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase">Asset</th>
                            <th className="text-right p-3 text-xs font-medium text-gray-400 uppercase">Amount</th>
                            <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase">To Address</th>
                            <th className="text-center p-3 text-xs font-medium text-gray-400 uppercase">Status</th>
                            <th className="text-center p-3 text-xs font-medium text-gray-400 uppercase">TX</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center p-8 text-gray-400">Loading...</td>
                            </tr>
                        ) : withdrawals.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center p-8 text-gray-400">No withdrawals found</td>
                            </tr>
                        ) : (
                            withdrawals.map((withdrawal) => {
                                const address = withdrawal.toAddress || withdrawal.withdrawalAddress || "";
                                const displayAddress = address.length > 10
                                    ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
                                    : address || "Unknown";

                                return (
                                    <tr key={withdrawal.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                        <td className="p-3 text-sm text-gray-400">{formatDate(withdrawal.createdAt)}</td>
                                        <td className="p-3 text-sm font-medium text-white">{withdrawal.assetId}</td>
                                        <td className="p-3 text-sm text-right text-red-400">-{withdrawal.amount}</td>
                                        <td className="p-3 text-xs text-gray-500 font-mono">
                                            {displayAddress}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${withdrawal.status === 'COMPLETED'
                                                ? 'bg-green-500/10 text-green-400'
                                                : withdrawal.status === 'FAILED'
                                                    ? 'bg-red-500/10 text-red-400'
                                                    : 'bg-yellow-500/10 text-yellow-400'
                                                }`}>
                                                {withdrawal.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            {withdrawal.txHash && (
                                                <a
                                                    href={`https://polygonscan.com/tx/${withdrawal.txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-blue-400"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
