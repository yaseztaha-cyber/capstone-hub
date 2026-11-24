'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import type { Notification } from '@/lib/types';
import { getTimeRemaining, getDeadlineColor } from '@/lib/deadlines';
import { cn, formatRelativeTime } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Clock, AlertTriangle, Check, X, Bell } from 'lucide-react';
import { isPushSupported, showNotification } from '@/lib/pushNotifications';

interface DeadlineCardProps {
  notification: Notification;
  onSnooze?: (id: string, durationMs: number) => void;
}

const CATEGORY_DOT: Record<string, string> = {
  task_overdue: 'bg-red-500',
  task_due: 'bg-amber-500',
  deadline_approaching: 'bg-blue-500',
  task_assigned: 'bg-violet-500',
  file_updated: 'bg-emerald-500',
  comment_mention: 'bg-pink-500',
  rubric_attention: 'bg-orange-500',
  dependency_blocked: 'bg-red-600',
};

const CATEGORY_LABEL: Record<string, string> = {
  task_overdue: 'Overdue',
  task_due: 'Due Soon',
  deadline_approaching: 'Approaching',
  task_assigned: 'Assigned',
  file_updated: 'File',
  comment_mention: 'Mention',
  rubric_attention: 'Rubric',
  dependency_blocked: 'Blocked',
};

export default function DeadlineCard({ notification, onSnooze }: DeadlineCardProps) {
  const { markNotificationReadAction, tasks, milestones } = useAppStore();
  const [snoozedUntil, setSnoozedUntil] = useState<number | null>(null);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const snoozeRef = useRef<HTMLDivElement | null>(null);
  const hasNotifiedRef = useRef(false);

  const isOverdue = notification.type === 'task_overdue';
  const isTaskDue = notification.type === 'task_due';
  const isApproaching = notification.type === 'deadline_approaching';

  // Resolve task / milestone for deadline display
  const taskId = notification.id.replace(
    /^(overdue-task-|due-1h-task-|due-24h-task-|due-7d-task-|overdue-ms-|due-ms-)/,
    ''
  );
  const task = tasks.find((t) => t.id === taskId);
  const milestone = milestones.find((m) => m.id === taskId);
  const deadline = task?.teamDeadline || task?.officialDeadline || milestone?.teamDeadline || milestone?.officialDeadline;
  const status = task?.status || (milestone ? (milestone.isCompleted ? 'completed' : 'not_started') : '');
  const deadlineColor = deadline ? getDeadlineColor(deadline, status) : 'text-gray-600';

  const dotColor = CATEGORY_DOT[notification.type] || 'bg-gray-400';
  const categoryLabel = CATEGORY_LABEL[notification.type] || notification.type;

  // Time ago
  const timeAgo = formatRelativeTime(notification.createdAt);

  // Show browser notification when new deadline appears (if permission granted)
  useEffect(() => {
    if (hasNotifiedRef.current) return;
    hasNotifiedRef.current = true;
    if (!notification.read && isPushSupported() && typeof window !== 'undefined' && Notification.permission === 'granted') {
      // Only auto-notify for deadline-related types to avoid spam
      if (['task_overdue', 'task_due', 'deadline_approaching'].includes(notification.type)) {
        showNotification(notification.title, notification.message, {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
        });
      }
    }
  }, [notification.id, notification.read, notification.title, notification.message, notification.type]);

  // Hide while snoozed
  useEffect(() => {
    if (snoozedUntil === null) return;
    const remaining = snoozedUntil - Date.now();
    if (remaining <= 0) {
      setSnoozedUntil(null);
      return;
    }
    const t = window.setTimeout(() => setSnoozedUntil(null), remaining);
    return () => clearTimeout(t);
  }, [snoozedUntil]);

  // Close snooze menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (snoozeRef.current && !snoozeRef.current.contains(e.target as Node)) {
        setShowSnoozeMenu(false);
      }
    }
    if (showSnoozeMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSnoozeMenu]);

  if (snoozedUntil && Date.now() < snoozedUntil) {
    return null;
  }

  const handleSnooze = (durationMs: number) => {
    setSnoozedUntil(Date.now() + durationMs);
    setShowSnoozeMenu(false);
    if (onSnooze) {
      onSnooze(notification.id, durationMs);
    } else {
      // Default snooze behavior: dismiss now and schedule a browser notification later
      // Keep unread state but visually hide; schedule showNotification after duration
      window.setTimeout(() => {
        if (isPushSupported() && Notification.permission === 'granted') {
          showNotification(notification.title, notification.message, {
            icon: '/icon-192.png',
            badge: '/icon-192.png',
          });
        }
      }, durationMs);
    }
  };

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-colors group',
        isOverdue
          ? 'bg-red-50 border-red-200 hover:bg-red-100/60'
          : isTaskDue
            ? 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
            : isApproaching
              ? 'bg-blue-50/40 border-blue-200 hover:bg-blue-50/70'
              : 'bg-white border-gray-200 hover:bg-gray-50',
        !notification.read && 'ring-1 ring-teal-100'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Category dot + icon */}
        <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
          <span className={cn('w-2.5 h-2.5 rounded-full', dotColor)} aria-hidden />
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center',
              isOverdue
                ? 'bg-red-100 text-red-600'
                : isTaskDue
                  ? 'bg-amber-100 text-amber-600'
                  : isApproaching
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-500'
            )}
          >
            {isOverdue ? <AlertTriangle size={14} /> : isTaskDue ? <Clock size={14} /> : <Bell size={14} />}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-900 leading-tight">{notification.title}</p>
            <Badge variant={isOverdue ? 'danger' : isTaskDue ? 'warning' : isApproaching ? 'info' : 'default'} size="sm">
              {categoryLabel}
            </Badge>
            {!notification.read && <span className="w-2 h-2 bg-teal-500 rounded-full shrink-0" aria-label="unread" />}
          </div>

          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {deadline ? (
              <span className={cn('text-xs font-medium flex items-center gap-1', deadlineColor)}>
                <Clock size={12} />
                {getTimeRemaining(deadline)}
              </span>
            ) : null}
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              {timeAgo}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            {task && task.status !== 'completed' && (
              <Button
                variant="primary"
                size="sm"
                className="h-7 px-2.5 text-xs gap-1"
                onClick={() => {
                  const { updateTaskStatusAction } = useAppStore.getState();
                  updateTaskStatusAction(task.id, 'completed');
                  markNotificationReadAction(notification.id);
                }}
              >
                <Check size={12} />
                Mark Complete
              </Button>
            )}
            {milestone && !milestone.isCompleted && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => markNotificationReadAction(notification.id)}
              >
                Dismiss
              </Button>
            )}

            {/* Snooze */}
            <div className="relative" ref={snoozeRef}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs gap-1 text-gray-600"
                onClick={() => setShowSnoozeMenu((v) => !v)}
              >
                <Clock size={12} />
                Snooze
              </Button>
              {showSnoozeMenu && (
                <div className="absolute left-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1">
                  <button
                    onClick={() => handleSnooze(60 * 60 * 1000)}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Clock size={12} /> Snooze 1h
                  </button>
                  <button
                    onClick={() => handleSnooze(24 * 60 * 60 * 1000)}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Clock size={12} /> Snooze 1d
                  </button>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs text-gray-500"
              onClick={() => markNotificationReadAction(notification.id)}
            >
              Dismiss
            </Button>
          </div>
        </div>

        <button
          onClick={() => markNotificationReadAction(notification.id)}
          className="text-gray-400 hover:text-gray-600 shrink-0 p-1 rounded hover:bg-gray-100 transition-colors"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
