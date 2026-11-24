'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, formatRelativeTime, formatDate } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { useTranslations } from '@/lib/useTranslations';
import DeadlineCard from '@/components/notifications/DeadlineCard';
import Toast from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { isPushSupported, requestNotificationPermission } from '@/lib/pushNotifications';
import {
  LayoutDashboard, CheckSquare, Calendar, FolderKanban, Folder,
  BookOpen, ClipboardList, Users, Settings, X, ChevronLeft, ChevronRight,
  Bell, AlertTriangle, MessageSquare, DollarSign, CalendarClock, Share2,
  Check, Clock, Plug
} from 'lucide-react';

const NAV_KEYS = [
  { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/notifications', key: 'notifications', icon: Bell },
  { href: '/tasks', key: 'tasks', icon: CheckSquare },
  { href: '/calendar', key: 'calendar', icon: Calendar },
  { href: '/project', key: 'project', icon: FolderKanban },
  { href: '/files', key: 'files', icon: Folder },
  { href: '/logbook', key: 'logbook', icon: BookOpen },
  { href: '/rubric', key: 'rubric', icon: ClipboardList },
  { href: '/team', key: 'team', icon: Users },
  { href: '/issues', key: 'issues', icon: AlertTriangle },
  { href: '/presentation', key: 'presentation', icon: LayoutDashboard },
  { href: '/chat', key: 'chat', icon: MessageSquare },
  { href: '/budget', key: 'budget', icon: DollarSign },
  { href: '/meetings', key: 'meetings', icon: CalendarClock },
  { href: '/share', key: 'share', icon: Share2 },
  { href: '/integrations', key: 'integrations', icon: Plug },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, notifications } = useAppStore();
  const { t } = useTranslations();
  const unreadCount = notifications.filter(n => !n.read).length;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, [notificationsOpen]);

  const filtered = useMemo(() => {
    if (activeTab === 'unread') return notifications.filter(n => !n.read);
    return notifications;
  }, [notifications, activeTab]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof notifications> = {};
    for (const n of filtered.slice(0, 20)) {
      const key = n.type || 'other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    }
    return groups;
  }, [filtered]);

  const handleMarkAllRead = () => {
    const unread = notifications.filter(n => !n.read);
    unread.forEach(n => useAppStore.getState().markNotificationReadAction(n.id));
    // also update local state optimistically
    useAppStore.setState((s) => ({
      notifications: s.notifications.map(nn => ({ ...nn, read: true }))
    }));
    setToast({ message: 'All notifications marked as read', type: 'success' });
  };

  const handleClear = () => {
    if (filtered.length === 0) return;
    if (activeTab === 'unread') {
      // clear only unread by marking read and hiding? For simplicity clear unread
      const ids = new Set(filtered.map(n => n.id));
      useAppStore.setState((s) => ({
        notifications: s.notifications.filter(n => !ids.has(n.id))
      }));
    } else {
      useAppStore.setState({ notifications: [] });
    }
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
    } else if (perm === 'denied') {
      setToast({ message: 'Notification permission denied', type: 'error' });
    } else {
      setToast({ message: 'Notification permission dismissed', type: 'info' });
    }
  };

  // Body scroll lock when sidebar overlay is open on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;
    if (sidebarOpen && isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [sidebarOpen]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    if (!notificationsOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-notifications-dropdown]') && !target.closest('[data-notifications-button]')) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notificationsOpen]);

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800 flex flex-col transition-all duration-200',
        'lg:sticky lg:top-0 lg:h-screen',
        sidebarOpen ? 'w-60' : 'w-0 lg:w-16',
        !sidebarOpen && 'overflow-hidden lg:overflow-visible'
      )}>
        <div className={cn('flex items-center h-14 px-4 border-b border-gray-200 dark:border-gray-800 shrink-0', !sidebarOpen && 'lg:justify-center')}>
          {sidebarOpen && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-7 h-7 bg-teal-700 rounded-md flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">STEM Capstone</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Hub</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn('p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors', !sidebarOpen && 'hidden lg:flex')}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {sidebarOpen && (
          <div className="px-3 py-2 flex gap-2 border-b border-gray-100 dark:border-gray-800">
            <div className="relative" data-notifications-dropdown>
              <button
                data-notifications-button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                aria-expanded={notificationsOpen}
                aria-haspopup="true"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-[300px] sm:w-[380px] max-w-[90vw] bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded-xl shadow-xl z-50 flex flex-col max-h-[520px] overflow-hidden">
                  {/* Header */}
                  <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                        {unreadCount > 0 && <Badge variant="danger" size="sm">{unreadCount} new</Badge>}
                      </div>
                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Close notifications"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {/* Tabs */}
                    <div className="flex items-center gap-1 mt-3 bg-gray-50 dark:bg-gray-800 p-1 rounded-lg w-fit">
                      <button
                        onClick={() => setActiveTab('all')}
                        className={cn('px-3 py-1.5 text-xs font-medium rounded-md transition-colors', activeTab === 'all' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200')}
                      >
                        All <span className="ml-1 text-[11px] bg-gray-100 dark:bg-gray-600 dark:text-gray-200 px-1.5 py-0.5 rounded-full">{notifications.length}</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('unread')}
                        className={cn('px-3 py-1.5 text-xs font-medium rounded-md transition-colors', activeTab === 'unread' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200')}
                      >
                        Unread <span className="ml-1 text-[11px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                      </button>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                        <Check size={12} /> Mark all read
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-gray-600 dark:text-gray-400" onClick={handleClear} disabled={filtered.length === 0}>
                        <X size={12} /> Clear
                      </Button>
                      <Link href="/notifications" onClick={() => setNotificationsOpen(false)} className="ml-auto text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium">View all</Link>
                    </div>
                    {/* Enable notifications */}
                    {isPushSupported() && permission !== 'granted' && (
                      <div className="mt-3">
                        <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5 justify-center" onClick={handleEnableNotifications}>
                          <Bell size={12} /> Enable Notifications
                        </Button>
                        <p className="text-[11px] text-gray-400 text-center mt-1">Get deadline alerts even when app is closed</p>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-3">
                    {filtered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                        <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                          <Bell size={22} className="text-gray-300 dark:text-gray-500" />
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{activeTab === 'unread' ? 'No unread notifications' : 'All caught up!'}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[220px]">
                          {activeTab === 'unread' ? 'You have no unread notifications. Switch to All to see read items.' : 'You have no notifications at the moment. Deadlines and mentions will appear here.'}
                        </p>
                        {activeTab === 'unread' && notifications.length > 0 && (
                          <Button variant="ghost" size="sm" className="mt-3" onClick={() => setActiveTab('all')}>Show all</Button>
                        )}
                      </div>
                    ) : (
                      Object.entries(grouped).map(([type, items]) => (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center gap-2 px-1">
                            <span className={cn('w-2 h-2 rounded-full', type === 'task_overdue' ? 'bg-red-500' : type === 'task_due' ? 'bg-amber-500' : type === 'deadline_approaching' ? 'bg-blue-500' : 'bg-gray-400')} />
                            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                              {type === 'task_overdue' ? 'Overdue' : type === 'task_due' ? 'Due Soon' : type === 'deadline_approaching' ? 'Approaching' : type.replace(/_/g, ' ')}
                            </h4>
                            <span className="text-[11px] text-gray-400">· {items.length}</span>
                            <span className="ml-auto text-[11px] text-gray-400 flex items-center gap-1">
                              <Clock size={10} /> {items[0] ? formatRelativeTime(items[0].createdAt) : ''}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {items.map((notification) => (
                              <DeadlineCard key={notification.id} notification={notification} />
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {filtered.length > 0 && (
                    <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">{filtered.length} notification{filtered.length !== 1 ? 's' : ''} · Updated {formatDate(notifications[0]?.createdAt || new Date().toISOString())}</span>
                      <Link href="/notifications" onClick={() => setNotificationsOpen(false)}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">Open Center</Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2" aria-label="Main navigation">
          {NAV_KEYS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            const label = item.key === 'notifications' ? 'Notifications' : t(item.key as 'dashboard');
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                aria-label={label}
                className={cn(
                  'flex items-center gap-3 mx-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  !sidebarOpen && 'lg:justify-center lg:mx-1',
                  isActive ? 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                )}
                title={!sidebarOpen ? label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {sidebarOpen && (
                  <span className="flex-1 flex items-center justify-between gap-2">
                    <span>{label}</span>
                    {item.key === 'notifications' && unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{unreadCount > 99 ? '99+' : unreadCount}</span>
                    )}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-3">
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-colors">
              <Settings size={18} />
              <span>{t('settings')}</span>
            </Link>
          </div>
        )}
      </aside>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
