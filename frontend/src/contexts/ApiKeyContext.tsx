/**
 * API Key Context for Frontend-Only Management
 * 
 * This context manages Gemini API keys in the frontend for enhanced security.
 * API keys are stored only in browser memory/localStorage and never sent to backend storage.
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ApiKeyContextType {
  apiKey: string | null;
  hasApiKey: boolean;
  setApiKey: (key: string | null) => void;
  validateApiKey: (key: string) => Promise<{ valid: boolean; message: string }>;
  clearApiKey: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const API_KEY_STORAGE_KEY = 'genai_gemini_api_key';

interface ApiKeyProviderProps {
  children: ReactNode;
}

export const ApiKeyProvider: React.FC<ApiKeyProviderProps> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    try {
      const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (storedKey) {
        setApiKeyState(storedKey);
      }
    } catch (error) {
      console.warn('Failed to load API key from localStorage:', error);
    }
  }, []);

  const setApiKey = (key: string | null) => {
    setApiKeyState(key);
    
    try {
      if (key) {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
      } else {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to save API key to localStorage:', error);
    }
  };

  const validateApiKey = async (key: string): Promise<{ valid: boolean; message: string }> => {
    try {
      // Create a simple validation by trying to initialize the AI client
      // We'll do a minimal test to avoid sending the key to our backend
      if (!key || key.length < 10) {
        return {
          valid: false,
          message: 'API key appears to be too short. Please check your key.'
        };
      }

      // Basic format validation for Gemini API keys
      if (!key.startsWith('AI') || key.length < 30) {
        return {
          valid: false,
          message: 'API key format appears invalid. Gemini keys should start with "AI" and be longer.'
        };
      }

      // For now, we'll do basic validation here
      // In a more robust implementation, you could make a test call to Gemini directly from frontend
      return {
        valid: true,
        message: 'API key format appears valid. It will be validated when used for analysis.'
      };
    } catch (error) {
      return {
        valid: false,
        message: `API key validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  };

  const clearApiKey = () => {
    setApiKey(null);
  };

  const value: ApiKeyContextType = {
    apiKey,
    hasApiKey: Boolean(apiKey),
    setApiKey,
    validateApiKey,
    clearApiKey
  };

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = (): ApiKeyContextType => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
}; 