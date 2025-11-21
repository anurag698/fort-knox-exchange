
import { oneInchConfig } from './one-inch.config';
import type {
  DexQuoteRequest,
  DexQuoteResponse,
  DexBuildTxRequest,
  DexBuildTxResponse,
  OneInchQuoteResponse,
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
      const { data } = await client.get<OneInchQuoteResponse>(`/quote?${queryParams}`);
      console.log('[DexService] Quote response:', JSON.stringify(data, null, 2));

      return {
        fromToken: data.fromToken,
        toToken: data.toToken,
        toAmount: data.toAmount || (data as any).dstAmount,
        gas: data.gas || 0,
      };
    } catch (error: any) {
      console.error('Error fetching quote from 1inch:', error.response?.data || error.message);
      throw new Error(`Failed to fetch quote from 1inch: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  }

  async buildSwapTransaction(params: DexBuildTxRequest): Promise<DexBuildTxResponse> {
    const client = oneInchConfig.getHttpClient(params.chainId);

    // Construct query parameters from the request object
    const queryParams = new URLSearchParams({
      src: params.src,
      dst: params.dst,
      amount: params.amount,
      from: params.from,
      slippage: params.slippage.toString(),
      receiver: params.from, // Send swapped tokens back to the sender
      allowPartialFill: 'false',
    }).toString();

    try {
      const { data } = await client.get<OneInchSwapResponse>(`/swap?${queryParams}`);

      // We only need the transaction object from the response
      return data.tx;

    } catch (error: any) {
      console.error('Error building swap transaction from 1inch:', error.response?.data || error.message);
      const details = error.response?.data?.description || error.response?.data?.error || error.message;
      throw new Error(`Failed to build swap transaction from 1inch: ${details}`);
    }
  }

  async getTokens(chainId: number) {
    const client = oneInchConfig.getHttpClient(chainId);
    try {
      const { data } = await client.get(`/tokens`);
      return data.tokens;
    } catch (error) {
      console.error('Error fetching tokens from 1inch:', error);
      throw new Error('Failed to fetch tokens from 1inch.');
    }
  }
}

export const dexService = new DexService();
