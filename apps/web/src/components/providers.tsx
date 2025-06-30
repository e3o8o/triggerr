'use client';

import { AuthProvider } from '@/lib/auth-client';
import { ThemeProvider } from 'next-themes';
import { Suspense } from 'react';

interface RootProvidersProps {
  children: React.ReactNode;
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export default function RootProviders({ children }: RootProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Suspense fallback={<LoadingFallback />}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </Suspense>
    </ThemeProvider>
  );
}
