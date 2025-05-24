"use client";

import React, { useState, useEffect } from 'react';
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
  
  // State for dynamically loaded indicators
  const [aiIndicators, setAiIndicators] = useState<IndicatorItem[]>(defaultAiIndicators);
  const [humanIndicators, setHumanIndicators] = useState<IndicatorItem[]>(defaultHumanIndicators);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

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
  }, [task]); // Reset when task changes

  const handleIndicatorChange = (
    id: string,
    type: 'ai' | 'human',
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
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
      
      {isLoadingConfig && (
        <div className="text-center p-2 text-sm text-gray-400">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading indicators...
          </div>
        </div>
      )}
      
      <div>
        <p className="text-sm font-medium text-gray-300 mb-1">Overall Label:</p>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="radio" 
              name="labelValue" 
              value="GenAI" 
              checked={labelValue === 'GenAI'}
              onChange={(e) => setLabelValue(e.target.value)} 
              className="form-radio text-blue-500 bg-gray-700 border-gray-600 focus:ring-blue-500"
              disabled={isSubmitting || isLoadingConfig}
            />
            <span className="text-gray-200">GenAI</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="radio" 
              name="labelValue" 
              value="Not GenAI" 
              checked={labelValue === 'Not GenAI'}
              onChange={(e) => setLabelValue(e.target.value)} 
              className="form-radio text-pink-500 bg-gray-700 border-gray-600 focus:ring-pink-500"
              disabled={isSubmitting || isLoadingConfig}
            />
            <span className="text-gray-200">Not GenAI</span>
          </label>
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
        <p className="text-sm font-medium text-gray-300 mb-1">
          AI Content Indicators:
          {!isLoadingConfig && aiIndicators.length > defaultAiIndicators.length && (
            <span className="text-xs text-green-400 ml-1">(from config)</span>
          )}
        </p>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {aiIndicators.map(indicator => (
            <label key={indicator.id} className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedAiIndicators.includes(indicator.id)}
                onChange={() => handleIndicatorChange(indicator.id, 'ai', setSelectedAiIndicators)}
                className="form-checkbox text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                disabled={isSubmitting || isLoadingConfig}
              />
              <span className="text-gray-300 text-sm">{indicator.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-300 mb-1">
          Human Content Indicators:
          {!isLoadingConfig && humanIndicators.length > defaultHumanIndicators.length && (
            <span className="text-xs text-green-400 ml-1">(from config)</span>
          )}
        </p>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {humanIndicators.map(indicator => (
            <label key={indicator.id} className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedHumanIndicators.includes(indicator.id)}
                onChange={() => handleIndicatorChange(indicator.id, 'human', setSelectedHumanIndicators)}
                className="form-checkbox text-pink-500 bg-gray-700 border-gray-600 rounded focus:ring-pink-500"
                disabled={isSubmitting || isLoadingConfig}
              />
              <span className="text-gray-300 text-sm">{indicator.label}</span>
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