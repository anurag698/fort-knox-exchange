import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Shield, Zap, TrendingUp, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            Fort Knox Exchange
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            The most secure and advanced cryptocurrency trading platform
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Button asChild size="lg">
              <Link href="/signup">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/markets">Explore Markets</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose Fort Knox Exchange?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-purple-500 mb-2" />
              <CardTitle>Secure</CardTitle>
              <CardDescription>Bank-level security with 2FA, encrypted data, and cold storage</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-purple-500 mb-2" />
              <CardTitle>Fast</CardTitle>
              <CardDescription>Real-time trading with instant order execution</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-purple-500 mb-2" />
              <CardTitle>Advanced Charts</CardTitle>
              <CardDescription>Professional trading tools and technical indicators</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-purple-500 mb-2" />
              <CardTitle>Social Trading</CardTitle>
              <CardDescription>Copy successful traders and learn from the best</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl md:text-4xl">Ready to Start Trading?</CardTitle>
            <CardDescription className="text-white/90 text-lg">
              Join thousands of traders on the most secure exchange
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/signup">Create Free Account</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
