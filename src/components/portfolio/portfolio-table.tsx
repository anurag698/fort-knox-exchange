
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type PortfolioItem = {
    id: string;
    asset: { symbol: string, name: string };
    available: number;
    price: number;
    value: number;
};

type PortfolioTableProps = {
  data: PortfolioItem[];
};

export function PortfolioTable({ data }: PortfolioTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Balances</CardTitle>
        <CardDescription>
          A detailed breakdown of your current asset holdings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Price (USDT)</TableHead>
                <TableHead className="text-right">Value (USDT)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.asset.name}</div>
                    <div className="text-sm text-muted-foreground">{item.asset.symbol}</div>
                  </TableCell>
                  <TableCell className="font-mono">{item.available.toFixed(8)}</TableCell>
                  <TableCell className="font-mono">
                    ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
