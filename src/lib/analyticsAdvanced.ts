import { format, startOfWeek } from 'date-fns';
import type { Task, Milestone } from '@/lib/types';

export function calculateVelocity(tasks: Task[]): { week: string; completed: number }[] {
  if (!tasks || tasks.length === 0) return [];
  const map = new Map<string, number>();
  for (const task of tasks) {
    if (task.status !== 'completed') continue;
    const raw = task.completionDate || task.createdDate;
    if (!raw) continue;
    const d = new Date(raw);
    if (isNaN(d.getTime())) continue;
    const weekStart = startOfWeek(d, { weekStartsOn: 1 });
    const key = format(weekStart, 'yyyy-MM-dd');
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, completed]) => ({ week, completed }));
}

export function calculateBurndown(
  tasks: Task[],
  milestones: Milestone[]
): { date: string; remaining: number; ideal: number }[] {
  if (!tasks || tasks.length === 0) return [];

  const total = tasks.length;

  const allDates: Date[] = [];

  for (const t of tasks) {
    if (t.createdDate) {
      const d = new Date(t.createdDate);
      if (!isNaN(d.getTime())) allDates.push(d);
    }
    if (t.completionDate) {
      const d = new Date(t.completionDate);
      if (!isNaN(d.getTime())) allDates.push(d);
    }
    const dl = t.teamDeadline || t.officialDeadline;
    if (dl) {
      const d = new Date(dl);
      if (!isNaN(d.getTime())) allDates.push(d);
    }
  }

  for (const m of milestones) {
    const dl = m.teamDeadline || m.officialDeadline;
    if (dl) {
      const d = new Date(dl);
      if (!isNaN(d.getTime())) allDates.push(d);
    }
    if (m.completedDate) {
      const d = new Date(m.completedDate);
      if (!isNaN(d.getTime())) allDates.push(d);
    }
  }

  if (allDates.length === 0) {
    const nowStr = format(new Date(), 'yyyy-MM-dd');
    return [{ date: nowStr, remaining: total, ideal: total }];
  }

  let start = new Date(Math.min(...allDates.map((d) => d.getTime())));
  let end = new Date(Math.max(...allDates.map((d) => d.getTime())));

  if (start.getTime() === end.getTime()) {
    end = new Date(end);
    end.setDate(end.getDate() + 1);
  }

  // normalize to midnight
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((endDay.getTime() - cur.getTime()) / 86400000) + 1;
  let step = 1;
  if (diffDays > 60) step = 7;
  else if (diffDays > 30) step = 2;

  const dates: Date[] = [];
  for (let d = new Date(cur); d <= endDay; d.setDate(d.getDate() + step)) {
    dates.push(new Date(d));
  }
  if (dates.length === 0) dates.push(new Date(cur));
  if (dates[dates.length - 1].getTime() !== endDay.getTime()) {
    dates.push(new Date(endDay));
  }

  const n = dates.length;
  return dates.map((d, i) => {
    const completed = tasks.filter((t) => {
      if (t.status !== 'completed') return false;
      const c = t.completionDate;
      if (!c) return false;
      const cd = new Date(c);
      if (isNaN(cd.getTime())) return false;
      const cdDay = new Date(cd);
      cdDay.setHours(0, 0, 0, 0);
      return cdDay <= d;
    }).length;
    // For tasks completed without date, handle createdDate fallback if needed
    // Already covered via completionDate check above; tasks completed without dates not counted yet
    // Do second pass for completed tasks without completionDate -> use createdDate
    const remaining = total - completed;
    const ideal = n > 1 ? Math.round(total - (total * i) / (n - 1)) : total;
    return { date: format(d, 'yyyy-MM-dd'), remaining, ideal };
  });
}

const STAGE_ORDER: string[] = [
  'research',
  'design',
  'prototype',
  'testing',
  'analysis',
  'documentation',
  'presentation',
];

export function calculateStageProgress(
  tasks: Task[]
): { stage: string; total: number; completed: number; percentage: number }[] {
  if (!tasks || tasks.length === 0) return [];
  const map = new Map<string, { total: number; completed: number }>();
  for (const task of tasks) {
    const stage = task.stage || 'other';
    const entry = map.get(stage) ?? { total: 0, completed: 0 };
    entry.total += 1;
    if (task.status === 'completed') entry.completed += 1;
    map.set(stage, entry);
  }
  const result = Array.from(map.entries()).map(([stage, v]) => ({
    stage,
    total: v.total,
    completed: v.completed,
    percentage: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0,
  }));
  // sort by predefined order if possible
  result.sort((a, b) => {
    const ia = STAGE_ORDER.indexOf(a.stage);
    const ib = STAGE_ORDER.indexOf(b.stage);
    if (ia === -1 && ib === -1) return a.stage.localeCompare(b.stage);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return result;
}

export function calculateTimeVsEstimate(
  tasks: Task[]
): { task: string; estimated?: number; actual: number }[] {
  if (!tasks || tasks.length === 0) return [];
  return tasks.map((t) => {
    const anyT = t as unknown as Record<string, unknown>;
    let estimated: number | undefined;
    if (typeof anyT.estimated === 'number') estimated = anyT.estimated as number;
    else if (typeof anyT.estimatedTime === 'number') estimated = anyT.estimatedTime as number;
    else if (typeof anyT.estimate === 'number') estimated = anyT.estimate as number;
    else if (typeof anyT.timeEstimate === 'number') estimated = anyT.timeEstimate as number;

    let actual = 0;
    if (typeof t.timeSpent === 'number') {
      actual = t.timeSpent;
    } else if (t.timeEntries && t.timeEntries.length > 0) {
      actual = t.timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    } else if (typeof anyT.timeSpent === 'number') {
      actual = anyT.timeSpent as number;
    }

    return { task: t.title, estimated, actual };
  });
}
