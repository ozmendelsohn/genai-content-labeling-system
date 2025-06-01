/**
 * Labeler Task Page
 * 
 * Page for labelers to view and classify website content as AI-generated
 * or human-created with detailed indicators and confidence scoring.
 */

'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TaskView from '@/components/labeler/TaskView';

function LabelerTaskContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Content Labeling</h1>
              <p className="text-slate-600 dark:text-slate-400">Analyze and classify web content for AI detection</p>
            </div>
          </div>
        </div>

        {/* Task View Component */}
        <TaskView />
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