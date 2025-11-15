
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
import { createMarketOrder } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { doc, runTransaction, serverTimestamp, writeBatch, type Timestamp } from "firebase/firestore";
import type { Order } from "@/lib/types";
import { useActionState } from "react";


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
  
  const [marketOrderState, marketOrderAction] = useActionState(createMarketOrder, { status: "idle", message: "" });

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
    if (marketOrderState.status === 'success') {
      toast({ title: "Success", description: marketOrderState.message });
      buyForm.reset(defaultValues);
      sellForm.reset(defaultValues);
    } else if (marketOrderState.status === 'error') {
      toast({ variant: "destructive", title: "Error", description: marketOrderState.message });
    }
  }, [marketOrderState, toast, buyForm, sellForm, defaultValues]);
  
  const handleLimitOrderSubmit = (values: OrderFormValues) => {
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

    const newOrderRef = doc(firestore, `orders/${doc(firestore, 'orders').id}`);
    const newOrder: Omit<Order, 'createdAt' | 'updatedAt'> = {
        id: newOrderRef.id,
        userId: user.uid,
        marketId,
        side,
        type,
        quantity,
        price,
        status: 'OPEN',
        filledAmount: 0,
    };
    
    runTransaction(firestore, async (transaction) => {
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
            ...newOrder,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    })
    .then(() => {
        toast({
            status: 'success',
            title: 'Success',
            description: `Limit ${side} order placed successfully and is now open.`,
        });
        buyForm.reset(defaultValues);
        sellForm.reset(defaultValues);
    })
    .catch((error) => {
        if (error.code === 'permission-denied' || error.message.includes('permission-denied')) {
            const permissionError = new FirestorePermissionError({
                path: newOrderRef.path,
                operation: 'create',
                requestResourceData: newOrder
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
            toast({
                variant: 'destructive',
                title: 'Order Failed',
                description: error.message || 'An unknown error occurred.',
            });
        }
    })
    .finally(() => {
        setIsSubmitting(false);
    });
};


  const OrderTabContent = ({ side }: { side: 'BUY' | 'SELL' }) => {
    const form = side === 'BUY' ? buyForm : sellForm;
    const { watch, control, handleSubmit } = form;
    const price = watch("price");
    const quantity = watch("quantity");
    const total = price && quantity ? price * quantity : 0;
    
    const onSubmit = (data: OrderFormValues) => {
        if (orderType === 'LIMIT') {
            handleLimitOrderSubmit(data);
        } else {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, String(value));
                }
            });
            marketOrderAction(formData);
        }
    };

    return (
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
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
                  <Input placeholder="0.00" type="number" step="0.0001" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {orderType === 'LIMIT' && (
            <div className="space-y-2">
                <Label>Total</Label>
                <Input placeholder="0.00" type="number" readOnly value={total.toFixed(2)} />
            </div>
          )}
          <Button
            type="submit"
            className={cn("w-full", side === 'BUY' ? "bg-green-600 hover:bg-green-700 text-white" : "")}
            variant={side === 'SELL' ? 'destructive' : 'default'}
            disabled={!user || isSubmitting || (orderType === 'MARKET' && marketOrderState.status === 'executing')}
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

    
