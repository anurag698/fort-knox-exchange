'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Portal({ children, containerId = 'trade-overlay-root' }: { children: React.ReactNode; containerId?: string }) {
  const [mounted, setMounted] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const el = document.getElementById(containerId) || null;
    setContainer(el);
  }, [containerId]);

  if (!mounted || !container) return null;
  return createPortal(children, container);
}
