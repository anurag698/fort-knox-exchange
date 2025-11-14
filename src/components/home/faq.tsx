
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqItems = [
    {
        question: "Why is Fort Knox the best exchange for crypto traders?",
        answer: "Fort Knox provides a secure, reliable, and user-friendly platform for trading a wide variety of cryptocurrencies. We offer low fees, deep liquidity, and a suite of advanced trading tools for both beginners and experienced traders."
    },
    {
        question: "What products does Fort Knox provide?",
        answer: "We offer spot trading for a wide range of cryptocurrencies, a decentralized swap aggregator for the best rates, secure wallet services for managing your assets, and detailed transaction history and ledger management."
    },
    {
        question: "How to buy Bitcoin and other cryptocurrencies on Fort Knox",
        answer: "To buy cryptocurrencies, first deposit funds into your wallet. Then, navigate to the 'Trade' page, select the market you're interested in (e.g., BTC-USDT), and place a buy order using the order form."
    },
    {
        question: "How to track cryptocurrency prices",
        answer: "You can track real-time cryptocurrency prices on our 'Markets' page, which provides an overview of all trading pairs. For detailed charting and analysis, visit the 'Trade' page for a specific market."
    },
    {
        question: "How to trade cryptocurrencies on Fort Knox",
        answer: "Our 'Trade' page offers a comprehensive interface for trading. You can view the order book, price chart, and place limit orders. For simple swaps, our 'Swap' page provides an easy way to exchange tokens directly from your wallet."
    },
    {
        question: "How to earn from crypto on Fort Knox",
        answer: "Currently, Fort Knox focuses on providing a secure and efficient trading experience. We are exploring future features that may include staking and other earning opportunities. Stay tuned for updates!"
    }
];


export function Faq() {
  return (
    <section className="py-16">
        <div className="container mx-auto max-w-4xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-12">
                Frequently Asked Questions
            </h2>
             <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index + 1}`}>
                        <AccordionTrigger className="text-lg">
                           <span className="flex items-center gap-4">
                                <span className="text-muted-foreground">{index + 1}</span>
                                <span>{item.question}</span>
                           </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground pl-10">
                            {item.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    </section>
  );
}
