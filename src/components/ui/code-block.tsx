"use client";

import { useState, useRef } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CodeBlockProps {
  children: string;
  className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const textRef = useRef<HTMLPreElement>(null);

  const onCopy = () => {
    if (textRef.current?.innerText) {
      navigator.clipboard.writeText(textRef.current.innerText).then(() => {
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
      });
    }
  };

  return (
    <div className="relative group">
      <pre
        ref={textRef}
        className={cn(
          "p-4 border rounded-lg bg-muted text-sm overflow-x-auto font-mono text-muted-foreground",
          className
        )}
      >
        {children}
      </pre>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onCopy}
            aria-label="Copy code"
          >
            {hasCopied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy to clipboard</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
