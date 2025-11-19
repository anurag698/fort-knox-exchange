"use client";

import React from "react";

const OPTIONS = ["1m", "5m", "15m", "1h", "4h", "1d"];

export default function TimeframeSwitcher({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-2 py-1 rounded ${value === opt ? "bg-blue-600 text-white" : "bg-transparent text-white/80"}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
