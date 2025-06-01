/**
 * Authenticated Layout Component
 * 
 * Layout component that shows different UI based on authentication status.
 * Shows navbar and main content for authenticated users, or handles login/signup flow.
 */

'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import AuthContainer from '@/components/auth/AuthContainer';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { isAuthenticated, isLoading, login } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication container (login/signup) if not authenticated
  if (!isAuthenticated) {
    return <AuthContainer onLoginSuccess={login} />;
  }

  // Show authenticated layout
  const shouldShowNavbar = isAuthenticated;

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <main className={shouldShowNavbar ? '' : ''}>
        {children}
      </main>
    </>
  );
} 