import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import ProHeader from "@/components/layout/pro-header";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import Script from "next/script";

export const metadata = {
  title: "Fort Knox Exchange",
  description: "A secure and modern cryptocurrency exchange.",
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
      <body>
        <ThemeProvider>
          <FirebaseClientProvider>
            {/* GLOBAL HEADER */}
            <ProHeader />

            {/* PAGE CONTENT (with header spacing) */}
            <main className="container mx-auto px-4 py-8 pt-24">
              {children}
            </main>
            <Toaster />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
