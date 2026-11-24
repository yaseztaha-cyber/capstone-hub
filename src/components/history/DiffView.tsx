'use client';

import { computeDiff, type DiffPart } from '@/lib/diff';

interface DiffViewProps {
  oldText: string;
  newText: string;
}

export default function DiffView({ oldText, newText }: DiffViewProps) {
  const parts = computeDiff(oldText, newText);

  if (oldText === newText) {
    return (
      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap p-3 bg-gray-50 rounded-lg">
        {oldText || <span className="text-gray-400 italic">Empty</span>}
      </div>
    );
  }

  return (
    <div className="text-sm leading-relaxed whitespace-pre-wrap p-3 bg-gray-50 rounded-lg border border-gray-200 font-mono text-xs">
      {parts.map((part: DiffPart, i: number) => (
        <span
          key={i}
          className={
            part.type === 'added'
              ? 'bg-green-100 text-green-800'
              : part.type === 'removed'
                ? 'bg-red-100 text-red-800 line-through'
                : 'text-gray-700'
          }
        >
          {part.text}
        </span>
      ))}
    </div>
  );
}
