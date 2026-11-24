'use client';

import { useAppStore } from '@/lib/store';

export default function DesignSlide() {
  const { project } = useAppStore();

  return (
    <div className="flex flex-col justify-center h-full px-16 lg:px-24 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-1 h-8 bg-[#0d9488] rounded-full" />
        <h2 className="text-sm font-semibold text-[#0d9488] uppercase tracking-widest">Design Requirements</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-xl p-6 border border-white/5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Engineering Objective</p>
          <p className="text-white text-base leading-relaxed">{project?.engineeringObjective || 'Not defined'}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-6 border border-white/5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Important Materials</p>
          <p className="text-white text-base leading-relaxed">{project?.importantMaterials || 'Not defined'}</p>
        </div>
      </div>
    </div>
  );
}
