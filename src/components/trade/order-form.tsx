
// This component provides the interface for users to place buy and sell orders.
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser } from '@/providers/azure-auth-provider';
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
import { useOrderStore } from '@/state/order-management-store';
import { Loader2, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { TradeConfirmationDialog } from './trade-confirmation-dialog';

const orderSchema = z.object({
  price: z.coerce.number().optional(),
  stopPrice: z.coerce.number().optional(),
  quantity: z.coerce.number().positive({ message: "Amount must be positive." }),
  marketId: z.string(),
  type: z.enum(['LIMIT', 'MARKET', 'STOP_LIMIT']),
  side: z.enum(['BUY', 'SELL']),
  userId: z.string(),
  timeInForce: z.enum(['GTC', 'IOC', 'FOK']).optional(),
}).refine((data) => {
  if (data.type === 'LIMIT' && !data.price) return false;
  if (data.type === 'STOP_LIMIT' && (!data.price || !data.stopPrice)) return false;
  return true;
}, {
  message: "Price is required for Limit and Stop Limit orders",
  path: ["price"],
});

type OrderFormValues = z.infer<typeof orderSchema>;

export function OrderForm({ selectedPrice, marketId }: { selectedPrice?: number; marketId: string; }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [baseAsset, quoteAsset] = marketId.split('-');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET' | 'STOP_LIMIT'>('LIMIT');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [timeInForce, setTimeInForce] = useState<'GTC' | 'IOC' | 'FOK'>('GTC');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: balances, mutate: refreshBalances } = useBalances();

  // Confirmation Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<OrderFormValues | null>(null);

  const baseBalance = balances?.find(b => b.assetId === baseAsset)?.available ?? 0;
  const quoteBalance = balances?.find(b => b.assetId === quoteAsset)?.available ?? 0;
  const ticker = useMarketDataStore((s) => s.ticker);
  const marketPrice = ticker?.price ? ticker.price : 0;
  const addTrade = useOrderStore((s) => s.addTrade);

  const defaultValues: Partial<OrderFormValues> = {
    price: undefined,
    stopPrice: undefined,
    quantity: undefined,
    marketId,
    type: orderType,
    userId: user?.uid || '',
    timeInForce: 'GTC',
  };

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { ...defaultValues, side }
  });

  const { watch, setValue, handleSubmit, control, reset } = form;
  const quantity = watch("quantity");
  const price = watch("price");

  // Update form side when state changes
  useEffect(() => { form.setValue('side', side); }, [side, form]);
  useEffect(() => { form.setValue('type', orderType); }, [orderType, form]);
  useEffect(() => { form.setValue('timeInForce', timeInForce); }, [timeInForce, form]);

  // Update price from props
  useEffect(() => {
    if (selectedPrice && (orderType === 'LIMIT' || orderType === 'STOP_LIMIT')) {
      form.setValue('price', selectedPrice);
    }
  }, [selectedPrice, orderType, form]);

  // Step 1: Validate and open confirmation dialog
  const onSubmit = async (data: OrderFormValues) => {
    if (!user?.uid) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please log in to trade' });
      return;
    }
    setPendingOrder(data);
    setConfirmOpen(true);
  };

  // Step 2: Execute trade after confirmation
  const handleConfirmTrade = async () => {
    if (!pendingOrder || !user?.uid) return;

    setIsSubmitting(true);
    try {
      const effectivePrice = pendingOrder.type === 'MARKET' ? marketPrice : pendingOrder.price!;

      const response = await fetch('/api/trade/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          pair: marketId,
          side: pendingOrder.side.toLowerCase(),
          quantity: pendingOrder.quantity,
          price: effectivePrice,
          stopPrice: pendingOrder.stopPrice,
          total: effectivePrice * pendingOrder.quantity,
          type: pendingOrder.type,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Order failed');
      }

      // Success!
      addTrade(result.trade); // Add to local store for instant update

      toast({
        title: '✅ Order Placed Successfully',
        description: `${pendingOrder.type} ${pendingOrder.side} executed.`,
      });

      // Reset form and close dialog
      reset({ ...defaultValues, side, type: orderType });
      setConfirmOpen(false);
      setPendingOrder(null);
      refreshBalances();

    } catch (error: any) {
      console.error('Order error:', error);
      toast({
        variant: 'destructive',
        title: '❌ Order Failed',
        description: error.message || 'Failed to place order',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const setAmountByPercentage = (percentage: number) => {
    if (side === 'BUY') {
      const effectivePrice = (orderType === 'MARKET' ? marketPrice : price) || marketPrice;
      if (!effectivePrice) return;

      const totalUsdt = quoteBalance * percentage;
      const buyAmount = totalUsdt / effectivePrice;
      setValue('quantity', Number(buyAmount.toFixed(6)), { shouldValidate: true });
    } else {
      const sellAmount = baseBalance * percentage;
      setValue('quantity', Number(sellAmount.toFixed(6)), { shouldValidate: true });
    }
  };

  const availableBalance = side === 'BUY' ? quoteBalance : baseBalance;
  const availableAsset = side === 'BUY' ? quoteAsset : baseAsset;

  return (
    <div className="flex flex-col h-full glass text-sm overflow-hidden animate-slide-in-up">
      {/* TOP TABS with Glass Effect */}
      <div className="flex items-center border-b border-primary/20 bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm">
        <button
          onClick={() => setOrderType('LIMIT')}
          className={cn(
            "flex-1 py-3 text-xs font-semibold transition-all relative group",
            orderType === 'LIMIT' ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Limit
          {orderType === 'LIMIT' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-purple-400 shadow-glow" />}
        </button>
        <button
          onClick={() => setOrderType('MARKET')}
          className={cn(
            "flex-1 py-3 text-xs font-semibold transition-all relative group",
            orderType === 'MARKET' ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Market
          {orderType === 'MARKET' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-purple-400 shadow-glow" />}
        </button>
        <button
          onClick={() => setOrderType('STOP_LIMIT')}
          className={cn(
            "flex-1 py-3 text-xs font-semibold transition-all relative group",
            orderType === 'STOP_LIMIT' ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Stop Limit
          {orderType === 'STOP_LIMIT' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-purple-400 shadow-glow" />}
        </button>
      </div>

      {/* FORM CONTENT */}
      <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto scrollbar-thin">

        {/* BUY/SELL TOGGLE with Premium Style */}
        <div className="grid grid-cols-2 gap-2 bg-muted/20 p-1 rounded-lg backdrop-blur-sm">
          <button
            onClick={() => setSide('BUY')}
            className={cn(
              "py-2 text-xs font-bold rounded-md transition-all",
              side === 'BUY'
                ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            Buy
          </button>
          <button
            onClick={() => setSide('SELL')}
            className={cn(
              "py-2 text-xs font-bold rounded-md transition-all",
              side === 'SELL'
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            Sell
          </button>
        </div>

        {/* AVAILABLE BALANCE with Icon */}
        <div className="flex justify-between items-center text-xs px-2 py-1.5 bg-muted/10 rounded border border-border/50">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3" />
            Available
          </span>
          <span className="font-mono text-foreground font-medium">{availableBalance.toFixed(8)} {availableAsset}</span>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

            {/* STOP PRICE INPUT (Only for Stop Limit) */}
            {orderType === 'STOP_LIMIT' && (
              <FormField
                control={control}
                name="stopPrice"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <div className="relative group">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Stop</span>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{quoteAsset}</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        step="any"
                        {...field}
                        value={field.value ?? ''}
                        className="pl-12 pr-16 text-right font-mono h-10 bg-background/80 border-border/50 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all group-hover:bg-background"
                      />
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* PRICE INPUT with Premium Styling */}
            {orderType !== 'MARKET' ? (
              <FormField
                control={control}
                name="price"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <div className="relative group">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Price</span>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{quoteAsset}</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        step="any"
                        {...field}
                        value={field.value ?? ''}
                        className="pl-12 pr-16 text-right font-mono h-10 bg-background/80 border-border/50 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all group-hover:bg-background"
                      />
                    </div>
                  </FormItem>
                )}
              />
            ) : (
              <div className="h-10 flex items-center justify-center bg-primary/5 rounded border border-primary/20 text-xs text-primary font-medium">
                <Zap className="h-3 w-3 mr-1.5" />
                Market Price
              </div>
            )}

            {/* QUANTITY INPUT */}
            <FormField
              control={control}
              name="quantity"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Amount</span>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {orderType === 'MARKET' && side === 'BUY' ? quoteAsset : baseAsset}
                    </span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="any"
                      {...field}
                      value={field.value ?? ''}
                      className="pl-16 pr-16 text-right font-mono h-10 bg-background/80 border-border/50 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all group-hover:bg-background"
                    />
                  </div>
                </FormItem>
              )}
            />

            {/* PERCENTAGE BUTTONS with Premium Style */}
            <div className="grid grid-cols-4 gap-1.5">
              {[0.25, 0.50, 0.75, 1.0].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setAmountByPercentage(pct)}
                  className="py-1.5 text-[10px] bg-muted/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30 rounded border border-transparent text-muted-foreground transition-all font-medium"
                >
                  {pct * 100}%
                </button>
              ))}
            </div>

            {/* TIME IN FORCE */}
            {orderType !== 'MARKET' && (
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Time in Force</label>
                <div className="grid grid-cols-3 gap-1.5 bg-muted/10 p-1 rounded-lg">
                  {['GTC', 'IOC', 'FOK'].map((tif) => (
                    <button
                      key={tif}
                      type="button"
                      onClick={() => setTimeInForce(tif as any)}
                      className={cn(
                        "py-1.5 text-[10px] rounded-md transition-all font-medium",
                        timeInForce === tif
                          ? "bg-gradient-to-r from-primary to-purple-400 text-primary-foreground shadow-md shadow-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      )}
                    >
                      {tif}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TOTAL ESTIMATE */}
            {orderType !== 'MARKET' && price && quantity && (
              <div className="flex justify-between items-center text-xs px-2 py-1.5 bg-primary/5 rounded border border-primary/20">
                <span className="text-muted-foreground">Total</span>
                <span className="font-mono text-primary font-medium">{(Number(price) * Number(quantity)).toFixed(2)} {quoteAsset}</span>
              </div>
            )}

            {/* INFO ALERT for Stop Limit */}
            {orderType === 'STOP_LIMIT' && (
              <div className="flex gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-400">
                <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                <p>Order triggers when price hits <strong>{watch('stopPrice') || '...'}</strong>. Limit order placed at <strong>{watch('price') || '...'}</strong>.</p>
              </div>
            )}

            {/* SUBMIT BUTTON with Gradient and Glow */}
            <Button
              type="submit"
              disabled={!user || isSubmitting}
              variant={!user ? "default" : "glow"}
              className={cn(
                "w-full font-bold mt-2 h-11 text-sm transition-all",
                !user && "bg-muted text-muted-foreground hover:bg-muted",
                user && side === 'BUY' && "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/30 hover:shadow-green-500/50",
                user && side === 'SELL' && "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Placing Order...
                </>
              ) : user ? (
                <>
                  {side === 'BUY' ? '🚀' : '💰'} {side} {baseAsset}
                </>
              ) : (
                'Log In to Trade'
              )}
            </Button>

          </form>
        </Form>
      </div>

      {/* CONFIRMATION DIALOG */}
      <TradeConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirmTrade}
        loading={isSubmitting}
        tradeDetails={pendingOrder ? {
          pair: marketId,
          side: pendingOrder.side.toLowerCase() as 'buy' | 'sell',
          price: pendingOrder.type === 'MARKET' ? marketPrice : pendingOrder.price!,
          quantity: pendingOrder.quantity,
          total: (pendingOrder.type === 'MARKET' ? marketPrice : pendingOrder.price!) * pendingOrder.quantity
        } : null}
      />
    </div>
  );
}
