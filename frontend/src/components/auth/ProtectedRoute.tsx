/**
 * Protected Route Component
 * 
 * Wrapper component that protects routes by checking authentication status
 * and redirecting to login if necessary.
 */

'use client';

import React, { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import LoginForm from './LoginForm';
import { User } from '@/lib/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: User['role'];
  fallback?: ReactNode;
  redirectTo?: string;
}

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-slate-600 dark:text-slate-300">Loading...</p>
    </div>
  </div>
);

const UnauthorizedMessage = ({ requiredRole }: { requiredRole: User['role'] }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 px-4">
    <div className="max-w-md mx-auto text-center">
      <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Access Denied
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4">
          You need {requiredRole} access to view this page.
        </p>
        <button 
          onClick={() => window.history.back()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
);

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback, 
  redirectTo 
}: ProtectedRouteProps) {
  const { user, isLoading, isLoggedIn } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return fallback || <LoadingSpinner />;
  }

  // Show login form if not authenticated
  if (!isLoggedIn || !user) {
    return <LoginForm redirectTo={redirectTo} />;
  }

  // Check role-based access if required
  if (requiredRole) {
    const roleHierarchy = { admin: 3, labeler: 2, viewer: 1 };
    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
      return <UnauthorizedMessage requiredRole={requiredRole} />;
    }
  }

  // User is authenticated and authorized
  return <>{children}</>;
} 