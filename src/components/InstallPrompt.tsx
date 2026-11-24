'use client';

import { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      // check if user previously dismissed (persisted)
      try {
        const dismissed = localStorage.getItem('sch_install_dismissed');
        if (dismissed === 'true') {
          setIsVisible(false);
          return;
        }
      } catch {
        // ignore
      }
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsVisible(false);
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
    try {
      const choice = await deferredPrompt.userChoice;
      // optional handling based on choice.outcome
      void choice;
    } catch {
      // ignore
    }
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('sch_install_dismissed', 'true');
    } catch {
      // ignore
    }
    // keep deferredPrompt for potential future use until page reload, but hide banner
  };

  if (!isVisible || !deferredPrompt) return null;

  return (
    <div
      className="fixed bottom-24 lg:bottom-6 left-4 right-4 lg:left-4 lg:right-auto lg:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-2"
      role="dialog"
      aria-label="Install prompt"
    >
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-950 border border-teal-100 dark:border-teal-900 flex items-center justify-center">
            <Smartphone size={20} className="text-teal-700 dark:text-teal-300" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              Install STEM Capstone Hub
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Install the app for quick access and offline support.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:text-gray-500 -mr-1 -mt-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 min-h-[44px]"
          >
            <Download size={16} aria-hidden />
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="inline-flex items-center justify-center text-sm font-medium rounded-lg px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors min-h-[44px] min-w-[80px]"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
