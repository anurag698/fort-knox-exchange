'use client';

import { Card } from '@/components/ui/card';
import { UserPlus, DollarSign, TrendingUp, Wallet, CheckCircle } from 'lucide-react';

const steps = [
    {
        icon: UserPlus,
        title: 'Create & Verify',
        description: 'Sign up and complete KYC verification in minutes',
        color: 'from-purple-500 to-purple-600'
    },
    {
        icon: DollarSign,
        title: 'Deposit Funds',
        description: 'Add funds via bank transfer, card, or crypto',
        color: 'from-blue-500 to-blue-600'
    },
    {
        icon: TrendingUp,
        title: 'Start Trading',
        description: 'Trade 100+ pairs with advanced tools',
        color: 'from-green-500 to-green-600'
    },
    {
        icon: Wallet,
        title: 'Withdraw Profits',
        description: 'Instant withdrawals to your wallet or bank',
        color: 'from-yellow-500 to-yellow-600'
    }
];

export function HowItWorks() {
    return (
        <section className="py-16 md:py-24 bg-gradient-to-b from-background/50 to-background">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                        Start Trading in 4 Simple Steps
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Get started with Fort Knox Exchange in just a few minutes
                    </p>
                </div>

                <div className="relative">
                    {/* Timeline line */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 -translate-y-1/2" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {steps.map((step, index) => (
                            <div key={index} className="relative">
                                <Card
                                    variant="glass"
                                    className="p-6 text-center hover-lift cursor-pointer group animate-scale-in h-full"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {/* Step number */}
                                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                        {index + 1}
                                    </div>

                                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${step.color} mb-4 group-hover:scale-110 transition-transform`}>
                                        <step.icon className="h-8 w-8 text-white" />
                                    </div>

                                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                        {step.title}
                                    </h3>
                                    <p className="text-muted-foreground text-sm">
                                        {step.description}
                                    </p>

                                    {/* Checkmark for completed look */}
                                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
