/**
 * Theme Toggle Component for GenAI Content Detection Assistant
 * 
 * A beautiful toggle button that allows users to switch between light and dark modes.
 * Features smooth animations, intuitive icons, and accessibility support.
 * 
 * Parameters
 * ----------
 * className : string, optional
 *     Additional CSS classes to apply to the component
 * size : 'sm' | 'md' | 'lg', optional
 *     Size variant of the toggle button (default: 'md')
 * showLabel : boolean, optional
 *     Whether to show text label next to the toggle (default: false)
 * 
 * Returns
 * -------
 * JSX.Element
 *     Rendered theme toggle component
 * 
 * Examples
 * --------
 * ```tsx
 * // Basic usage
 * <ThemeToggle />
 * 
 * // With label and custom size
 * <ThemeToggle size="lg" showLabel={true} />
 * 
 * // Custom styling
 * <ThemeToggle className="my-custom-class" />
 * ```
 */

'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const SunIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

const SystemIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

export default function ThemeToggle({ 
  className = '', 
  size = 'md', 
  showLabel = false 
}: ThemeToggleProps) {
  const { theme, effectiveTheme, setTheme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const getThemeIcon = () => {
    if (theme === 'system') {
      return <SystemIcon className={iconSizeClasses[size]} />;
    }
    return effectiveTheme === 'dark' ? (
      <MoonIcon className={iconSizeClasses[size]} />
    ) : (
      <SunIcon className={iconSizeClasses[size]} />
    );
  };

  const getThemeLabel = () => {
    if (theme === 'system') {
      return `System (${effectiveTheme})`;
    }
    return effectiveTheme === 'dark' ? 'Dark' : 'Light';
  };

  const handleClick = () => {
    if (theme === 'system') {
      // If currently system, switch to opposite of current effective theme
      setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
    } else {
      // If manual theme, toggle between light and dark
      toggleTheme();
    }
  };

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <button
        onClick={handleClick}
        className={`
          ${sizeClasses[size]}
          relative rounded-full
          bg-slate-200 dark:bg-slate-700
          border border-slate-300 dark:border-slate-600
          text-slate-600 dark:text-slate-300
          hover:bg-slate-300 dark:hover:bg-slate-600
          hover:text-slate-900 dark:hover:text-slate-100
          hover:border-slate-400 dark:hover:border-slate-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          focus:ring-offset-slate-50 dark:focus:ring-offset-slate-900
          active:scale-95
          transition-all duration-200 ease-in-out
          group
        `}
        title={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
        aria-label={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200 to-orange-300 opacity-0 group-hover:opacity-20 transition-opacity duration-200" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-200 to-purple-300 opacity-0 dark:group-hover:opacity-20 transition-opacity duration-200" />
        
        <div className="relative flex items-center justify-center h-full w-full">
          <div className={`
            transform transition-all duration-300 ease-in-out
            ${effectiveTheme === 'dark' ? 'rotate-180' : 'rotate-0'}
          `}>
            {getThemeIcon()}
          </div>
        </div>
      </button>

      {showLabel && (
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {getThemeLabel()}
        </span>
      )}
    </div>
  );
} 