/**
 * Client Layout Component
 * 
 * Client-side layout wrapper that provides authentication context
 * and handles navigation based on authentication state.
 */

'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthenticatedLayout from './authenticated-layout';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AuthProvider>
      <AuthenticatedLayout>
        {children}
      </AuthenticatedLayout>
    </AuthProvider>
  );
} 