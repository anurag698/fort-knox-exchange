"use client";

import { cn } from "@/lib/utils";

export function MarketListSidebar() {
  return (
    <aside className={cn(
      "w-full h-full bg-transparent",
      "flex flex-col"
    )}>
      <div className="p-3 border-b border-[#131D2E]">
        <input
          placeholder="Search markets"
          className="w-full rounded bg-[#0D1522] px-3 py-2 text-sm outline-none ring-1 ring-inset ring-[#131D2E] focus:ring-[#CDA349] text-neutral-200"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <p className="text-sm text-neutral-500 text-center py-10">Market list loading...</p>
      </div>
    </aside>
  );
}
