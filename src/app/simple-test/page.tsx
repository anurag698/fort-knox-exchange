'use client';

import { useEffect, useState } from 'react';
import mexcWebSocket from '@/services/mexc-websocket';
import useMarketDataStore from '@/state/market-data-store';

export default function SimpleDataTest() {
    const [status, setStatus] = useState('Initializing...');
    const klines = useMarketDataStore(s => s.kline['BTCUSDT'] || []);
    const ticker = useMarketDataStore(s => s.ticker['BTCUSDT']);

    useEffect(() => {
        setStatus('Fetching data...');

        mexcWebSocket.fetchInitialData('BTCUSDT')
            .then(() => {
                setStatus('✅ Data loaded!');
                mexcWebSocket.connect();
                mexcWebSocket.subscribeAll('BTCUSDT', '1m');
            })
            .catch((err) => {
                setStatus(`❌ Error: ${err.message}`);
                console.error(err);
            });
    }, []);

    return (
        <div className="p-8 space-y-4">
            <h1 className="text-3xl font-bold">Data Flow Test</h1>

            <div className="bg-blue-100 border-l-4 border-blue-500 p-4">
                <p className="font-bold">Status: {status}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-semibold mb-2">Klines in Store</h2>
                    <p className="text-4xl font-bold text-green-600">{klines.length}</p>
                    <p className="text-sm text-gray-600 mt-2">
                        {klines.length > 0 ? '✅ Data loaded!' : '⚠️ No data yet'}
                    </p>
                </div>

                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-semibold mb-2">Ticker Data</h2>
                    {ticker ? (
                        <div>
                            <p className="text-2xl font-bold">${ticker.lastPrice?.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">Last Price</p>
                        </div>
                    ) : (
                        <p className="text-gray-500">No ticker data</p>
                    )}
                </div>
            </div>

            {klines.length > 0 && (
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-semibold mb-2">Latest Candle</h2>
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                        {JSON.stringify(klines[klines.length - 1], null, 2)}
                    </pre>
                </div>
            )}

            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
                <p className="font-bold">Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>Check if "Klines in Store" shows 500</li>
                    <li>Check if ticker shows a price</li>
                    <li>Open browser console (F12) and look for <code className="bg-white px-1">[MEXC]</code> logs</li>
                    <li>Share what you see</li>
                </ol>
            </div>
        </div>
    );
}
