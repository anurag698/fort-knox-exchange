
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { DexQuoteResponse, TokenInfo, DexBuildTxResponse } from '@/lib/dex/dex.types';
import { BrowserProvider, parseUnits, formatUnits, type TransactionRequest } from 'ethers';
import { Loader2, ArrowDown } from 'lucide-react';
import { TokenSelector } from './token-selector';

// Helper to check if window.ethereum is available
const isMetamaskAvailable = () => typeof window.ethereum !== 'undefined';

export function SwapWidget() {
  const { toast } = useToast();

  // Wallet State
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<any>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(1); // Default to Ethereum

  // Form State
  const [fromToken, setFromToken] = useState<TokenInfo | null>(null);
  const [toToken, setToToken] = useState<TokenInfo | null>(null);
  const [fromAmount, setFromAmount] = useState<string>('');
  const [quote, setQuote] = useState<DexQuoteResponse | null>(null);

  // UI State
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  
  useEffect(() => {
    if (isMetamaskAvailable()) {
      const browserProvider = new BrowserProvider(window.ethereum);
      setProvider(browserProvider);

      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
            setUserAddress(accounts[0]);
            browserProvider.getSigner().then(setSigner);
        } else {
            setUserAddress('');
            setSigner(null);
        }
      });
      
       window.ethereum.on('chainChanged', (newChainId: string) => {
        setChainId(parseInt(newChainId, 16));
        // Also re-initialize provider and signer for the new chain
        const newProvider = new BrowserProvider(window.ethereum);
        setProvider(newProvider);
        if(userAddress){
            newProvider.getSigner().then(setSigner);
        }
      });
    }
  }, [userAddress]);

  const connectWallet = async () => {
    if (!provider) {
        toast({ variant: 'destructive', title: 'Wallet provider not found.' });
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
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to connect wallet.' });
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  };
  
  const getQuote = async () => {
    if (!fromToken || !toToken || !fromAmount || !userAddress) {
        return;
    }
    setIsFetchingQuote(true);
    setQuote(null);
    try {
        const amountInWei = parseUnits(fromAmount, fromToken.decimals).toString();
        const query = new URLSearchParams({
            chainId: chainId.toString(),
            fromTokenAddress: fromToken.address,
            toTokenAddress: toToken.address,
            amount: amountInWei,
        }).toString();
        
        const response = await fetch(`/api/dex/quote?${query}`);
        if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch quote');
        }
        const data: DexQuoteResponse = await response.json();
        setQuote(data);

    } catch (error) {
        toast({ variant: 'destructive', title: 'Could not get quote', description: (error as Error).message });
    } finally {
        setIsFetchingQuote(false);
    }
  }
  
  const handleSwap = async () => {
    if (!signer || !fromToken || !toToken || !fromAmount) {
        toast({ variant: 'destructive', title: 'Please fill all fields and connect wallet.' });
        return;
    }
    setIsSwapping(true);
    try {
        const amountInWei = parseUnits(fromAmount, fromToken.decimals).toString();
        
        // Step 1: Build the transaction via our backend
        const buildTxResponse = await fetch('/api/dex/build-tx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chainId,
                fromTokenAddress: fromToken.address,
                toTokenAddress: toToken.address,
                amount: amountInWei,
                userAddress: userAddress,
                slippage: 1, // default 1%
            }),
        });

        if (!buildTxResponse.ok) {
            const errorData = await buildTxResponse.json();
            throw new Error(errorData.message || 'Failed to build transaction');
        }
        
        const txData: DexBuildTxResponse = await buildTxResponse.json();

        // Step 2: Send the transaction using the user's wallet
        const tx: TransactionRequest = {
            to: txData.to,
            data: txData.data,
            value: txData.value,
        };

        const txResponse = await signer.sendTransaction(tx);
        
        toast({ title: "Transaction Sent", description: "Waiting for confirmation..." });

        const receipt = await txResponse.wait();

        toast({ title: "Swap Successful!", description: `Transaction confirmed. Hash: ${receipt.transactionHash}` });

    } catch (error) {
        toast({ variant: 'destructive', title: 'Swap Failed', description: (error as Error).message });
    } finally {
        setIsSwapping(false);
    }
  };


  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Swap Tokens</CardTitle>
        <CardDescription>Non-custodial swaps powered by 1inch</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <Label>From</Label>
            <div className="flex gap-2">
                <TokenSelector chainId={chainId} onSelectToken={setFromToken} />
                <Input 
                    type="number" 
                    placeholder="0.0" 
                    className="text-right" 
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    onBlur={getQuote}
                />
            </div>
        </div>
        
        <div className="flex justify-center -my-3">
            <Button variant="ghost" size="icon"><ArrowDown className="h-5 w-5"/></Button>
        </div>

        <div className="space-y-2">
            <Label>To</Label>
            <div className="flex gap-2">
                <TokenSelector chainId={chainId} onSelectToken={setToToken} />
                <Input 
                    type="number" 
                    placeholder="0.0" 
                    className="text-right bg-muted" 
                    readOnly
                    value={quote ? formatUnits(quote.toTokenAmount, quote.toToken.decimals) : ''}
                />
            </div>
        </div>

        {isFetchingQuote && <div className="text-sm text-center text-muted-foreground">Fetching best rate...</div>}
        
        {quote && (
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                1 {fromToken?.symbol} = {formatUnits(BigInt(quote.toTokenAmount) * BigInt(10)**BigInt(fromToken?.decimals || 18) / BigInt(quote.fromTokenAmount), toToken?.decimals || 18)} {toToken?.symbol}
            </div>
        )}

        {!userAddress ? (
          <Button onClick={connectWallet} className="w-full" disabled={isConnecting}>
            {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect Wallet
          </Button>
        ) : (
          <Button onClick={handleSwap} className="w-full" disabled={!quote || isSwapping || isFetchingQuote}>
            {(isSwapping || isFetchingQuote) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSwapping ? 'Swapping...' : 'Swap'}
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
