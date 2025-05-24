/**
 * Enhanced Labeler Task Page
 * 
 * A modern labeling interface with improved UX, better visual hierarchy,
 * and comprehensive labeling tools for AI content detection.
 */

'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Icons
const TaskIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const AIIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const HumanIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const TagIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

interface LabelingData {
  aiIndicators: string[];
  humanIndicators: string[];
  classification: 'ai' | 'human' | '';
  customTags: string[];
  confidence: number;
  notes: string;
}

function LabelerTaskContent() {
  const [currentUrl] = useState('https://example.com/sample-article');
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  const [labelingData, setLabelingData] = useState<LabelingData>({
    aiIndicators: [],
    humanIndicators: [],
    classification: '',
    customTags: [],
    confidence: 50,
    notes: ''
  });

  // Simulate timer
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const aiIndicatorOptions = [
    'Repetitive patterns in text',
    'Unnatural language flow',
    'Generic or templated content',
    'Inconsistent writing style',
    'Perfect grammar without personality',
    'Lack of personal anecdotes',
    'Overly structured content',
    'Generic stock phrases'
  ];

  const humanIndicatorOptions = [
    'Personal experiences mentioned',
    'Unique writing voice',
    'Natural language variations',
    'Contextual references',
    'Emotional expressions',
    'Informal language/slang',
    'Personal opinions',
    'Cultural references'
  ];

  const handleIndicatorChange = (type: 'ai' | 'human', indicator: string, checked: boolean) => {
    setLabelingData(prev => ({
      ...prev,
      [`${type}Indicators`]: checked
        ? [...prev[`${type}Indicators` as keyof LabelingData] as string[], indicator]
        : (prev[`${type}Indicators` as keyof LabelingData] as string[]).filter(item => item !== indicator)
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !labelingData.customTags.includes(newTag.trim())) {
      setLabelingData(prev => ({
        ...prev,
        customTags: [...prev.customTags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setLabelingData(prev => ({
      ...prev,
      customTags: prev.customTags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset form and load next task
      setLabelingData({
        aiIndicators: [],
        humanIndicators: [],
        classification: '',
        customTags: [],
        confidence: 50,
        notes: ''
      });
      setTimeSpent(0);
      
      alert('Label submitted successfully! Loading next task...');
    } catch (error) {
      alert('Failed to submit label. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isFormValid = labelingData.classification && 
    (labelingData.aiIndicators.length > 0 || labelingData.humanIndicators.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-4">
                <TaskIcon />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Content Labeling</h1>
                <p className="text-slate-600 dark:text-slate-400">Analyze and classify web content for AI detection</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="info" size="sm">
                <ClockIcon />
                <span className="ml-1">{formatTime(timeSpent)}</span>
              </Badge>
              <Badge variant="primary" size="sm">Task #1247</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Website Preview */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Website Preview</h2>
                  <a 
                    href={currentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <span className="text-sm mr-1">Open in new tab</span>
                    <ExternalLinkIcon />
                  </a>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 break-all">{currentUrl}</p>
              </CardHeader>
              <CardContent>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <iframe
                    src={currentUrl}
                    className="w-full h-96 border-0"
                    title="Website Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Labeling Form */}
          <div className="space-y-6">
            {/* Classification */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Content Classification</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Select whether this content appears to be AI-generated or human-created
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setLabelingData(prev => ({ ...prev, classification: 'ai' }))}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      labelingData.classification === 'ai'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-600'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <AIIcon className={`mb-2 ${
                        labelingData.classification === 'ai' 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-slate-400'
                      }`} />
                      <span className={`font-medium ${
                        labelingData.classification === 'ai'
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        AI Generated
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => setLabelingData(prev => ({ ...prev, classification: 'human' }))}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      labelingData.classification === 'human'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <HumanIcon className={`mb-2 ${
                        labelingData.classification === 'human' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-slate-400'
                      }`} />
                      <span className={`font-medium ${
                        labelingData.classification === 'human'
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        Human Created
                      </span>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* AI Indicators */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI Indicators</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Select any indicators that suggest AI generation
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiIndicatorOptions.map((indicator) => (
                    <label key={indicator} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={labelingData.aiIndicators.includes(indicator)}
                        onChange={(e) => handleIndicatorChange('ai', indicator, e.target.checked)}
                        className="w-4 h-4 text-red-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-red-500 focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">{indicator}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Human Indicators */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Human Indicators</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Select any indicators that suggest human creation
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {humanIndicatorOptions.map((indicator) => (
                    <label key={indicator} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={labelingData.humanIndicators.includes(indicator)}
                        onChange={(e) => handleIndicatorChange('human', indicator, e.target.checked)}
                        className="w-4 h-4 text-green-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-green-500 focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">{indicator}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Confidence and Tags */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Additional Details</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Confidence Slider */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Confidence Level: {labelingData.confidence}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={labelingData.confidence}
                      onChange={(e) => setLabelingData(prev => ({ ...prev, confidence: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Custom Tags */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Custom Tags
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a custom tag..."
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        className="flex-1"
                      />
                      <Button onClick={handleAddTag} variant="outline" size="sm">
                        <TagIcon />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {labelingData.customTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={labelingData.notes}
                      onChange={(e) => setLabelingData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add any additional observations or notes..."
                      className="w-full h-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!isFormValid || isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Label & Get Next Task'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LabelerTaskPage() {
  return (
    <ProtectedRoute requiredRole="labeler">
      <LabelerTaskContent />
    </ProtectedRoute>
  );
} 