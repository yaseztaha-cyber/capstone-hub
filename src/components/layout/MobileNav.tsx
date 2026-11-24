'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/useTranslations';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BookOpen,
  Users,
  FolderKanban,
  Folder,
  MoreHorizontal,
  X,
  DollarSign,
  MessageSquare,
  AlertTriangle,
  Download,
  Smartphone,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const PRIMARY_NAV = [
  { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/tasks', key: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/calendar', key: 'calendar', icon: Calendar, label: 'Calendar' },
  { href: '/project', key: 'project', icon: FolderKanban, label: 'Project' },
  { href: '/team', key: 'team', icon: Users, label: 'Team' },
];

const OVERFLOW_NAV = [
  { href: '/logbook', key: 'logbook', icon: BookOpen, label: 'Logbook' },
  { href: '/files', key: 'files', icon: Folder, label: 'Files' },
  { href: '/budget', key: 'budget', icon: DollarSign, label: 'Budget' },
  { href: '/chat', key: 'chat', icon: MessageSquare, label: 'Chat' },
  { href: '/issues', key: 'issues', icon: AlertTriangle, label: 'Issues' },
];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslations();
  const [moreOpen, setMoreOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    // handle userChoice outcome if needed
    void choice;
    setDeferredPrompt(null);
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const isOverflowActive = OVERFLOW_NAV.some((i) => isActive(i.href));

  return (
    <>
      {/* Overflow sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" aria-hidden={!moreOpen}>
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-16 left-2 right-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 mb-2">
              <span className="text-sm font-semibold text-gray-900">More</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            {/* Install app prompt in overflow */}
            {deferredPrompt && (
              <div className="mb-2">
                <button
                  onClick={() => {
                    handleInstall();
                    setMoreOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-teal-700 text-white hover:bg-teal-800 transition-colors min-h-[44px]"
                  aria-label="Install STEM Capstone Hub"
                >
                  <Download size={18} />
                  <Smartphone size={18} />
                  Install App
                </button>
              </div>
            )}
            <div className="grid grid-cols-4 gap-1">
              {OVERFLOW_NAV.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-colors min-h-[72px] justify-center',
                      active
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon size={22} className={cn(active ? 'text-teal-700' : 'text-gray-500')} />
                    <span className="text-center leading-tight line-clamp-1">
                      {t(item.key as 'dashboard') !== item.key ? t(item.key as 'dashboard') : item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav
        data-mobile-nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden pb-safe-nav"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-around h-16 px-1">
          {PRIMARY_NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[11px] font-medium transition-colors min-w-[56px] min-h-[44px] rounded-lg',
                  active ? 'text-teal-700 bg-teal-50' : 'text-gray-500 hover:text-gray-700 active:bg-gray-50'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={20} className={cn(active && 'text-teal-700')} strokeWidth={active ? 2.2 : 1.8} />
                <span className="leading-none truncate max-w-[60px]">
                  {t(item.key as 'dashboard') !== item.key ? t(item.key as 'dashboard') : item.label}
                </span>
              </Link>
            );
          })}

          {/* Install button - shown when beforeinstallprompt available */}
          {deferredPrompt && (
            <button
              onClick={handleInstall}
              className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[11px] font-medium transition-colors min-w-[56px] min-h-[44px] rounded-lg text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200"
              aria-label="Install app"
            >
              <Download size={20} className="text-teal-700" />
              <span className="leading-none flex items-center gap-0.5">
                <Smartphone size={10} className="hidden sm:inline" />
                Install
              </span>
            </button>
          )}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[11px] font-medium transition-colors min-w-[56px] min-h-[44px] rounded-lg',
              moreOpen || isOverflowActive ? 'text-teal-700 bg-teal-50' : 'text-gray-500 hover:text-gray-700 active:bg-gray-50'
            )}
            aria-expanded={moreOpen}
            aria-label="More navigation"
          >
            {moreOpen ? <X size={20} /> : <MoreHorizontal size={20} />}
            <span className="leading-none">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
