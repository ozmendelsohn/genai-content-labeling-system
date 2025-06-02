/**
 * Comprehensive Admin Dashboard
 * 
 * A powerful admin interface with detailed statistics, URL management,
 * and comprehensive system monitoring capabilities.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Enhanced interfaces for the dashboard
interface ContentItem {
  id: number;
  url: string;
  title?: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: number;
  assigned_user_id?: number;
  assigned_user?: {
    id: number;
    username: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface ContentStats {
  total_urls: number;
  pending_urls: number;
  in_progress_urls: number;
  completed_urls: number;
  failed_urls: number;
  completion_rate: number;
  avg_completion_time: number;
  urls_added_today: number;
  urls_completed_today: number;
}

interface UserActivity {
  active_labelers: number;
  top_labelers: Array<{
    username: string;
    labels_count: number;
    labels_today: number;
  }>;
  recent_activity: Array<{
    user: string;
    action: string;
    timestamp: string;
    url?: string;
  }>;
}

interface SystemMetrics {
  avg_processing_time: number;
  peak_activity_hour: number;
  system_load: number;
  error_rate: number;
}

interface LabelingAnalytics {
  classification_distribution: {
    ai_generated: {
      count: number;
      percentage: number;
      avg_confidence: number;
      avg_time_seconds: number;
    };
    human_created: {
      count: number;
      percentage: number;
      avg_confidence: number;
      avg_time_seconds: number;
    };
    uncertain: {
      count: number;
      percentage: number;
    };
    total: number;
  };
  labeler_performance: Array<{
    username: string;
    full_name: string;
    total_labels: number;
    labels_today: number;
    avg_time_per_label_seconds: number;
    avg_time_per_label_minutes: number;
    total_time_spent_hours: number;
    avg_confidence: number;
    productivity_score: number;
  }>;
  daily_trends: Array<{
    date: string;
    total_labels: number;
    ai_labels: number;
    human_labels: number;
    avg_time_seconds: number;
  }>;
  quality_metrics: {
    labels_today: number;
    avg_time_today_seconds: number;
    avg_time_today_minutes: number;
    quick_labels_count: number;
    thorough_labels_count: number;
    quick_labels_percentage: number;
    thorough_labels_percentage: number;
  };
  summary: {
    total_labelers: number;
    most_productive_labeler: string | null;
    avg_time_per_label_system: number;
    ai_human_ratio: number;
  };
}

interface ContentFilters {
  status: string;
  search: string;
  priority: string;
  assigned_user: string;
  date_from: string;
  date_to: string;
}

// Icons
const StatsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const ExportIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

function AdminDashboardContent() {
  // State management
  const [contentStats, setContentStats] = useState<ContentStats | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [labelingAnalytics, setLabelingAnalytics] = useState<LabelingAnalytics | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  const [filters, setFilters] = useState<ContentFilters>({
    status: '',
    search: '',
    priority: '',
    assigned_user: '',
    date_from: '',
    date_to: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      loadDashboardData();
      loadContentItems();
      loadLabelingAnalytics();
    }
  }, [token, currentPage, filters]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load basic dashboard stats
      const dashboardResponse = await fetch(`${API_BASE_URL}/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!dashboardResponse.ok) throw new Error('Failed to load dashboard data');
      const dashboardData = await dashboardResponse.json();
      
      // Transform the data into our enhanced format
      const stats: ContentStats = {
        total_urls: dashboardData.system_stats.total_content_items,
        pending_urls: dashboardData.system_stats.pending_content_items,
        in_progress_urls: dashboardData.system_stats.total_content_items - dashboardData.system_stats.pending_content_items - dashboardData.system_stats.completed_content_items,
        completed_urls: dashboardData.system_stats.completed_content_items,
        failed_urls: 0, // Would need to be calculated from actual data
        completion_rate: dashboardData.system_stats.total_content_items > 0 
          ? (dashboardData.system_stats.completed_content_items / dashboardData.system_stats.total_content_items) * 100 
          : 0,
        avg_completion_time: 245, // Placeholder - would be calculated from actual data
        urls_added_today: dashboardData.system_stats.labels_today,
        urls_completed_today: dashboardData.system_stats.labels_today
      };
      
      const activity: UserActivity = {
        active_labelers: dashboardData.system_stats.active_users,
        top_labelers: [], // Will be populated from real API data
        recent_activity: dashboardData.recent_activity
      };
      
      const metrics: SystemMetrics = {
        avg_processing_time: 180,
        peak_activity_hour: 14,
        system_load: 65,
        error_rate: 2.1
      };
      
      setContentStats(stats);
      setUserActivity(activity);
      setSystemMetrics(metrics);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadContentItems = async () => {
    try {
      setContentLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: itemsPerPage.toString()
      });
      
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.priority) params.append('priority', filters.priority);
      
      const response = await fetch(`${API_BASE_URL}/content?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to load content items');
      const data = await response.json();
      
      setContentItems(data.content_items || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Error loading content items:', err);
    } finally {
      setContentLoading(false);
    }
  };

  const loadLabelingAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/labeling-analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to load labeling analytics');
      const data = await response.json();
      
      setLabelingAnalytics(data);
    } catch (err) {
      console.error('Error loading labeling analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ContentFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      search: '',
      priority: '',
      assigned_user: '',
      date_from: '',
      date_to: ''
    });
    setCurrentPage(1);
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'danger' | 'secondary' => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-600 dark:text-red-400';
    if (priority === 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const handleExport = async (dataType: string, format: string = 'csv') => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/export-data?format=${format}&data_type=${dataType}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or generate one
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `${dataType}_export_${new Date().toISOString().slice(0, 10)}.${format}`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError('Export failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-slate-100 dark:from-black dark:via-gray-900 dark:to-gray-800 opacity-90"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="inline-flex items-center space-x-2 text-black dark:text-white">
              <svg className="animate-spin h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
                <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-lg">Loading dashboard...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-slate-100 dark:from-black dark:via-gray-900 dark:to-gray-800 opacity-90"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                <StatsIcon />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-slate-600 dark:text-slate-400">Comprehensive system monitoring and URL management</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                loadDashboardData();
                loadContentItems();
              }}
              className="flex items-center space-x-2"
            >
              <RefreshIcon />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 dark:border-red-800">
            <CardContent className="p-4">
              <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Overview */}
        {contentStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total URLs</p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">{contentStats.total_urls}</p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <LinkIcon />
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  +{contentStats.urls_added_today} today
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Completion Rate</p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">{contentStats.completion_rate.toFixed(1)}%</p>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {contentStats.completed_urls} completed
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">{contentStats.pending_urls}</p>
                  </div>
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {contentStats.in_progress_urls} in progress
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Labelers</p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">{userActivity?.active_labelers || 0}</p>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <UserIcon />
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {contentStats.urls_completed_today} labels today
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Statistics Overview with Labeling Analytics */}
        {contentStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total URLs</p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">{contentStats.total_urls}</p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <LinkIcon />
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  +{contentStats.urls_added_today} today
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">AI Generated</p>
                    <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                      {labelingAnalytics?.classification_distribution.ai_generated.count || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {labelingAnalytics?.classification_distribution.ai_generated.percentage.toFixed(1) || 0}% of total
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Human Created</p>
                    <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                      {labelingAnalytics?.classification_distribution.human_created.count || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {labelingAnalytics?.classification_distribution.human_created.percentage.toFixed(1) || 0}% of total
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Labelers</p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">{userActivity?.active_labelers || 0}</p>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <UserIcon />
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {contentStats.urls_completed_today} labels today
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Labeling Analytics Section */}
        {labelingAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Classification Distribution */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Classification Distribution</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI Generated</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {labelingAnalytics.classification_distribution.ai_generated.count}
                      </div>
                      <div className="text-xs text-slate-500">
                        {labelingAnalytics.classification_distribution.ai_generated.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Human Created</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {labelingAnalytics.classification_distribution.human_created.count}
                      </div>
                      <div className="text-xs text-slate-500">
                        {labelingAnalytics.classification_distribution.human_created.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  {labelingAnalytics.classification_distribution.uncertain.count > 0 && (
                    <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Uncertain</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">
                          {labelingAnalytics.classification_distribution.uncertain.count}
                        </div>
                        <div className="text-xs text-slate-500">
                          {labelingAnalytics.classification_distribution.uncertain.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Total Labels:</span>
                        <span className="font-medium">{labelingAnalytics.classification_distribution.total}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>AI/Human Ratio:</span>
                        <span className="font-medium">
                          {labelingAnalytics.summary.ai_human_ratio === Infinity ? '∞' : labelingAnalytics.summary.ai_human_ratio.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Labeler Performance */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Labeler Performance</h3>
                  <Badge variant="secondary" size="sm">
                    {labelingAnalytics.summary.total_labelers} labelers
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {labelingAnalytics.labeler_performance.slice(0, 5).map((labeler) => (
                    <div key={labeler.username} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {labeler.full_name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          @{labeler.username}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {labeler.total_labels} labels
                        </div>
                        <div className="text-xs text-slate-500">
                          {labeler.avg_time_per_label_minutes.toFixed(1)}m avg
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>System Average:</span>
                        <span className="font-medium">
                          {(labelingAnalytics.summary.avg_time_per_label_system / 60).toFixed(1)}m per label
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Most Productive:</span>
                        <span className="font-medium">
                          {labelingAnalytics.summary.most_productive_labeler || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quality Metrics */}
        {labelingAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                  {labelingAnalytics.quality_metrics.avg_time_today_minutes.toFixed(1)}m
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Average Time Today</div>
                <div className="text-xs text-slate-500 mt-1">
                  {labelingAnalytics.quality_metrics.labels_today} labels completed
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  {labelingAnalytics.quality_metrics.quick_labels_percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Quick Labels</div>
                <div className="text-xs text-slate-500 mt-1">
                  &lt;30 seconds ({labelingAnalytics.quality_metrics.quick_labels_count})
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-semibold text-purple-600 dark:text-purple-400 mb-2">
                  {labelingAnalytics.quality_metrics.thorough_labels_percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Thorough Labels</div>
                <div className="text-xs text-slate-500 mt-1">
                  &gt;5 minutes ({labelingAnalytics.quality_metrics.thorough_labels_count})
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* URL Management Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">URL Management</h2>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-1"
                >
                  <FilterIcon />
                  <span>Filters</span>
                </Button>
                <div className="relative">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center space-x-1"
                    onClick={() => document.getElementById('export-menu')?.classList.toggle('hidden')}
                  >
                    <ExportIcon />
                    <span>Export</span>
                  </Button>
                  <div id="export-menu" className="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10">
                    <div className="py-2">
                      <button
                        onClick={() => handleExport('urls', 'csv')}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        Export URLs (CSV)
                      </button>
                      <button
                        onClick={() => handleExport('labels', 'csv')}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        Export Labels (CSV)
                      </button>
                      <button
                        onClick={() => handleExport('performance', 'csv')}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        Export Performance (CSV)
                      </button>
                      <hr className="my-1 border-slate-200 dark:border-slate-700" />
                      <button
                        onClick={() => handleExport('urls', 'json')}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        Export URLs (JSON)
                      </button>
                      <button
                        onClick={() => handleExport('labels', 'json')}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        Export Labels (JSON)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Filters Panel */}
            {showFilters && (
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Search</label>
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search URLs..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                    <select
                      value={filters.priority}
                      onChange={(e) => handleFilterChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="">All Priorities</option>
                      <option value="5">High (5)</option>
                      <option value="4">High (4)</option>
                      <option value="3">Medium (3)</option>
                      <option value="2">Low (2)</option>
                      <option value="1">Low (1)</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button variant="outline" onClick={resetFilters} className="w-full">
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* URL List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-white">URL</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-white">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-white">Priority</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-white">Assigned To</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-white">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contentLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8">
                        <div className="inline-flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                          <svg className="animate-spin h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
                            <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Loading URLs...</span>
                        </div>
                      </td>
                    </tr>
                  ) : contentItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500 dark:text-slate-400">
                        No URLs found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    contentItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white truncate max-w-xs" title={item.url}>
                              {formatDomain(item.url)}
                            </div>
                            {item.title && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs" title={item.title}>
                                {item.title}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusColor(item.status)} size="sm">
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {item.assigned_user ? (
                            <span className="text-slate-700 dark:text-slate-300">
                              {item.assigned_user.username}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">View</Button>
                            <Button variant="outline" size="sm">Edit</Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
} 