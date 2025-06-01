/**
 * Modern Badge Component
 * 
 * A flexible badge component for status indicators, labels, and tags.
 * Supports different variants, sizes, and interactive states.
 */

import React from 'react';
import { cn } from '@/lib/design-system';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({
    variant = 'primary',
    size = 'md',
    rounded = false,
    removable = false,
    onRemove,
    className,
    children,
    ...props
  }, ref) => {
    const baseClasses = 'inline-flex items-center font-medium transition-all duration-200';
    
    const variantClasses = {
      primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      secondary: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      info: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    };
    
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    };
    
    const roundedClasses = rounded ? 'rounded-full' : 'rounded-md';
    
    const RemoveIcon = () => (
      <svg
        className="w-3 h-3 ml-1 cursor-pointer hover:text-current"
        fill="currentColor"
        viewBox="0 0 20 20"
        onClick={(e) => {
          e.stopPropagation();
          onRemove?.();
        }}
      >
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    );
    
    return (
      <span
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          roundedClasses,
          className
        )}
        {...props}
      >
        {children}
        {removable && <RemoveIcon />}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge; 