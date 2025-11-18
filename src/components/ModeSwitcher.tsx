'use client';

import React from 'react';
import clsx from 'clsx';

interface Props {
  mode: string;
  onChange: (mode: string) => void;
}

const tabs = [
  { id: 'advanced', label: 'Advanced' },
  { id: 'chart', label: 'Chart + TV' },
  { id: 'depth', label: 'Depth' },
];

export default function ModeSwitcher({ mode, onChange }: Props) {
  return (
    <div className="flex items-center gap-4 border-b border-gray-800 px-4">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={clsx(
            'py-3 px-1 text-sm transition-all',
            mode === t.id
              ? 'text-blue-400 border-b-2 border-blue-400 font-semibold'
              : 'text-gray-400 hover:text-gray-200'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
