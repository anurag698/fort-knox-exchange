"use client";

import { useState } from "react";

let currentTool = "none";

export function useDrawingTool(): [string, (t: string) => void] {
  const [tool, setToolState] = useState(currentTool);

  const setTool = (t: string) => {
    currentTool = t;
    setToolState(t);
  };

  return [tool, setTool];
}

export function getDrawingTool() {
  return currentTool;
}
