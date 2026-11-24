'use client';

import { cn } from '@/lib/utils';
import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-white dark:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500',
            error
              ? 'border-red-300 dark:border-red-700 focus-visible:ring-red-500 focus:border-red-500'
              : 'border-gray-300 dark:border-gray-600 focus-visible:ring-teal-500 focus:border-teal-500',
            className
          )}
          {...props}
        />
        {(error || helperText) && (
          <p className={cn('mt-1 text-xs', error ? 'text-red-600' : 'text-gray-500')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
