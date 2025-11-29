import { queryItems } from '@/lib/azure/cosmos';
import { getUserTrades } from '@/lib/azure/cosmos-trading';
import type { SpotPosition, Balance, Market } from '@/lib/types';
import type { Trade, Ticker } from '@/lib/market-types';

export async function getUserTradesHistory(userId: string) {
  const query = 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC';
  const parameters = [{ name: '@userId', value: userId }];

  const orders = await queryItems('orders', query, parameters);
  return orders;
}

export async function getUserTradeFills(userId: string) {
  // Use the existing cosmos-trading function
  const trades = await getUserTrades(userId);
  return trades;
}

export async function getUserPositions(userId: string): Promise<SpotPosition[]> {
  // Read user balances
  const balancesQuery = 'SELECT * FROM c WHERE c.userId = @userId';
  const balanceParams = [{ name: '@userId', value: userId }];
  const balances = await queryItems<Balance>('balances', balancesQuery, balanceParams);

  // Read markets
  const markets = await queryItems<Market>('markets', 'SELECT * FROM c');

  // Read tickers from market_data
  const tickers = await queryItems<Ticker>('market_data', 'SELECT * FROM c');

  const tickerMap = Object.fromEntries(
    tickers.map(t => [t.symbol, t.lastPrice || t.price || 0])
  );

  const positions: SpotPosition[] = [];

  for (const balance of balances) {
    const assetId = balance.assetId;
    const quantity = balance.available + (balance.locked || 0);

    // Skip zero balance coins or the quote currency
    if (!quantity || quantity <= 0 || assetId === 'USDT') continue;

    // Find the market where this asset is the base asset (e.g., BTC in BTC-USDT)
    const market = markets.find(m => m.baseAssetId === assetId && m.quoteAssetId === 'USDT');
    if (!market) continue;

    const mId = market.id;
    const marketPrice = tickerMap[mId] ?? null;

    // This is a simplification. A real avgPrice would be calculated from trade history.
    const avgPrice = (balance as any).avgPrice ?? marketPrice; // Fallback to current price if no avg
    const value = marketPrice ? quantity * marketPrice : null;

    let pnl = null;
    let pnlPercent = null;

    if (avgPrice && marketPrice && avgPrice > 0) {
      pnl = (marketPrice - avgPrice) * quantity;
      pnlPercent = ((marketPrice - avgPrice) / avgPrice) * 100;
    }

    positions.push({
      assetId,
      quantity,
      avgPrice,
      marketPrice,
      value,
      pnl,
      pnlPercent,
    });
  }

  return positions;
}
