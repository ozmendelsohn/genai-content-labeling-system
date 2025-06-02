/**
 * Client Layout Component
 * 
 * Client-side layout wrapper that provides authentication context and API key context
 * and handles navigation based on authentication state.
 */

'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ApiKeyProvider } from '@/contexts/ApiKeyContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AuthenticatedLayout from './authenticated-layout';

interface ClientLayoutProps {
  children: ReactNode;
}

/**
 * Client-side layout wrapper with all providers
 * 
 * Wraps the app with authentication, API key, and theme providers.
 * Must be a client component to handle browser-specific functionality.
 */
export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ApiKeyProvider>
          <AuthenticatedLayout>
            {children}
          </AuthenticatedLayout>
        </ApiKeyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
} 