
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import { FirebaseClientProvider } from '@/firebase';
import Script from 'next/script';

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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
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
                  
                  // Be more selective with errors if needed, for now, we suppress all
                  // to prevent the panel from opening and causing layout shifts.
                  // In a real debug session, you would comment this out.
                  // console.error = function(...args) {
                  //   // Example: Suppress specific known non-critical errors
                  //   // if (typeof args[0] === 'string' && args[0].includes('some known error')) {
                  //   //   return;
                  //   // }
                  //   originalError.apply(console, args);
                  // };
                }
              } catch (e) {
                // Could fail due to security policies, but we tried.
              }
            })();
          `}
        </Script>
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <div className="flex flex-1 flex-col min-h-svh">
            <Header />
            <main className="flex-1">
              <div className="container mx-auto p-4 md:p-6 lg:p-8">
                {children}
              </div>
            </main>
          </div>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
