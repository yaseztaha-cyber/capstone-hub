'use client';

import { cn } from '@/lib/utils';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, 'aria-label': ariaLabel, 'aria-disabled': ariaDisabledProp, ...props }, ref) => {
    const isDisabled = Boolean(disabled || ariaDisabledProp);
    return (
      <button
        ref={ref}
        disabled={disabled}
        aria-disabled={isDisabled || undefined}
        aria-label={ariaLabel}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none aria-disabled:opacity-50 aria-disabled:pointer-events-none',
          {
            'bg-teal-700 text-white hover:bg-teal-800 focus-visible:ring-teal-500': variant === 'primary',
            'bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-400': variant === 'secondary',
            'bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500': variant === 'danger',
            'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400': variant === 'outline',
          },
          {
            'text-xs px-2.5 py-1.5': size === 'sm',
            'text-sm px-3.5 py-2': size === 'md',
            'text-base px-5 py-2.5': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
