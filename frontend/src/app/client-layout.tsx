/**
 * Client Layout Component
 * 
 * Client-side layout wrapper that provides authentication context, API key context,
 * and theme context using next-themes for reliable theme switching.
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

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AuthProvider>
      <ApiKeyProvider>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          storageKey="ui-theme"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          <AuthenticatedLayout>
            {children}
          </AuthenticatedLayout>
        </ThemeProvider>
      </ApiKeyProvider>
    </AuthProvider>
  );
} 