"use client";

import React, { useState, useEffect } from 'react';
import LabelingForm from './LabelingForm';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface TaskDataFromAPI {
  website_id: number; // Assuming backend sends number
  website_url: string;
  user_id: number; // Assuming backend sends number
  task_start_time: string; // ISO string
  // Potentially other fields like error messages if no task is available
  message_title?: string;
  message_body?: string;
}

// Internal state for the task might be slightly different or include more
interface Task {
  websiteId: string; // Keep as string for consistency if used as key/id
  url: string;
  userId: string;
  taskStartTime: string;
}

export default function TaskView() {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLabelerId, setCurrentLabelerId] = useState<string>('2'); // Default or fetched user ID

  const fetchTask = async () => {
    if (!currentLabelerId.trim()) {
      setError("Please enter a valid Labeler ID.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setTask(null); // Clear previous task

    const attemptFetch = async (attempt: number = 1): Promise<void> => {
      try {
        const response = await fetch(`${API_BASE_URL}/labeler/task?user_id=${currentLabelerId}`);
        
        // Handle different response types
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          // Fallback for non-JSON responses
          const text = await response.text();
          throw new Error('Server returned non-JSON response: ' + text.substring(0, 100));
        }

        if (!response.ok) {
          // Handle specific error status codes with user-friendly messages
          if (response.status === 404) {
            throw new Error('Task service not found. Please check if the backend is running.');
          } else if (response.status === 429) {
            throw new Error('Too many requests. Please wait a moment before requesting another task.');
          } else if (response.status === 503) {
            throw new Error('Task service temporarily unavailable. Please try again in a moment.');
          } else if (response.status >= 500) {
            throw new Error('Server error occurred. Please try again or contact support if this persists.');
          } else {
            throw new Error(data.message_body || data.detail || 'Failed to fetch task. Status: ' + response.status);
          }
        }

        // Check if a task was actually returned or if it's a message like "No tasks"
        if (data.message_title && data.message_title === "No Tasks") {
          setError(data.message_body || "No tasks available at the moment. Please check back later.");
          setTask(null);
        } else if (data.website_id && data.website_url) {
          setTask({
            websiteId: String(data.website_id),
            url: data.website_url,
            userId: String(data.user_id),
            taskStartTime: data.task_start_time
          });
        } else {
          // Handle unexpected response structure
          throw new Error('Received unexpected data structure for task.');
        }

        setIsLoading(false);
      } catch (err) {
        if (err instanceof Error) {
          // Check if this is a network error that might benefit from retry
          const isNetworkError = err.message.includes('fetch') || 
                                 err.message.includes('network') ||
                                 err.message.includes('503') ||
                                 err.name === 'TypeError';
          
          if (isNetworkError && attempt < 3) {
            // Wait before retrying (exponential backoff)
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            setError(`Connection issue detected. Retrying in ${delay/1000} seconds... (Attempt ${attempt}/3)`);
            
            setTimeout(() => {
              attemptFetch(attempt + 1);
            }, delay);
            return;
          }
          
          setError(err.message);
        } else {
          setError('An unknown error occurred while fetching the task.');
        }
        setTask(null);
        console.error('Fetch task error:', err);
        setIsLoading(false);
      }
    };

    await attemptFetch();
  };

  return (
    <div className="space-y-6">
      {!task && !isLoading && (
        <div className="text-center p-6 bg-gray-800 shadow-md rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-white">Get Labeling Task</h2>
          {error && (
            <div className={`mb-4 p-3 rounded-md border text-sm ${
              error.includes('Connection issue') || error.includes('Retrying')
                ? 'text-yellow-400 bg-yellow-900/20 border-yellow-800'
                : error.includes('No tasks available')
                ? 'text-blue-400 bg-blue-900/20 border-blue-800'
                : 'text-red-400 bg-red-900/20 border-red-800'
            }`}>
              {error}
            </div>
          )}
          <div className="mb-4 max-w-xs mx-auto">
            <label htmlFor="userIdInput" className="block text-sm font-medium text-gray-300 mb-1">
              Enter Your Labeler ID (e.g., 2, 3, 4):
            </label>
            <input 
              type="text"
              id="userIdInput" // Changed id to avoid conflict if LabelingForm also has userId
              value={currentLabelerId}
              onChange={(e) => setCurrentLabelerId(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter User ID"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading && currentLabelerId.trim()) {
                  fetchTask();
                }
              }}
            />
          </div>
          <button
            onClick={fetchTask}
            disabled={!currentLabelerId.trim() || isLoading}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-md disabled:opacity-50 transition duration-150 ease-in-out"
          >
            {isLoading ? (
              <span className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Requesting...
              </span>
            ) : 'Request New Task'}
          </button>
        </div>
      )}
      {isLoading && (
        <div className="text-center p-6 text-lg text-gray-300">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading task...
          </div>
        </div>
      )}
      
      {task && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-[calc(100vh-200px)]">
            <h2 className="text-xl font-semibold mb-2 text-white">Website to Label:</h2>
            <p className="mb-2 text-sm text-gray-400 truncate">
              Viewing: <a href={task.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{task.url}</a>
            </p>
            <iframe
              src={task.url}
              title="Website Content"
              className="w-full h-full border border-gray-700 rounded-md bg-white"
              onError={() => {
                setError("Failed to load website content. The URL might not support embedding.");
              }}
              // sandbox="allow-scripts allow-same-origin" // Consider sandbox attributes for security
            ></iframe>
          </div>
          <div className="md:col-span-1 bg-gray-800 p-4 rounded-lg shadow">
            <LabelingForm task={task} onSubmitSuccess={() => { setTask(null); fetchTask();}} currentLabelerId={currentLabelerId} />
          </div>
        </div>
      )}
    </div>
  );
} 