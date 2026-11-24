'use client';

import { useEffect, useRef, useCallback } from 'react';

export const SHORTCUTS = {
  newTask: 'n',
  newMeeting: 'm',
  search: '/',
  help: '?',
  goDashboard: 'g d',
  goTasks: 'g t',
  goCalendar: 'g c',
  goFiles: 'g f',
  goChat: 'g h',
  goProject: 'g p',
} as const;

export type ShortcutKey = (typeof SHORTCUTS)[keyof typeof SHORTCUTS];

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (target.isContentEditable) return true;
  if (target.closest('[contenteditable="true"]')) return true;
  return false;
}

export function useKeyboardShortcuts(handlers: Record<string, () => void>) {
  const handlersRef = useRef(handlers);
  const bufferRef = useRef<string>('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const clearBuffer = useCallback(() => {
    bufferRef.current = '';
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      if (isEditableTarget(e.target)) return;

      // Ignore with modifier keys except Shift (needed for '?')
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const rawKey = e.key;
      // Ignore if key is not a single character and not special handling
      // For sequences we only care about single characters like 'g', 'd', 'n', '/', '?'
      if (rawKey.length !== 1) {
        // Allow Escape to clear sequence buffer
        if (rawKey === 'Escape') {
          clearBuffer();
        }
        return;
      }

      const key = rawKey.toLowerCase();

      // Build candidate key string (sequence with spaces)
      const prev = bufferRef.current;
      const candidate = prev ? `${prev} ${key}` : key;

      const handlersNow = handlersRef.current;
      const handlerKeys = Object.keys(handlersNow);

      // Exact match -> fire handler
      if (candidate in handlersNow) {
        e.preventDefault();
        clearBuffer();
        // invoke handler
        try {
          handlersNow[candidate]?.();
        } catch {}
        return;
      }

      // Check if candidate is a prefix for any handler (sequence in progress)
      const hasPrefix = handlerKeys.some((k) => k !== candidate && k.startsWith(candidate + ' '));

      if (hasPrefix) {
        e.preventDefault();
        bufferRef.current = candidate;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          clearBuffer();
        }, 1000);
        return;
      }

      // No match and not a prefix: try handling the single key alone if it is a valid handler
      // This handles case where previous buffer was 'g' and user pressed 'x' (invalid), then 'x' might be valid solo
      if (prev) {
        // clear previous buffer and check if key alone is a handler
        clearBuffer();
        if (key in handlersNow) {
          e.preventDefault();
          try {
            handlersNow[key]?.();
          } catch {}
          return;
        }
        // also check if key alone is prefix of sequence
        const keyIsPrefix = handlerKeys.some((k) => k.startsWith(key + ' '));
        if (keyIsPrefix) {
          e.preventDefault();
          bufferRef.current = key;
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => clearBuffer(), 1000);
        }
        return;
      }

      // If no buffer and key not handled, do nothing (maybe prefix check already above)
      // However for first key that is prefix (like 'g'), we already handled via hasPrefix, so
      // final case: if key is prefix alone (e.g., first press 'g'), the hasPrefix branch would have caught candidate='g' which is prefix of 'g d'.
      // So nothing to do here.
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [clearBuffer]);
}
