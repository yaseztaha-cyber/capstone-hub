'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import SlideControls from '@/components/presentation/SlideControls';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const TOTAL_SLIDES = 10;

const SlideRenderer = dynamic(() => import('@/components/presentation/SlideRenderer'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-[#0f172a]">
      <div className="w-full max-w-3xl p-8 space-y-4 animate-pulse">
        <div className="h-10 bg-white/10 rounded w-3/4 mx-auto" />
        <div className="h-6 bg-white/10 rounded w-1/2 mx-auto" />
        <div className="h-48 bg-white/10 rounded" />
      </div>
    </div>
  ),
});

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [mounted, setMounted] = useState(false);
  const { project } = useAppStore();

  useEffect(() => { setMounted(true); }, []);

  const goNext = useCallback(() => {
    setDirection('next');
    setCurrentSlide((prev) => Math.min(prev + 1, TOTAL_SLIDES - 1));
  }, []);

  const goPrev = useCallback(() => {
    setDirection('prev');
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  const exitPresentation = useCallback(() => {
    window.history.back();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      else if (e.key === 'Escape') { e.preventDefault(); exitPresentation(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mounted, goNext, goPrev, exitPresentation]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 bg-[#0f172a] overflow-hidden z-40">
      {/* Subtle teal accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0d9488] via-[#14b8a6] to-[#0d9488] z-[60]" />

      {/* Slide content with transition */}
      <div className="h-full w-full">
        <div
          key={currentSlide}
          className={cn(
            'h-full w-full animate-in fade-in duration-300',
          )}
        >
          <SlideRenderer slideIndex={currentSlide} />
        </div>
      </div>

      {/* Controls overlay */}
      <SlideControls
        currentSlide={currentSlide}
        onPrev={goPrev}
        onNext={goNext}
        onExit={exitPresentation}
      />
    </div>
  );
}
