"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function OrderForm() {
  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-lg">Place Order</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Tabs defaultValue="buy">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>
          <TabsContent value="buy" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buy-price">Price (USDT)</Label>
              <Input id="buy-price" placeholder="0.00" type="number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buy-amount">Amount (BTC)</Label>
              <Input id="buy-amount" placeholder="0.00" type="number" />
            </div>
            <div className="space-y-2">
              <Label>Total</Label>
              <Input id="buy-total" placeholder="0.00" type="number" readOnly />
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">Buy BTC</Button>
          </TabsContent>
          <TabsContent value="sell" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sell-price">Price (USDT)</Label>
              <Input id="sell-price" placeholder="0.00" type="number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sell-amount">Amount (BTC)</Label>
              <Input id="sell-amount" placeholder="0.00" type="number" />
            </div>
             <div className="space-y-2">
              <Label>Total</Label>
              <Input id="sell-total" placeholder="0.00" type="number" readOnly />
            </div>
            <Button className="w-full" variant="destructive">Sell BTC</Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
