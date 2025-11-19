"use client";

import { useState } from "react";
import { Bell, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: "trade" | "price" | "system" | "security";
  timestamp: number;
  read: boolean;
};

export default function NotificationsDrawer() {
  const [open, setOpen] = useState(false);

  // TEMP mock notifications — replace with backend later
  const [items, setItems] = useState<NotificationItem[]>([
    {
      id: "1",
      title: "Order Filled",
      message: "Your BTC-USDT buy order at 62000 has been filled.",
      type: "trade",
      timestamp: Date.now() - 10000,
      read: false,
    },
    {
      id: "2",
      title: "Price Alert Triggered",
      message: "BTC has crossed above $63,000.",
      type: "price",
      timestamp: Date.now() - 500000,
      read: true,
    },
    {
      id: "3",
      title: "System Update",
      message: "New security patch has been deployed successfully.",
      type: "system",
      timestamp: Date.now() - 900000,
      read: true,
    },
  ]);

  const unreadCount = items.filter((i) => !i.read).length;

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setItems([]);
  };

  const iconFor = (type: NotificationItem["type"]) => {
    switch (type) {
      case "trade":
        return <CheckCircle2 className="text-[#1AC186]" size={16} />;
      case "price":
        return <AlertTriangle className="text-[#E8B923]" size={16} />;
      case "system":
        return <AlertTriangle className="text-[#4D7CFE]" size={16} />;
      case "security":
        return <AlertTriangle className="text-[#F54E5D]" size={16} />;
      default:
        return null;
    }
  };

  const formatTs = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour12: false });
  };

  return (
    <>
      {/* BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 hover:bg-muted rounded-md transition"
      >
        <Bell size={18} className="text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#F54E5D] text-white text-[10px] px-1 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[998]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* DRAWER */}
      <div
        className={cn(
          "fixed top-0 right-0 w-[360px] h-full bg-background border-l border-border z-[999] shadow-2xl transform transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            Notifications
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded hover:bg-muted"
          >
            <X size={18} />
          </button>
        </div>

        {/* ACTIONS */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-border">
          <button
            onClick={markAllRead}
            className="text-xs text-muted-foreground hover:text-white transition"
          >
            Mark all as read
          </button>
          <button
            onClick={clearAll}
            className="text-xs text-destructive hover:opacity-80"
          >
            Clear All
          </button>
        </div>

        {/* NOTIFICATION LIST */}
        <div className="overflow-y-auto h-[calc(100%-145px)] px-4 py-3 space-y-3">
          {items.length === 0 && (
            <div className="text-center text-muted-foreground mt-10">
              No notifications
            </div>
          )}

          {items.map((n) => (
            <div
              key={n.id}
              className={cn(
                "p-3 rounded-lg border border-border shadow-sm transition",
                !n.read ? "bg-card" : "opacity-70"
              )}
            >
              <div className="flex items-center gap-3">
                {iconFor(n.type)}
                <div className="flex-1">
                  <div className="font-medium text-sm">{n.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {n.message}
                  </div>
                </div>
              </div>

              <div className="text-right mt-2 text-[10px] text-muted-foreground">
                {formatTs(n.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
