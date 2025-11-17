
type Options = {
  interval: number;
  maxRequests: number;
  uniqueTokenPerInterval?: number;
};

export default function rateLimit(options: Options) {
  const tokenMap = new Map<string, { tokens: number; lastReset: number }>();

  return {
    check: async (token: string) => {
      const now = Date.now();
      const entry = tokenMap.get(token) || {
        tokens: options.maxRequests,
        lastReset: now,
      };

      if (now - entry.lastReset > options.interval) {
        entry.tokens = options.maxRequests;
        entry.lastReset = now;
      }

      if (entry.tokens <= 0) {
        throw new Error("Rate limit exceeded");
      }

      entry.tokens -= 1;
      tokenMap.set(token, entry);
    },
  };
}
