
"use client";

import { useState } from "react";
import {
  HybridOrderRequest,
  OrderSide,
  OrderType,
  TimeInForce,
} from "@/lib/order-types";
import { submitHybridOrder } from "@/lib/order-client";
import { useMarketDataStore } from "@/lib/market-data-service";
import { useTriggerEngine } from "@/components/trade/trigger-engine-provider";
import { useOpenOrdersStore } from "@/lib/open-orders-store";

export function OrderFormAdvanced({ marketId }: { marketId: string }) {
  const ticker = useMarketDataStore((s) => s.ticker);
  const { addTriggerOrder } = useTriggerEngine();
  const openOrders = useOpenOrdersStore();


  const [side, setSide] = useState<OrderSide>("BUY");
  const [tab, setTab] = useState<
    "LIMIT" |
    "MARKET" |
    "STOP" |
    "STOP_LIMIT" |
    "TP" |
    "TP_LIMIT" |
    "OCO" |
    "TRAILING"
  >("LIMIT");

  const [price, setPrice] = useState("");
  const [triggerPrice, setTriggerPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [timeInForce, setTIF] = useState<TimeInForce>("GTC");
  const [postOnly, setPostOnly] = useState(false);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [trailValue, setTrailValue] = useState("");

  const currentPrice = ticker?.c ? parseFloat(ticker.c) : 0;

  function resetFields() {
    setPrice("");
    setTriggerPrice("");
    setQuantity("");
    setTrailValue("");
    setTIF("GTC");
    setPostOnly(false);
    setReduceOnly(false);
  }

  async function submit() {
    const payload: HybridOrderRequest = {
      userId: "USER_001", // TODO: connect to auth
      marketId,
      side,
      quantity: Number(quantity),
      type: mapTabToOrderType(tab),
      price: price ? Number(price) : null,
      triggerPrice: triggerPrice ? Number(triggerPrice) : null,
      postOnly,
      reduceOnly,
      timeInForce,
      trailValue: trailValue ? Number(trailValue) : null,
    };
    
    if (
      payload.type === "STOP_MARKET" ||
      payload.type === "STOP_LIMIT" ||
      payload.type === "TAKE_PROFIT_MARKET" ||
      payload.type === "TAKE_PROFIT_LIMIT" ||
      payload.type === "OCO" ||
      payload.type === "TRAILING_STOP"
    ) {
      addTriggerOrder({ ...payload, id: crypto.randomUUID() });
      resetFields();
      return;
    }


    const res = await submitHybridOrder(payload);
    console.log("ORDER RESPONSE", res);

    if (res.status === 'ACCEPTED') {
      openOrders.addOrder({
        id: res.orderId,
        marketId,
        side,
        type: payload.type,
        quantity: Number(quantity),
        price: payload.price,
        triggerPrice: payload.triggerPrice ?? null,
        status: "OPEN",
        timestamp: Date.now(),
      });
    }

    resetFields();
  }

  function mapTabToOrderType(tab: string): OrderType {
    switch (tab) {
      case "LIMIT":
        return "LIMIT";
      case "MARKET":
        return "MARKET";
      case "STOP":
        return "STOP_MARKET";
      case "STOP_LIMIT":
        return "STOP_LIMIT";
      case "TP":
        return "TAKE_PROFIT_MARKET";
      case "TP_LIMIT":
        return "TAKE_PROFIT_LIMIT";
      case "OCO":
        return "OCO";
      case "TRAILING":
        return "TRAILING_STOP";
      default:
        return "LIMIT";
    }
  }

  const estimatedTotal =
    price && quantity ? (Number(price) * Number(quantity)).toFixed(2) : "0.00";

  const estimatedFee =
    quantity && currentPrice
      ? (Number(quantity) * currentPrice * 0.001).toFixed(3)
      : "0.000";

  return (
    <div className="bg-[#111315] p-4 rounded-xl shadow-xl w-full max-w-sm border border-gray-800">
      
      {/* BUY/SELL SWITCH */}
      <div className="flex mb-4">
        <button
          onClick={() => setSide("BUY")}
          className={`flex-1 py-2 rounded-l-lg text-sm font-semibold ${
            side === "BUY"
              ? "bg-green-600 text-white"
              : "bg-[#1c1f24] text-gray-400 hover:text-white"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("SELL")}
          className={`flex-1 py-2 rounded-r-lg text-sm font-semibold ${
            side === "SELL"
              ? "bg-red-600 text-white"
              : "bg-[#1c1f24] text-gray-400 hover:text-white"
          }`}
        >
          Sell
        </button>
      </div>

      {/* ORDER TYPE TABS */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {["LIMIT", "MARKET", "STOP", "TP"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`py-2 text-xs rounded-lg ${
              tab === t
                ? "bg-blue-600 text-white"
                : "bg-[#1c1f24] text-gray-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* PRICE INPUT */}
      {tab !== "MARKET" && (
        <InputField
          label="Price"
          value={price}
          onChange={setPrice}
          placeholder={currentPrice?.toString() ?? ""}
        />
      )}

      {/* TRIGGER PRICE */}
      {(tab === "STOP" ||
        tab === "STOP_LIMIT" ||
        tab === "TP" ||
        tab === "TP_LIMIT") && (
        <InputField
          label="Trigger Price"
          value={triggerPrice}
          onChange={setTriggerPrice}
          placeholder="0.00"
        />
      )}

      {/* TRAILING STOP */}
      {tab === "TRAILING" && (
        <InputField
          label="Trail Amount"
          value={trailValue}
          onChange={setTrailValue}
          placeholder="0.5%"
        />
      )}

      {/* QUANTITY */}
      <InputField
        label="Amount"
        value={quantity}
        onChange={setQuantity}
        placeholder="0.00"
      />

      {/* % BUTTONS */}
      <div className="flex justify-between mb-3">
        {[25, 50, 75, 100].map((p) => (
          <button
            key={p}
            onClick={() =>
              setQuantity(((p / 100) * 1).toString()) // TODO: set based on balance
            }
            className="px-2 py-1 text-xs bg-[#1c1f24] text-gray-400 rounded hover:text-white"
          >
            {p}%
          </button>
        ))}
      </div>

      {/* TIF + POST ONLY */}
      {tab === "LIMIT" ||
      tab === "STOP_LIMIT" ||
      tab === "TP_LIMIT" ? (
        <div className="space-y-3 mb-3">
          <Dropdown
            label="Time in Force"
            value={timeInForce}
            setValue={setTIF}
            options={["GTC", "IOC", "FOK"]}
          />

          <Checkbox
            label="Post Only"
            enabled={postOnly}
            setEnabled={setPostOnly}
          />
        </div>
      ) : null}

      {/* REDUCE ONLY */}
      <Checkbox
        label="Reduce Only"
        enabled={reduceOnly}
        setEnabled={setReduceOnly}
      />

      {/* TOTAL */}
      <div className="text-gray-400 text-xs mt-4">
        Estimated Total: <span className="text-white">{estimatedTotal}</span>
      </div>

      <div className="text-gray-400 text-xs mb-3">
        Estimated Fee: <span className="text-white">{estimatedFee}</span>
      </div>

      {/* SUBMIT BUTTON */}
      <button
        onClick={submit}
        className={`w-full py-2 rounded-lg mt-3 font-semibold ${
          side === "BUY" ? "bg-green-600" : "bg-red-600"
        } text-white hover:opacity-90`}
      >
        {side === "BUY" ? "Buy" : "Sell"} {marketId}
      </button>
    </div>
  );
}

/* ----------------------- UI SUBCOMPONENTS ---------------------- */

function InputField({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (value: string) => void, placeholder: string }) {
  return (
    <div className="mb-3">
      <label className="text-xs text-gray-400">{label}</label>
      <input
        className="w-full mt-1 px-3 py-2 bg-[#1a1d21] rounded text-sm text-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Dropdown({ label, value, setValue, options }: { label: string, value: string, setValue: (value: string) => void, options: string[] }) {
  return (
    <div>
      <label className="text-xs text-gray-400">{label}</label>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full mt-1 px-3 py-2 bg-[#1a1d21] rounded text-sm text-white"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function Checkbox({ label, enabled, setEnabled }: { label: string, enabled: boolean, setEnabled: (enabled: boolean) => void }) {
  return (
    <label className="flex items-center space-x-2 text-xs text-gray-300 mb-2">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => setEnabled(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
