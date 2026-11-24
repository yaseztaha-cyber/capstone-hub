'use client';

import { useAppStore } from '@/lib/store';

export default function PrototypeSlide() {
  const { project } = useAppStore();
  const solution = project?.expectedSolution || 'No prototype description defined yet.';

  return (
    <div className="flex flex-col justify-center h-full px-16 lg:px-24 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-1 h-8 bg-[#0d9488] rounded-full" />
        <h2 className="text-sm font-semibold text-[#0d9488] uppercase tracking-widest">Prototype</h2>
      </div>

      <p className="text-white leading-relaxed" style={{ fontSize: 'clamp(18px, 2.5vw, 24px)' }}>
        {solution}
      </p>

      {project?.concept && (
        <div className="mt-8 bg-white/5 rounded-xl p-6 border border-white/5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Concept</p>
          <p className="text-white/70">{project.concept}</p>
        </div>
      )}
    </div>
  );
}
