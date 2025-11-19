export function smaCalc(values: number[], period: number, times: number[]) {
  const result = [];
  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / period;
    result.push({ time: times[i], value: avg });
  }
  return result;
}

export function emaCalc(values: number[], period: number, times: number[]) {
  const k = 2 / (period + 1);
  let emaPrev = values[0];
  const res = [];

  for (let i = 1; i < values.length; i++) {
    const cur = values[i] * k + emaPrev * (1 - k);
    emaPrev = cur;
    res.push({ time: times[i], value: cur });
  }

  return res;
}

export function bollingerBands(values: number[], period: number, times: number[]) {
  const upper = [];
  const middle = [];
  const lower = [];

  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / period;

    const variance =
      slice.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / period;
    const std = Math.sqrt(variance);

    upper.push({ time: times[i], value: avg + 2 * std });
    middle.push({ time: times[i], value: avg });
    lower.push({ time: times[i], value: avg - 2 * std });
  }

  return { upper, middle, lower };
}

export function rsiCalc(values: number[], times: number[], period = 14) {
  if (values.length < period + 1) return [];

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses += -diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  const result = [];

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + -diff) / period;
    }

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);

    result.push({ time: times[i], value: rsi });
  }

  return result;
}
