/**
 * Modern Input Component
 * 
 * A flexible input component with validation states, icons, and enhanced styling.
 * Supports different sizes, states, and accessibility features.
 */

import React from 'react';
import { cn } from '@/lib/design-system';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    variant = 'default',
    size = 'md',
    leftIcon,
    rightIcon,
    label,
    helperText,
    errorMessage,
    fullWidth = false,
    className,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = variant === 'error' || !!errorMessage;
    const hasSuccess = variant === 'success';
    
    const baseClasses = 'block rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
      default: 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-blue-500',
      error: 'border-red-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-red-500 focus:ring-red-500',
      success: 'border-green-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-green-500 focus:ring-green-500',
    };
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    };
    
    const iconSizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };
    
    const inputClasses = cn(
      baseClasses,
      variantClasses[hasError ? 'error' : hasSuccess ? 'success' : 'default'],
      sizeClasses[size],
      leftIcon ? 'pl-10' : '',
      rightIcon ? 'pr-10' : '',
      fullWidth ? 'w-full' : '',
      className
    );
    
    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className={cn(
              'absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400',
              iconSizeClasses[size]
            )}>
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            {...props}
          />
          
          {rightIcon && (
            <div className={cn(
              'absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400',
              iconSizeClasses[size]
            )}>
              {rightIcon}
            </div>
          )}
        </div>
        
        {(helperText || errorMessage) && (
          <p className={cn(
            'mt-2 text-sm',
            hasError ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
          )}>
            {errorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 