'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';
import SkipLink from '@/components/a11y/SkipLink';
import { useAppStore } from '@/lib/store';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import HelpDialog from '@/components/HelpDialog';
import { HelpCircle } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading, onboarded, currentUser, locale, sidebarOpen } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useKeyboardShortcuts({
    n: () => router.push('/tasks?new=1'),
    m: () => router.push('/meetings?new=1'),
    '?': () => setHelpOpen((v) => !v),
    'g d': () => router.push('/dashboard'),
    'g t': () => router.push('/tasks'),
    'g c': () => router.push('/calendar'),
    'g f': () => router.push('/files'),
    'g h': () => router.push('/chat'),
    'g p': () => router.push('/project'),
  });

  useEffect(() => { setMounted(true); }, []);

  // Body scroll lock when mobile sidebar is open (mirrors Sidebar logic for AppLayout overlay)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 1023px)');
    if (sidebarOpen && mql.matches) {
      document.body.style.overflow = 'hidden';
    } else if (!mql.matches) {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (mounted && !loading && !currentUser) {
      router.push('/auth/login');
    }
  }, [mounted, loading, currentUser, router]);

  useEffect(() => {
    if (mounted && !loading && currentUser && !onboarded && pathname !== '/onboarding') {
      router.push('/onboarding');
    }
  }, [mounted, loading, currentUser, onboarded, pathname, router]);

  if (!mounted || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-10 h-10 bg-teal-700 rounded-lg flex items-center justify-center mx-auto mb-3 animate-pulse">
            <span className="text-white text-lg font-bold">S</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  if (!onboarded) {
    return (
      <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <SkipLink />
        <main id="main-content" tabIndex={-1} className="focus:outline-none">
          {children}
        </main>
        <HelpDialog isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      </div>
    );
  }

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <SkipLink />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto overflow-x-hidden pb-20 lg:pb-0 bg-gray-50 dark:bg-gray-950 focus:outline-none"
          aria-label="Main content"
        >
          {children}
        </main>
      </div>
      <MobileNav />
      <HelpDialog isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      <button
        onClick={() => setHelpOpen(true)}
        className="hidden lg:flex fixed bottom-4 right-4 z-40 w-10 h-10 items-center justify-center bg-teal-700 dark:bg-teal-600 rounded-full shadow-lg hover:bg-teal-800 dark:hover:bg-teal-700 transition-colors text-white focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (?)"
      >
        <HelpCircle size={18} />
      </button>
    </div>
  );
}
