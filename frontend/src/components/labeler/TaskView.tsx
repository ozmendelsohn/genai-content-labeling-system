"use client";

import React, { useState, useEffect } from 'react';
import LabelingForm from './LabelingForm';

// Dummy type for task data - replace with actual type from API
interface TaskData {
  websiteId: string;
  url: string;
  // other task details...
}

export default function TaskView() {
  const [task, setTask] = useState<TaskData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('2'); // Default or fetched user ID

  const fetchTask = async () => {
    setIsLoading(true);
    setError(null);
    // Simulate API call to /labeler/task?user_id=<user_id>
    // Replace with actual fetch call when backend is ready
    console.log(`Fetching task for user_id: ${userId}`);
    try {
      // const response = await fetch(`/api/labeler/task?user_id=${userId}`); // Adjust API endpoint
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || 'Failed to fetch task');
      // }
      // const data: TaskData = await response.json();
      // setTask(data);

      // Simulated delay and data
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockTask: TaskData = {
        websiteId: `site-${Math.floor(Math.random() * 1000)}`,
        url: 'https://example.com/sample-article-for-labeling',
      };
      setTask(mockTask);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching the task.');
      }
      setTask(null);
      console.error('Fetch task error:', err);
    }
    setIsLoading(false);
  };

  // Effect to fetch a task when the component mounts or userId changes
  // For now, let's add a button to trigger it manually as per README description
  // useEffect(() => {
  //  fetchTask();
  // }, [userId]);

  if (isLoading) {
    return <p className="text-center text-lg">Loading task...</p>;
  }

  if (error) {
    return (
      <div className="text-center text-red-400">
        <p>Error: {error}</p>
        <button
          onClick={fetchTask}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!task ? (
        <div className="text-center">
          <p className="mb-4 text-lg">No task assigned. Click below to get a new task.</p>
          {/* Simple User ID input for PoC, can be improved with actual auth later */}
          <div className="mb-4 max-w-xs mx-auto">
            <label htmlFor="userId" className="block text-sm font-medium text-gray-300 mb-1">
              Enter Your Labeler ID (e.g., 2, 3, 4):
            </label>
            <input 
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400"
              placeholder="Enter User ID"
            />
          </div>
          <button
            onClick={fetchTask}
            disabled={!userId.trim()}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-md disabled:opacity-50"
          >
            Request New Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-[calc(100vh-200px)]">
            <h2 className="text-xl font-semibold mb-2 text-white">Website to Label:</h2>
            <p className="mb-2 text-sm text-gray-400">
              Viewing: <a href={task.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{task.url}</a>
            </p>
            <iframe
              src={task.url}
              title="Website Content"
              className="w-full h-full border border-gray-700 rounded-md bg-white"
              // sandbox="allow-scripts allow-same-origin" // Consider sandbox attributes for security
            ></iframe>
          </div>
          <div className="md:col-span-1 bg-gray-800 p-4 rounded-lg shadow">
            <LabelingForm task={task} onSubmitSuccess={fetchTask} />
          </div>
        </div>
      )}
    </div>
  );
} 