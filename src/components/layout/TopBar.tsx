'use client';

import { useAppStore } from '@/lib/store';
import { usePathname } from 'next/navigation';
import { Menu, Bell, Search, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import SearchPalette from '@/components/search/SearchPalette';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/tasks': 'Tasks',
  '/calendar': 'Calendar',
  '/project': 'Project',
  '/files': 'Files',
  '/logbook': 'Logbook',
  '/rubric': 'Rubric',
  '/team': 'Team',
  '/issues': 'Issues',
  '/settings': 'Settings',
};

export default function TopBar() {
  const pathname = usePathname();
  const { currentUser, team, sidebarOpen, setSidebarOpen, notifications, searchOpen, setSearchOpen } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const pageTitle = PAGE_TITLES[pathname] || 'STEM Capstone Hub';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setSearchOpen]);

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800 flex items-center px-4 gap-3 shrink-0 sticky top-0 z-30">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 lg:hidden"
          >
            <Menu size={18} />
          </button>
        )}

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{pageTitle}</h1>
            {team && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {team.name} — {team.code}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label="Search project (Ctrl+K)"
            title="Search project (Ctrl+K)"
          >
            <Search size={18} />
          </button>

          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-gray-800">
            <div className="w-8 h-8 bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200 rounded-full flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">{currentUser?.name || 'Student'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{currentUser?.email || ''}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 z-50" onClick={() => setShowNotifications(false)}>
          <div className="absolute top-14 right-2 left-2 sm:left-auto sm:right-4 sm:w-80 bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
              <button onClick={() => setShowNotifications(false)} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Close</button>
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No notifications</div>
            ) : (
              notifications.slice(0, 10).map(n => (
                <div key={n.id} className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${!n.read ? 'bg-teal-50/50 dark:bg-teal-950/30' : ''}`}>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
