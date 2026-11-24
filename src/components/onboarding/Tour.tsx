'use client';

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';

interface TourProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface Step {
  target: string;
  title: string;
  content: string;
}

const steps: Step[] = [
  {
    target: '[data-tour="dashboard"]',
    title: 'Welcome',
    content: 'Welcome to STEM Capstone Hub — your workspace to manage tasks, track progress, and collaborate with your team.',
  },
  {
    target: '[data-tour="tasks"]',
    title: 'Tasks',
    content: 'Organize and track your project tasks. Assign owners, set deadlines, and monitor status from not started to completed.',
  },
  {
    target: '[data-tour="project"]',
    title: 'Project Workspace',
    content: 'Define your problem, grand challenge, and engineering objectives. This is the heart of your capstone documentation.',
  },
  {
    target: '[data-tour="calendar"]',
    title: 'Calendar',
    content: 'View deadlines, milestones, and meetings in one place to stay on top of your timeline.',
  },
  {
    target: '[data-tour="chat"]',
    title: 'Team Chat',
    content: 'Collaborate in real time with your team — share updates, ask questions, and keep everyone aligned.',
  },
];

export default function Tour({ open, onClose, onComplete }: TourProps) {
  const [current, setCurrent] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);

  const step = steps[current];

  const updateRect = useCallback(() => {
    if (!open) return;
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (el) {
      const r = el.getBoundingClientRect();
      // scroll into view if not visible
      const isVisible = r.top >= 0 && r.bottom <= window.innerHeight;
      if (!isVisible) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setRect(r);

      // compute card position: prefer below target, fallback above, fallback center
      const cardWidth = 340;
      const cardHeight = 200;
      const padding = 16;
      let top = r.bottom + 16;
      let left = r.left + r.width / 2 - cardWidth / 2;

      // Clamp left
      left = Math.max(padding, Math.min(left, window.innerWidth - cardWidth - padding));

      // If not enough space below, place above
      if (top + cardHeight > window.innerHeight - padding) {
        const altTop = r.top - cardHeight - 16;
        if (altTop > padding) {
          top = altTop;
        } else {
          // center fallback
          top = Math.max(padding, window.innerHeight / 2 - cardHeight / 2);
          left = Math.max(padding, window.innerWidth / 2 - cardWidth / 2);
        }
      }
      setCardPos({ top, left });
    } else {
      // No target found -> center card
      setRect(null);
      const cardWidth = 340;
      const cardHeight = 200;
      setCardPos({
        top: Math.max(16, window.innerHeight / 2 - cardHeight / 2),
        left: Math.max(16, window.innerWidth / 2 - cardWidth / 2),
      });
    }
  }, [open, step.target]);

  useEffect(() => {
    if (!open) return;
    // reset to first step when opened
    setCurrent(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    updateRect();
    const handleResize = () => updateRect();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    const t = setTimeout(updateRect, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      clearTimeout(t);
    };
  }, [open, current, updateRect]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        if (current < steps.length - 1) setCurrent((c) => c + 1);
      } else if (e.key === 'ArrowLeft') {
        if (current > 0) setCurrent((c) => c - 1);
      }
    };
    document.addEventListener('keydown', handleKey);
    // lock scroll?
    const prevOverflow = document.body.style.overflow;
    // allow scrolling inside tour but prevent body scroll? Keep simple
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, current, onClose]);

  if (!open) return null;

  const isFirst = current === 0;
  const isLast = current === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) setCurrent((c) => c - 1);
  };

  const handleSkip = () => {
    onClose();
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('sch_tour_done', 'true');
    } catch {}
    onComplete();
    onClose();
  };

  // Spotlight style via box-shadow
  const spotlightStyle: React.CSSProperties | undefined = rect
    ? {
        position: 'fixed',
        top: rect.top - 8,
        left: rect.left - 8,
        width: rect.width + 16,
        height: rect.height + 16,
        borderRadius: 12,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
        pointerEvents: 'none',
        zIndex: 60,
        transition: 'all 0.3s ease',
        border: '2px solid rgba(255,255,255,0.8)',
      }
    : undefined;

  const overlayStyle: React.CSSProperties = rect
    ? {
        position: 'fixed',
        inset: 0,
        background: 'transparent',
        zIndex: 55,
      }
    : {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 55,
      };

  // Arrow pointer position: point from card to spotlight center
  const showArrow = !!rect && !!cardPos;
  const arrowStyle: React.CSSProperties | undefined = showArrow
    ? (() => {
        const spotlightCenterX = rect!.left + rect!.width / 2;
        const isAbove = cardPos!.top < rect!.top;
        // Arrow is at top or bottom edge of card
        const arrowLeft = spotlightCenterX - cardPos!.left;
        const clampedLeft = Math.max(20, Math.min(arrowLeft, 320));
        if (isAbove) {
          // card is above spotlight, arrow at bottom of card
          return {
            position: 'absolute' as const,
            bottom: -8,
            left: clampedLeft - 8,
            width: 16,
            height: 16,
            background: 'white',
            transform: 'rotate(45deg)',
            borderRight: '1px solid #e5e7eb',
            borderBottom: '1px solid #e5e7eb',
          };
        } else {
          // card below spotlight, arrow at top
          return {
            position: 'absolute' as const,
            top: -8,
            left: clampedLeft - 8,
            width: 16,
            height: 16,
            background: 'white',
            transform: 'rotate(45deg)',
            borderLeft: '1px solid #e5e7eb',
            borderTop: '1px solid #e5e7eb',
          };
        }
      })()
    : undefined;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* Overlay */}
      <div style={overlayStyle} onClick={handleSkip} aria-hidden="true" />

      {/* Spotlight */}
      {rect && <div style={spotlightStyle} aria-hidden="true" />}

      {/* Card */}
      <div
        className="fixed z-[70] bg-white rounded-xl shadow-2xl border border-gray-200 w-[340px] max-w-[90vw] overflow-hidden"
        style={
          cardPos
            ? { top: cardPos.top, left: cardPos.left, transition: 'all 0.3s ease' }
            : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
        }
      >
        {showArrow && <div style={arrowStyle} aria-hidden="true" />}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 id="tour-title" className="text-base font-semibold text-gray-900">
              {step.title}
            </h3>
            <button
              onClick={handleSkip}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
              aria-label="Close tour"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{step.content}</p>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mt-4 mb-4" role="group" aria-label="Tour progress">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === current ? 'w-6 bg-teal-600' : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to step ${idx + 1} of ${steps.length}`}
                aria-current={idx === current ? 'true' : undefined}
              />
            ))}
            <span className="ml-2 text-xs text-gray-500">
              {current + 1} / {steps.length}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={isFirst}
                className="gap-1"
                aria-label="Previous step"
              >
                <ChevronLeft size={14} />
                Prev
              </Button>
              <Button variant="primary" size="sm" onClick={handleNext} className="gap-1">
                {isLast ? 'Finish' : 'Next'}
                {!isLast && <ChevronRight size={14} />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
