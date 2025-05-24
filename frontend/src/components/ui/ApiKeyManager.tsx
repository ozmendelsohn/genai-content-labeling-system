/**
 * API Key Manager Component
 * 
 * A component for managing Google Gemini AI API keys with validation
 * and status display for the GenAI Content Labeling System.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/design-system';
import Input from './Input';
import Button from './Button';
import { KeyIcon, CheckCircleIcon, XCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface ApiKeyStatus {
  valid: boolean;
  message: string;
  has_api_key: boolean;
}

interface ApiKeyManagerProps {
  className?: string;
  onApiKeyChange?: (hasApiKey: boolean) => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ 
  className,
  onApiKeyChange 
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [status, setStatus] = useState<ApiKeyStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check initial API key status
  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    try {
      setChecking(true);
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/ai/api-key/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: ApiKeyStatus = await response.json();
        setStatus(data);
        onApiKeyChange?.(data.has_api_key);
      }
    } catch (error) {
      console.error('Failed to check API key status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/ai/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ api_key: apiKey }),
      });

      const data: ApiKeyStatus = await response.json();
      setStatus(data);
      
      if (data.valid) {
        setApiKey('');
        onApiKeyChange?.(true);
      }
    } catch (error) {
      console.error('Failed to set API key:', error);
      setStatus({
        valid: false,
        message: 'Failed to validate API key. Please try again.',
        has_api_key: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveApiKey = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/ai/api-key', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setStatus({
          valid: false,
          message: 'API key removed successfully',
          has_api_key: false
        });
        onApiKeyChange?.(false);
      }
    } catch (error) {
      console.error('Failed to remove API key:', error);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center space-x-2">
        <KeyIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
          Gemini AI API Key
        </h3>
        {status && (
          <div className="flex items-center space-x-1">
            {status.has_api_key ? (
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-red-500" />
            )}
          </div>
        )}
      </div>

      {status && (
        <div className={cn(
          "p-3 rounded-lg border",
          status.valid || status.has_api_key
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
            : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200"
        )}>
          <p className="text-sm font-medium">{status.message}</p>
        </div>
      )}

      {status?.has_api_key ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your Gemini AI API key is configured and ready for content analysis.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveApiKey}
            disabled={loading}
            className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
          >
            {loading ? 'Removing...' : 'Remove API Key'}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Google AI Studio API Key
            </label>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key..."
                className="pr-10"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showApiKey ? (
                  <EyeSlashIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Get your free API key from{' '}
              <a 
                href="https://ai.google.dev/gemini-api/docs/api-key" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <Button
            type="submit"
            disabled={!apiKey.trim() || loading}
            className="w-full"
          >
            {loading ? 'Validating...' : 'Set API Key'}
          </Button>
        </form>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
          What is this for?
        </h4>
        <p className="text-xs text-blue-800 dark:text-blue-300">
          The Gemini AI API key enables automatic content analysis to pre-classify whether 
          web content is AI-generated or human-created, making your labeling work more efficient.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyManager; 