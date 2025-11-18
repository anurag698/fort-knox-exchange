'use client';

interface Props {
  value: number;
  onChange: (v: number) => void;
}

const levels = [0.01, 0.1, 1, 10];

export default function AggregationSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 px-4 py-1 bg-[#0d1117] border-b border-gray-800">
      {levels.map((lvl) => (
        <button
          key={lvl}
          onClick={() => onChange(lvl)}
          className={`px-2 py-1 rounded text-xs ${
            value === lvl
              ? 'bg-blue-500 text-white'
              : 'text-gray-400 hover:bg-gray-800'
          }`}
        >
          {lvl}
        </button>
      ))}
    </div>
  );
}
