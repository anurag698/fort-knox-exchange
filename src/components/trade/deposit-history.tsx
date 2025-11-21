"use client";

import { useState, useEffect } from "react";
import { Clock, ArrowDownLeft, ExternalLink } from "lucide-react";

interface Deposit {
    id: string;
    assetId?: string;
    asset?: string;
    amount: number;
    status: string;
    txHash: string;
    fromAddress: string;
    toAddress: string;
    createdAt: string;
    chain: string;
}

interface DepositHistoryProps {
    userId: string;
}

export function DepositHistory({ userId }: DepositHistoryProps) {
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/deposits?userId=${userId}`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setDeposits(data);
            }
        } catch (error) {
            console.error("Failed to fetch deposits:", error);
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
                    <ArrowDownLeft className="w-5 h-5 text-green-400" />
                    Deposit History
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
                            <th className="text-center p-3 text-xs font-medium text-gray-400 uppercase">Chain</th>
                            <th className="text-center p-3 text-xs font-medium text-gray-400 uppercase">Status</th>
                            <th className="text-center p-3 text-xs font-medium text-gray-400 uppercase">TX</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center p-8 text-gray-400">Loading...</td>
                            </tr>
                        ) : deposits.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center p-8 text-gray-400">No deposits found</td>
                            </tr>
                        ) : (
                            deposits.map((deposit) => (
                                <tr key={deposit.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                    <td className="p-3 text-sm text-gray-400">{formatDate(deposit.createdAt || new Date().toISOString())}</td>
                                    <td className="p-3 text-sm font-medium text-white">{deposit.asset || deposit.assetId || 'Unknown'}</td>
                                    <td className="p-3 text-sm text-right text-green-400">+{deposit.amount}</td>
                                    <td className="p-3 text-center text-xs text-gray-500">{deposit.chain}</td>
                                    <td className="p-3 text-center">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${deposit.status === 'COMPLETED' || deposit.status === 'CONFIRMED' || deposit.status === 'confirmed'
                                                ? 'bg-green-500/10 text-green-400'
                                                : 'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            {deposit.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center">
                                        {deposit.txHash && !deposit.txHash.startsWith('manual') ? (
                                            <a
                                                href={`https://polygonscan.com/tx/${deposit.txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-blue-400"
                                                title={deposit.txHash}
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-500 italic">Manual</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
