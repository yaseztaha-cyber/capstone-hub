import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || url === 'your-project-url-here' || !key) {
    throw new Error('Supabase not configured. Add your URL and anon key to .env.local');
  }
  client = createBrowserClient(url, key);
  return client;
}

let lastReachCheck = 0;
let lastReachResult = false;

// Deterministic connectivity probe: any HTTP response (even 4xx) proves the
// project host resolves and answers. Only a network-level throw means offline.
// Result is cached briefly so every keystroke doesn't re-probe.
export async function isCloudReachable(timeoutMs = 6000): Promise<boolean> {
  const now = Date.now();
  if (now - lastReachCheck < 60_000) return lastReachResult;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || url === 'your-project-url-here' || !key) {
    lastReachCheck = now;
    lastReachResult = false;
    return false;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    await fetch(`${url.replace(/\/$/, '')}/rest/v1/`, {
      method: 'GET',
      headers: { apikey: key },
      signal: ctrl.signal,
    });
    lastReachCheck = Date.now();
    lastReachResult = true;
    return true;
  } catch {
    lastReachCheck = Date.now();
    lastReachResult = false;
    return false;
  } finally {
    clearTimeout(timer);
  }
}
