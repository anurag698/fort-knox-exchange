// src/components/trade/chart-area.tsx
"use client";

import React from "react";

export default function ChartArea({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      {children ?? (
        <div
          style={{
            color: "#888",
            padding: "16px",
            fontSize: "14px",
          }}
        >
          Chart Area Ready — waiting for chart component...
        </div>
      )}
    </div>
  );
}
