
// This component provides the interface for users to place buy and sell orders.
'use client';

import { useEffect, useState, useActionState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser } from '@/firebase';
import { createMarketOrder } from '@/app/trade/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { useBalances } from '@/hooks/use-balances';
import { Alert } from '@/components/ui/alert';
import { useMarketDataStore } from '@/state/market-data-store';

const orderSchema = z.object({
  price: z.coerce.number().optional(),
  quantity: z.coerce.number().positive({ message: "Amount must be positive." }),
  marketId: z.string(),
  type: z.enum(['LIMIT', 'MARKET']),
  side: z.enum(['BUY', 'SELL']),
  userId: z.string(),
});
type OrderFormValues = z.infer<typeof orderSchema>;

export function OrderForm({ selectedPrice, marketId }: { selectedPrice?: number; marketId: string; }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [baseAsset, quoteAsset] = marketId.split('-');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('MARKET');
  const [marketOrderState, marketOrderAction] = useActionState(createMarketOrder, { status: "idle", message: "" });
  const { data: balances } = useBalances();

  const baseBalance = balances?.find(b => b.assetId === baseAsset)?.available ?? 0;
  const quoteBalance = balances?.find(b => b.assetId === quoteAsset)?.available ?? 0;
  const ticker = useMarketDataStore((s) => s.ticker);
  const marketPrice = ticker?.price ? ticker.price : 0;


  const defaultValues: Partial<OrderFormValues> = {
    price: undefined, quantity: undefined, marketId, type: orderType, userId: user?.uid || '',
  };

  const buyForm = useForm<OrderFormValues>({ resolver: zodResolver(orderSchema), defaultValues: { ...defaultValues, side: 'BUY' } });
  const sellForm = useForm<OrderFormValues>({ resolver: zodResolver(orderSchema), defaultValues: { ...defaultValues, side: 'SELL' } });

  useEffect(() => { buyForm.setValue('type', orderType); sellForm.setValue('type', orderType); }, [orderType, buyForm, sellForm]);
  useEffect(() => { if (selectedPrice) { buyForm.setValue('price', selectedPrice); sellForm.setValue('price', selectedPrice); } }, [selectedPrice, buyForm, sellForm]);

  const OrderTabContent = ({ side }: { side: 'BUY' | 'SELL' }) => {
    const form = side === 'BUY' ? buyForm : sellForm;
    const { watch, control, handleSubmit, setValue } = form;
    const quantity = watch("quantity");

    const setAmountByPercentage = (percentage: number) => {
      if (side === 'BUY') {
        const totalUsdt = quoteBalance * percentage;
        const buyAmount = marketPrice > 0 ? totalUsdt / marketPrice : 0;
        setValue('quantity', buyAmount, { shouldValidate: true });
      } else { // SELL
        const sellAmount = baseBalance * percentage;
        setValue('quantity', sellAmount, { shouldValidate: true });
      }
    };

    return (
      <Form {...form}>
        <form action={marketOrderAction} className="mt-4 space-y-4">
          <input type="hidden" {...form.register("userId")} value={user?.uid} />
          <input type="hidden" {...form.register("marketId")} />
          <input type="hidden" {...form.register("side")} />
          <input type="hidden" {...form.register("type")} />
          {orderType === 'LIMIT' && <FormField control={control} name="price" render={({ field }) => <FormItem><FormLabel>Price ({quoteAsset})</FormLabel><FormControl><Input placeholder="0.00" type="number" {...field} /></FormControl><FormMessage /></FormItem>} />}
          <FormField control={control} name="quantity" render={({ field }) => <FormItem><FormLabel>Amount ({baseAsset})</FormLabel><FormControl><Input placeholder="0.00" type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
          <div className="flex justify-between gap-1">
            {[0.25, 0.50, 0.75, 1.0].map(pct => <Button key={pct} type="button" variant="outline" size="sm" className="flex-1 text-xs h-6" onClick={() => setAmountByPercentage(pct)}>{pct * 100}%</Button>)}
          </div>
          <Button type="submit" className={cn("w-full", side === 'BUY' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700")} disabled={!user}>
            {user ? `${side} ${baseAsset}` : 'Please sign in'}
          </Button>
        </form>
      </Form>
    );
  };

  return (
    <Card>
      <CardHeader className="p-4 flex-row items-center justify-between">
        <CardTitle className="text-lg">Place Order</CardTitle>
        <ToggleGroup type="single" value={orderType} onValueChange={(v: 'LIMIT' | 'MARKET') => v && setOrderType(v)} size="sm">
          <ToggleGroupItem value="LIMIT">Limit</ToggleGroupItem>
          <ToggleGroupItem value="MARKET">Market</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Tabs defaultValue="buy">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>
          <TabsContent value="buy"><OrderTabContent side="BUY" /></TabsContent>
          <TabsContent value="sell"><OrderTabContent side="SELL" /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
