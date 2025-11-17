
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { DexQuoteResponse, TokenInfo, DexBuildTxResponse } from '@/lib/dex/dex.types';
import { BrowserProvider, parseUnits, formatUnits, type TransactionRequest } from 'ethers';
import { Loader2, ArrowDown } from 'lucide-react';
import { TokenSelector } from './token-selector';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';


// Helper to check if window.ethereum is available
const isMetamaskAvailable = () => typeof window.ethereum !== 'undefined';

export function SwapWidget() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  // Wallet State
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<any>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(1); // Default to Ethereum

  // Form State
  const [fromToken, setFromToken] = useState<TokenInfo | null>(null);
  const [toToken, setToToken] = useState<TokenInfo | null>(null);
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState('');
  const [quote, setQuote] = useState<DexQuoteResponse | null>(null);

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
        
        const { data } = await axios.get<DexQuoteResponse>('/api/dex/quote', {
          params: {
            chainId: chainId.toString(),
            fromTokenAddress: fromToken.address,
            toTokenAddress: toToken.address,
            amount: amountInWei,
          }
        });
        
        setQuote(data);
        setToAmount(formatUnits(data.toAmount, data.toToken.decimals));

    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data.message : (error as Error).message;
      toast({ variant: 'destructive', title: 'Could not get quote', description: message });
    } finally {
        setIsFetchingQuote(false);
    }
  }, [fromToken, toToken, fromAmount, chainId, toast]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
        getQuote();
    }, 500); // 500ms debounce

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
        if(userAddress){
            newProvider.getSigner().then(setSigner);
        }
        // Reset form on chain change
        setFromToken(null);
        setToToken(null);
        setFromAmount('');
        setQuote(null);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Initial check
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
        let description = 'An unknown error occurred.';
        // MetaMask error codes are useful for specific feedback
        if (error.code === 4001) {
            description = 'Connection rejected. Please approve the connection in MetaMask.';
        } else if (error.message) {
            description = error.message;
        }
        toast({ variant: 'destructive', title: 'Failed to connect wallet.', description });
        console.error("Wallet connection error:", error);
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleSwap = async () => {
    if (!signer || !fromToken || !toToken || !fromAmount || !quote || !user || !firestore) {
        toast({ variant: 'destructive', title: 'Please fill all fields and connect wallet.' });
        return;
    }
    setIsSwapping(true);

    const fromAmountInWei = parseUnits(fromAmount, fromToken.decimals).toString();

    try {
        // Step 1: Build the transaction via our backend
        const { data: txData } = await axios.post<DexBuildTxResponse>('/api/dex/build-tx', {
            chainId,
            src: fromToken.address,
            dst: toToken.address,
            amount: fromAmountInWei,
            from: userAddress, // For non-custodial, `from` is the user's address
            slippage: 1, // default 1%
        });

        // Step 2: Send the transaction using the user's wallet
        const tx: TransactionRequest = {
            to: txData.to,
            data: txData.data,
            value: txData.value,
        };

        const txResponse = await signer.sendTransaction(tx);
        
        toast({ title: "Transaction Sent", description: "Waiting for confirmation..." });

        const receipt = await txResponse.wait();

        if (receipt.status === 1) {
          toast({ title: "Swap Successful!", description: `Transaction confirmed successfully.` });
          
          // Step 3: Record the non-custodial order in the user's subcollection
          const ordersRef = collection(firestore, 'users', user.uid, 'orders');
          await addDoc(ordersRef, {
            userId: user.uid,
            marketId: `${fromToken.symbol}-${toToken.symbol}`,
            side: 'SELL', // A swap is effectively selling the 'from' token
            type: 'MARKET',
            mode: 'NON_CUSTODIAL',
            price: parseFloat(toAmount) / parseFloat(fromAmount),
            quantity: parseFloat(fromAmount),
            status: 'FILLED',
            filledAmount: parseFloat(fromAmount),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            meta: {
              txHash: txResponse.hash,
              chainId,
            }
          });

        } else {
           throw new Error("Transaction failed on-chain.");
        }

    } catch (error) {
        const message = axios.isAxiosError(error) ? error.response?.data.message : (error as Error).message;
        toast({ variant: 'destructive', title: 'Swap Failed', description: message });
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
            <Button variant="ghost" size="icon"><ArrowDown className="h-5 w-5"/></Button>
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

        {isFetchingQuote && <div className="text-sm text-center text-muted-foreground animate-pulse">Fetching best rate...</div>}
        
        {quote && fromToken && toToken && fromAmount && (
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                1 {fromToken.symbol} ≈ {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken.symbol}
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
