'use client';

import type { Task, Milestone, Notification } from '@/lib/types';
import { checkDeadlines } from '@/lib/deadlines';

// Track scheduled timeouts so we can clear them if needed
let scheduledTimeouts: number[] = [];

/**
 * Check if browser supports push notifications
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

/**
 * Wrapper around Notification API with serviceWorker fallback
 */
export function showNotification(
  title: string,
  body: string,
  options?: NotificationOptions
): void {
  if (typeof window === 'undefined') return;
  if (!isPushSupported()) return;
  if (Notification.permission !== 'granted') return;

  const baseOptions: NotificationOptions = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    ...options,
  };

  // Prefer serviceWorker registration if available
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready
        .then((registration) => {
          // Use serviceWorker showNotification if available
          if (registration && typeof registration.showNotification === 'function') {
            return registration.showNotification(title, baseOptions);
          }
          // Fallback to regular Notification
          new Notification(title, baseOptions);
        })
        .catch(() => {
          new Notification(title, baseOptions);
        });
      return;
    }
  } catch {
    // fall through to regular Notification
  }

  try {
    new Notification(title, baseOptions);
  } catch (err) {
    console.warn('showNotification failed', err);
  }
}

/**
 * Generate deadline notifications array (reuses existing deadline logic)
 */
export function generateDeadlineNotifications(
  tasks: Task[],
  milestones: Milestone[]
): Notification[] {
  return checkDeadlines(tasks, milestones);
}

/**
 * Alias for backwards compatibility
 */
export function getDeadlineNotifications(
  tasks: Task[],
  milestones: Milestone[]
): Notification[] {
  return generateDeadlineNotifications(tasks, milestones);
}

/**
 * Schedule deadline notifications for items due within 24h
 * Checks Notification permission, if granted schedules setTimeout to show Notification
 */
export async function scheduleDeadlineNotifications(
  tasks: Task[],
  milestones: Milestone[]
): Promise<number[]> {
  if (typeof window === 'undefined') return [];
  if (!isPushSupported()) return [];
  if (Notification.permission !== 'granted') return [];

  // Clear previous scheduled timeouts
  clearScheduledNotifications();

  const now = Date.now();
  const notifications = generateDeadlineNotifications(tasks, milestones);

  // Filter to only those deadlines within 24h that are not yet completed
  // checkDeadlines already categorizes by hoursUntil, so we reuse but also double-check
  const within24h: { notification: Notification; deadline: string }[] = [];

  for (const task of tasks) {
    const deadline = task.teamDeadline || task.officialDeadline;
    if (!deadline || task.status === 'completed') continue;
    const deadlineDate = new Date(deadline);
    const hoursUntil = (deadlineDate.getTime() - now) / (1000 * 60 * 60);
    if (hoursUntil >= 0 && hoursUntil <= 24) {
      const n = notifications.find((x) => x.id.includes(task.id));
      if (n) within24h.push({ notification: n, deadline });
    }
  }

  for (const ms of milestones) {
    if (ms.isCompleted) continue;
    const deadline = ms.teamDeadline || ms.officialDeadline;
    if (!deadline) continue;
    const deadlineDate = new Date(deadline);
    const hoursUntil = (deadlineDate.getTime() - now) / (1000 * 60 * 60);
    if (hoursUntil >= 0 && hoursUntil <= 24) {
      const n = notifications.find((x) => x.id.includes(ms.id));
      if (n) within24h.push({ notification: n, deadline });
    }
  }

  // Also include overdue items for immediate notification
  const overdue = notifications.filter((n) => n.type === 'task_overdue');
  for (const n of overdue) {
    if (!within24h.find((w) => w.notification.id === n.id)) {
      within24h.push({ notification: n, deadline: new Date().toISOString() });
    }
  }

  const timeoutIds: number[] = [];

  for (const { notification, deadline } of within24h) {
    const deadlineMs = new Date(deadline).getTime();
    const delay = deadlineMs - now;

    // If already overdue (delay <0) show immediately
    if (delay <= 0) {
      showNotification(notification.title, notification.message, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      });
      continue;
    }

    // Cap delay to 24h max, but also ensure we don't schedule too far
    // If delay > 24h we skip (already filtered)
    // For demo purposes, if delay is very large (e.g., 23h), we still schedule
    // Browsers may throttle, but we proceed
    const timeoutId = window.setTimeout(() => {
      showNotification(notification.title, notification.message, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      });
    }, delay);

    timeoutIds.push(timeoutId);
    scheduledTimeouts.push(timeoutId);
  }

  // For notifications that are due within 1h or already overdue, also show a near-term reminder
  // Schedule an immediate check notification for items due within 24h (show now as preview if not overdue)
  // To avoid spamming, we only show overdue immediately; within-24h will fire at deadline time
  // Additionally, show a summary notification if there are items due soon
  if (within24h.length > 0 && within24h.some((w) => w.notification.type !== 'task_overdue')) {
    // No immediate spam; relying on scheduled timeouts
  }

  return timeoutIds;
}

export function clearScheduledNotifications(): void {
  if (typeof window === 'undefined') return;
  for (const id of scheduledTimeouts) {
    clearTimeout(id);
  }
  scheduledTimeouts = [];
}

/**
 * Helper to check permission and schedule if granted - convenience wrapper
 */
export async function initDeadlinePushNotifications(
  tasks: Task[],
  milestones: Milestone[]
): Promise<void> {
  if (!isPushSupported()) return;
  if (Notification.permission !== 'granted') return;
  await scheduleDeadlineNotifications(tasks, milestones);
}
