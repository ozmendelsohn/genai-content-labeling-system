"use client";

import React, { useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function UrlUploadForm() {
  const [urls, setUrls] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    if (!urls.trim()) {
      setMessage('Please enter at least one URL.');
      setIsLoading(false);
      return;
    }

    const formData = new URLSearchParams();
    formData.append('urls_list', urls);

    const attemptSubmission = async (attempt: number = 1): Promise<void> => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/upload_urls`, {
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
            throw new Error('Too many requests. Please wait a moment before uploading again.');
          } else if (response.status === 503) {
            throw new Error('Upload service temporarily unavailable. Please try again in a moment.');
          } else if (response.status >= 500) {
            throw new Error('Server error occurred. This has been logged and will be investigated.');
          } else {
            throw new Error(result.detail || result.message || 'Failed to upload URLs. Status: ' + response.status);
          }
        }

        setMessage(result.message || 'URLs submitted successfully!');
        setUrls(''); // Clear the textarea on success
        setIsLoading(false);
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
          setMessage('An unknown error occurred.');
        }
        console.error('Upload error:', error);
        setIsLoading(false);
      }
    };

    await attemptSubmission();
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-gray-800 shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-6 text-center text-white">Upload Website URLs</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="urls" className="block text-sm font-medium text-gray-300 mb-1">
            Enter URLs (one per line):
          </label>
          <textarea
            id="urls"
            name="urls"
            rows={10}
            className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 shadow-sm-light"
            placeholder="http://example.com/article1\nhttps://another.example/blog-post"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            required
            disabled={isLoading}
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="inline-flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </span>
          ) : 'Upload URLs'}
        </button>
      </form>
      {message && (
        <div className={`mt-4 p-3 text-sm text-center rounded-md border ${
          message.startsWith('Error:') || message.includes('Failed')
            ? 'text-red-400 bg-red-900/20 border-red-800'
            : message.includes('Retrying')
            ? 'text-yellow-400 bg-yellow-900/20 border-yellow-800'
            : 'text-green-400 bg-green-900/20 border-green-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
} 