"use client";

import { useOpenOrdersStore } from "@/lib/open-orders-store";

export function OpenOrdersPanel({ marketId }: { marketId: string }) {
  const orders = useOpenOrdersStore((s) =>
    s.getOrdersByMarket(marketId)
  );

  const remove = useOpenOrdersStore((s) => s.removeOrder);
  const update = useOpenOrdersStore((s) => s.updateOrder);

  const renderContent = () => {
    if (orders.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No open orders
        </div>
      );
    }

    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-black/40 text-gray-400">
            <th className="py-2 px-3 text-left">Type</th>
            <th className="py-2 px-3 text-left">Side</th>
            <th className="py-2 px-3 text-left">Price</th>
            <th className="py-2 px-3 text-left">Trigger</th>
            <th className="py-2 px-3 text-left">Amount</th>
            <th className="py-2 px-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr
              key={o.id}
              className="border-t border-gray-800 hover:bg-white/5 transition-colors"
            >
              {/* TYPE BADGE */}
              <td className="py-2 px-3">
                <OrderTypeBadge type={o.type} parentOcoId={o.parentOcoId} />
              </td>
              {/* BUY / SELL COLOR */}
              <td
                className={`py-2 px-3 font-semibold ${
                  o.side === "BUY" ? "text-green-400" : "text-red-400"
                }`}
              >
                {o.side}
              </td>
              {/* PRICE */}
              <td className="py-2 px-3 text-gray-200">
                {o.price ? o.price.toFixed(4) : "--"}
              </td>
              {/* TRIGGER PRICE */}
              <td className="py-2 px-3 text-gray-300">
                {o.triggerPrice ? o.triggerPrice.toFixed(4) : "--"}
              </td>
              {/* QUANTITY */}
              <td className="py-2 px-3 text-gray-200">
                {o.quantity}
              </td>
              {/* ACTIONS */}
              <td className="py-2 px-3 text-center flex gap-2 justify-center">
                {/* MODIFY BUTTON */}
                <button
                  onClick={() =>
                    update(o.id, {
                      price: parseFloat(prompt("New Price:", o.price?.toString() ?? "") || o.price?.toString() || '0'),
                    })
                  }
                  className="text-blue-400 hover:text-blue-300"
                >
                  Edit
                </button>
                {/* CANCEL BUTTON */}
                <button
                  onClick={() => remove(o.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="trading-panel">
      <div className="trading-panel-header">My Open Orders</div>
      <div className="trading-panel-body p-0">
        {renderContent()}
      </div>
    </div>
  );
}

/* ----------------------------------------------
   TYPE BADGES (LIMIT, STOP, OCO, TRAIL, etc.)
------------------------------------------------ */
function OrderTypeBadge({ type, parentOcoId }: { type: string, parentOcoId?: string | null }) {
  let label = type;
  let color = "bg-gray-700 text-gray-200";

  switch (type) {
    case "LIMIT":
      label = "Limit";
      color = "bg-blue-600/20 text-blue-400";
      break;

    case "STOP_MARKET":
      label = "Stop";
      color = "bg-red-600/20 text-red-400";
      break;

    case "STOP_LIMIT":
      label = "Stop-Limit";
      color = "bg-red-600/20 text-red-400";
      break;

    case "TAKE_PROFIT_MARKET":
      label = "TP";
      color = "bg-green-600/20 text-green-400";
      break;

    case "TAKE_PROFIT_LIMIT":
      label = "TP-Limit";
      color = "bg-green-600/20 text-green-400";
      break;

    case "TRAILING_STOP":
      label = "Trail";
      color = "bg-yellow-600/20 text-yellow-400";
      break;

    case "OCO":
      label = "OCO";
      color = "bg-purple-600/20 text-purple-400";
      break;
  }

  if (parentOcoId) {
    label = "OCO";
    color = "bg-purple-600/20 text-purple-400";
  }

  return (
    <span
      className={`px-2 py-1 text-xs rounded-md font-semibold ${color}`}
    >
      {label}
    </span>
  );
}