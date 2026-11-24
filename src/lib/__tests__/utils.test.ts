import { describe, it, expect } from 'vitest';
import {
  cn,
  formatDate,
  formatShortDate,
  formatDateTime,
  formatRelativeTime,
  getStageLabel,
  getStageColor,
  getTaskStatusLabel,
  getTaskStatusColor,
  getHealthLabel,
  getHealthColor,
  calculateTaskProgress,
  calculateRubricProgress,
  generateTeamCode,
} from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });
  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });
  it('deduplicates tailwind classes via twMerge', () => {
    // tailwind-merge should keep last conflicting class
    expect(cn('px-2 px-4')).toBe('px-4');
  });
});

describe('formatDate', () => {
  it('formats ISO date to MMM d, yyyy', () => {
    expect(formatDate('2026-01-15')).toBe('Jan 15, 2026');
  });
  it('formats another date', () => {
    expect(formatDate('2025-12-01')).toBe('Dec 1, 2025');
  });
});

describe('formatShortDate', () => {
  it('formats to MMM d', () => {
    expect(formatShortDate('2026-03-10')).toBe('Mar 10');
  });
});

describe('formatDateTime', () => {
  it('formats to MMM d, yyyy h:mm a', () => {
    // Use a date with known time; parseISO preserves exact time, format uses local TZ.
    // We check that year and month are present rather than exact hour to avoid TZ flakiness.
    const result = formatDateTime('2026-06-01T14:30:00.000Z');
    expect(result).toMatch(/Jun 1, 2026/);
    expect(result).toMatch(/:/);
  });
});

describe('formatRelativeTime', () => {
  it('returns a relative string', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    const result = formatRelativeTime(past);
    expect(result).toMatch(/ago/);
  });
});

describe('getStageLabel', () => {
  it('returns correct labels', () => {
    expect(getStageLabel('research')).toBe('Research');
    expect(getStageLabel('design')).toBe('Design');
    expect(getStageLabel('prototype')).toBe('Prototype');
    expect(getStageLabel('presentation')).toBe('Presentation');
  });
});

describe('getStageColor', () => {
  it('returns a color string for each stage', () => {
    expect(getStageColor('research')).toMatch(/bg-blue/);
    expect(getStageColor('testing')).toMatch(/bg-orange/);
  });
});

describe('getTaskStatusLabel', () => {
  it('maps status to label', () => {
    expect(getTaskStatusLabel('not_started')).toBe('Not Started');
    expect(getTaskStatusLabel('completed')).toBe('Completed');
    expect(getTaskStatusLabel('blocked')).toBe('Blocked');
  });
});

describe('getTaskStatusColor', () => {
  it('returns color for in_progress', () => {
    expect(getTaskStatusColor('in_progress')).toMatch(/blue/);
  });
  it('returns color for completed', () => {
    expect(getTaskStatusColor('completed')).toMatch(/emerald/);
  });
});

describe('getHealthLabel / getHealthColor', () => {
  it('maps health correctly', () => {
    expect(getHealthLabel('on_track')).toBe('On Track');
    expect(getHealthLabel('at_risk')).toBe('At Risk');
    expect(getHealthColor('needs_attention')).toMatch(/amber/);
  });
});

describe('calculateTaskProgress', () => {
  it('returns 0 for empty array', () => {
    expect(calculateTaskProgress([])).toBe(0);
  });
  it('calculates percentage correctly', () => {
    const tasks: any = [
      { status: 'completed' },
      { status: 'in_progress' },
      { status: 'completed' },
      { status: 'not_started' },
    ];
    expect(calculateTaskProgress(tasks)).toBe(50);
  });
});

describe('calculateRubricProgress', () => {
  it('returns 0 for empty', () => {
    expect(calculateRubricProgress([])).toBe(0);
  });
  it('calculates with partial weighting', () => {
    const criteria: any = [
      { status: 'complete' },
      { status: 'partial' },
      { status: 'missing' },
      { status: 'complete' },
    ];
    // (2 + 0.5)/4 = 62.5 -> 63
    expect(calculateRubricProgress(criteria)).toBe(63);
  });
});

describe('generateTeamCode', () => {
  it('generates 6-char code with allowed chars', () => {
    const code = generateTeamCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });
});
