/**
 * Upload History Component
 * 
 * Fetches and displays recent upload history from the backend API
 * instead of using placeholder data.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Badge from './Badge';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface ContentItem {
  id: number;
  url: string;
  title?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  assigned_user_id?: number;
}

interface UploadHistoryProps {
  limit?: number;
}

export default function UploadHistory({ limit = 5 }: UploadHistoryProps) {
  const [uploads, setUploads] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchUploads();
    }
  }, [token]);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/content?per_page=${limit}&sort_by=created_at&sort_order=desc`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch upload history');
      }

      const data = await response.json();
      setUploads(data.content_items || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching upload history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load upload history');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusVariant = (status: string): 'success' | 'danger' | 'warning' | 'secondary' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      case 'in_progress':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg animate-pulse">
            <div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 mb-1"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
            </div>
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400 text-center py-4">
        Failed to load upload history
      </div>
    );
  }

  if (!uploads.length) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
        No uploads yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {uploads.map((upload) => (
        <div key={upload.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {upload.title || new URL(upload.url).hostname}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatTimestamp(upload.created_at)}
            </p>
          </div>
          <Badge 
            variant={getStatusVariant(upload.status)} 
            size="sm"
          >
            {upload.status.replace('_', ' ')}
          </Badge>
        </div>
      ))}
    </div>
  );
} 