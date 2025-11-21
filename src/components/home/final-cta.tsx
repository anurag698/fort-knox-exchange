'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Zap, TrendingUp } from 'lucide-react';

export function FinalCTA() {
    return (
        <section className="py-20 md:py-32 bg-gradient-to-br from-primary via-purple-600 to-primary relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center text-white max-w-4xl mx-auto">
                    <Zap className="h-16 w-16 mx-auto mb-6 animate-bounce-subtle" />

                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                        Ready to Start Trading?
                    </h2>

                    <p className="text-xl md:text-2xl mb-8 text-white/90">
                        Join 150,000+ traders on Fort Knox Exchange today
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                        <Button
                            size="xl"
                            variant="secondary"
                            asChild
                            className="bg-white text-primary hover:bg-white/90 shadow-2xl group"
                        >
                            <Link href="/auth">
                                Create Free Account
                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                        <Button
                            size="xl"
                            variant="outline"
                            asChild
                            className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                        >
                            <Link href="/markets">
                                Explore Markets
                            </Link>
                        </Button>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                        <div>
                            <p className="text-3xl md:text-4xl font-bold mb-1">150K+</p>
                            <p className="text-sm text-white/80">Active Users</p>
                        </div>
                        <div>
                            <p className="text-3xl md:text-4xl font-bold mb-1">$2B+</p>
                            <p className="text-sm text-white/80">24h Volume</p>
                        </div>
                        <div>
                            <p className="text-3xl md:text-4xl font-bold mb-1">100+</p>
                            <p className="text-sm text-white/80">Trading Pairs</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
