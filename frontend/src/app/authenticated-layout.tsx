/**
 * Authenticated Layout Component
 * 
 * Layout component that shows different UI based on authentication status.
 * Shows navbar and main content for authenticated users, or handles login flow.
 */

'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import Navbar from '@/components/Navbar';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { isLoggedIn, isLoading } = useAuth();
  const pathname = usePathname();

  // Don't show navbar on login page or while loading
  const isLoginPage = pathname === '/login';
  const shouldShowNavbar = isLoggedIn && !isLoginPage && !isLoading;

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <main className={shouldShowNavbar ? '' : ''}>
        {children}
      </main>
    </>
  );
} 