
export function calculatePriceImpact(midPrice: number, executionPrice: number) {
  if (!midPrice || !executionPrice || midPrice === 0) return 0;

  return Math.abs(((executionPrice - midPrice) / midPrice) * 100);
}

export function getImpactColor(impact: number) {
  if (impact < 1) return "text-green-400";      // Low impact
  if (impact < 3) return "text-yellow-400";     // Medium impact
  return "text-red-500";                        // High impact
}

export function getImpactLabel(impact: number) {
  if (impact < 1) return "Low";
  if (impact < 3) return "Medium";
  return "High";
}
