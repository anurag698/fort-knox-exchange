
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
  fromTokenAmount: string;
  toTokenAmount: string;
  estimatedGas: string;
  route?: any; // You can type this further based on 1inch response
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

// 1inch Specific API response types (simplified)

export interface OneInchToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
}

export interface OneInchQuote {
  fromToken: OneInchToken;
  toToken: OneInchToken;
  toTokenAmount: string;
  fromTokenAmount: string;
  estimatedGas: string;
  protocols: any[];
}

export interface OneInchSwapTransaction {
  to: string;
  data: string;
  value: string;
  gas: number;
  gasPrice: string;
}

export interface OneInchSwapResponse {
  fromToken: OneInchToken;
  toToken: OneInchToken;
  toTokenAmount: string;
  fromTokenAmount: string;
  tx: OneInchSwapTransaction;
}

// General Token Info type for frontend use
export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  chainId: number;
}
