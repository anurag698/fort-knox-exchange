'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, Loader2 } from 'lucide-react';
import type { TokenInfo } from '@/lib/dex/dex.types';

interface TokenSelectorProps {
  chainId: number;
  onSelectToken: (token: TokenInfo) => void;
}

export function TokenSelector({ chainId, onSelectToken }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tokens, setTokens] = useState<Record<string, TokenInfo>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch(`/api/dex/tokens?chainId=${chainId}`)
        .then(res => res.json())
        .then(data => {
            setTokens(data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, chainId]);

  const filteredTokens = useMemo(() => {
    return Object.values(tokens).filter(token => 
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tokens, searchQuery]);

  const handleSelect = (token: TokenInfo) => {
    setSelectedToken(token);
    onSelectToken(token);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-40 justify-between">
          {selectedToken ? (
            <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedToken.logoURI} alt={selectedToken.name} />
                    <AvatarFallback>{selectedToken.symbol.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <span>{selectedToken.symbol}</span>
            </div>
          ) : (
            'Select Token'
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select a Token</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input 
            placeholder="Search name or paste address" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <ScrollArea className="h-72">
            {isLoading ? (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="space-y-1">
                {filteredTokens.map(token => (
                    <div 
                        key={token.address} 
                        onClick={() => handleSelect(token)}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                    >
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={token.logoURI} alt={token.name} />
                        <AvatarFallback>{token.symbol.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-xs text-muted-foreground">{token.name}</div>
                    </div>
                    </div>
                ))}
                </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
