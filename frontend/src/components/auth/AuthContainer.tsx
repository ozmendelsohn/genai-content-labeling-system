/**
 * Authentication Container Component
 * 
 * A container component that handles both login and signup flows
 * with smooth transitions and proper state management.
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

interface AuthContainerProps {
  onLoginSuccess: (token: string, user: any) => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthContainer({ onLoginSuccess, initialMode = 'login' }: AuthContainerProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const router = useRouter();

  const handleSignupSuccess = (user: any) => {
    console.log('🎉 handleSignupSuccess called with user:', user);
    setShowSuccessMessage(true);
    
    // Show success message for 2 seconds, then switch to login
    setTimeout(() => {
      console.log('⏰ Timeout completed, switching to login mode');
      setShowSuccessMessage(false);
      setMode('login');
    }, 2000);
  };

  const handleSwitchToLogin = () => {
    setMode('login');
  };

  const handleSwitchToSignup = () => {
    setMode('signup');
  };

  // Show success message after signup
  if (showSuccessMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Account Created Successfully!
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Your account has been created. You can now sign in with your credentials.
            </p>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                Redirecting to login...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login form
  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-blue-600 rounded-full">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                Welcome Back
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                Sign in to your account
              </p>
            </div>

            {/* Login Form Content */}
            <LoginFormContent onLoginSuccess={onLoginSuccess} />

            {/* Switch to Signup */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Don't have an account?{' '}
                <button
                  onClick={handleSwitchToSignup}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Create one here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show signup form
  return (
    <SignupForm 
      onSignupSuccess={handleSignupSuccess}
      onSwitchToLogin={handleSwitchToLogin}
    />
  );
}

// Extracted login form content to match the existing design
function LoginFormContent({ onLoginSuccess }: { onLoginSuccess: (token: string, user: any) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          remember_me: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      
      // Store token in localStorage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      onLoginSuccess(data.access_token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>
    </>
  );
} 