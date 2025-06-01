/**
 * Homepage Component
 * 
 * Main landing page for the GenAI Content Labeling System with
 * authentication-protected dashboard.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ApiKeyManager from '@/components/ui/ApiKeyManager';
import ContentAnalyzer from '@/components/ui/ContentAnalyzer';
import DashboardStats from '@/components/ui/DashboardStats';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { 
  SparklesIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

function DashboardContent() {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  // Prevent hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Initializing...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: SparklesIcon,
      title: 'AI-Powered Analysis',
      description: 'Use Google\'s Gemini AI to automatically analyze content and suggest AI/Human classifications with confidence scores.'
    },
    {
      icon: DocumentTextIcon,
      title: 'Smart Content Extraction',
      description: 'Automatically extract and analyze web content, including titles, descriptions, and full text for comprehensive analysis.'
    },
    {
      icon: ChartBarIcon,
      title: 'Detailed Insights',
      description: 'Get detailed reasoning, confidence scores, and specific indicators that help identify AI-generated vs human-created content.'
    },
    {
      icon: UserGroupIcon,
      title: 'Collaborative Labeling',
      description: 'Work with your team to label content efficiently with role-based access control and audit trails.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-blue-600 rounded-full mr-4">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Welcome back, {user?.full_name || user?.username}!
            </h1>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Your GenAI Content Labeling Dashboard - Harness the power of Google's Gemini AI to intelligently analyze and classify web content.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {user?.role === 'admin' && (
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Admin Dashboard
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Monitor system stats, manage URLs, and view comprehensive analytics.
              </p>
              <Button variant="primary" size="sm" className="w-full">
                <a href="/admin/dashboard" className="block w-full">
                  View Dashboard
                </a>
              </Button>
            </Card>
          )}

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <UploadIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Upload URLs
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Add new websites for content analysis and labeling.
            </p>
            {user?.role === 'admin' && (
              <Button variant="primary" size="sm" className="w-full">
                <a href="/admin/upload" className="block w-full">
                  Go to Upload
                </a>
              </Button>
            )}
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TaskIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Label Content
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Review and label website content as AI or human-generated.
            </p>
            {(user?.role === 'admin' || user?.role === 'labeler') && (
              <Button variant="primary" size="sm" className="w-full">
                <a href="/labeler/task" className="block w-full">
                  Start Labeling
                </a>
              </Button>
            )}
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="h-full">
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Configuration */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CogIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    AI Configuration
                  </h2>
                </div>
                <ApiKeyManager onApiKeyChange={setHasApiKey} />
              </div>
            </Card>

            {/* Getting Started */}
            <Card className="mt-6">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <LightBulbIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                    Getting Started
                  </h3>
                </div>
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-start">
                    <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                      1
                    </span>
                    <p>Get your free API key from Google AI Studio</p>
                  </div>
                  <div className="flex items-start">
                    <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                      2
                    </span>
                    <p>Configure your API key in the AI Configuration panel</p>
                  </div>
                  <div className="flex items-start">
                    <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                      3
                    </span>
                    <p>Start analyzing web content with AI-powered insights</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Content Analyzer */}
          <div className="lg:col-span-2">
            <ContentAnalyzer hasApiKey={hasApiKey} />
          </div>
        </div>

        {/* Dashboard Statistics for Admins */}
        {user?.role === 'admin' && (
          <div className="mt-16">
            <Card>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                  System Overview
                </h3>
                <DashboardStats variant="admin" />
              </div>
            </Card>
          </div>
        )}

        {/* Recent Activity */}
        <div className="mt-16">
          <Card>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                Recent Activity
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        Welcome to the GenAI Labeling System!
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        You're now logged in as {user?.role}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 text-xs rounded-md">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Additional icons needed
const UploadIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const TaskIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

export default function Home() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
