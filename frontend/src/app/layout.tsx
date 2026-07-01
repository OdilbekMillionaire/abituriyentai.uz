"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { LangProvider } from "@/lib/lang";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";
import "katex/dist/katex.min.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

// Note: metadata must be in a server component; keep here for reference only
// export const metadata: Metadata = {
//   title: "AbituriyentAI",
//   description: "O'zbekiston abituriyentlari uchun AI-powered tayyorgarlik platformasi",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <html lang="uz">
      <head>
        <title>AbituriyentAI — Universitetga kirish imtihoniga tayyorlaning</title>
        <meta
          name="description"
          content="O'zbekiston abituriyentlari uchun AI yordamida BMBA imtihoniga tayyorgarlik platformasi. Ona tili, Matematika, O'zbekiston tarixi."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AbituriyentAI" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>
          <LangProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </LangProvider>
          {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </body>
    </html>
  );
}
