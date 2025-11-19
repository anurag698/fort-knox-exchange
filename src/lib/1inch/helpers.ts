// ======================================================
// Token Resolver for 1inch Fusion (BNB Chain)
// ======================================================

export const BNB_CHAIN_TOKENS: Record<string, string> = {
  USDT: "0x55d398326f99059fF775485246999027B3197955",
  BNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  BTCB: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
  ETH: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
  POL: "0x76A797A59Ba453c58baE0aC3fFf8B6d5e0EeA395",  // POL on BNB Chain
  MATIC: "0xcc42724C6683b7E57334c4E856f4c296cF615D36",
};

export function resolveToken(symbol: string) {
  return BNB_CHAIN_TOKENS[symbol] ?? null;
}
