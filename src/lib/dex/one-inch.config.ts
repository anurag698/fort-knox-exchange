
import axios from 'axios';

class OneInchConfig {
  private readonly apiKey: string;
  private readonly baseUrls: { [chainId: number]: string };
  private readonly fusionBaseUrl: string;

  constructor() {
    // ✅ SECURITY FIX: Read from environment variable
    this.apiKey = process.env.ONEINCH_API_KEY || '';

    if (!this.apiKey) {
      console.warn('⚠️ ONEINCH_API_KEY environment variable is not set. 1inch integration will fail.');
    }

    // ✅ UPGRADED: Using v6.0 API on api.1inch.com
    this.baseUrls = {
      // Ethereum Mainnet
      1: 'https://api.1inch.com/swap/v6.0/1',
      // BNB Chain (BSC)
      56: 'https://api.1inch.com/swap/v6.0/56',
      // Polygon
      137: 'https://api.1inch.com/swap/v6.0/137',
      // Arbitrum
      42161: 'https://api.1inch.com/swap/v6.0/42161',
      // Optimism
      10: 'https://api.1inch.com/swap/v6.0/10',
      // Base
      8453: 'https://api.1inch.com/swap/v6.0/8453',
      // Avalanche
      43114: 'https://api.1inch.com/swap/v6.0/43114',
      // Gnosis
      100: 'https://api.1inch.com/swap/v6.0/100',
      // zkSync Era
      324: 'https://api.1inch.com/swap/v6.0/324',
      // Linea
      59144: 'https://api.1inch.com/swap/v6.0/59144',
    };

    // Fusion+ base URL (for cross-chain swaps)
    this.fusionBaseUrl = 'https://api.1inch.com/fusion-plus';
  }

  public getHttpClient(chainId: number) {
    const baseURL = this.baseUrls[chainId];
    if (!baseURL) {
      throw new Error(`Unsupported chainId for 1inch API: ${chainId}. Supported: ${Object.keys(this.baseUrls).join(', ')}`);
    }

    const client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error) && error.response) {
          console.error('1inch API Error:', {
            status: error.response.status,
            data: error.response.data,
            chainId
          });
          const errorMessage = error.response.data?.description
            || error.response.data?.error
            || error.response.data?.message
            || '1inch API request failed';
          return Promise.reject(new Error(errorMessage));
        }
        return Promise.reject(error);
      }
    );

    return client;
  }

  public getFusionClient() {
    const client = axios.create({
      baseURL: this.fusionBaseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error) && error.response) {
          console.error('1inch Fusion+ Error:', {
            status: error.response.status,
            data: error.response.data,
          });
          const errorMessage = (error.response.data?.description
            || error.response.data?.error
            || error.response.data?.message
            || 'Fusion+ API request failed') + ` Details: ${JSON.stringify(error.response.data)}`;
          return Promise.reject(new Error(errorMessage));
        }
        return Promise.reject(error);
      }
    );

    return client;
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public getSupportedChains(): number[] {
    return Object.keys(this.baseUrls).map(Number);
  }
}

// Singleton instance
export const oneInchConfig = new OneInchConfig();
