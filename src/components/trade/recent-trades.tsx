"use client";

import React from 'react';

export function RecentTrades({ marketId }: { marketId: string }) {
 return (
    <div className="bg-transparent p-2 h-full flex flex-col">
      <h2 className="text-sm text-gray-400 mb-2">Recent Trades</h2>
       <div className="flex-1 flex items-center justify-center text-sm text-neutral-500">
        Trades loading...
       </div>
    </div>
  );
}
