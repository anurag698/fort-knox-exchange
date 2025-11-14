import { SwapWidget } from '@/components/swap/swap-widget';

export default function SwapPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Decentralized Swap
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Swap tokens directly from your wallet, powered by 1inch for the best rates.
        </p>
      </div>

      <div className="flex justify-center">
        <SwapWidget />
      </div>
    </div>
  );
}
