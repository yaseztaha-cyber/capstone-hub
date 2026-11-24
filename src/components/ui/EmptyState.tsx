'use client';

import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

type EmptyStateAction =
  | React.ReactNode
  | { label: string; onClick: () => void };

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: EmptyStateAction;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const renderAction = () => {
    if (!action) return null;
    if (
      typeof action === 'object' &&
      action !== null &&
      'label' in (action as Record<string, unknown>) &&
      'onClick' in (action as Record<string, unknown>) &&
      typeof (action as { label: unknown }).label === 'string' &&
      typeof (action as { onClick: unknown }).onClick === 'function'
    ) {
      const { label, onClick } = action as { label: string; onClick: () => void };
      return <Button onClick={onClick}>{label}</Button>;
    }
    return action as React.ReactNode;
  };

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {icon && (
        <div className="text-gray-300 mb-3">
          {icon}
        </div>
      )}
      <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">{description}</p>
      {renderAction()}
    </div>
  );
}

export { EmptyState };
