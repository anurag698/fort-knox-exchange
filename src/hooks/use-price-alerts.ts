
'use client';

import { useEffect, useRef } from "react";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { useUser, useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import type { PriceAlert } from "@/lib/types";
import { useCollection } from "@/firebase";

const COOLDOWN_PERIOD = 300 * 1000; // 5 minutes

export function usePriceAlerts(marketId: string, currentPrice: number) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const lastTriggeredRef = useRef<Record<string, number>>({});

  const alertsQuery = query(
    collection(firestore, `users/${user?.uid}/alerts`),
    where("marketId", "==", marketId),
    where("enabled", "==", true)
  );

  const { data: alerts, isLoading } = useCollection<PriceAlert>(alertsQuery, {
    enabled: !!user,
  });

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
