
import { NextResponse, type NextRequest } from 'next/server';
import axios from 'axios';

// MEXC API base URL
const MEXC_API_BASE = 'https://api.mexc.com';

// Kline/Candlestick data from MEXC
// https://mexc-docs.github.io/apidocs/spot-v3/en/#kline-candlestick-data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // 1. Extract and validate query parameters
  const pair = searchParams.get('pair')?.replace('-', '');
  const interval = searchParams.get('interval') || '1m';
  const from = searchParams.get('from'); // Start time in seconds
  const to = searchParams.get('to');     // End time in seconds

  if (!pair) {
    return NextResponse.json({ error: 'Pair is required' }, { status: 400 });
  }

  // 2. Construct the MEXC API URL
  const mexcParams = new URLSearchParams({
    symbol: pair,
    interval: interval,
  });

  // MEXC uses `startTime` and `endTime` in milliseconds
  if (from) {
    mexcParams.append('startTime', (parseInt(from, 10) * 1000).toString());
  }
  if (to) {
    mexcParams.append('endTime', (parseInt(to, 10) * 1000).toString());
  }

  const url = `${MEXC_API_BASE}/api/v3/klines?${mexcParams.toString()}`;

  try {
    // 3. Fetch data from MEXC
    const response = await axios.get(url);
    const data = response.data;

    // 4. Map MEXC's array format to the object format our chart expects
    const candles = data.map((kline: any) => ({
      t: kline[0], // open time (ms)
      o: parseFloat(kline[1]), // open
      h: parseFloat(kline[2]), // high
      l: parseFloat(kline[3]), // low
      c: parseFloat(kline[4]), // close
      v: parseFloat(kline[5]), // volume
    }));

    return NextResponse.json(candles);
  } catch (error) {
    console.error('MEXC API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candlestick data from MEXC' },
      { status: 500 }
    );
  }
}
