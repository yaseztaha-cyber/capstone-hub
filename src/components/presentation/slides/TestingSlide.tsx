'use client';

import { useAppStore } from '@/lib/store';

export default function TestingSlide() {
  const { project } = useAppStore();
  const plan = project?.testingPlan || 'No testing plan defined yet.';
  const results = project?.testingResults;

  return (
    <div className="flex flex-col justify-center h-full px-16 lg:px-24 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-1 h-8 bg-[#0d9488] rounded-full" />
        <h2 className="text-sm font-semibold text-[#0d9488] uppercase tracking-widest">Testing</h2>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Test Plan</p>
          <p className="text-white leading-relaxed" style={{ fontSize: 'clamp(16px, 2vw, 20px)' }}>{plan}</p>
        </div>

        {results && (
          <div className="bg-white/5 rounded-xl p-6 border border-white/5">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Results</p>
            <p className="text-white/80 leading-relaxed">{results}</p>
          </div>
        )}
      </div>
    </div>
  );
}
