import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, differenceInDays, parseISO } from 'date-fns';
import type { Task, TaskStatus, ProjectHealth, ProjectStage, RubricCriterion, RubricStatus } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  return format(parseISO(date), 'MMM d, yyyy');
}

export function formatDateTime(date: string): string {
  return format(parseISO(date), 'MMM d, yyyy h:mm a');
}

export function formatShortDate(date: string): string {
  return format(parseISO(date), 'MMM d');
}

export function formatRelativeTime(date: string): string {
  return formatDistanceToNow(parseISO(date), { addSuffix: true });
}

export function isOverdue(date: string): boolean {
  return isPast(parseISO(date)) && !isToday(parseISO(date));
}

export function isDueToday(date: string): boolean {
  return isToday(parseISO(date));
}

export function isDueTomorrow(date: string): boolean {
  return isTomorrow(parseISO(date));
}

export function daysUntil(date: string): number {
  return differenceInDays(parseISO(date), new Date());
}

export function getTaskStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    waiting: 'Waiting',
    blocked: 'Blocked',
    submitted: 'Submitted',
    completed: 'Completed',
  };
  return labels[status];
}

export function getTaskStatusColor(status: TaskStatus): string {
  const colors: Record<TaskStatus, string> = {
    not_started: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
    waiting: 'bg-amber-50 text-amber-700 border border-amber-200',
    blocked: 'bg-red-50 text-red-700 border border-red-200',
    submitted: 'bg-purple-50 text-purple-700 border border-purple-200',
    completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  };
  return colors[status];
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'text-gray-500',
    normal: 'text-blue-600',
    high: 'text-amber-600',
    critical: 'text-red-600',
  };
  return colors[priority] || 'text-gray-500';
}

export function getHealthColor(health: ProjectHealth): string {
  const colors: Record<ProjectHealth, string> = {
    on_track: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    needs_attention: 'bg-amber-50 text-amber-700 border border-amber-200',
    at_risk: 'bg-red-50 text-red-700 border border-red-200',
  };
  return colors[health];
}

export function getHealthLabel(health: ProjectHealth): string {
  const labels: Record<ProjectHealth, string> = {
    on_track: 'On Track',
    needs_attention: 'Needs Attention',
    at_risk: 'At Risk',
  };
  return labels[health];
}

export function getStageLabel(stage: ProjectStage): string {
  const labels: Record<ProjectStage, string> = {
    research: 'Research',
    design: 'Design',
    prototype: 'Prototype',
    testing: 'Testing',
    analysis: 'Analysis',
    documentation: 'Documentation',
    presentation: 'Presentation',
  };
  return labels[stage];
}

export function getStageColor(stage: ProjectStage): string {
  const colors: Record<ProjectStage, string> = {
    research: 'bg-blue-50 text-blue-700',
    design: 'bg-violet-50 text-violet-700',
    prototype: 'bg-amber-50 text-amber-700',
    testing: 'bg-orange-50 text-orange-700',
    analysis: 'bg-cyan-50 text-cyan-700',
    documentation: 'bg-emerald-50 text-emerald-700',
    presentation: 'bg-pink-50 text-pink-700',
  };
  return colors[stage];
}

export function getRubricStatusColor(status: RubricStatus): string {
  const colors: Record<RubricStatus, string> = {
    complete: 'text-emerald-600',
    partial: 'text-amber-600',
    missing: 'text-red-600',
  };
  return colors[status];
}

export function getRubricStatusIcon(status: RubricStatus): string {
  const icons: Record<RubricStatus, string> = {
    complete: '✓',
    partial: '⚠',
    missing: '✕',
  };
  return icons[status];
}

export function generateTeamCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function calculateTaskProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}

export function calculateRubricProgress(criteria: RubricCriterion[]): number {
  if (criteria.length === 0) return 0;
  const complete = criteria.filter(c => c.status === 'complete').length;
  const partial = criteria.filter(c => c.status === 'partial').length;
  return Math.round(((complete + partial * 0.5) / criteria.length) * 100);
}

export function getOverdueTasks(tasks: Task[]): Task[] {
  return tasks.filter(t =>
    t.officialDeadline &&
    isOverdue(t.officialDeadline) &&
    t.status !== 'completed' &&
    t.status !== 'submitted'
  );
}

export function getUpcomingTasks(tasks: Task[], days: number = 7): Task[] {
  return tasks.filter(t => {
    if (!t.teamDeadline && !t.officialDeadline) return false;
    const deadline = t.teamDeadline || t.officialDeadline;
    if (!deadline) return false;
    const daysLeft = daysUntil(deadline);
    return daysLeft >= 0 && daysLeft <= days && t.status !== 'completed';
  });
}

export function getTasksNeedingAttention(tasks: Task[]): Task[] {
  return tasks.filter(t => {
    if (t.status === 'blocked') return true;
    if (t.priority === 'critical' && t.status !== 'completed') return true;
    if (t.officialDeadline && isOverdue(t.officialDeadline) && t.status !== 'completed') return true;
    return false;
  });
}
