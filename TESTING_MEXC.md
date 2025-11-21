## Quick Test Instructions

### Test MEXC Data Loading

1. **Test API Routes:**
   ```bash
   curl "http://localhost:9002/api/mexc/ticker?symbol=BTCUSDT"
   curl "http://localhost:9002/api/mexc/klines?symbol=BTCUSDT&interval=1m&limit=5"
   ```

2. **Test Store Population:**
   Visit: `http://localhost:9002/debug-data`
   - Should show klines count > 0
   - Should show ticker data
   - Should show depth data

3. **Test Chart Rendering:**
   Visit: `http://localhost:9002/test-chart`
   - Should load 500 candles
   - Should show chart with candlesticks
   - Check console for `[TEST]` logs

4. **Test Full Trade Page:**
   Visit: `http://localhost:9002/trade/BTC-USDT`
   - Open console (F12)
   - Look for `[ProTradingLayout]` and `[MEXC]` logs
   - Chart should display candlesticks

### Console Logs to Look For

✅ Good logs:
```
[ProTradingLayout] Initializing MEXC data for symbol: BTCUSDT
[MEXC] Fetching initial data for BTCUSDT...
[MEXC] Requesting ticker from /api/mexc/ticker?symbol=BTCUSDT
[MEXC] Fetched ticker: {...}
[MEXC] Requesting klines from /api/mexc/klines?symbol=BTCUSDT&interval=1m&limit=500
[MEXC] Fetched 500 klines
[MEXC] All klines emitted to event bus
[MEXC] ✅ Initial data loading complete!
[ProTradingLayout] ✅ Initial data loaded, now connecting WebSocket...
[MEXC WS] Connected
```

❌ Bad logs:
- Any red error messages
- `Failed to fetch`
- `404 Not Found`
- No logs at all
