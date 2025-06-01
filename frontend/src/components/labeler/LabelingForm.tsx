"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApiKey } from '@/contexts/ApiKeyContext';
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
  const { apiKey } = useApiKey();
  
  // State for dynamically loaded indicators
  const [aiIndicators, setAiIndicators] = useState<IndicatorItem[]>(defaultAiIndicators);
  const [humanIndicators, setHumanIndicators] = useState<IndicatorItem[]>(defaultHumanIndicators);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  
  // State for AI pre-selection
  const [isPreselecting, setIsPreselecting] = useState(false);
  const [preselectionMessage, setPreselectionMessage] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [autoAnalysisStarted, setAutoAnalysisStarted] = useState(false);

  // Additional state for the new UI design
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // Filter indicators based on search term
  const filterIndicators = (indicators: IndicatorItem[], searchTerm: string) => {
    if (!searchTerm) return indicators;
    return indicators.filter(indicator => 
      indicator.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Group indicators by category
  const groupIndicatorsByCategory = (indicators: IndicatorItem[]) => {
    return indicators.reduce((groups, indicator) => {
      const category = (indicator as any).category || 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(indicator);
      return groups;
    }, {} as Record<string, IndicatorItem[]>);
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Category display names and icons
  const categoryInfo = {
    content_quality: { name: "Content Quality", icon: "📝", color: "blue" },
    writing_style: { name: "Writing Style", icon: "✍️", color: "purple" },
    content_structure: { name: "Content Structure", icon: "📊", color: "indigo" },
    technical: { name: "Technical & Links", icon: "🔧", color: "gray" },
    author_credibility: { name: "Author & Credibility", icon: "👤", color: "yellow" },
    domain_branding: { name: "Domain & Branding", icon: "🎭", color: "pink" },
    engagement: { name: "Engagement", icon: "💬", color: "green" },
    visual_media: { name: "Visual & Media", icon: "🖼️", color: "red" },
    content_duplication: { name: "Content Duplication", icon: "📋", color: "orange" },
    transparency: { name: "Transparency", icon: "🤖", color: "cyan" },
    design_branding: { name: "Design & Branding", icon: "🎨", color: "violet" },
    content_organization: { name: "Content Organization", icon: "📅", color: "emerald" },
    other: { name: "Other", icon: "📌", color: "slate" }
  };

  // Load configuration on component mount
  useEffect(() => {
    const loadIndicators = async () => {
      try {
        await loadConfig(); // Ensure config is loaded
        const configAiIndicators = getConfigValue('labeling.ai_indicators', defaultAiIndicators);
        const configHumanIndicators = getConfigValue('labeling.human_indicators', defaultHumanIndicators);
        
        console.log('Loaded AI indicators count:', configAiIndicators.length);
        console.log('Loaded Human indicators count:', configHumanIndicators.length);
        console.log('First AI indicator:', configAiIndicators[0]);
        
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
    
    if (!apiKey) {
      setPreselectionMessage('Gemini API key required for AI analysis. Please configure your API key first.');
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
        body: JSON.stringify({
          api_key: apiKey
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || result.message || 'Failed to get AI pre-selection');
      }

      if (result.success) {
        // Pre-select the indicators suggested by AI - updated structure
        const aiIndicatorIds = result.preselected_ai_indicators || [];
        const humanIndicatorIds = result.preselected_human_indicators || [];
        
        setSelectedAiIndicators(aiIndicatorIds);
        setSelectedHumanIndicators(humanIndicatorIds);
        
        // Store AI analysis data for display
        setAiAnalysis({
          classification: result.classification,
          confidence_score: result.confidence_score,
          reasoning: result.reasoning
        });
        
        // Note: We don't auto-set the label value to avoid biasing the user's decision
        
        setPreselectionMessage(`AI analysis complete! Relevant indicators have been pre-selected to help speed up your review.`);
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

  // Component for rendering a single indicator tag
  const IndicatorTag = ({ 
    indicator, 
    isSelected, 
    onToggle, 
    type 
  }: { 
    indicator: IndicatorItem, 
    isSelected: boolean, 
    onToggle: () => void, 
    type: 'ai' | 'human' 
  }) => {
    const baseClasses = "inline-flex items-center px-3 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 border";
    const selectedClasses = type === 'ai' 
      ? "bg-red-500/20 border-red-500 text-red-300 shadow-lg"
      : "bg-green-500/20 border-green-500 text-green-300 shadow-lg";
    const unselectedClasses = "bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50 hover:border-gray-500";
    
    return (
      <button
        type="button"
        onClick={onToggle}
        className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses}`}
        disabled={isSubmitting || isLoadingConfig}
      >
        <span className="mr-2">{type === 'ai' ? '🤖' : '👥'}</span>
        {indicator.label}
        {isSelected && <span className="ml-2">✓</span>}
      </button>
    );
  };

  // Component for rendering category sections
  const CategorySection = ({ 
    category, 
    indicators, 
    type, 
    selectedIndicators, 
    onToggleIndicator 
  }: {
    category: string,
    indicators: IndicatorItem[],
    type: 'ai' | 'human',
    selectedIndicators: string[],
    onToggleIndicator: (id: string) => void
  }) => {
    const filteredIndicators = filterIndicators(indicators, searchTerm);
    const selectedInCategory = filteredIndicators.filter(ind => selectedIndicators.includes(ind.id));
    const categoryData = categoryInfo[category as keyof typeof categoryInfo] || categoryInfo.other;
    const isExpanded = expandedSections[`${type}-${category}`];
    
    if (showOnlySelected && selectedInCategory.length === 0) {
      return null;
    }

    const displayIndicators = showOnlySelected ? selectedInCategory : filteredIndicators;
    
    if (displayIndicators.length === 0) {
      return null;
    }

    return (
      <div className="border border-gray-600 rounded-lg bg-gray-800/50">
        <button
          type="button"
          onClick={() => toggleSection(`${type}-${category}`)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl">{categoryData.icon}</span>
            <div>
              <h4 className="text-white font-medium">{categoryData.name}</h4>
              <p className="text-xs text-gray-400">
                {selectedInCategory.length}/{displayIndicators.length} selected
              </p>
            </div>
          </div>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isExpanded && (
          <div className="p-4 pt-0 border-t border-gray-600">
            <div className="flex flex-wrap gap-2">
              {displayIndicators.map(indicator => (
                <IndicatorTag
                  key={indicator.id}
                  indicator={indicator}
                  isSelected={selectedIndicators.includes(indicator.id)}
                  onToggle={() => onToggleIndicator(indicator.id)}
                  type={type}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">Label This Content</h3>
      
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
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

      {/* Selection Summary */}
      {(selectedAiIndicators.length > 0 || selectedHumanIndicators.length > 0) && (
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-300 mb-2">Selection Summary</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-red-400">🤖 AI Indicators:</span>
              <span className="text-white font-medium">{selectedAiIndicators.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">👥 Human Indicators:</span>
              <span className="text-white font-medium">{selectedHumanIndicators.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Total Selected:</span>
              <span className="text-white font-bold">{selectedAiIndicators.length + selectedHumanIndicators.length}</span>
            </div>
          </div>
        </div>
      )}
      
      {isLoadingConfig && (
        <div className="text-center p-4 text-sm text-gray-400">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 718-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading comprehensive indicators...
          </div>
        </div>
      )}
      
      {/* Content Indicators Section - Completely Redesigned */}
      <div className="bg-gray-800 rounded-lg border border-gray-600 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">🔍 Content Analysis</h3>
          <div className="text-sm text-gray-400">
            Total: {selectedAiIndicators.length + selectedHumanIndicators.length} selected
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search indicators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting || isLoadingConfig}
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowOnlySelected(!showOnlySelected)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showOnlySelected 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              disabled={isSubmitting || isLoadingConfig}
            >
              {showOnlySelected ? '✓ Selected Only' : 'Show All'}
            </button>
            
            <button
              type="button"
              onClick={() => {
                // Expand all sections with content
                const newExpanded: Record<string, boolean> = {};
                ['ai', 'human'].forEach(type => {
                  const indicators = type === 'ai' ? aiIndicators : humanIndicators;
                  Object.keys(groupIndicatorsByCategory(indicators)).forEach(category => {
                    newExpanded[`${type}-${category}`] = true;
                  });
                });
                setExpandedSections(newExpanded);
              }}
              className="px-4 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-lg text-sm font-medium transition-all"
              disabled={isSubmitting || isLoadingConfig}
            >
              Expand All
            </button>
          </div>
        </div>

        {/* Tabbed Interface */}
        <div className="space-y-6">
          {/* AI Indicators Tab */}
          <div>
            <div className="flex items-center justify-between mb-4 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
              <h4 className="text-lg font-semibold text-red-400 flex items-center">
                🤖 AI Content Indicators
                <span className="ml-2 text-sm text-gray-400">({selectedAiIndicators.length} selected)</span>
              </h4>
              {!isLoadingConfig && aiIndicators.length > defaultAiIndicators.length && (
                <span className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded">Enhanced Config</span>
              )}
            </div>
            
            <div className="space-y-3">
              {Object.entries(groupIndicatorsByCategory(aiIndicators)).map(([category, indicators]) => (
                <CategorySection
                  key={category}
                  category={category}
                  indicators={indicators}
                  type="ai"
                  selectedIndicators={selectedAiIndicators}
                  onToggleIndicator={(id) => handleIndicatorChange(id, 'ai', setSelectedAiIndicators)}
                />
              ))}
            </div>
          </div>

          {/* Human Indicators Tab */}
          <div>
            <div className="flex items-center justify-between mb-4 p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
              <h4 className="text-lg font-semibold text-green-400 flex items-center">
                👥 Human Content Indicators
                <span className="ml-2 text-sm text-gray-400">({selectedHumanIndicators.length} selected)</span>
              </h4>
              {!isLoadingConfig && humanIndicators.length > defaultHumanIndicators.length && (
                <span className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded">Enhanced Config</span>
              )}
            </div>
            
            <div className="space-y-3">
              {Object.entries(groupIndicatorsByCategory(humanIndicators)).map(([category, indicators]) => (
                <CategorySection
                  key={category}
                  category={category}
                  indicators={indicators}
                  type="human"
                  selectedIndicators={selectedHumanIndicators}
                  onToggleIndicator={(id) => handleIndicatorChange(id, 'human', setSelectedHumanIndicators)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overall Label Section */}
      <div className="bg-gray-800 rounded-lg border border-gray-600 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">📝 Your Final Classification</h3>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setLabelValue('GenAI')}
            className={`flex-1 py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 ${
              labelValue === 'GenAI'
                ? 'bg-red-600 text-white border-2 border-red-500 shadow-lg transform scale-105'
                : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600 hover:border-gray-500 hover:scale-102'
            }`}
            disabled={isSubmitting || isLoadingConfig}
          >
            🤖 GenAI
          </button>
          <button
            type="button"
            onClick={() => setLabelValue('Not GenAI')}
            className={`flex-1 py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 ${
              labelValue === 'Not GenAI'
                ? 'bg-green-600 text-white border-2 border-green-500 shadow-lg transform scale-105'
                : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600 hover:border-gray-500 hover:scale-102'
            }`}
            disabled={isSubmitting || isLoadingConfig}
          >
            👥 Not GenAI
          </button>
        </div>
      </div>

      {/* Custom Tags Section */}
      <div className="bg-gray-800 rounded-lg border border-gray-600 p-4">
        <label htmlFor="tags" className="block text-lg font-semibold text-white mb-3">
          🏷️ Custom Tags (optional)
        </label>
        <input
          type="text"
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          placeholder="e.g., news, blog, poorly written, suspicious domain"
          disabled={isSubmitting || isLoadingConfig}
        />
        <p className="text-xs text-gray-400 mt-2">Add comma-separated tags to help categorize this content</p>
      </div>

      {/* Submit Button */}
      <button 
        type="submit"
        disabled={isSubmitting || !labelValue || isLoadingConfig}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting Your Analysis...
          </span>
        ) : isLoadingConfig ? 'Loading...' : '🚀 Submit Label'}
      </button>

      {message && (
        <div className={`mt-4 p-4 text-sm text-center rounded-lg border ${
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