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

// F52: bumped from v1 → v2 to invalidate every cached HTML response
// from the v1 era. Reason: v1 cached navigation responses in
// CACHE_SHELL (see networkFirstNavigation pre-F52). Each cached HTML
// referenced /_next/static/chunks/<hash>.js URLs from that build.
// After a deploy, those chunk hashes no longer exist on origin, so a
// transient network blip during navigation made the SW fall back to
// stale cached HTML → React tried to load missing chunks → white
// page. v2 deletes the v1 caches on activate AND no longer caches
// navigation responses (see the rewritten networkFirstNavigation
// below — only /offline.html is cached, served only when truly
// offline). Future deploys do NOT need to bump VERSION further unless
// the SW logic itself changes.
const VERSION = "v2";
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
  // F52: removed navigation response caching. Pre-F52 we cached every 2xx
  // navigation response into CACHE_SHELL on the assumption that it would
  // be a useful offline fallback. In practice it caused white-page
  // outages: the cached HTML referenced /_next/static/chunks/<hash>.js
  // URLs from THAT build, and after the next deploy those hashes no
  // longer existed on origin. Any transient network blip during
  // navigation made the SW fall back to stale HTML → missing chunk
  // requests → React failed to hydrate → blank page. Symptom users saw:
  // "白くなる時や何回も読み込まないと表示されない".
  //
  // F52 fix: navigation always passes through to network. Offline
  // fallback is the pre-cached /offline.html only — it's static, has
  // no chunk dependencies, so it can never go stale. The trade-off is
  // we lose the "open recently-visited page while offline" capability
  // for routes that aren't /offline.html, which we accept because the
  // luxury-UX cost of intermittent white pages on live deploys is far
  // higher than the offline-revisit feature it bought us.
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(CACHE_SHELL);
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
