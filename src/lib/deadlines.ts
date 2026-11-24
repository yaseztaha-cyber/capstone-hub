import type { Task, Milestone, Notification } from '@/lib/types';

export function checkDeadlines(tasks: Task[], milestones: Milestone[]): Notification[] {
  const now = new Date();
  const notifications: Notification[] = [];

  for (const task of tasks) {
    const deadline = task.teamDeadline || task.officialDeadline;
    if (!deadline || task.status === 'completed') continue;

    const deadlineDate = new Date(deadline);
    const hoursUntil = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 0) {
      notifications.push({
        id: `overdue-task-${task.id}`,
        userId: task.createdBy || '',
        title: `Task Overdue: ${task.title}`,
        message: `This task was due ${Math.abs(Math.round(hoursUntil))} hours ago`,
        type: 'task_overdue',
        read: false,
        createdAt: now.toISOString(),
      });
    } else if (hoursUntil <= 1) {
      notifications.push({
        id: `due-1h-task-${task.id}`,
        userId: task.createdBy || '',
        title: `Due Soon: ${task.title}`,
        message: 'This task is due within 1 hour',
        type: 'task_due',
        read: false,
        createdAt: now.toISOString(),
      });
    } else if (hoursUntil <= 24) {
      notifications.push({
        id: `due-24h-task-${task.id}`,
        userId: task.createdBy || '',
        title: `Due Tomorrow: ${task.title}`,
        message: 'This task is due within 24 hours',
        type: 'task_due',
        read: false,
        createdAt: now.toISOString(),
      });
    } else if (hoursUntil <= 168) {
      notifications.push({
        id: `due-7d-task-${task.id}`,
        userId: task.createdBy || '',
        title: `Due This Week: ${task.title}`,
        message: `Due in ${Math.round(hoursUntil / 24)} days`,
        type: 'deadline_approaching',
        read: false,
        createdAt: now.toISOString(),
      });
    }
  }

  for (const ms of milestones) {
    if (ms.isCompleted) continue;
    const deadline = ms.teamDeadline || ms.officialDeadline;
    if (!deadline) continue;
    const deadlineDate = new Date(deadline);
    const hoursUntil = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 0) {
      notifications.push({
        id: `overdue-ms-${ms.id}`,
        userId: '',
        title: `Milestone Overdue: ${ms.name}`,
        message: `This milestone was due ${Math.abs(Math.round(hoursUntil))} hours ago`,
        type: 'task_overdue',
        read: false,
        createdAt: now.toISOString(),
      });
    } else if (hoursUntil <= 24) {
      notifications.push({
        id: `due-ms-${ms.id}`,
        userId: '',
        title: `Milestone Due: ${ms.name}`,
        message: 'Due within 24 hours',
        type: 'deadline_approaching',
        read: false,
        createdAt: now.toISOString(),
      });
    }
  }

  return notifications;
}

export function getTimeRemaining(deadline: string): string {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const hoursUntil = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntil < 0) return `Overdue by ${Math.abs(Math.round(hoursUntil))}h`;
  if (hoursUntil < 1) return `${Math.round(hoursUntil * 60)}m remaining`;
  if (hoursUntil < 24) return `${Math.round(hoursUntil)}h remaining`;
  return `${Math.round(hoursUntil / 24)}d remaining`;
}

export function getDeadlineColor(deadline: string, status: string): string {
  if (status === 'completed') return 'text-emerald-600';
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const hoursUntil = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntil < 0) return 'text-red-600';
  if (hoursUntil <= 24) return 'text-amber-600';
  if (hoursUntil <= 72) return 'text-orange-600';
  return 'text-gray-600';
}
