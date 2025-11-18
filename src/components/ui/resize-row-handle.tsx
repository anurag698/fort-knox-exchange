"use client";

export default function ResizeRowHandle({ onMouseDown }: { onMouseDown: () => void }) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="
        h-2 cursor-row-resize bg-transparent
        hover:bg-slate-600 transition-all
        active:bg-blue-500
      "
      style={{ userSelect: "none" }}
    />
  );
}
