"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CandlestickChart } from "lucide-react";

export function Charting() {
  return (
    <Card className="flex-grow">
      <CardHeader>
        <CardTitle>BTC/USDT Chart</CardTitle>
        <CardDescription>Price chart will be implemented here.</CardDescription>
      </CardHeader>
      <CardContent className="h-96 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
            <CandlestickChart className="mx-auto h-12 w-12" />
            <p className="mt-2">TradingView Chart Coming Soon</p>
        </div>
      </CardContent>
    </Card>
  );
}
