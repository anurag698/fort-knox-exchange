'use client';

import { Card } from '@/components/ui/card';
import { Shield, Lock, Server, FileCheck, Eye, Clock } from 'lucide-react';

const securityFeatures = [
    {
        icon: Lock,
        title: 'Cold Storage',
        description: '95% of assets stored offline in multi-sig wallets'
    },
    {
        icon: Shield,
        title: '2FA Protection',
        description: 'Mandatory two-factor authentication for all accounts'
    },
    {
        icon: Server,
        title: 'DDOS Protection',
        description: 'Enterprise-grade infrastructure with 99.9% uptime'
    },
    {
        icon: FileCheck,
        title: 'KYC/AML Compliance',
        description: 'Fully compliant with global regulatory standards'
    },
    {
        icon: Eye,
        title: 'Real-time Monitoring',
        description: '24/7 security team monitoring all transactions'
    },
    {
        icon: Clock,
        title: 'Withdrawal Whitelist',
        description: '24-hour security hold on new withdrawal addresses'
    }
];

export function SecuritySection() {
    return (
        <section className="py-16 md:py-24 bg-gradient-to-b from-background to-primary/5">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <div className="inline-flex p-3 rounded-full bg-green-500/10 mb-4">
                        <Shield className="h-8 w-8 text-green-500" />
                    </div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-green-500 to-foreground bg-clip-text text-transparent">
                        Bank-Grade Security
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Your assets are protected by industry-leading security measures
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {securityFeatures.map((feature, index) => (
                        <Card
                            key={index}
                            variant="glass"
                            className="p-6 hover-lift cursor-pointer group animate-scale-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                                    <feature.icon className="h-6 w-6 text-green-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold mb-1 group-hover:text-primary transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
                    <div className="text-center">
                        <p className="text-2xl font-bold">ISO 27001</p>
                        <p className="text-xs text-muted-foreground">Certified</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">SOC 2</p>
                        <p className="text-xs text-muted-foreground">Type II</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">$100M+</p>
                        <p className="text-xs text-muted-foreground">Insurance</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">99.9%</p>
                        <p className="text-xs text-muted-foreground">Uptime</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
