'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { TokenInfo } from '@/lib/dex/dex.types';
import { BrowserProvider, parseUnits, formatUnits } from 'ethers';
import { Loader2, ArrowDown, RefreshCw } from 'lucide-react';
import { TokenSelector } from './token-selector';
import { useUser } from '@/providers/azure-auth-provider';
import axios from 'axios';

// Helper to check if window.ethereum is available
const isMetamaskAvailable = () => typeof window.ethereum !== 'undefined';

// 1inch Fusion Order Domain
const FUSION_DOMAIN = {
  name: "1inch Aggregation Router",
  version: "5",
  verifyingContract: "0x1111111254fb6c44bAC0beD2854e76F90643097d"
};

// 1inch Fusion Order Types (Limit Order Protocol v3/v4)
// Note: This might need adjustment based on exact API response structure
const FUSION_ORDER_TYPES = {
  Order: [
    { name: "salt", type: "uint256" },
    { name: "makerAsset", type: "address" },
    { name: "takerAsset", type: "address" },
    { name: "maker", type: "address" },
    { name: "receiver", type: "address" },
    { name: "allowedSender", type: "address" },
    { name: "makingAmount", type: "uint256" },
    { name: "takingAmount", type: "uint256" },
    { name: "offsets", type: "uint256" },
    { name: "interactions", type: "bytes" },
  ]
};

