// ======================================================
// 1inch Fusion Quote
// ======================================================

const ONEINCH_FUSION = "https://api.1inch.dev/fusion/quoter/v1.0/56/quote";

export async function getFusionQuote(params: {
  srcToken: string;
  dstToken: string;
  amount: string;
}) {
  const url = `${ONEINCH_FUSION}?fromTokenAddress=${params.srcToken}&toTokenAddress=${params.dstToken}&amount=${params.amount}`;

  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${process.env.ONEINCH_API_KEY}`,
    },
  });

  if (!res.ok) {
    return null;
  }

  return await res.json();
}
