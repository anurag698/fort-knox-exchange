"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function UserTrades() {
    // This will be replaced with real data
    const openOrders = [
        // Sample data
        { id: '1', market: 'BTC/USDT', side: 'BUY', price: '68000.00', amount: '0.1', filled: '0.05', status: 'PARTIAL' },
        { id: '2', market: 'ETH/USDT', side: 'SELL', price: '3500.00', amount: '2.0', filled: '0.0', status: 'OPEN' },
    ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Open Orders</CardTitle>
        <CardDescription>Your active and partially filled orders.</CardDescription>
      </CardHeader>
      <CardContent>
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Market</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Filled</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {openOrders.map(order => (
                    <TableRow key={order.id}>
                        <TableCell>{order.market}</TableCell>
                        <TableCell>
                            <span className={order.side === 'BUY' ? 'text-green-600' : 'text-red-600'}>{order.side}</span>
                        </TableCell>
                        <TableCell>{order.price}</TableCell>
                        <TableCell>{order.amount}</TableCell>
                        <TableCell>{order.filled}</TableCell>
                        <TableCell>
                            <Badge variant={order.status === 'OPEN' ? 'secondary' : 'default'}>{order.status}</Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
        {openOrders.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
                <p>You have no open orders.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
