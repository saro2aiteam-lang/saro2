"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from '@/contexts/AuthContext';
import { CreditsProvider } from '@/contexts/CreditsContext';
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from '@/components/ErrorBoundary';
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error && typeof error === 'object' && 'status' in error) {
            const status = (error as any).status;
            if (status >= 400 && status < 500) {
              return false;
            }
          }
          return failureCount < 3;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  }));

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <CreditsProvider>
              {children}
            </CreditsProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}