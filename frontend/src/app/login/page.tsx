/**
 * Login Page
 * 
 * Dedicated login page for the GenAI Content Labeling System
 * with modern design and authentication handling.
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AuthContainer from '@/components/auth/AuthContainer';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const handleLoginSuccess = (token: string, user: any) => {
    login(token, user);
    router.push('/');
  };

  return <AuthContainer onLoginSuccess={handleLoginSuccess} initialMode="login" />;
} 