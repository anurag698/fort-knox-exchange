'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import mexcWebSocket from '@/services/mexc-websocket';
import useMarketDataStore from '@/state/market-data-store';

export default function MinimalChart() {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState('Loading...');
    const klines = useMarketDataStore(s => s.kline['BTCUSDT'] || []);

    useEffect(() => {
        // Fetch data first
        mexcWebSocket.fetchInitialData('BTCUSDT')
            .then(() => {
                setStatus('✅ Data loaded!');
            })
            .catch(err => {
                setStatus(`❌ Error: ${err.message}`);
            });
    }, []);

    useEffect(() => {
        if (!chartContainerRef.current || klines.length === 0) {
            console.log('No container or no data yet');
            return;
        }

        console.log(`Creating chart with ${klines.length} candles`);

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#1e222d' },
                textColor: '#d1d4dc',
            },
            width: chartContainerRef.current.clientWidth,
            height: 500,
        });

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        // Convert and set data
        const chartData = klines.map(k => ({
            time: Math.floor(k.t / 1000),
            open: k.o,
            high: k.h,
            low: k.l,
            close: k.c,
        }));

        console.log('Setting chart data:', chartData.length, 'candles');
        candlestickSeries.setData(chartData);
        chart.timeScale().fitContent();

        return () => {
            chart.remove();
        };
    }, [klines]);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Minimal Chart Test</h1>

            <div className="bg-blue-100 p-4 mb-4 rounded">
                <p><strong>Status:</strong> {status}</p>
                <p><strong>Candles in store:</strong> {klines.length}</p>
            </div>

            {klines.length === 0 ? (
                <div className="bg-yellow-100 p-8 rounded text-center">
                    <p className="text-xl">Waiting for data to load...</p>
                    <p className="text-sm mt-2">Check browser console for errors</p>
                </div>
            ) : (
                <div ref={chartContainerRef} className="bg-gray-900 rounded" />
            )}
        </div>
    );
}
