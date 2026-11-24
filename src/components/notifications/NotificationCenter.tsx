'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import EmptyState from '@/components/ui/EmptyState';
import Toast from '@/components/ui/Toast';
import DeadlineCard from '@/components/notifications/DeadlineCard';
import { formatRelativeTime, formatDate } from '@/lib/utils';
import { isPushSupported, requestNotificationPermission, scheduleDeadlineNotifications, showNotification } from '@/lib/pushNotifications';
import { Bell, Check, X, Clock, AlertTriangle, Search, Trash2, Filter, BellRing, CheckCheck } from 'lucide-react';

export default function NotificationCenter() {
  const { notifications, tasks, milestones } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Auto-schedule deadline notifications when permission granted
  useEffect(() => {
    if (permission === 'granted' && tasks.length > 0) {
      scheduleDeadlineNotifications(tasks, milestones);
    }
  }, [permission, tasks, milestones]);

  const types = useMemo(() => {
    const s = new Set(notifications.map(n => n.type));
    return Array.from(s);
  }, [notifications]);

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (filterType !== 'all' && n.type !== filterType) return false;
      if (filterRead === 'unread' && n.read) return false;
      if (filterRead === 'read' && !n.read) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q) || n.type.toLowerCase().includes(q);
      }
      return true;
    });
  }, [notifications, filterType, filterRead, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const n of filtered) {
      const key = n.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    }
    return groups;
  }, [filtered]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const selectedCount = selectedIds.size;
  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(n => n.id)));
  };

  const handleMarkAllRead = () => {
    const unread = notifications.filter(n => !n.read);
    unread.forEach(n => useAppStore.getState().markNotificationReadAction(n.id));
    useAppStore.setState((s) => ({
      notifications: s.notifications.map(nn => ({ ...nn, read: true }))
    }));
    setToast({ message: 'All notifications marked as read', type: 'success' });
  };

  const handleMarkSelectedRead = () => {
    selectedIds.forEach(id => useAppStore.getState().markNotificationReadAction(id));
    useAppStore.setState((s) => ({
      notifications: s.notifications.map(nn => selectedIds.has(nn.id) ? { ...nn, read: true } : nn)
    }));
    setSelectedIds(new Set());
    setToast({ message: `${selectedCount} notifications marked as read`, type: 'success' });
  };

  const handleClearSelected = () => {
    useAppStore.setState((s) => ({
      notifications: s.notifications.filter(n => !selectedIds.has(n.id))
    }));
    setSelectedIds(new Set());
    setToast({ message: 'Selected notifications removed', type: 'info' });
  };

  const handleClearAll = () => {
    if (filtered.length === 0) return;
    if (filterRead === 'all' && !search && filterType === 'all') {
      useAppStore.setState({ notifications: [] });
    } else {
      const ids = new Set(filtered.map(n => n.id));
      useAppStore.setState((s) => ({
        notifications: s.notifications.filter(n => !ids.has(n.id))
      }));
    }
    setSelectedIds(new Set());
    setToast({ message: 'Notifications cleared', type: 'info' });
  };

  const handleEnableNotifications = async () => {
    if (!isPushSupported()) {
      setToast({ message: 'Push notifications not supported in this browser', type: 'error' });
      return;
    }
    const perm = await requestNotificationPermission();
    setPermission(perm);
    if (perm === 'granted') {
      setToast({ message: 'Notifications enabled!', type: 'success' });
      await scheduleDeadlineNotifications(tasks, milestones);
      // Test notification
      showNotification('Notifications enabled', 'You will receive deadline alerts up to 24h before due dates', {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      });
    } else if (perm === 'denied') {
      setToast({ message: 'Permission denied. Enable in browser settings.', type: 'error' });
    } else {
      setToast({ message: 'Permission dismissed', type: 'info' });
    }
  };

  const handleTestNotification = () => {
    if (!isPushSupported() || permission !== 'granted') {
      setToast({ message: 'Enable notifications first', type: 'error' });
      return;
    }
    showNotification('STEM Capstone Hub', 'This is a test notification 🔔', {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    });
    setToast({ message: 'Test notification sent', type: 'success' });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Bell size={20} className="text-teal-600" />
            Notification Center
            {unreadCount > 0 && <Badge variant="danger">{unreadCount} unread</Badge>}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage deadline alerts, mentions and system notifications · {notifications.length} total
          </p>
          {filtered.length > 0 && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Clock size={12} /> Last updated {formatRelativeTime(filtered[0].createdAt)} · {formatDate(filtered[0].createdAt)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isPushSupported() && permission !== 'granted' ? (
            <Button variant="primary" size="sm" className="gap-1.5" onClick={handleEnableNotifications}>
              <BellRing size={14} /> Enable Notifications
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleTestNotification}>
              <BellRing size={14} /> Test
            </Button>
          )}
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            <CheckCheck size={14} /> Mark all read
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-red-600 hover:text-red-700" onClick={handleClearAll} disabled={filtered.length === 0}>
            <Trash2 size={14} /> Clear
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[160px]"
            >
              <option value="all">All types</option>
              {types.map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <Tabs
            tabs={[
              { id: 'all', label: 'All', count: notifications.length },
              { id: 'unread', label: 'Unread', count: unreadCount },
              { id: 'read', label: 'Read', count: notifications.length - unreadCount },
            ]}
            activeTab={filterRead}
            onChange={(id) => setFilterRead(id as any)}
          />
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Filter size={12} /> {filtered.length} result{filtered.length !== 1 ? 's' : ''} {search && `for "${search}"`}
          </div>
        </div>

        {/* Bulk actions */}
        {filtered.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap p-2 bg-gray-50 rounded-lg border border-gray-100">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">
                {allSelected ? 'Deselect all' : 'Select all'}
              </span>
            </label>
            {selectedCount > 0 && (
              <>
                <span className="text-xs text-gray-500 ml-2">{selectedCount} selected</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 ml-2" onClick={handleMarkSelectedRead}>
                  <Check size={12} /> Mark read
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-red-600" onClick={handleClearSelected}>
                  <X size={12} /> Remove
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedIds(new Set())}>
                  Clear selection
                </Button>
              </>
            )}
            <span className="ml-auto text-xs text-gray-400 hidden sm:inline">
              Grouped by type · {Object.keys(grouped).length} groups
            </span>
          </div>
        )}
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Bell size={40} />}
            title={search || filterType !== 'all' || filterRead !== 'all' ? 'No matching notifications' : 'No notifications'}
            description={
              search || filterType !== 'all' || filterRead !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'All caught up! Deadline and system notifications will appear here. Enable push notifications to get alerts even when the app is closed.'
            }
            action={
              search || filterType !== 'all' || filterRead !== 'all' ? (
                <Button variant="outline" size="sm" onClick={() => { setSearch(''); setFilterType('all'); setFilterRead('all'); }}>
                  Clear filters
                </Button>
              ) : (
                isPushSupported() && permission !== 'granted' ? (
                  <Button variant="primary" size="sm" onClick={handleEnableNotifications} className="gap-1.5">
                    <Bell size={14} /> Enable Notifications
                  </Button>
                ) : undefined
              )
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, items]) => (
            <Card key={type} className="p-0 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${type === 'task_overdue' ? 'bg-red-500' : type === 'task_due' ? 'bg-amber-500' : type === 'deadline_approaching' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  {type.replace(/_/g, ' ')}
                </h3>
                <Badge variant={type === 'task_overdue' ? 'danger' : type === 'task_due' ? 'warning' : 'info'} size="sm">
                  {items.length}
                </Badge>
                <span className="ml-auto text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={12} /> {formatRelativeTime(items[0].createdAt)}
                  <span className="hidden sm:inline">· {formatDate(items[0].createdAt)}</span>
                </span>
              </div>
              <div className="p-3 space-y-3">
                {items.map((notification) => (
                  <div key={notification.id} className="flex gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(notification.id)}
                      onChange={() => toggleSelect(notification.id)}
                      className="mt-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <DeadlineCard notification={notification} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Footer info */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400 py-2">
        <AlertTriangle size={12} />
        <span>Notifications are generated from deadlines · Overdue and due-soon tasks appear automatically</span>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
