'use client';

import React from 'react';

export default function OrderBook() {
  return (
    <div className="bg-transparent p-2 h-full flex flex-col">
      <h2 className="text-sm text-gray-400 mb-2">Order Book</h2>
       <div className="flex-1 flex items-center justify-center text-sm text-neutral-500">
        Order book loading...
       </div>
    </div>
  );
}
