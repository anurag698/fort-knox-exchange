'use client';

interface Props {
  interval: string;
  onChange: (i: string) => void;
}

const intervals = ['1m', '5m', '15m', '1h', '4h', '1d'];

export default function IntervalBar({ interval, onChange }: Props) {
  return (
    <div className="flex gap-2 px-4 py-2 border-b border-gray-800 bg-[#0d1117]">
      {intervals.map((i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`px-2 py-1 rounded text-sm ${
            interval === i
              ? 'bg-blue-500 text-white'
              : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          {i}
        </button>
      ))}
    </div>
  );
}
