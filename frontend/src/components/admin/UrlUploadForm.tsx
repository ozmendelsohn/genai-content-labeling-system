"use client";

import React, { useState } from 'react';

export default function UrlUploadForm() {
  const [urls, setUrls] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');

    // Basic validation: check if URLs are provided
    if (!urls.trim()) {
      setMessage('Please enter at least one URL.');
      return;
    }

    // Here you would typically send the URLs to the backend API
    // For now, we'll just simulate it and show a success message
    console.log('Submitting URLs:', urls.split('\n').filter(url => url.trim() !== ''));
    // Example API call structure (uncomment and adapt when backend is ready):
    /*
    try {
      const response = await fetch('/api/admin/upload_urls', { // Adjust API endpoint as needed
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls_list: urls.split('\n').filter(url => url.trim() !== '') }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload URLs');
      }

      const result = await response.json();
      setMessage(result.message || 'URLs submitted successfully!');
      setUrls(''); // Clear the textarea on success
    } catch (error) {
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('An unknown error occurred.');
      }
      console.error('Upload error:', error);
    }
    */
    setMessage('URLs submitted successfully (simulated)!');
    setUrls('');
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
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
        >
          Upload URLs
        </button>
      </form>
      {message && (
        <p className={`mt-4 text-sm text-center ${message.startsWith('Error:') ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
} 