"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OrderBook() {
  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-lg">Order Book</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="h-48 flex items-center justify-center text-center text-muted-foreground text-sm">
            <p>Live order book data will be displayed here.</p>
        </div>
      </CardContent>
    </Card>
  );
}
