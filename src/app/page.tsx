
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, LogIn, Wallet, ArrowRightLeft, AreaChart, BookText } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: LogIn,
    title: "Create an Account or Sign In",
    description: "Start by creating a new account or signing in to access the exchange.",
    link: "/auth",
    linkText: "Go to Auth"
  },
  {
    icon: Wallet,
    title: "Fund Your Account",
    description: "Navigate to the Wallet page to generate a deposit address and fund your account.",
    link: "/portfolio",
    linkText: "Go to Wallet"
  },
  {
    icon: ArrowRightLeft,
    title: "Start Trading",
    description: "Explore the available markets and place your first trade on the Trade page.",
    link: "/trade",
    linkText: "Go to Trade"
  },
  {
    icon: AreaChart,
    title: "Track Your Portfolio",
    description: "View your asset allocation and total portfolio value in the Wallet.",
    link: "/portfolio",
    linkText: "View Portfolio"
  },
    {
    icon: BookText,
    title: "Review Your History",
    description: "Check the Ledger for a complete history of all your transactions.",
    link: "/ledger",
    linkText: "View Ledger"
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 text-center items-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight">
          Welcome to Fort Knox Exchange
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Your secure and modern platform for trading digital assets. Follow the steps below to get started.
        </p>
      </div>
      
      <Card className="max-w-4xl mx-auto w-full">
        <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>A quick guide to using the exchange.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="space-y-6">
                {steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                            <step.icon className="h-6 w-6" />
                        </div>
                        <div className="flex-grow">
                            <h3 className="font-semibold text-lg">{step.title}</h3>
                            <p className="text-muted-foreground">{step.description}</p>
                             <Button variant="link" asChild className="p-0 h-auto mt-1">
                                <Link href={step.link}>
                                    {step.linkText}
                                </Link>
                            </Button>
                        </div>
                    </li>
                ))}
            </ul>
        </CardContent>
      </Card>

    </div>
  );
}
