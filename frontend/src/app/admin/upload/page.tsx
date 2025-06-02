/**
 * Enhanced Admin Upload Page
 * 
 * A modern admin interface for uploading URLs with improved UX,
 * better visual hierarchy, and comprehensive feedback systems.
 */

'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import DashboardStats from '@/components/ui/DashboardStats';
import UploadHistory from '@/components/ui/UploadHistory';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Icons
const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const AlertIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

interface UploadResult {
  success: boolean;
  message: string;
  count?: number;
}

function AdminUploadContent() {
  const [urls, setUrls] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const { token } = useAuth();

  const [resetExisting, setResetExisting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const urlList = urls.split('\n').filter(url => url.trim());
      
      if (urlList.length === 0) {
        setResult({
          success: false,
          message: 'Please enter at least one URL'
        });
        setIsLoading(false);
        return;
      }

      const formData = new URLSearchParams();
      formData.append('urls_list', urls);
      formData.append('reset_existing', resetExisting.toString());

      const response = await fetch(`${API_BASE_URL}/admin/upload_urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to upload URLs');
      }

      setResult({
        success: true,
        message: data.message || 'URLs processed successfully!',
        count: urlList.length
      });

      setUrls('');
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload URLs. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const urlCount = urls.split('\n').filter(url => url.trim()).length;

  return (
    <div className="min-h-screen bg-white dark:bg-black py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-slate-100 dark:from-black dark:via-gray-900 dark:to-gray-800 opacity-90"></div>
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
              <UploadIcon />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Upload</h1>
              <p className="text-slate-600 dark:text-slate-400">Upload URLs for content labeling tasks</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="primary" size="sm">Admin Panel</Badge>
            <Badge variant="success" size="sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              System Ready
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-2">
            <Card variant="elevated">
              <CardHeader>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center">
                  <LinkIcon />
                  <span className="ml-2">Upload URLs</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Enter one URL per line. Each URL will be processed and assigned to labelers.
                </p>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        URLs to Process
                      </label>
                      <textarea
                        value={urls}
                        onChange={(e) => setUrls(e.target.value)}
                        placeholder="https://website1.com/article&#10;https://blog.company.com/post&#10;https://news.site.com/story"
                        className="w-full h-48 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                        disabled={isLoading}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Enter one URL per line
                        </p>
                        <Badge variant={urlCount > 0 ? 'primary' : 'secondary'} size="sm">
                          {urlCount} URL{urlCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>

                    {/* Upload Options */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Upload Options</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                            defaultChecked
                          />
                          <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                            Auto-assign to available labelers
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                            defaultChecked
                          />
                          <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                            Send notification to labelers
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                            High priority processing
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={resetExisting}
                            onChange={(e) => setResetExisting(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                            Reset existing URLs to pending status
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Result Display */}
                    {result && (
                      <div className={`p-4 rounded-lg border ${
                        result.success 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}>
                        <div className="flex items-center">
                          {result.success ? (
                            <CheckIcon className="text-green-600 dark:text-green-400 mr-2" />
                          ) : (
                            <AlertIcon className="text-red-600 dark:text-red-400 mr-2" />
                          )}
                          <p className={`text-sm font-medium ${
                            result.success 
                              ? 'text-green-800 dark:text-green-200' 
                              : 'text-red-800 dark:text-red-200'
                          }`}>
                            {result.message}
                            {result.count && ` (${result.count} URLs processed)`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={isLoading || urlCount === 0}
                    isLoading={isLoading}
                  >
                    {isLoading ? 'Uploading...' : `Upload ${urlCount} URL${urlCount !== 1 ? 's' : ''}`}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upload Statistics */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Upload Statistics</h3>
              </CardHeader>
              <CardContent>
                <DashboardStats variant="upload" />
              </CardContent>
            </Card>

            {/* Upload History */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                  <FileIcon />
                  <span className="ml-2">Recent Uploads</span>
                </h3>
              </CardHeader>
              <CardContent>
                <UploadHistory limit={5} />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Quick Actions</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileIcon />
                    <span className="ml-2">Import from CSV</span>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <LinkIcon />
                    <span className="ml-2">Bulk URL Validator</span>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <CheckIcon />
                    <span className="ml-2">View All Tasks</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUploadPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminUploadContent />
    </ProtectedRoute>
  );
} 