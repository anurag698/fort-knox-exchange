import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import { FirebaseClientProvider } from '@/firebase';
import Script from 'next/script';
import { ThemeProvider } from '@/providers/theme-provider';


export const metadata: Metadata = {
  title: 'Fort Knox Exchange',
  description: 'A secure, modern crypto exchange.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      <body>
        <ThemeProvider>
          <FirebaseClientProvider>
            <Header />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
