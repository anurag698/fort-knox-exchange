"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "@/firebase";
import { createOrder } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const orderSchema = z.object({
  price: z.coerce.number().optional(),
  quantity: z.coerce.number().positive({ message: "Amount must be positive." }),
  marketId: z.string(),
  type: z.enum(['LIMIT', 'MARKET']),
});

type OrderFormValues = z.infer<typeof orderSchema>;

interface OrderFormProps {
  selectedPrice?: number;
  marketId: string;
}

export function OrderForm({ selectedPrice, marketId }: OrderFormProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [baseAsset, quoteAsset] = marketId.split('-');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');

  const [buyState, buyAction] = useActionState(createOrder, { status: "idle", message: "" });
  const [sellState, sellAction] = useActionState(createOrder, { status: "idle", message: "" });

  const buyForm = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { price: undefined, quantity: undefined, marketId, type: 'LIMIT' },
  });

  const sellForm = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { price: undefined, quantity: undefined, marketId, type: 'LIMIT' },
  });

  useEffect(() => {
    buyForm.setValue('type', orderType);
    sellForm.setValue('type', orderType);
     if (orderType === 'MARKET') {
        buyForm.unregister('price');
        sellForm.unregister('price');
    }
  }, [orderType, buyForm, sellForm]);
  
  useEffect(() => {
    if (selectedPrice) {
      buyForm.setValue('price', selectedPrice);
      sellForm.setValue('price', selectedPrice);
    }
  }, [selectedPrice, buyForm, sellForm]);

   useEffect(() => {
    buyForm.setValue('marketId', marketId);
    sellForm.setValue('marketId', marketId);
  }, [marketId, buyForm, sellForm]);

  useEffect(() => {
    if (buyState.status === 'success' && buyState.message) {
      toast({ title: "Success", description: buyState.message });
      buyForm.reset({ price: buyForm.getValues('price'), quantity: undefined, marketId, type: orderType });
    } else if (buyState.status === 'error' && buyState.message) {
      toast({ variant: "destructive", title: "Error", description: buyState.message });
    }
  }, [buyState, toast, buyForm, marketId, orderType]);

  useEffect(() => {
    if (sellState.status === 'success' && sellState.message) {
      toast({ title: "Success", description: sellState.message });
      sellForm.reset({ price: sellForm.getValues('price'), quantity: undefined, marketId, type: orderType });
    } else if (sellState.status === 'error' && sellState.message) {
      toast({ variant: "destructive", title: "Error", description: sellState.message });
    }
  }, [sellState, toast, sellForm, marketId, orderType]);

  const OrderTabContent = ({ side, form, action }: { side: 'BUY' | 'SELL', form: any, action: any }) => {
    const price = form.watch("price");
    const quantity = form.watch("quantity");
    const total = price && quantity ? price * quantity : 0;
    const currentOrderType = form.watch("type");

    return (
      <Form {...form}>
        <form action={action} className="mt-4 space-y-4">
          <input type="hidden" name="side" value={side} />
           <input type="hidden" name="marketId" value={marketId} />
           <input type="hidden" name="type" value={currentOrderType} />
          
           {currentOrderType === 'LIMIT' && (
             <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Price ({quoteAsset})</FormLabel>
                    <FormControl>
                    <Input placeholder="0.00" type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
           )}
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount ({baseAsset})</FormLabel>
                <FormControl>
                  <Input placeholder="0.00" type="number" step="0.0001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {currentOrderType === 'LIMIT' && (
            <div className="space-y-2">
                <Label>Total</Label>
                <Input placeholder="0.00" type="number" readOnly value={total.toFixed(2)} />
            </div>
          )}
          <Button
            type="submit"
            className={cn("w-full", side === 'BUY' ? "bg-green-600 hover:bg-green-700 text-white" : "")}
            variant={side === 'SELL' ? 'destructive' : 'default'}
            disabled={!user}
          >
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
         <ToggleGroup type="single" value={orderType} onValueChange={(value: 'LIMIT' | 'MARKET') => value && setOrderType(value)} size="sm">
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
          <TabsContent value="buy">
            <OrderTabContent side="BUY" form={buyForm} action={buyAction} />
          </TabsContent>
          <TabsContent value="sell">
            <OrderTabContent side="SELL" form={sellForm} action={sellAction} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
