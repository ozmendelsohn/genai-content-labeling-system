/**
 * Content Analyzer Component
 * 
 * A component for analyzing website content using AI with frontend-managed API keys.
 * The API key is retrieved from frontend context and sent with analysis requests.
 */

'use client';

import React, { useState } from 'react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { cn } from '@/lib/design-system';
import { Card } from './Card';
import Input from './Input';
import Button from './Button';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  UserIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  ClockIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

interface ContentExtractionResult {
  title: string;
  description: string;
  content_text: string;
  word_count: number;
  error?: string;
}

interface AIAnalysisResult {
  classification: string;
  confidence_score: number;
  ai_indicators: string[];
  human_indicators: string[];
  reasoning: string;
  detected_patterns?: string;
  analysis_timestamp: string;
}

interface CompleteAnalysisResult {
  url: string;
  content_extraction: ContentExtractionResult;
  ai_analysis: AIAnalysisResult;
  analysis_complete: boolean;
  timestamp: string;
}

interface ContentAnalysisResponse {
  success: boolean;
  message: string;
  analysis_result?: CompleteAnalysisResult;
  suggested_content_item?: {
    url: string;
    title: string;
    description: string;
    priority: number;
  };
}

interface ContentAnalyzerProps {
  className?: string;
  onContentAnalyzed?: (result: CompleteAnalysisResult) => void;
}

const ContentAnalyzer: React.FC<ContentAnalyzerProps> = ({
  className,
  onContentAnalyzed
}) => {
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<CompleteAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { apiKey, hasApiKey } = useApiKey();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !hasApiKey || !apiKey) return;

    try {
      setAnalyzing(true);
      setError(null);
      setResult(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/ai/analyze-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          url: url.trim(),
          use_ai_analysis: true,
          api_key: apiKey
        }),
      });

      const data: ContentAnalysisResponse = await response.json();
      
      if (data.success && data.analysis_result) {
        setResult(data.analysis_result);
        onContentAnalyzed?.(data.analysis_result);
      } else {
        setError(data.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('Failed to analyze content:', error);
      setError('Failed to analyze content. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'ai_generated':
        return <SparklesIcon className="w-5 h-5 text-purple-600" />;
      case 'human_created':
        return <UserIcon className="w-5 h-5 text-green-600" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'ai_generated':
        return 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-900/20 dark:border-purple-800';
      case 'human_created':
        return 'text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-900/20 dark:border-green-800';
      default:
        return 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-800';
    }
  };

  const formatClassification = (classification: string) => {
    switch (classification) {
      case 'ai_generated':
        return 'AI Generated';
      case 'human_created':
        return 'Human Created';
      default:
        return 'Uncertain';
    }
  };

  if (!hasApiKey) {
    return (
      <div className={cn("p-6 text-center bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-dashed border-gray-300 dark:border-gray-700", className)}>
        <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          AI Content Analysis
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Configure your Gemini API key to enable automatic content analysis
        </p>
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
          <p>🔒 Your API key will be stored securely in your browser and never saved on our servers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MagnifyingGlassIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              AI Content Analysis
            </h3>
            <CheckBadgeIcon className="w-5 h-5 text-green-500" title="API Key Configured" />
          </div>

          <form onSubmit={handleAnalyze} className="space-y-4">
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL to analyze..."
              label="Website URL"
              disabled={analyzing}
              fullWidth
            />

            <Button
              type="submit"
              disabled={!url.trim() || analyzing}
              className="w-full"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>
      </Card>

      {result && (
        <Card>
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <LinkIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <h4 className="text-lg font-medium text-slate-900 dark:text-white">
                Analysis Results
              </h4>
            </div>

            <div className="space-y-4">
              {/* URL and Title */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Analyzed URL</p>
                <p className="text-sm font-mono bg-slate-100 dark:bg-slate-800 rounded px-3 py-2 break-all">
                  {result.url}
                </p>
                {result.content_extraction.title && (
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-2">
                    {result.content_extraction.title}
                  </p>
                )}
              </div>

              {/* Classification */}
              <div className={cn("p-4 rounded-lg border flex items-center space-x-3", getClassificationColor(result.ai_analysis.classification))}>
                {getClassificationIcon(result.ai_analysis.classification)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">
                      {formatClassification(result.ai_analysis.classification)}
                    </h5>
                    <span className="text-sm font-mono">
                      {result.ai_analysis.confidence_score}% confidence
                    </span>
                  </div>
                  {result.ai_analysis.reasoning && (
                    <p className="text-sm mt-1 opacity-90">
                      {result.ai_analysis.reasoning}
                    </p>
                  )}
                </div>
              </div>

              {/* Indicators */}
              {(result.ai_analysis.ai_indicators.length > 0 || result.ai_analysis.human_indicators.length > 0) && (
                <div className="grid md:grid-cols-2 gap-4">
                  {result.ai_analysis.ai_indicators.length > 0 && (
                    <div>
                      <h6 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                        AI Indicators ({result.ai_analysis.ai_indicators.length})
                      </h6>
                      <div className="space-y-1">
                        {result.ai_analysis.ai_indicators.map((indicator, index) => (
                          <div key={index} className="text-xs bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                            {indicator}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {result.ai_analysis.human_indicators.length > 0 && (
                    <div>
                      <h6 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                        Human Indicators ({result.ai_analysis.human_indicators.length})
                      </h6>
                      <div className="space-y-1">
                        {result.ai_analysis.human_indicators.map((indicator, index) => (
                          <div key={index} className="text-xs bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                            {indicator}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Content Info */}
              <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 border-t pt-3">
                <span className="flex items-center space-x-1">
                  <ClockIcon className="w-3 h-3" />
                  <span>{new Date(result.ai_analysis.analysis_timestamp).toLocaleString()}</span>
                </span>
                <span>{result.content_extraction.word_count} words analyzed</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ContentAnalyzer; 