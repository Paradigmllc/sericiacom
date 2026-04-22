/*
 * Sericia storefront service worker — hand-rolled, no next-pwa.
 *
 * DESIGN CONTRACT
 * ---------------
 * 1. SCOPE: same-origin GET only. Cross-origin calls (Medusa API, Crossmint,
 *    fonts CDN) pass through untouched — the browser's HTTP cache handles them
 *    and we don't want to interpose a second layer that could serve stale
 *    responses from a third party.
 * 2. NEVER CACHE: /api/*, /cms/*, /admin/*. Auth, cart, checkout, and Payload
 *    admin must hit the network every time. Caching them creates logouts that
 *    aren't really logouts and carts that silently resurrect.
 * 3. CACHE STRATEGIES, by resource kind:
 *      - Navigation (HTML):    network-first, fall back to cached shell or
 *                              /offline.html when offline.
 *      - /_next/static/*:      cache-first. Next.js content-hashes these so
 *                              a new build always produces new URLs; the old
 *                              ones stay valid for already-open tabs.
 *      - Images/fonts/svg:     stale-while-revalidate. Cheap win for repeat
 *                              visits without holding back fresh edits.
 *      - Everything else:      passes through (no respondWith call).
 * 4. VERSIONING: bump VERSION below to force clients off stale caches on next
 *    activate. Old caches prefixed "sericia-" that don't match the active
 *    VERSION are deleted.
 * 5. PUSH: shows the notification from the server payload and routes clicks
 *    to the URL the sender supplied. No fallback UI — if the payload is
 *    malformed, the push is dropped silently (pre-existing tabs stay happy).
 *
 * See docs/pwa.md for a longer architectural walkthrough.
 */

const VERSION = "v1";
const CACHE_SHELL = `sericia-shell-${VERSION}`;
const CACHE_STATIC = `sericia-static-${VERSION}`;
const CACHE_RUNTIME = `sericia-runtime-${VERSION}`;

/**
 * Assets pre-cached on install. Keep this list tiny — every entry here is a
 * blocking fetch during install, and a single 404 causes the entire install
 * to fail. Only add resources guaranteed to exist at the published URL.
 */
const SHELL_ASSETS = [
  "/offline.html",
  "/favicon.svg",
  "/logo-mark.svg",
  "/manifest.json",
];

// ---------- Lifecycle ----------

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => cache.addAll(SHELL_ASSETS)),
  );
  // Take over immediately so the first page load after install is already
  // SW-controlled. Without this, the user has to hard-reload once before
  // offline mode works at all.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((n) => n.startsWith("sericia-") && !n.endsWith(VERSION))
        .map((n) => caches.delete(n)),
    );
    await self.clients.claim();
  })());
});

// ---------- Fetch routing ----------

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/cms")) return;
  if (url.pathname.startsWith("/admin")) return;

  if (req.mode === "navigate") {
    event.respondWith(networkFirstNavigation(req));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(req, CACHE_STATIC));
    return;
  }

  if (/\.(png|jpe?g|svg|webp|avif|gif|ico|woff2?|ttf)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req, CACHE_RUNTIME));
    return;
  }
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    // Only cache 2xx — avoids pinning 404 / 500 pages into the shell cache,
    // which would then get served when the user is offline and revisit the
    // same URL. Nothing worse than "offline fallback" being a stale 500.
    if (response.ok) {
      const shell = await caches.open(CACHE_SHELL);
      shell.put(request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(CACHE_SHELL);
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await cache.match("/offline.html");
    return offline ?? new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  // Return cached immediately if we have it; network fills in for next time.
  return cached ?? network;
}

// ---------- Push notifications ----------

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Sericia", body: event.data.text() };
  }
  const {
    title = "Sericia",
    body,
    url = "/",
    tag,
    icon,
    image,
    badge,
  } = payload;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon: icon ?? "/favicon.svg",
      image,
      badge: badge ?? "/favicon.svg",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil((async () => {
    // Prefer focusing an existing tab already on the target URL — the user
    // doesn't want a fifth Sericia tab when they already have one open.
    const all = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });
    for (const client of all) {
      if (client.url.includes(url) && "focus" in client) return client.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
