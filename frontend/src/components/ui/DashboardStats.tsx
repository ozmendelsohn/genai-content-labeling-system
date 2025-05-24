/**
 * Dashboard Statistics Component
 * 
 * Fetches and displays real-time statistics from the backend
 * including user stats and system stats for the dashboard.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Badge from './Badge';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface UserStats {
  total_labels: number;
  labels_today: number;
  labels_this_week: number;
  labels_this_month: number;
  average_time_per_label: number;
  accuracy_score?: number;
}

interface SystemStats {
  total_users: number;
  active_users: number;
  total_content_items: number;
  pending_content_items: number;
  completed_content_items: number;
  total_labels: number;
  labels_today: number;
  average_accuracy: number;
}

interface DashboardData {
  user_stats: UserStats;
  system_stats: SystemStats;
  recent_activity: any[];
}

interface DashboardStatsProps {
  variant?: 'user' | 'admin' | 'upload';
}

export default function DashboardStats({ variant = 'user' }: DashboardStatsProps) {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data: DashboardData = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">
        Failed to load statistics
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  if (variant === 'upload' && user?.role === 'admin') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600 dark:text-slate-400">Today</span>
          <Badge variant="primary" size="sm">{stats.system_stats.labels_today} Labels</Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600 dark:text-slate-400">Pending</span>
          <Badge variant="secondary" size="sm">{stats.system_stats.pending_content_items} URLs</Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600 dark:text-slate-400">Total</span>
          <Badge variant="success" size="sm">{stats.system_stats.total_content_items} URLs</Badge>
        </div>
      </div>
    );
  }

  if (variant === 'admin' && user?.role === 'admin') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Users</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.system_stats.active_users}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Content</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.system_stats.total_content_items}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.system_stats.pending_content_items}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Labels</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.system_stats.total_labels}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">Your Labels Today</span>
        <Badge variant="primary" size="sm">{stats.user_stats.labels_today}</Badge>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">This Week</span>
        <Badge variant="secondary" size="sm">{stats.user_stats.labels_this_week}</Badge>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">Total</span>
        <Badge variant="success" size="sm">{stats.user_stats.total_labels}</Badge>
      </div>
      {stats.user_stats.accuracy_score && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600 dark:text-slate-400">Accuracy</span>
          <Badge variant="info" size="sm">{stats.user_stats.accuracy_score.toFixed(1)}%</Badge>
        </div>
      )}
    </div>
  );
} 