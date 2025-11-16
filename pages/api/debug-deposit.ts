
// pages/api/debug-deposit.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

function fakeEthAddress(seed: string) {
  const h = crypto.createHash('sha256').update(seed).digest('hex');
  return '0x' + h.slice(0, 40);
}
function fakeBtcAddress(seed: string) {
  // create a pseudo-bech32ish string that looks like a bc1... address
  const h = crypto.createHash('sha256').update(seed).digest('hex');
  return 'bc1' + h.slice(0, 30);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { userId = 'u1', coin = 'eth' } = req.body || {};
  const seed = `${userId}:${coin}`;
  if (String(coin).toLowerCase() === 'btc') {
    return res.status(200).json({ address: fakeBtcAddress(seed), source: 'debug-fake' });
  }
  return res.status(200).json({ address: fakeEthAddress(seed), source: 'debug-fake' });
}
