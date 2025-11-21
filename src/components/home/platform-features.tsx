'use client';

import { Card } from '@/components/ui/card';
import { Shield, TrendingUp, Zap, Headphones, Smartphone, Lock } from 'lucide-react';

const features = [
    {
        icon: TrendingUp,
        title: 'Advanced Charting',
        description: 'Professional-grade charts with 50+ indicators and drawing tools',
        color: 'from-purple-500 to-purple-600'
    },
    {
        icon: Zap,
        title: 'Low Fees',
        description: 'Industry-leading 0.1% trading fee on all pairs',
        color: 'from-yellow-500 to-yellow-600'
    },
    {
        icon: Shield,
        title: 'Bank-Grade Security',
        description: '95% of funds in cold storage with multi-sig protection',
        color: 'from-green-500 to-green-600'
    },
    {
        icon: Headphones,
        title: '24/7 Support',
        description: 'Live chat support available around the clock',
        color: 'from-blue-500 to-blue-600'
    },
    {
        icon: Lock,
        title: 'Instant Deposits',
        description: 'Deposits credited instantly, withdrawals within 15 minutes',
        color: 'from-pink-500 to-pink-600'
    },
    {
        icon: Smartphone,
        title: 'Mobile Trading',
        description: 'Trade on the go with our iOS and Android apps',
        color: 'from-indigo-500 to-indigo-600'
    }
];

export function PlatformFeatures() {
    return (
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                        Why Choose Fort Knox Exchange?
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Industry-leading features designed for both beginners and professional traders
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <Card
                            key={index}
                            variant="glass"
                            className="p-6 hover-lift hover-glow cursor-pointer group animate-scale-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                                <feature.icon className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-muted-foreground">
                                {feature.description}
                            </p>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
