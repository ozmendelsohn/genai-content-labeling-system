"use client";

import React, { useState, useEffect } from 'react';

// Dummy type for task data - replace with actual type from API
interface TaskData {
  websiteId: string;
  url: string; // Included for context, though LabelingForm might only need websiteId
}

interface LabelingFormProps {
  task: TaskData;
  onSubmitSuccess: () => void; // Callback to refresh task or give feedback
}

// Simplified checklist items - these should ideally come from a config or API
const aiIndicators = [
  { id: 'ai-1', label: 'Repetitive phrasing' },
  { id: 'ai-2', label: 'Overly formal tone' },
  { id: 'ai-3', label: 'Lacks personal anecdotes' },
  { id: 'ai-4', label: 'Unusual sentence structures' },
  { id: 'ai-5', label: 'Many facts, no deep insights' },
];

const humanIndicators = [
  { id: 'h-1', label: 'Personal voice/style' },
  { id: 'h-2', label: 'Includes personal stories/opinions' },
  { id: 'h-3', label: 'Natural, varied language' },
  { id: 'h-4', label: 'Occasional typos/errors' },
  { id: 'h-5', label: 'Clear emotional expression' },
];

export default function LabelingForm({ task, onSubmitSuccess }: LabelingFormProps) {
  const [labelValue, setLabelValue] = useState('');
  const [tags, setTags] = useState('');
  const [selectedAiIndicators, setSelectedAiIndicators] = useState<string[]>([]);
  const [selectedHumanIndicators, setSelectedHumanIndicators] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Start timer when a new task is loaded
    setStartTime(new Date());
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

    const submissionData = {
      website_id: task.websiteId,
      // user_id: fetched or stored user ID - to be implemented
      label_value: labelValue,
      tags_str: tags,
      ai_indicators: selectedAiIndicators,
      human_indicators: selectedHumanIndicators,
      task_start_time: startTime.toISOString(),
      submission_time: new Date().toISOString(),
    };

    console.log('Submitting label:', submissionData);
    // Example API call structure (uncomment and adapt when backend is ready):
    /*
    try {
      const response = await fetch('/api/labeler/submit_label', { // Adjust API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization headers if needed (e.g., for user_id)
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit label');
      }

      const result = await response.json();
      setMessage(result.message || 'Label submitted successfully!');
      onSubmitSuccess(); // Trigger fetching a new task or other success actions
    } catch (error) {
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('An unknown error occurred during submission.');
      }
      console.error('Submission error:', error);
    }
    */
    setMessage('Label submitted successfully (simulated)!');
    setIsSubmitting(false);
    onSubmitSuccess(); // Simulate success and fetch new task
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-3">Label This Content</h3>
      
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
        />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-300 mb-1">AI Content Indicators:</p>
        <div className="space-y-1">
          {aiIndicators.map(indicator => (
            <label key={indicator.id} className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedAiIndicators.includes(indicator.id)}
                onChange={() => handleIndicatorChange(indicator.id, 'ai', setSelectedAiIndicators)}
                className="form-checkbox text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-300 text-sm">{indicator.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-300 mb-1">Human Content Indicators:</p>
        <div className="space-y-1">
          {humanIndicators.map(indicator => (
            <label key={indicator.id} className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedHumanIndicators.includes(indicator.id)}
                onChange={() => handleIndicatorChange(indicator.id, 'human', setSelectedHumanIndicators)}
                className="form-checkbox text-pink-500 bg-gray-700 border-gray-600 rounded focus:ring-pink-500"
              />
              <span className="text-gray-300 text-sm">{indicator.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button 
        type="submit"
        disabled={isSubmitting || !labelValue}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 transition duration-150 ease-in-out"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Label'}
      </button>

      {message && (
        <p className={`mt-3 text-sm text-center ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </p>
      )}
    </form>
  );
} 