/**
 * Configuration utilities for the GenAI Content Detection Assistant frontend.
 * 
 * This module provides functions to access the global configuration.
 */

import yaml from 'js-yaml';

// Types for our configuration structure
export interface ApiConfig {
  base_url: string;
  endpoints: {
    admin_upload: string;
    labeler_task: string;
    labeler_submit: string;
    users: string;
  };
}

export interface FrontendConfig {
  theme: string;
  api_timeout_ms: number;
}

export interface IndicatorItem {
  id: string;
  label: string;
}

export interface LabelingConfig {
  max_labelers_per_website: number;
  ai_indicators: IndicatorItem[];
  human_indicators: IndicatorItem[];
}

export interface GlobalConfig {
  api: ApiConfig;
  frontend: FrontendConfig;
  labeling: LabelingConfig;
  [key: string]: any; // Allow other properties
}

// Default configuration
const defaultConfig: GlobalConfig = {
  api: {
    base_url: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    endpoints: {
      admin_upload: '/admin/upload_urls',
      labeler_task: '/labeler/task',
      labeler_submit: '/labeler/submit_label',
      users: '/users',
    }
  },
  frontend: {
    theme: 'dark',
    api_timeout_ms: 10000,
  },
  labeling: {
    max_labelers_per_website: 3,
    ai_indicators: [
      { id: 'ai-1', label: 'Repetitive phrasing' },
      { id: 'ai-2', label: 'Overly formal tone' },
      { id: 'ai-3', label: 'Lacks personal anecdotes' },
      { id: 'ai-4', label: 'Unusual sentence structures' },
      { id: 'ai-5', label: 'Many facts, no deep insights' },
    ],
    human_indicators: [
      { id: 'h-1', label: 'Personal voice/style' },
      { id: 'h-2', label: 'Includes personal stories/opinions' },
      { id: 'h-3', label: 'Natural, varied language' },
      { id: 'h-4', label: 'Occasional typos/errors' },
      { id: 'h-5', label: 'Clear emotional expression' },
    ],
  }
};

// Cache for the loaded configuration
let configCache: GlobalConfig | null = null;

/**
 * Load the global configuration.
 * 
 * In a browser environment, this will attempt to fetch the configuration from
 * /config.yaml. If that fails, it will use the default configuration.
 * 
 * @param reload - If true, reload the configuration even if cached
 * @returns The configuration object
 */
export async function loadConfig(reload = false): Promise<GlobalConfig> {
  // Return cached config if available and reload not requested
  if (configCache && !reload) {
    return configCache;
  }

  // In browser, try to fetch the config.yaml file
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/config.yaml');
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
      }
      const yamlText = await response.text();
      const loadedConfig = yaml.load(yamlText) as Record<string, any>;
      
      // Merge with default config to ensure all properties exist
      configCache = deepMerge(defaultConfig, loadedConfig);
      return configCache;
    } catch (error) {
      console.warn('Failed to load config.yaml, using default config:', error);
      configCache = defaultConfig;
      return defaultConfig;
    }
  }

  // In non-browser environment (SSR), use default config
  return defaultConfig;
}

/**
 * Get a specific configuration value using a dot-notation key path.
 * 
 * This is a synchronous function that returns values from the cached config.
 * If the config hasn't been loaded yet, it will use the default config.
 * 
 * @param keyPath - Dot-notation path to the configuration value (e.g., "api.base_url")
 * @param defaultValue - Default value to return if the key is not found
 * @returns The configuration value at the specified path
 * 
 * @example
 * const apiBaseUrl = getConfigValue("api.base_url");
 * const maxLabelers = getConfigValue("labeling.max_labelers_per_website", 3);
 */
export function getConfigValue<T>(keyPath: string, defaultValue?: T): T {
  const config = configCache || defaultConfig;
  const keys = keyPath.split('.');
  
  // Navigate through the nested object
  let current: any = config;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return defaultValue as T;
    }
  }
  
  return current as T;
}

/**
 * Get the API URL for a specific endpoint.
 * 
 * @param endpoint - The endpoint key from the config (e.g., "admin_upload")
 * @returns The full URL for the endpoint
 * 
 * @example
 * const uploadUrl = getApiUrl("admin_upload"); // "http://localhost:8000/admin/upload_urls"
 */
export function getApiUrl(endpoint: keyof ApiConfig['endpoints']): string {
  const config = configCache || defaultConfig;
  const baseUrl = config.api.base_url;
  const path = config.api.endpoints[endpoint];
  
  // Ensure there's no double slash when joining
  return baseUrl.endsWith('/') 
    ? `${baseUrl}${path.startsWith('/') ? path.substring(1) : path}`
    : `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
}

/**
 * Deep merge two objects.
 * 
 * @param target - The target object
 * @param source - The source object
 * @returns The merged object
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
  const output = { ...target } as T;
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          (output as Record<string, any>)[key] = source[key];
        } else {
          (output as Record<string, any>)[key] = deepMerge(
            (target as Record<string, any>)[key], 
            source[key]
          );
        }
      } else {
        (output as Record<string, any>)[key] = source[key];
      }
    });
  }
  
  return output;
}

/**
 * Check if a value is an object.
 * 
 * @param item - The value to check
 * @returns True if the value is an object, false otherwise
 */
function isObject(item: any): boolean {
  return (item && typeof item === 'object' && !Array.isArray(item));
} 