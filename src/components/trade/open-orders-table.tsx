"use client";

import { useState, useEffect } from "react";
import { X, Edit2, RefreshCw } from "lucide-react";

interface Order {
    orderId: string;
    symbol: string;
    side: "BUY" | "SELL";
    type: "LIMIT" | "MARKET";
    price?: number;
    quantity: number;
    filled: number;
    remaining: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

interface OpenOrdersTableProps {
    userId: string;
}

export function OpenOrdersTable({ userId }: OpenOrdersTableProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<"ALL" | "BUY" | "SELL">("ALL");
    const [editingOrder, setEditingOrder] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState("");
    const [editQuantity, setEditQuantity] = useState("");

    // Fetch orders
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                userId,
                status: "OPEN,PARTIAL",
            });

            if (filter !== "ALL") {
                params.append("side", filter);
            }

            const response = await fetch(`/api/orders?${params}`);
            const data = await response.json();

            if (data.status === "success") {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // Refresh every 5 seconds
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, [userId, filter]);

    // Cancel order
    const handleCancel = async (orderId: string) => {
        if (!confirm("Are you sure you want to cancel this order?")) return;

        try {
            const response = await fetch(`/api/orders/${orderId}/cancel`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();

            if (data.status === "success") {
                fetchOrders(); // Refresh list
            } else {
                alert(`Cancel failed: ${data.error}`);
            }
        } catch (error) {
            console.error("Cancel error:", error);
            alert("Failed to cancel order");
        }
    };

    // Modify order
    const handleModify = async (orderId: string) => {
        const newPrice = parseFloat(editPrice);
        const newQuantity = parseFloat(editQuantity);

        if (isNaN(newPrice) && isNaN(newQuantity)) {
            alert("Enter new price or quantity");
            return;
        }

        try {
            const body: any = { userId };
            if (!isNaN(newPrice)) body.newPrice = newPrice;
            if (!isNaN(newQuantity)) body.newQuantity = newQuantity;

            const response = await fetch(`/api/orders/${orderId}/modify`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (data.status === "success") {
                setEditingOrder(null);
                setEditPrice("");
                setEditQuantity("");
                fetchOrders();
            } else {
                alert(`Modify failed: ${data.error}`);
            }
        } catch (error) {
            console.error("Modify error:", error);
            alert("Failed to modify order");
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "OPEN":
                return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case "PARTIAL":
                return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
            case "FILLED":
                return "bg-green-500/10 text-green-400 border-green-500/20";
            case "CANCELLED":
                return "bg-gray-500/10 text-gray-400 border-gray-500/20";
            default:
                return "bg-gray-500/10 text-gray-400 border-gray-500/20";
        }
    };

    return (
        <div className="bg-gray-900 rounded-lg border border-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">Open Orders</h3>

                <div className="flex items-center gap-3">
                    {/* Filter Buttons */}
                    <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                        {["ALL", "BUY", "SELL"].map((f) => (
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

                    {/* Refresh Button */}
                    <button
                        onClick={fetchOrders}
                        disabled={loading}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`w-4 h-4 text-gray-400 ${loading ? "animate-spin" : ""}`}
                        />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-800">
                            <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase">
                                Symbol
                            </th>
                            <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase">
                                Side
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
                            <th className="text-right p-3 text-xs font-medium text-gray-400 uppercase">
                                Remaining
                            </th>
                            <th className="text-center p-3 text-xs font-medium text-gray-400 uppercase">
                                Status
                            </th>
                            <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase">
                                Time
                            </th>
                            <th className="text-right p-3 text-xs font-medium text-gray-400 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && orders.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="text-center p-8 text-gray-400">
                                    Loading orders...
                                </td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="text-center p-8 text-gray-400">
                                    No open orders
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr
                                    key={order.orderId}
                                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                                >
                                    <td className="p-3">
                                        <span className="text-white font-medium">{order.symbol}</span>
                                    </td>
                                    <td className="p-3">
                                        <span
                                            className={`text-sm font-semibold ${order.side === "BUY" ? "text-green-400" : "text-red-400"
                                                }`}
                                        >
                                            {order.side}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        {editingOrder === order.orderId ? (
                                            <input
                                                type="number"
                                                value={editPrice}
                                                onChange={(e) => setEditPrice(e.target.value)}
                                                placeholder={order.price?.toFixed(2)}
                                                className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white text-right"
                                            />
                                        ) : (
                                            <span className="text-white">
                                                ${order.price?.toLocaleString()}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-right">
                                        {editingOrder === order.orderId ? (
                                            <input
                                                type="number"
                                                value={editQuantity}
                                                onChange={(e) => setEditQuantity(e.target.value)}
                                                placeholder={order.quantity.toString()}
                                                className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white text-right"
                                            />
                                        ) : (
                                            <span className="text-white">{order.quantity}</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-right text-gray-400">{order.filled}</td>
                                    <td className="p-3 text-right text-white font-medium">
                                        {order.remaining}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex justify-center">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                                    order.status
                                                )}`}
                                            >
                                                {order.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-gray-400 text-sm">
                                        {formatDate(order.createdAt)}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center justify-end gap-2">
                                            {editingOrder === order.orderId ? (
                                                <>
                                                    <button
                                                        onClick={() => handleModify(order.orderId)}
                                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingOrder(null);
                                                            setEditPrice("");
                                                            setEditQuantity("");
                                                        }}
                                                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => setEditingOrder(order.orderId)}
                                                        className="p-1.5 hover:bg-gray-700 rounded transition-colors group"
                                                        title="Modify"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancel(order.orderId)}
                                                        className="p-1.5 hover:bg-gray-700 rounded transition-colors group"
                                                        title="Cancel Order"
                                                    >
                                                        <X className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            {orders.length > 0 && (
                <div className="p-3 border-t border-gray-800 text-sm text-gray-400">
                    Showing {orders.length} open order{orders.length !== 1 ? "s" : ""}
                </div>
            )}
        </div>
    );
}
