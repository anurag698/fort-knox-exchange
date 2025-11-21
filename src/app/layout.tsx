import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import ProHeader from "@/components/layout/pro-header";
import { Toaster } from "@/components/ui/toaster";
import { AzureAuthProvider } from "@/providers/azure-auth-provider";
import Script from "next/script";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TwoFactorGuard } from "@/components/security/two-factor-guard";

export const metadata = {
  title: {
    default: "Fort Knox Exchange | Secure Crypto Trading",
    template: "%s | Fort Knox Exchange",
  },
  description: "A secure, ultra-modern cryptocurrency exchange featuring real-time trading, advanced charting, and social trading features.",
  keywords: ["crypto", "exchange", "bitcoin", "ethereum", "trading", "finance", "secure", "fort knox"],
  authors: [{ name: "Fort Knox Team" }],
  creator: "Fort Knox Exchange",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://fortknox.exchange",
    title: "Fort Knox Exchange | Secure Crypto Trading",
    description: "Experience the future of crypto trading with Fort Knox Exchange. Secure, fast, and feature-rich.",
    siteName: "Fort Knox Exchange",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fort Knox Exchange Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fort Knox Exchange | Secure Crypto Trading",
    description: "Experience the future of crypto trading with Fort Knox Exchange. Secure, fast, and feature-rich.",
    images: ["/twitter-image.png"],
    creator: "@fortknox_ex",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=Outfit:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <Script id="production-mode-switch" strategy="beforeInteractive">
          {`
            // Production Mode Switch to prevent Studio panel auto-scroll
            (function() {
              try {
                if (window.self !== window.top) {
                  // We are in an iframe (likely Firebase Studio)
                  const originalWarn = console.warn;
                  const originalError = console.error;

                  console.warn = function(...args) {
                    // Suppress warnings that are known to be noisy in dev but not critical
                    // Example: Next.js hydration warnings
                    if (typeof args[0] === 'string' && args[0].includes('Extra attributes from the server')) {
                      return;
                    }
                    originalWarn.apply(console, args);
                  };
                  
                }
              } catch (e) {
                // Could fail due to security policies, but we tried.
              }
            })();
          `}
        </Script>
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AzureAuthProvider>
            {/* GLOBAL HEADER */}
            <ProHeader />

            {/* PAGE CONTENT (with header spacing and mobile nav spacing) */}
            <main className="w-full pb-16 md:pb-0">
              {children}
            </main>

            {/* MOBILE NAVIGATION */}
            <MobileNav />

            <TwoFactorGuard />
            <Toaster />
          </AzureAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
