"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { loadConfig, getConfigValue, IndicatorItem } from '../../lib/config';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Updated interface to match the one from TaskView.tsx
interface Task {
  websiteId: string;
  url: string;
  userId: string;
  taskStartTime: string;
}

interface LabelingFormProps {
  task: Task;
  onSubmitSuccess: () => void; // Callback to refresh task or give feedback
  currentLabelerId: string; // Added to ensure we use the current user ID
}

// Default indicators as fallback
const defaultAiIndicators: IndicatorItem[] = [
  { id: 'ai-1', label: 'Repetitive phrasing' },
  { id: 'ai-2', label: 'Overly formal tone' },
  { id: 'ai-3', label: 'Lacks personal anecdotes' },
  { id: 'ai-4', label: 'Unusual sentence structures' },
  { id: 'ai-5', label: 'Many facts, no deep insights' },
];

const defaultHumanIndicators: IndicatorItem[] = [
  { id: 'h-1', label: 'Personal voice/style' },
  { id: 'h-2', label: 'Includes personal stories/opinions' },
  { id: 'h-3', label: 'Natural, varied language' },
  { id: 'h-4', label: 'Occasional typos/errors' },
  { id: 'h-5', label: 'Clear emotional expression' },
];

export default function LabelingForm({ task, onSubmitSuccess, currentLabelerId }: LabelingFormProps) {
  const [labelValue, setLabelValue] = useState('');
  const [tags, setTags] = useState('');
  const [selectedAiIndicators, setSelectedAiIndicators] = useState<string[]>([]);
  const [selectedHumanIndicators, setSelectedHumanIndicators] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token } = useAuth();
  
  // State for dynamically loaded indicators
  const [aiIndicators, setAiIndicators] = useState<IndicatorItem[]>(defaultAiIndicators);
  const [humanIndicators, setHumanIndicators] = useState<IndicatorItem[]>(defaultHumanIndicators);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  
  // State for AI pre-selection
  const [isPreselecting, setIsPreselecting] = useState(false);
  const [preselectionMessage, setPreselectionMessage] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [autoAnalysisStarted, setAutoAnalysisStarted] = useState(false);

  // Load configuration on component mount
  useEffect(() => {
    const loadIndicators = async () => {
      try {
        await loadConfig(); // Ensure config is loaded
        const configAiIndicators = getConfigValue('labeling.ai_indicators', defaultAiIndicators);
        const configHumanIndicators = getConfigValue('labeling.human_indicators', defaultHumanIndicators);
        
        setAiIndicators(configAiIndicators);
        setHumanIndicators(configHumanIndicators);
      } catch (error) {
        console.warn('Failed to load configuration, using defaults:', error);
        // Keep default indicators if config fails to load
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadIndicators();
  }, []);

  useEffect(() => {
    // Start timer when a new task is loaded
    // If task already has a taskStartTime from API, use that instead
    setStartTime(task.taskStartTime ? new Date(task.taskStartTime) : new Date());
    
    // Reset form fields for the new task
    setLabelValue('');
    setTags('');
    setSelectedAiIndicators([]);
    setSelectedHumanIndicators([]);
    setMessage('');
    setAutoAnalysisStarted(false);
    setPreselectionMessage('');
    setAiAnalysis(null);
    
    // Automatically run AI analysis when task loads and config is ready
    if (!isLoadingConfig && token && task.url) {
      setAutoAnalysisStarted(true);
      setPreselectionMessage('Auto-running AI analysis for new task...');
      
      // Small delay to ensure form is ready
      const timer = setTimeout(() => {
        handleAIPreselection();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [task, isLoadingConfig, token]); // Reset when task changes

  const handleIndicatorChange = (
    id: string,
    type: 'ai' | 'human',
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAIPreselection = async () => {
    if (!token) {
      setPreselectionMessage('Authentication required for AI analysis');
      return;
    }

    setIsPreselecting(true);
    setPreselectionMessage('Analyzing content with AI...');
    setAiAnalysis(null);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/preselect-indicators`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || result.message || 'Failed to get AI pre-selection');
      }

      if (result.success) {
        // Pre-select the indicators suggested by AI
        const aiIndicatorIds = result.preselected_indicators?.ai_indicators || [];
        const humanIndicatorIds = result.preselected_indicators?.human_indicators || [];
        
        setSelectedAiIndicators(aiIndicatorIds);
        setSelectedHumanIndicators(humanIndicatorIds);
        setAiAnalysis(result.ai_analysis);
        
        // Note: We don't auto-set the label value to avoid biasing the user's decision
        
        setPreselectionMessage(`AI analysis complete! Pre-selected ${aiIndicatorIds.length} AI indicators and ${humanIndicatorIds.length} human indicators`);
      } else {
        setPreselectionMessage('AI analysis completed but no indicators were pre-selected');
      }
    } catch (error) {
      console.error('AI pre-selection error:', error);
      setPreselectionMessage(`AI pre-selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPreselecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    if (!labelValue) {
      setMessage('Please select a label (GenAI / Not GenAI).');
      setIsSubmitting(false);
      return;
    }
    if (!startTime) {
      setMessage('Task start time not recorded. Please refresh.');
      setIsSubmitting(false);
      return;
    }

    // Convert selected indicators to comma-separated strings
    const aiIndicatorsStr = selectedAiIndicators.join(',');
    const humanIndicatorsStr = selectedHumanIndicators.join(',');

    // Create form data using URLSearchParams for application/x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('website_id', task.websiteId);
    formData.append('user_id', currentLabelerId); // Use the current labeler ID passed as prop
    formData.append('label_value', labelValue);
    formData.append('tags_str', tags);
    formData.append('ai_indicators_str', aiIndicatorsStr);
    formData.append('human_indicators_str', humanIndicatorsStr);
    
    // The backend expects task_start_time as form data
    // Convert the Date to ISO string if it's not already
    const taskStartTimeStr = typeof task.taskStartTime === 'string' 
      ? task.taskStartTime 
      : startTime.toISOString();
    formData.append('task_start_time', taskStartTimeStr);

    const attemptSubmission = async (attempt: number = 1): Promise<void> => {
      try {
        const response = await fetch(`${API_BASE_URL}/labeler/submit_label`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData,
        });

        // Handle different response types
        let result;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
        } else {
          // Fallback for non-JSON responses
          const text = await response.text();
          result = { message: text };
        }

        if (!response.ok) {
          // Handle specific error status codes
          if (response.status === 429) {
            throw new Error('Too many requests. Please wait a moment before submitting again.');
          } else if (response.status === 503) {
            throw new Error('Service temporarily unavailable. Please try again in a moment.');
          } else if (response.status >= 500) {
            throw new Error('Server error occurred. This has been logged and will be investigated.');
          } else {
            throw new Error(result.detail || result.message || `Failed to submit label. Status: ${response.status}`);
          }
        }

        setMessage(result.message || 'Label submitted successfully!');
        onSubmitSuccess(); // Trigger fetching a new task or other success actions
      } catch (error) {
        if (error instanceof Error) {
          // Check if this is a network error that might benefit from retry
          const isNetworkError = error.message.includes('fetch') || 
                                 error.message.includes('network') ||
                                 error.message.includes('503') ||
                                 error.name === 'TypeError';
          
          if (isNetworkError && attempt < 3) {
            // Wait before retrying (exponential backoff)
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            setMessage(`Connection issue detected. Retrying in ${delay/1000} seconds... (Attempt ${attempt}/3)`);
            
            setTimeout(() => {
              attemptSubmission(attempt + 1);
            }, delay);
            return;
          }
          
          setMessage(`Error: ${error.message}`);
        } else {
          setMessage('An unknown error occurred during submission.');
        }
        console.error('Submission error:', error);
        setIsSubmitting(false);
      }
    };

    await attemptSubmission();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-3">Label This Content</h3>
      
      {/* AI Pre-selection Section */}
      <div className="bg-gray-800 p-3 rounded-lg border border-gray-600">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-300">
            AI-Powered Analysis
            {autoAnalysisStarted && (
              <span className="ml-2 text-xs text-blue-400">(Auto-running)</span>
            )}
          </h4>
          <button
            type="button"
            onClick={handleAIPreselection}
            disabled={isPreselecting || isLoadingConfig || !token}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 transition duration-150 ease-in-out"
          >
            {isPreselecting ? (
              <span className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </span>
            ) : autoAnalysisStarted ? 'Re-run Analysis' : 'Get AI Suggestions'}
          </button>
        </div>
        
        {preselectionMessage && (
          <div className={`text-xs p-2 rounded-md border ${
            preselectionMessage.includes('failed') || preselectionMessage.includes('error')
              ? 'text-red-400 bg-red-900/20 border-red-800'
              : preselectionMessage.includes('Analyzing')
              ? 'text-yellow-400 bg-yellow-900/20 border-yellow-800'
              : 'text-green-400 bg-green-900/20 border-green-800'
          }`}>
            {preselectionMessage}
          </div>
        )}
        
        {aiAnalysis && (
          <div className="mt-2 space-y-2">
            {aiAnalysis.reasoning && (
              <div className="text-xs text-gray-300 bg-gray-900 p-2 rounded border-l-2 border-purple-500">
                <strong>AI Reasoning:</strong> {aiAnalysis.reasoning}
              </div>
            )}
          </div>
        )}
      </div>
      
      {isLoadingConfig && (
        <div className="text-center p-2 text-sm text-gray-400">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading indicators...
          </div>
        </div>
      )}
      
      <div>
        <p className="text-sm font-medium text-gray-300 mb-3">Overall Label:</p>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setLabelValue('GenAI')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
              labelValue === 'GenAI'
                ? 'bg-red-600 text-white border-2 border-red-500 shadow-lg'
                : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
            }`}
            disabled={isSubmitting || isLoadingConfig}
          >
            GenAI
          </button>
          <button
            type="button"
            onClick={() => setLabelValue('Not GenAI')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
              labelValue === 'Not GenAI'
                ? 'bg-green-600 text-white border-2 border-green-500 shadow-lg'
                : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
            }`}
            disabled={isSubmitting || isLoadingConfig}
          >
            Not GenAI
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-1">
          Custom Tags (comma-separated):
        </label>
        <input
          type="text"
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., news, blog, poorly written"
          disabled={isSubmitting || isLoadingConfig}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-300 mb-2">
          AI Content Indicators (27 total):
          {!isLoadingConfig && aiIndicators.length > defaultAiIndicators.length && (
            <span className="text-xs text-green-400 ml-1">(from config)</span>
          )}
        </p>
        <div className="space-y-2 max-h-64 overflow-y-auto bg-gray-900 p-3 rounded-lg border border-gray-700">
          {aiIndicators.map(indicator => (
            <label key={indicator.id} className="flex items-start space-x-3 cursor-pointer hover:bg-gray-800 p-2 rounded transition-colors">
              <input 
                type="checkbox" 
                checked={selectedAiIndicators.includes(indicator.id)}
                onChange={() => handleIndicatorChange(indicator.id, 'ai', setSelectedAiIndicators)}
                className="form-checkbox text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 mt-1 flex-shrink-0"
                disabled={isSubmitting || isLoadingConfig}
              />
              <span className="text-gray-300 text-sm leading-relaxed">{indicator.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-300 mb-2">
          Human Content Indicators (23 total):
          {!isLoadingConfig && humanIndicators.length > defaultHumanIndicators.length && (
            <span className="text-xs text-green-400 ml-1">(from config)</span>
          )}
        </p>
        <div className="space-y-2 max-h-64 overflow-y-auto bg-gray-900 p-3 rounded-lg border border-gray-700">
          {humanIndicators.map(indicator => (
            <label key={indicator.id} className="flex items-start space-x-3 cursor-pointer hover:bg-gray-800 p-2 rounded transition-colors">
              <input 
                type="checkbox" 
                checked={selectedHumanIndicators.includes(indicator.id)}
                onChange={() => handleIndicatorChange(indicator.id, 'human', setSelectedHumanIndicators)}
                className="form-checkbox text-pink-500 bg-gray-700 border-gray-600 rounded focus:ring-pink-500 mt-1 flex-shrink-0"
                disabled={isSubmitting || isLoadingConfig}
              />
              <span className="text-gray-300 text-sm leading-relaxed">{indicator.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button 
        type="submit"
        disabled={isSubmitting || !labelValue || isLoadingConfig}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 transition duration-150 ease-in-out"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting...
          </span>
        ) : isLoadingConfig ? 'Loading...' : 'Submit Label'}
      </button>

      {message && (
        <div className={`mt-3 p-2 text-sm text-center rounded-md border ${
          message.includes('Error') || message.includes('Failed') 
            ? 'text-red-400 bg-red-900/20 border-red-800' 
            : message.includes('Retrying')
            ? 'text-yellow-400 bg-yellow-900/20 border-yellow-800'
            : 'text-green-400 bg-green-900/20 border-green-800'
        }`}>
          {message}
        </div>
      )}
    </form>
  );
} 