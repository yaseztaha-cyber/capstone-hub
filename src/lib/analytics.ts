declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, any> }) => void;
  }
}

export interface AnalyticsEvent {
  event: string;
  props?: Record<string, any>;
  at: string;
}

const STORAGE_KEY = 'sch_analytics_log';
const MAX_EVENTS = 200;

function readLog(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Real local event log (capped). Forwards to Plausible when configured.
export function track(event: string, props?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  try {
    const log = readLog();
    log.push({ event, props, at: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log.slice(-MAX_EVENTS)));
  } catch {}
  if (window.plausible) {
    try {
      window.plausible(event, { props });
    } catch {}
  }
}

export function pageview(url: string) {
  track('pageview', { url });
}

export function getAnalyticsLog(): AnalyticsEvent[] {
  return readLog();
}

export function clearAnalyticsLog() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
