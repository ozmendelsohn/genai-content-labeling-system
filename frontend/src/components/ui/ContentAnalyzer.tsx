/**
 * Content Analyzer Component
 * 
 * A component for analyzing web content using Gemini AI and displaying
 * AI/Human classification results with confidence scores and indicators.
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/design-system';
import Input from './Input';
import Button from './Button';
import { Card } from './Card';
import { 
  MagnifyingGlassIcon, 
  SparklesIcon, 
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface AIAnalysisResult {
  classification: 'ai_generated' | 'human_created' | 'uncertain';
  confidence_score: number;
  ai_indicators: string[];
  human_indicators: string[];
  reasoning: string;
  analysis_timestamp: string;
  model_used: string;
  word_count_analyzed: number;
  error?: string;
}

interface ContentExtractionResult {
  title: string;
  description: string;
  content_text: string;
  word_count: number;
  error?: string;
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
  hasApiKey?: boolean;
}

const ContentAnalyzer: React.FC<ContentAnalyzerProps> = ({
  className,
  onContentAnalyzed,
  hasApiKey = false
}) => {
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<CompleteAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !hasApiKey) return;

    try {
      setAnalyzing(true);
      setError(null);
      setResult(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/ai/analyze-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          url: url.trim(),
          use_ai_analysis: true 
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
        <div className="space-y-4">
          {/* Content Information */}
          <Card>
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <DocumentTextIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h4 className="text-lg font-medium text-slate-900 dark:text-white">
                  Content Information
                </h4>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Title
                  </label>
                  <p className="text-sm text-slate-900 dark:text-white">
                    {result.content_extraction.title || 'No title found'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <p className="text-sm text-slate-900 dark:text-white">
                    {result.content_extraction.description || 'No description found'}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                  <span>Words: {result.content_extraction.word_count}</span>
                  <span>•</span>
                  <span className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    {new Date(result.ai_analysis.analysis_timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* AI Analysis Results */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-slate-900 dark:text-white">
                  AI Analysis Results
                </h4>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {result.ai_analysis.model_used}
                </span>
              </div>

              {/* Classification Result */}
              <div className={cn(
                "p-4 rounded-lg border mb-4",
                getClassificationColor(result.ai_analysis.classification)
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getClassificationIcon(result.ai_analysis.classification)}
                    <span className="font-medium">
                      {formatClassification(result.ai_analysis.classification)}
                    </span>
                  </div>
                  <div className="text-sm font-medium">
                    {result.ai_analysis.confidence_score}% confidence
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  AI Reasoning
                </label>
                <p className="text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                  {result.ai_analysis.reasoning}
                </p>
              </div>

              {/* Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.ai_analysis.ai_indicators.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                      AI Indicators
                    </label>
                    <ul className="space-y-1">
                      {result.ai_analysis.ai_indicators.map((indicator, index) => (
                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300 flex items-start">
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {indicator}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.ai_analysis.human_indicators.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                      Human Indicators
                    </label>
                    <ul className="space-y-1">
                      {result.ai_analysis.human_indicators.map((indicator, index) => (
                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300 flex items-start">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {indicator}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ContentAnalyzer; 