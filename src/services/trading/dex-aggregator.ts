
import axios from "axios";
import { hotWallet, provider } from "@/lib/wallet-service";
import { ethers } from "ethers";

// 1inch API (v6 router)
const ONE_INCH_API = "https://api.1inch.dev/swap/v6.0";
const ONE_INCH_KEY = process.env.ONE_INCH_API_KEY!;

if (!ONE_INCH_KEY) {
  throw new Error("Missing ONE_INCH_API_KEY in .env");
}

export interface DexQuoteParams {
  chainId: number;          // 1, 137, 8453, etc.
  fromToken: string;        // user balance token
  toToken: string;          // output token
  amount: string;           // in wei
  fromAddress: string;      // hot wallet or safe module address
  slippage: number;         // default 1%
}

export interface DexTradeResult {
  txHash: string;
  fromToken: string;
  toToken: string;
  amountIn: string;
  amountOut: string;
}

/**
 * STEP 1 — Fetch best quote from 1inch
 */
export const getDexQuote = async (p: DexQuoteParams) => {
  const url = `${ONE_INCH_API}/${p.chainId}/quote`;

  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${ONE_INCH_KEY}` },
    params: {
      src: p.fromToken,
      dst: p.toToken,
      amount: p.amount,
    },
  });

  return res.data;
};

/**
 * STEP 2 — Build swap transaction
 */
export const buildDexSwapTx = async (p: DexQuoteParams) => {
  const url = `${ONE_INCH_API}/${p.chainId}/swap`;

  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${ONE_INCH_KEY}` },
    params: {
      src: p.fromToken,
      dst: p.toToken,
      amount: p.amount,
      from: p.fromAddress,
      slippage: p.slippage ?? 1,
      disableEstimate: false,
    },
  });

  return res.data.tx; // raw transaction
};

/**
 * STEP 3 — Execute swap SIGNING via hot wallet
 */
export const executeDexSwap = async (rawTx: any): Promise<DexTradeResult> => {
  const signer = hotWallet;

  const txResponse = await signer.sendTransaction({
    to: rawTx.to,
    data: rawTx.data,
    value: rawTx.value ? BigInt(rawTx.value) : 0n,
    gasLimit: rawTx.gas, 
    gasPrice: rawTx.gasPrice,
  });

  const receipt = await txResponse.wait();

  if (!receipt) {
    throw new Error('Transaction receipt not found');
  }

  return {
    txHash: receipt.hash,
    fromToken: rawTx.src,
    toToken: rawTx.dst,
    amountIn: rawTx.amount,
    amountOut: rawTx.returnAmount,
  };
};

/**
 * STEP 4 — High-level market trade function
 */
export const performMarketSwap = async (params: DexQuoteParams) => {
  // 1) get quote
  const quote = await getDexQuote(params);

  // 2) build swap tx
  const tx = await buildDexSwapTx({
    ...params,
    amount: quote.srcAmount,
  });

  // 3) execute swap
  const result = await executeDexSwap(tx);

  return {
    ...result,
    price: quote.dstAmount / quote.srcAmount,
  };
};
