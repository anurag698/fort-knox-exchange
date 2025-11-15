
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

// Corresponds to the params for 1inch /swap endpoint
export interface DexBuildTxRequest {
  chainId: number;
  src: string; // fromTokenAddress
  dst: string; // toTokenAddress
  amount: string; // amount in wei
  from: string; // userAddress
  slippage: number;
  receiver?: string;
  allowPartialFill?: boolean;
}

// Corresponds to the `tx` object in the 1inch /swap response
export interface DexBuildTxResponse {
  from: string;
  to: string;
  data: string;
  value: string;
  gas: number;
  gasPrice: string;
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


export interface OneInchSwapResponse {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  toAmount: string;
  tx: DexBuildTxResponse; // The nested transaction object
}
