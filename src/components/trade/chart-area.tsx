// src/components/trade/chart-area.tsx
"use client";

import React from "react";

export default function ChartArea({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      {children ?? (
        <div
          style={{
            padding: "16px",
            color: "#999",
            fontSize: "14px",
          }}
        >
          ChartArea Loaded — waiting for chart component…
        </div>
      )}
    </div>
  );
}
