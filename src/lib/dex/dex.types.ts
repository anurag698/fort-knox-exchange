

// API Request and Response types

export interface DexQuoteRequest {
  chainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string; // amount in wei
  slippage?: number;
}

export interface DexQuoteResponse {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  toAmount: string;
  gas: number;
}

export interface DexBuildTxRequest {
  chainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string; // amount in wei
  userAddress: string;
  slippage: number;
}

export interface DexBuildTxResponse {
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice?: string;
  chainId: number;
}

// 1inch Specific API response types (simplified for v5.2)

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  domainVersion?: string;
  eip2612?: boolean;
  isFoT?: boolean;
  tags: string[];
}


export interface OneInchQuoteResponse {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  toAmount: string;
  gas: number;
}


export interface OneInchSwapTransaction {
  from: string;
  to: string;
  data: string;
  value: string;
  gas: number;
  gasPrice: string;
}

export interface OneInchSwapResponse {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  toAmount: string;
  tx: OneInchSwapTransaction;
}
