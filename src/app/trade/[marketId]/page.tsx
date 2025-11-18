// This file is the entry point for the trade page.
// It is a server component that renders the client-side trade page.
import { MultiChartProvider } from '@/components/trade/multi-chart-provider';
import { TriggerEngineProvider } from '@/components/trade/trigger-engine-provider';
import TradePageClient from "./trade-page-client";

export default function Page({ params }: { params: { marketId: string } }) {
  return (
    <TriggerEngineProvider>
        <MultiChartProvider marketId={params.marketId}>
            <div className="flex -mx-8 -my-8 h-[calc(100vh-4rem)]">
                <div className="flex-1 p-4">
                    <TradePageClient marketId={params.marketId} />
                </div>
            </div>
        </MultiChartProvider>
    </TriggerEngineProvider>
  );
}
