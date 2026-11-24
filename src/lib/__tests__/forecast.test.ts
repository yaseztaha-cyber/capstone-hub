import { describe, it, expect } from 'vitest';
import { calculateForecast } from '@/lib/forecast';

describe('calculateForecast', () => {
  it('returns on_track with empty items', () => {
    const f = calculateForecast([]);
    expect(f.weeklyAverage).toBe(0);
    expect(f.projectedTotal).toBe(0);
    expect(f.weeksRemaining).toBe(0);
    expect(f.status).toBe('on_track');
    expect(f.spendingByWeek).toEqual([]);
  });

  it('calculates weekly average and projected total', () => {
    const items = [
      { amount: 100, date: '2026-01-01' },
      { amount: 100, date: '2026-01-08' },
    ];
    const f = calculateForecast(items);
    // first to last = 7 days => 1 week => weeklyAverage = 200/1=200? Actually ceil(7/7)=1
    // totalWeeks=1, weeklyAverage=200, weeksRemaining=15, projected=200+200*15=3200
    expect(f.weeklyAverage).toBe(200);
    expect(f.projectedTotal).toBe(3200);
    expect(f.weeksRemaining).toBe(15);
  });

  it('groups spending by week', () => {
    const items = [
      { amount: 50, date: '2026-01-01' },
      { amount: 30, date: '2026-01-02' },
      { amount: 20, date: '2026-01-09' },
    ];
    const f = calculateForecast(items);
    expect(f.spendingByWeek.length).toBeGreaterThan(0);
    const total = f.spendingByWeek.reduce((sum, w) => sum + w.amount, 0);
    expect(total).toBe(100);
  });

  it('status on_track when under 85% of limit', () => {
    const items = [{ amount: 10, date: '2026-01-01' }];
    const f = calculateForecast(items, 10000);
    expect(f.status).toBe('on_track');
  });

  it('status warning when projected >85% but <=100% of limit', () => {
    // Need projectedTotal > 0.85*limit but not over. Let's craft items so projected ~900 with limit 1000
    // Use single item 50 on one week => weekly 50, projected 50+50*15=800 => 80% on_track
    // Need higher weekly. Use 60 => 60+60*15=960 => 96% warning
    const items = [{ amount: 60, date: '2026-01-01' }];
    const f = calculateForecast(items, 1000);
    expect(f.status).toBe('warning');
  });

  it('status over_budget when projected exceeds limit', () => {
    const items = [{ amount: 100, date: '2026-01-01' }];
    // projected =100+100*15=1600 >1000 => over_budget
    const f = calculateForecast(items, 1000);
    expect(f.status).toBe('over_budget');
  });

  it('handles single item spanning at least 1 week', () => {
    const items = [{ amount: 123.456, date: '2026-02-15' }];
    const f = calculateForecast(items);
    expect(f.weeklyAverage).toBeCloseTo(123.46, 1);
    expect(f.spendingByWeek).toHaveLength(1);
  });

  it('sorts items by date regardless of input order', () => {
    const items = [
      { amount: 20, date: '2026-01-15' },
      { amount: 10, date: '2026-01-01' },
    ];
    const f1 = calculateForecast(items);
    const f2 = calculateForecast([...items].reverse());
    expect(f1.weeklyAverage).toBe(f2.weeklyAverage);
    expect(f1.projectedTotal).toBe(f2.projectedTotal);
  });
});
