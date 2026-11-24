'use client';

import { useAppStore } from '@/lib/store';

export default function ResearchSlide() {
  const { sources } = useAppStore();

  return (
    <div className="flex flex-col justify-center h-full px-16 lg:px-24 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-1 h-8 bg-[#0d9488] rounded-full" />
        <h2 className="text-sm font-semibold text-[#0d9488] uppercase tracking-widest">Research</h2>
      </div>

      {sources.length === 0 ? (
        <p className="text-white/40 text-lg italic">No research sources added yet.</p>
      ) : (
        <div className="space-y-4">
          {sources.slice(0, 5).map((source, i) => (
            <div key={source.id} className="flex items-start gap-4 bg-white/5 rounded-lg p-4 border border-white/5">
              <span className="text-[#0d9488] font-mono text-sm mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <p className="text-white font-medium text-base">{source.title}</p>
                <p className="text-white/40 text-sm mt-0.5">{source.authors} ({source.year})</p>
              </div>
            </div>
          ))}
          {sources.length > 5 && (
            <p className="text-white/30 text-sm text-center">+ {sources.length - 5} more sources</p>
          )}
        </div>
      )}
    </div>
  );
}
