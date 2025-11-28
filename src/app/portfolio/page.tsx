'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Target,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PortfolioStats {
  totalValue: number;
  totalProfit: number;
  totalProfitPercentage: number;
  totalTrades: number;
  winRate: number;
  bestAsset: { symbol: string; profit: number; profitPercentage: number };
  worstAsset: { symbol: string; loss: number; lossPercentage: number };
}

interface AssetAllocation {
  symbol: string;
  value: number;
  percentage: number;
  profit: number;
}

interface Trade {
  id: string;
  date: string;
  pair: string;
  type: string;
  amount: number;
  price: number;
  total: number;
  profit?: number;
  profitPercentage?: number;
}

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

export default function PortfolioPage() {
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [allocation, setAllocation] = useState<AssetAllocation[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');
  const [filterPair, setFilterPair] = useState('all');

  useEffect(() => {
    fetchPortfolioData();
  }, [timeframe]);

  useEffect(() => {
    fetchTradeHistory();
  }, [filterPair]);

  const fetchPortfolioData = async () => {
    try {
      const response = await fetch(`/api/portfolio/stats?userId=user1&timeframe=${timeframe}`);
      const data = await response.json();
      setStats(data.stats);
      setAllocation(data.allocation || []);
      setPerformance(data.performance || []);
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTradeHistory = async () => {
    try {
      const pairQuery = filterPair !== 'all' ? `&pair=${filterPair}` : '';
      const response = await fetch(`/api/portfolio/history?userId=user1${pairQuery}&limit=20`);
      const data = await response.json();
      setTrades(data.trades || []);
    } catch (error) {
      console.error('Failed to fetch trade history:', error);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Portfolio Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your trading performance and profits
          </p>
        </div>

        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">24 Hours</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Portfolio balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            {stats.totalProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(stats.totalProfit).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className={stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfitPercentage}%
              </span> lifetime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalTrades} total trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Asset</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bestAsset.symbol}</div>
            <p className="text-xs text-green-600 mt-1">
              +${stats.bestAsset.profit.toLocaleString()} ({stats.bestAsset.profitPercentage}%)
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="allocation">Asset Allocation</TabsTrigger>
          <TabsTrigger value="history">Trade History</TabsTrigger>
        </TabsList>

        {/* Performance Chart */}
        <TabsContent value="performance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
              <CardDescription>Value and profit over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    name="Portfolio Value"
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Total Profit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Best/Worst Performers */}
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-green-600" />
                  Best Performer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.bestAsset.symbol}</div>
                <div className="text-2xl text-green-600 font-bold mt-2">
                  +${stats.bestAsset.profit.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  +{stats.bestAsset.profitPercentage}% return
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownRight className="h-5 w-5 text-red-600" />
                  Worst Performer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.worstAsset.symbol}</div>
                <div className="text-2xl text-red-600 font-bold mt-2">
                  ${stats.worstAsset.loss.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.worstAsset.lossPercentage}% return
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Asset Allocation */}
        <TabsContent value="allocation" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Asset Distribution</CardTitle>
                <CardDescription>Current portfolio breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={allocation}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.symbol} (${entry.percentage}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {allocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Holdings</CardTitle>
                <CardDescription>Detailed breakdown by asset</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allocation.map((asset, index) => (
                    <div key={asset.symbol} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium">{asset.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            ${asset.value.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{asset.percentage}%</p>
                        <p className={`text-sm ${asset.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {asset.profit >= 0 ? '+' : ''}${asset.profit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trade History */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Trade History</CardTitle>
                  <CardDescription>Your recent trading activity</CardDescription>
                </div>
                <Select value={filterPair} onValueChange={setFilterPair}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pairs</SelectItem>
                    <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                    <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                    <SelectItem value="BNB/USDT">BNB/USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Pair</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="text-sm">
                        {new Date(trade.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{trade.pair}</TableCell>
                      <TableCell>
                        <Badge variant={trade.type === 'BUY' ? 'default' : 'secondary'}>
                          {trade.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{trade.amount}</TableCell>
                      <TableCell className="text-right">${trade.price.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${trade.total.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {trade.profit !== undefined && (
                          <span className={trade.profit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {trade.profit >= 0 ? '+' : ''}${trade.profit.toLocaleString()}
                            {trade.profitPercentage && ` (${trade.profitPercentage}%)`}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
