'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { TOTAL_SLIDES } from './SlideRenderer';

interface SlideControlsProps {
  currentSlide: number;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
}

export default function SlideControls({ currentSlide, onPrev, onNext, onExit }: SlideControlsProps) {
  const [visible, setVisible] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setVisible(true);
    hideTimeoutRef.current = setTimeout(() => setVisible(false), 4000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current); };
  }, [currentSlide, resetHideTimer]);

  useEffect(() => {
    if (autoPlay) {
      autoPlayRef.current = setInterval(() => onNext(), 8000);
    } else if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [autoPlay, onNext]);

  return (
    <div className="fixed inset-0 z-50" style={{ pointerEvents: 'none' }}>
      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 transition-all duration-500"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-20px)', pointerEvents: visible ? 'auto' : 'none' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all backdrop-blur-sm">
            <X size={18} />
          </button>
          <span className="text-sm text-white/50 font-medium tabular-nums">{currentSlide + 1} / {TOTAL_SLIDES}</span>
        </div>
        <button onClick={() => setAutoPlay(!autoPlay)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all text-sm font-medium backdrop-blur-sm">
          {autoPlay ? <Pause size={14} /> : <Play size={14} />}
          {autoPlay ? 'Pause' : 'Auto'}
        </button>
      </div>

      {/* Side arrows — only visible, not blocking screen */}
      <div
        className="absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-500"
        style={{ opacity: visible ? 0.8 : 0, pointerEvents: visible && currentSlide > 0 ? 'auto' : 'none' }}
      >
        <button onClick={onPrev} className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all backdrop-blur-sm">
          <ChevronLeft size={22} />
        </button>
      </div>
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-500"
        style={{ opacity: visible ? 0.8 : 0, pointerEvents: visible && currentSlide < TOTAL_SLIDES - 1 ? 'auto' : 'none' }}
      >
        <button onClick={onNext} className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all backdrop-blur-sm">
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Bottom progress bar */}
      <div
        className="absolute bottom-0 left-0 right-0 px-6 py-4 transition-all duration-500"
        style={{ opacity: visible ? 1 : 0, pointerEvents: 'none' }}
      >
        <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#0d9488] rounded-full transition-all duration-500 ease-out" style={{ width: `${((currentSlide + 1) / TOTAL_SLIDES) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
