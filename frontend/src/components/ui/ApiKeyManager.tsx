/**
 * API Key Manager Component
 * 
 * A component for managing Google Gemini AI API keys with frontend-only storage
 * for enhanced security. API keys are never sent to the backend for storage.
 */

'use client';

import React, { useState } from 'react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { cn } from '@/lib/design-system';
import Input from './Input';
import Button from './Button';
import { KeyIcon, CheckCircleIcon, XCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface ApiKeyManagerProps {
  className?: string;
  onApiKeyChange?: (hasApiKey: boolean) => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ 
  className,
  onApiKeyChange 
}) => {
  const [inputApiKey, setInputApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const { apiKey, hasApiKey, setApiKey, validateApiKey, clearApiKey } = useApiKey();

  React.useEffect(() => {
    onApiKeyChange?.(hasApiKey);
  }, [hasApiKey, onApiKeyChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputApiKey.trim()) return;

    try {
      setValidating(true);
      setValidationMessage(null);

      const validation = await validateApiKey(inputApiKey.trim());
      
      if (validation.valid) {
        setApiKey(inputApiKey.trim());
        setInputApiKey('');
        setValidationMessage({
          type: 'success',
          message: 'API key saved successfully! It will be validated when used for analysis.'
        });
      } else {
        setValidationMessage({
          type: 'error',
          message: validation.message
        });
      }
    } catch (error) {
      setValidationMessage({
        type: 'error',
        message: 'Failed to validate API key. Please try again.'
      });
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveApiKey = () => {
    clearApiKey();
    setValidationMessage({
      type: 'success',
      message: 'API key removed successfully.'
    });
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center space-x-2">
        <KeyIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
          Gemini AI API Key
        </h3>
        {hasApiKey && (
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
        )}
      </div>

      {validationMessage && (
        <div className={cn(
          "p-3 rounded-lg border",
          validationMessage.type === 'success'
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
        )}>
          <p className="text-sm font-medium">{validationMessage.message}</p>
        </div>
      )}

      {hasApiKey ? (
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  API Key Configured
                </p>
                <p className="text-xs text-green-600 dark:text-green-300 font-mono">
                  {maskApiKey(apiKey || '')}
                </p>
              </div>
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
            </div>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your Gemini AI API key is stored securely in your browser and ready for content analysis.
          </p>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveApiKey}
            className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
          >
            Remove API Key
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Google AI Studio API Key
            </label>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={inputApiKey}
                onChange={(e) => setInputApiKey(e.target.value)}
                placeholder="Enter your Gemini API key..."
                className="pr-10"
                disabled={validating}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showApiKey ? (
                  <EyeSlashIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Get your free API key from{' '}
              <a 
                href="https://ai.google.dev/gemini-api/docs/api-key" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <Button
            type="submit"
            disabled={!inputApiKey.trim() || validating}
            className="w-full"
          >
            {validating ? 'Validating...' : 'Save API Key'}
          </Button>
        </form>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
          🔒 Enhanced Security
        </h4>
        <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
          <p>• Your API key is stored only in your browser (localStorage)</p>
          <p>• It's never sent to our servers for storage</p>
          <p>• Only transmitted when making AI analysis requests</p>
          <p>• You'll need to re-enter it if you clear browser data</p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
          What is this for?
        </h4>
        <p className="text-xs text-gray-800 dark:text-gray-300">
          The Gemini AI API key enables automatic content analysis to pre-classify whether 
          web content is AI-generated or human-created, making your labeling work more efficient.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyManager; 