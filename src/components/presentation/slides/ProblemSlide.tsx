'use client';

import { useAppStore } from '@/lib/store';

export default function ProblemSlide() {
  const { project } = useAppStore();
  const problem = project?.problemStatement || 'No problem statement defined yet.';
  const constraints = project?.constraints;

  return (
    <div className="flex flex-col justify-center h-full px-16 lg:px-24 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-1 h-8 bg-[#0d9488] rounded-full" />
        <h2 className="text-sm font-semibold text-[#0d9488] uppercase tracking-widest">The Problem</h2>
      </div>

      <p className="text-white leading-relaxed mb-10" style={{ fontSize: 'clamp(20px, 3vw, 28px)' }}>
        {problem}
      </p>

      {constraints && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Constraints</p>
          <p className="text-white/70 text-base leading-relaxed">{constraints}</p>
        </div>
      )}
    </div>
  );
}
