const CACHE_NAME = "capstone-hub-v2";
const SHELL = ["/", "/offline.html"];
// Never cache Next.js build output: filenames may be reused across
// deploys in dev and a stale chunk breaks module instantiation.
const NEVER_CACHE = ["/_next/", "/sw.js"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch((err) => {
        // In dev, offline.html may not be precached yet; don't fail install
        console.warn("[SW] install cache failed", err);
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return undefined;
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Network-first for Supabase API calls
  if (url.href.includes("supabase")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Optionally cache successful GETs
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Never intercept build output or the worker itself
  if (NEVER_CACHE.some((prefix) => url.pathname.startsWith(prefix))) return;

  // Stale-while-revalidate for same-origin GET
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req)
          .then((res) => {
            if (res && res.status === 200 && res.type === "basic") {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return res;
          })
          .catch(() => {
            // If navigation request fails, return offline fallback if available
            if (req.mode === "navigate") {
              return caches.match("/offline.html").then((offline) => offline || caches.match("/offline") || caches.match("/"));
            }
            return undefined;
          });

        // Return cached immediately if present, otherwise wait for network
        return cached || networkFetch;
      })
    );
  }
});