export function SwapWidget() {
  const { toast } = useToast();
  const { user } = useUser();

  // Wallet State
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<any>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(1);

  // Form State
  const [fromToken, setFromToken] = useState<TokenInfo | null>(null);
  const [toToken, setToToken] = useState<TokenInfo | null>(null);
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState('');
  const [quote, setQuote] = useState<any | null>(null);

  // UI State
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const getQuote = useCallback(async () => {
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      setQuote(null);
      setToAmount('');
      return;
    }
    setIsFetchingQuote(true);
    setQuote(null);
    try {
      const amountInWei = parseUnits(fromAmount, fromToken.decimals).toString();

      // Call Fusion+ Quote API
      const { data } = await axios.get('/api/fusion/quote', {
        params: {
          fromChain: chainId,
          toChain: chainId, // Assuming same chain for now, update for cross-chain
          fromToken: fromToken.address,
          toToken: toToken.address,
          amount: amountInWei,
          walletAddress: userAddress || undefined,
        }
      });

      setQuote(data);
      // Fusion+ quote returns toAmount in wei
      setToAmount(formatUnits(data.toAmount, toToken.decimals));

    } catch (error) {
      console.error("Quote error:", error);
      const message = axios.isAxiosError(error) ? error.response?.data.message : (error as Error).message;
      toast({ variant: 'destructive', title: 'Could not get quote', description: message });
    } finally {
      setIsFetchingQuote(false);
    }
  }, [fromToken, toToken, fromAmount, chainId, userAddress, toast]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      getQuote();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [fromAmount, fromToken, toToken, chainId, getQuote]);

  useEffect(() => {
    if (isMetamaskAvailable()) {
      const browserProvider = new BrowserProvider(window.ethereum, 'any');
      setProvider(browserProvider);

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          browserProvider.getSigner().then(setSigner);
        } else {
          setUserAddress('');
          setSigner(null);
        }
      };

      const handleChainChanged = (newChainId: string) => {
        setChainId(parseInt(newChainId, 16));
        const newProvider = new BrowserProvider(window.ethereum, 'any');
        setProvider(newProvider);
        if (userAddress) {
          newProvider.getSigner().then(setSigner);
        }
        setFromToken(null);
        setToToken(null);
        setFromAmount('');
        setQuote(null);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      browserProvider.send('eth_accounts', []).then(handleAccountsChanged);
      browserProvider.getNetwork().then(network => setChainId(Number(network.chainId)));

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      }
    }
  }, [userAddress]);

  const connectWallet = async () => {
    if (!provider) {
      toast({ variant: 'destructive', title: 'Wallet provider not found.', description: 'Please install a Web3 wallet like MetaMask.' });
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await provider.send('eth_requestAccounts', []);
      if (accounts.length > 0) {
        const connectedSigner = await provider.getSigner();
        setUserAddress(accounts[0]);
        setSigner(connectedSigner);
        const network = await provider.getNetwork();
        setChainId(Number(network.chainId));
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Connect Wallet',
        description: error.message
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSwap = async () => {
    if (!signer || !fromToken || !toToken || !fromAmount || !quote || !user) {
      toast({ variant: 'destructive', title: 'Please fill all fields and connect wallet.' });
      return;
    }
    setIsSwapping(true);

    const fromAmountInWei = parseUnits(fromAmount, fromToken.decimals).toString();

    try {
      // Step 1: Build Fusion+ Order
      const { data: buildData } = await axios.post('/api/fusion/build-order', {
        quoteId: quote.quoteId,
        fromTokenAddress: fromToken.address,
        toTokenAddress: toToken.address,
        amount: fromAmountInWei,
        fromChain: chainId,
        toChain: chainId,
        walletAddress: userAddress,
      });

      const order = buildData.order;

      // Step 2: Sign the order (EIP-712)
      // Note: We need to match the domain and types exactly to what 1inch expects
      const domain = { ...FUSION_DOMAIN, chainId };

      // IMPORTANT: The order object from API might need mapping to match EIP-712 types
      // This is a simplification. In a real app, use @1inch/fusion-sdk
      const signature = await signer.signTypedData(domain, FUSION_ORDER_TYPES, order);

      // Step 3: Submit Signed Order
      const { data: submitData } = await axios.post('/api/fusion/submit-order', {
        signedOrder: {
          order: order,
          signature: signature,
          quoteId: quote.quoteId,
        },
        metadata: {
          userId: user.uid,
          internalOrderId: `web_${Date.now()}`,
          fromToken: fromToken.address,
          toToken: toToken.address,
          fromChain: chainId,
          toChain: chainId,
        }
      });

      if (submitData.success) {
        toast({
          title: "Order Submitted!",
          description: `Fusion+ order created. Hash: ${submitData.orderHash.slice(0, 8)}...`
        });

        // Reset form
        setFromAmount('');
        setQuote(null);
      } else {
        throw new Error(submitData.error || "Submission failed");
      }

    } catch (error) {
      console.error("Swap failed:", error);
      const message = axios.isAxiosError(error) ? error.response?.data.message : (error as Error).message;
      toast({ variant: 'destructive', title: 'Swap Failed', description: message });
    } finally {
      setIsSwapping(false);
    }
  };


  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Swap Tokens</span>
          {isFetchingQuote && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
        </CardTitle>
        <CardDescription>Powered by 1inch Fusion+ (Gasless*)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>From</Label>
          <div className="flex gap-2">
            <TokenSelector chainId={chainId} onSelectToken={setFromToken} selectedToken={fromToken} />
            <Input
              type="number"
              placeholder="0.0"
              className="text-right"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-center -my-3">
          <Button variant="ghost" size="icon"><ArrowDown className="h-5 w-5" /></Button>
        </div>

        <div className="space-y-2">
          <Label>To</Label>
          <div className="flex gap-2">
            <TokenSelector chainId={chainId} onSelectToken={setToToken} selectedToken={toToken} />
            <Input
              type="number"
              placeholder="0.0"
              className="text-right bg-muted"
              readOnly
              value={toAmount}
            />
          </div>
        </div>

        {quote && fromToken && toToken && fromAmount && (
          <div className="space-y-2 p-3 bg-muted rounded-md text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span>1 {fromToken.symbol} ≈ {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Est. Gas</span>
              <span className="text-green-500">Free (Fusion+)</span>
            </div>
          </div>
        )}

        {!userAddress ? (
          <Button onClick={connectWallet} className="w-full" disabled={isConnecting}>
            {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect Wallet
          </Button>
        ) : (
          <Button onClick={handleSwap} className="w-full" disabled={!quote || isSwapping || isFetchingQuote || !fromAmount}>
            {(isSwapping || isFetchingQuote) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSwapping ? 'Signing Order...' : 'Swap via Fusion+'}
          </Button>
        )}
        {userAddress && (
          <div className="text-center text-xs text-muted-foreground pt-2">
            Connected: {userAddress.slice(0, 6)}...{userAddress.slice(-4)} (Chain: {chainId})
          </div>
        )}
      </CardContent>
    </Card>
  );
}
