
'use client';

import { useEffect, useRef } from "react";
import useSWR from 'swr';
import { useUser } from "@/providers/azure-auth-provider";
import { useToast } from "@/hooks/use-toast";
import type { PriceAlert } from "@/lib/types";

const COOLDOWN_PERIOD = 300 * 1000; // 5 minutes
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function usePriceAlerts(marketId: string, currentPrice: number) {
  const { user } = useUser();
  const { toast } = useToast();
  const lastTriggeredRef = useRef<Record<string, number>>({});

  const { data: alerts, isLoading } = useSWR<PriceAlert[]>(
    user ? `/api/price-alerts?userId=${user.uid}&marketId=${marketId}&enabled=true` : null,
    fetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds for updates
      revalidateOnFocus: true,
    }
  );

  useEffect(() => {
    if (!alerts || alerts.length === 0 || !currentPrice || currentPrice === 0) {
      return;
    }

    const now = Date.now();

    for (const alert of alerts) {
      const lastTriggered = lastTriggeredRef.current[alert.id] || 0;
      if (now - lastTriggered < COOLDOWN_PERIOD) {
        continue;
      }

      const conditionMet =
        (alert.condition === "above" && currentPrice >= alert.price) ||
        (alert.condition === "below" && currentPrice <= alert.price);

      if (conditionMet) {
        lastTriggeredRef.current[alert.id] = now;
        toast({
          title: `🔔 Price Alert: ${alert.marketId}`,
          description: `Price reached your target. Current price is ${currentPrice.toFixed(2)}.`,
        });

        // Here you could also play a sound or trigger a web notification
        // const audio = new Audio('/sounds/alert.mp3');
        // audio.play();
      }
    }
  }, [alerts, currentPrice, toast]);
}
