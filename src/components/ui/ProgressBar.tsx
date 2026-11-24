'use client';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  color?: 'teal' | 'blue' | 'amber' | 'red' | 'green';
}

export default function ProgressBar({
  value, max = 100, size = 'md', showLabel = false, className, color = 'teal'
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  const colorMap = {
    teal: 'bg-teal-600',
    blue: 'bg-blue-600',
    amber: 'bg-amber-500',
    red: 'bg-red-600',
    green: 'bg-emerald-600',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{percentage}%</span>
        </div>
      )}
      <div className={cn(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        { 'h-1.5': size === 'sm', 'h-2': size === 'md', 'h-3': size === 'lg' }
      )}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorMap[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
