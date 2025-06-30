'use client';

import { AuthProvider } from '@/lib/auth-client';
import App from './app'; // Assuming app.tsx is in the same directory

export default function ClientAppRoot() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
