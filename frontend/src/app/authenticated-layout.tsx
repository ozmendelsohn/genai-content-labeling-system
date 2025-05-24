/**
 * Authenticated Layout Component
 * 
 * Layout component that shows different UI based on authentication status.
 * Shows navbar and main content for authenticated users, or handles login flow.
 */

'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import LoginForm from '@/components/auth/LoginForm';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { isAuthenticated, isLoading, login } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={login} />;
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