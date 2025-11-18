'use client';

export default function OrderBookContainer({ children }: any) {
  return (
    <div className="bg-[#0d1117] border border-gray-800 rounded p-2 overflow-auto h-full">
      {children}
    </div>
  );
}
