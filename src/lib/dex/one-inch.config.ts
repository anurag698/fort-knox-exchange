
import axios from 'axios';

class OneInchConfig {
  private readonly apiKey: string;
  private readonly baseUrls: { [chainId: number]: string };

  constructor() {
    // Per the prompt, use the provided API key directly.
    this.apiKey = 'n7vYfn4JWkisRdkbfycph7OLW36YWp4l';
    
    this.baseUrls = {
      1: 'https://api.1inch.dev/swap/v5.2/1', // Ethereum
      56: 'https://api.1inch.dev/swap/v5.2/56', // BSC
      137: 'https://api.1inch.dev/swap/v5.2/137', // Polygon
    };
  }

  public getHttpClient(chainId: number) {
    const baseURL = this.baseUrls[chainId];
    if (!baseURL) {
      throw new Error(`Unsupported chainId for 1inch API: ${chainId}`);
    }

    const client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
      },
    });

    client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error) && error.response) {
            console.error('1inch API Error:', error.response.data);
            const errorMessage = error.response.data?.description || error.response.data?.error || '1inch API request failed';
            return Promise.reject(new Error(errorMessage));
        }
        return Promise.reject(error);
      }
    );

    return client;
  }
}

// Singleton instance
export const oneInchConfig = new OneInchConfig();
