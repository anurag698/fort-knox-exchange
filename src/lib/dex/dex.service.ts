
import { oneInchConfig } from './one-inch.config';
import type { 
  DexQuoteRequest, 
  DexQuoteResponse, 
  DexBuildTxRequest,
  DexBuildTxResponse,
  OneInchQuote,
  OneInchSwapResponse
} from './dex.types';

class DexService {
  async getQuote(params: DexQuoteRequest): Promise<DexQuoteResponse> {
    const { chainId, fromTokenAddress, toTokenAddress, amount } = params;
    const client = oneInchConfig.getHttpClient(chainId);
    
    const queryParams = new URLSearchParams({
      src: fromTokenAddress,
      dst: toTokenAddress,
      amount: amount,
    }).toString();

    try {
      const { data } = await client.get<OneInchQuote>(`/quote?${queryParams}`);
      
      return {
        fromToken: data.fromToken,
        toToken: data.toToken,
        fromTokenAmount: data.fromTokenAmount,
        toTokenAmount: data.toTokenAmount,
        estimatedGas: data.estimatedGas,
        route: data.protocols,
      };
    } catch (error) {
      console.error('Error fetching quote from 1inch:', error);
      throw new Error('Failed to fetch quote from 1inch.');
    }
  }

  async buildSwapTransaction(params: DexBuildTxRequest): Promise<DexBuildTxResponse> {
    const { chainId, fromTokenAddress, toTokenAddress, amount, userAddress, slippage } = params;
    const client = oneInchConfig.getHttpClient(chainId);
    
    const queryParams = new URLSearchParams({
      src: fromTokenAddress,
      dst: toTokenAddress,
      amount: amount,
      from: userAddress,
      destReceiver: userAddress, // Send swapped tokens back to the user
      slippage: slippage.toString(),
      allowPartialFill: 'false',
    }).toString();

    try {
      const { data } = await client.get<OneInchSwapResponse>(`/swap?${queryParams}`);
      
      return {
        to: data.tx.to,
        data: data.tx.data,
        value: data.tx.value,
        gas: data.tx.gas.toString(),
        gasPrice: data.tx.gasPrice,
        chainId: chainId,
      };
    } catch (error) {
      console.error('Error building swap transaction from 1inch:', error);
      throw new Error('Failed to build swap transaction from 1inch.');
    }
  }

  async getTokens(chainId: number) {
    const client = oneInchConfig.getHttpClient(chainId);
    try {
      // The tokens endpoint is structured differently in the 1inch API
      const { data } = await client.get(`/tokens`);
      return data.tokens;
    } catch (error) {
        console.error('Error fetching tokens from 1inch:', error);
        throw new Error('Failed to fetch tokens from 1inch.');
    }
  }
}

export const dexService = new DexService();
