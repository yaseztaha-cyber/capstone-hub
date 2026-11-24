'use client';

import { useAppStore } from '@/lib/store';

export default function TitleSlide() {
  const { project, team, members } = useAppStore();
  const projectName = project?.title || 'Project Title';
  const teamName = team?.name || 'Team Name';
  const school = project?.school || members[0]?.user.school || 'STEM School';
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-16 relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#0d9488]/5 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Logo */}
        <div className="mb-10 w-14 h-14 rounded-xl bg-[#0d9488] flex items-center justify-center mx-auto shadow-lg shadow-[#0d9488]/20">
          <span className="text-white text-2xl font-bold">S</span>
        </div>

        {/* Title */}
        <h1 className="font-bold text-white leading-tight mb-6" style={{ fontSize: 'clamp(36px, 5vw, 56px)', maxWidth: '800px' }}>
          {projectName}
        </h1>

        {/* Divider */}
        <div className="w-16 h-[3px] bg-[#0d9488] rounded-full mx-auto mb-6" />

        {/* Team & School */}
        <p className="text-xl text-white/60 mb-1 font-medium">{teamName}</p>
        <p className="text-base text-white/40">{school}</p>
        <p className="text-sm text-white/30 mt-6">{date}</p>
      </div>
    </div>
  );
}
