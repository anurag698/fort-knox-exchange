"use client";

export default function ResizeHandle({ onMouseDown }: { onMouseDown: () => void }) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="
        w-2 cursor-col-resize bg-transparent
        hover:bg-slate-600 transition-all
        active:bg-blue-500
      "
      style={{ userSelect: "none" }}
    />
  );
}
