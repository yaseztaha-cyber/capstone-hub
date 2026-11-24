'use client';

import { useAppStore } from '@/lib/store';

export default function ResultsSlide() {
  const { project } = useAppStore();
  const results = project?.resultsAnalysis || 'No results analysis defined yet.';

  return (
    <div className="flex flex-col justify-center h-full px-16 lg:px-24 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-1 h-8 bg-[#0d9488] rounded-full" />
        <h2 className="text-sm font-semibold text-[#0d9488] uppercase tracking-widest">Results & Analysis</h2>
      </div>

      <p className="text-white leading-relaxed" style={{ fontSize: 'clamp(18px, 2.5vw, 24px)' }}>
        {results}
      </p>
    </div>
  );
}
