'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { createMarketOrder } from '@/app/trade/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { doc, runTransaction, serverTimestamp, type Timestamp, collection } from 'firebase/firestore';
import type { Order, Balance } from '@/lib/types';
import { useActionState } from 'react';
import type { SecurityRuleContext } from '@/firebase/errors';
import { useBalances } from '@/hooks/use-balances';

const orderSchema = z.object({
  price: z.coerce.number().optional(),
  quantity: z.coerce.number().positive({ message: "Amount must be positive." }),
  marketId: z.string(),
  type: z.enum(['LIMIT', 'MARKET']),
  side: z.enum(['BUY', 'SELL']),
  userId: z.string(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

interface OrderFormProps {
  selectedPrice?: number;
  marketId: string;
}

export function OrderForm({ selectedPrice, marketId }: OrderFormProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [baseAsset, quoteAsset] = marketId ? marketId.split('-') : ['', ''];
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: balances } = useBalances();

  const [marketOrderState, marketOrderAction, isMarketOrderPending] = useActionState(createMarketOrder, { status: "idle", message: "" });
  
  const baseBalance = balances?.find(b => b.assetId === baseAsset)?.available ?? 0;
  const quoteBalance = balances?.find(b => b.assetId === quoteAsset)?.available ?? 0;


  const defaultValues: Partial<OrderFormValues> = {
      price: undefined,
      quantity: undefined,
      marketId,
      type: 'LIMIT',
      userId: user?.uid || '',
  }

  const buyForm = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {...defaultValues, side: 'BUY'}
  });

  const sellForm = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {...defaultValues, side: 'SELL' }
  });
  
  useEffect(() => {
    if (user?.uid) {
      buyForm.setValue('userId', user.uid);
      sellForm.setValue('userId', user.uid);
    }
  }, [user, buyForm, sellForm]);

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
    if (marketId) {
      buyForm.setValue('marketId', marketId);
      sellForm.setValue('marketId', marketId);
    }
  }, [marketId, buyForm, sellForm]);

  useEffect(() => {
    if (marketOrderState.status === 'success' && marketOrderState.message) {
      toast({ title: "Success", description: marketOrderState.message });
      buyForm.reset(defaultValues);
      sellForm.reset(defaultValues);
    } else if (marketOrderState.status === 'error' && marketOrderState.message) {
      toast({ variant: "destructive", title: "Error", description: marketOrderState.message });
    }
  }, [marketOrderState, toast, buyForm, sellForm, defaultValues]);
  
  const handleLimitOrderSubmit = async (values: OrderFormValues) => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'User or database not available.' });
      return;
    }
    setIsSubmitting(true);

    const { price, quantity, side, marketId, type } = values;

    if (type === 'LIMIT' && (!price || price <= 0)) {
      toast({ variant: 'destructive', title: 'Error', description: 'A positive price is required for Limit orders.' });
      setIsSubmitting(false);
      return;
    }

    // Create the new order in the user's subcollection
    const newOrderRef = doc(collection(firestore, 'users', user.uid, 'orders'));
    const newOrderData: Omit<Order, 'createdAt' | 'updatedAt' | 'id'> & { id?: string } = {
      userId: user.uid,
      marketId,
      side,
      type,
      quantity,
      price,
      status: 'OPEN',
      filledAmount: 0,
    };

    try {
      await runTransaction(firestore, async (transaction) => {
        const assetToLock = side === 'BUY' ? quoteAsset : baseAsset;
        const amountToLock = side === 'BUY' ? (price || 0) * quantity : quantity;

        const balanceRef = doc(firestore, 'users', user.uid, 'balances', assetToLock);
        const balanceSnap = await transaction.get(balanceRef);

        if (!balanceSnap.exists()) {
          throw new Error(`You have no balance for ${assetToLock}.`);
        }
        const balanceData = balanceSnap.data()!;
        if (balanceData.available < amountToLock) {
          throw new Error(`Insufficient funds. You need ${amountToLock} ${assetToLock}, but only have ${balanceData.available}.`);
        }

        const newAvailable = balanceData.available - amountToLock;
        const newLocked = (balanceData.locked || 0) + amountToLock;
        transaction.update(balanceRef, { available: newAvailable, locked: newLocked, updatedAt: serverTimestamp() });

        transaction.set(newOrderRef, {
          ...newOrderData,
          id: newOrderRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      toast({
        title: 'Success',
        description: `Limit ${side} order placed successfully.`,
      });
      buyForm.reset(defaultValues);
      sellForm.reset(defaultValues);

    } catch (error: any) {
        if (error?.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
              path: newOrderRef.path,
              operation: 'create',
              requestResourceData: { 
                ...newOrderData, 
                id: newOrderRef.id,
                createdAt: {".sv": "timestamp"}, // Represent server value
                updatedAt: {".sv": "timestamp"} 
              },
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        } else {
            toast({
                variant: 'destructive',
                title: 'Order Failed',
                description: error.message || 'An unknown error occurred during the transaction.',
            });
        }
    } finally {
      setIsSubmitting(false);
    }
  };

  const OrderTabContent = ({ side }: { side: 'BUY' | 'SELL' }) => {
    const form = side === 'BUY' ? buyForm : sellForm;
    const { watch, control, handleSubmit, setValue } = form;
    const price = watch("price");
    const quantity = watch("quantity");
    const total = price && quantity ? price * quantity : 0;
    const balance = side === 'BUY' ? quoteBalance : baseBalance;

    const setAmountByPercentage = (percentage: number) => {
        const currentPrice = price || 0;
        let newAmount = 0;
        if (side === 'BUY') {
            // For BUY, percentage is of quote asset. Amount to buy is total value / price
            if (currentPrice > 0) {
              newAmount = (quoteBalance * percentage) / currentPrice;
            }
        } else { // For SELL
            // For SELL, percentage is of base asset.
            newAmount = baseBalance * percentage;
        }
        setValue('quantity', newAmount, { shouldValidate: true });
    };

    return (
      <Form {...form}>
        <form 
          action={orderType === 'MARKET' ? marketOrderAction : undefined}
          onSubmit={orderType === 'LIMIT' ? handleSubmit(handleLimitOrderSubmit) : undefined}
          className="mt-4 space-y-4"
        >
          <input type="hidden" {...form.register("userId")} />
          <input type="hidden" {...form.register("marketId")} />
          <input type="hidden" {...form.register("side")} />
          <input type="hidden" {...form.register("type")} />

           {orderType === 'LIMIT' && (
             <FormField
                control={control}
                name="price"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Price ({quoteAsset})</FormLabel>
                    <FormControl>
                    <Input placeholder="0.00" type="number" step="0.01" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
           )}
          <FormField
            control={control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount ({orderType === 'MARKET' && side === 'BUY' ? quoteAsset : baseAsset})</FormLabel>
                <FormControl>
                  <Input placeholder="0.00" type="number" step="any" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <div className="flex justify-between gap-1">
                {[0.25, 0.50, 0.75, 1.0].map(pct => (
                    <Button 
                        key={pct}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-6"
                        onClick={() => setAmountByPercentage(pct)}
                    >
                        {pct * 100}%
                    </Button>
                ))}
            </div>
          {orderType === 'LIMIT' && (
            <div className="space-y-2">
                <Label>Total</Label>
                <Input placeholder="0.00" type="number" readOnly value={total.toFixed(2)} className="bg-muted" />
            </div>
          )}
          <Button
            type="submit"
            className={cn("w-full", side === 'BUY' ? "bg-green-600 hover:bg-green-700 text-white" : "")}
            variant={side === 'SELL' ? 'destructive' : 'default'}
            disabled={!user || isSubmitting || isMarketOrderPending}
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
            <OrderTabContent side="BUY" />
          </TabsContent>
          <TabsContent value="sell">
            <OrderTabContent side="SELL" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
