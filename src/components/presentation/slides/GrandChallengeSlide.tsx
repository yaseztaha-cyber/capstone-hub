'use client';

import { useAppStore } from '@/lib/store';

export default function GrandChallengeSlide() {
  const { project } = useAppStore();
  const challenge = project?.grandChallenge || 'No grand challenge selected.';
  const connection = project?.grandChallengeConnection || 'No connection defined yet.';

  return (
    <div className="flex flex-col justify-center h-full px-16 lg:px-24 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-1 h-8 bg-[#0d9488] rounded-full" />
        <h2 className="text-sm font-semibold text-[#0d9488] uppercase tracking-widest">Grand Challenge</h2>
      </div>

      <div className="bg-[#0d9488]/10 rounded-xl p-8 border border-[#0d9488]/20 mb-8">
        <p className="text-white font-medium" style={{ fontSize: 'clamp(20px, 3vw, 28px)' }}>
          {challenge}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Connection to Our Project</p>
        <p className="text-white/70 leading-relaxed text-lg">{connection}</p>
      </div>
    </div>
  );
}
