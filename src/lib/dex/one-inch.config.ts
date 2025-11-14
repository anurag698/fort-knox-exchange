
import axios from 'axios';

class OneInchConfig {
  private readonly apiKey: string;
  private readonly baseUrls: { [chainId: number]: string };

  constructor() {
    this.apiKey = process.env.ONEINCH_API_KEY || 'n7vYfn4JWkisRdkbfycph7OLW36YWp4l';
    if (!this.apiKey) {
      console.warn('1inch API key not found. Please set ONEINCH_API_KEY in your .env file.');
    }
    
    this.baseUrls = {
      1: 'https://api.1inch.dev/swap/v6.0/1', // Ethereum
      56: 'https://api.1inch.dev/swap/v6.0/56', // BSC
      137: 'https://api.1inch.dev/swap/v6.0/137', // Polygon
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
            // Log the detailed error from 1inch
            console.error('1inch API Error:', error.response.data);
            // Re-throw a more generic error to the service layer
            return Promise.reject(new Error(error.response.data.description || '1inch API request failed'));
        }
        return Promise.reject(error);
      }
    );

    return client;
  }
}

// Singleton instance
export const oneInchConfig = new OneInchConfig();
