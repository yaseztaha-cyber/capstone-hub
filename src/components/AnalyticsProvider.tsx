'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { pageview } from '@/lib/analytics';

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  useEffect(() => {
    if (!pathname) return;
    pageview(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!domain) return;
    if (typeof document === 'undefined') return;
    // Avoid duplicate script injection
    if (document.querySelector(`script[data-domain="${domain}"]`)) return;
    const script = document.createElement('script');
    script.defer = true;
    script.dataset.domain = domain;
    script.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(script);
  }, [domain]);

  return (
    <>
      {domain ? <script defer data-domain={domain} src="https://plausible.io/js/script.js" /> : null}
      {children}
    </>
  );
}
