/* Maintain Ops Suite — Service Worker v3.24.6 */
const SHELL_CACHE = 'mos-shell-3.24.6';
const API_CACHE   = 'mos-api-3.24.6';

const SHELL_ASSETS = [
    self.registration.scope + 'js/ops_suite-main.js',
    self.registration.scope + 'css/ops_suite-style.css',
    self.registration.scope + 'img/app.svg',
];

// ── Install: pre-cache shell assets ──────────────────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(SHELL_CACHE).then(cache =>
            Promise.allSettled(SHELL_ASSETS.map(url => cache.add(url).catch(() => {})))
        )
    );
    self.skipWaiting();
});

// ── Activate: evict old cache versions ───────────────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== SHELL_CACHE && k !== API_CACHE)
                    .map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// ── Fetch: route by request type ─────────────────────────────────────────────
self.addEventListener('fetch', event => {
    const req = event.request;
    const url = new URL(req.url);

    // Only handle same-origin GET requests
    if (req.method !== 'GET') return;
    if (url.origin !== self.location.origin) return;

    // Never intercept Nextcloud core internals
    if (url.pathname.includes('/remote.php/')) return;
    if (url.pathname.includes('/ocs/'))        return;
    if (url.pathname.includes('/index.php/webdav')) return;

    // ── API calls: network-first, fall back to cached data ────────────────
    if (url.pathname.includes('/api/')) {
        event.respondWith(networkFirstApi(req));
        return;
    }

    // ── Static shell assets: cache-first, update in background ───────────
    const isStatic = /\.(js|css|svg|png|ico|woff2?|ttf)$/.test(url.pathname);
    if (isStatic) {
        event.respondWith(cacheFirstStatic(req));
        return;
    }

    // ── App pages: network with cache fallback ────────────────────────────
    event.respondWith(
        fetch(req).catch(() => caches.match(req))
    );
});

async function networkFirstApi(req) {
    const cache = await caches.open(API_CACHE);
    try {
        const response = await fetch(req);
        if (response.ok) {
            // Store response and record sync timestamp
            cache.put(req, response.clone());
            cache.put('__last_sync__', new Response(Date.now().toString(), {
                headers: { 'Content-Type': 'text/plain' }
            }));
        }
        return response;
    } catch {
        // Network failed — serve from cache
        const cached = await cache.match(req);
        if (cached) {
            // Clone with an extra header so the app knows this is stale
            const body = await cached.text();
            return new Response(body, {
                status: cached.status,
                headers: {
                    'Content-Type': cached.headers.get('Content-Type') || 'application/json',
                    'X-MOS-Offline': 'true',
                },
            });
        }
        // Nothing cached — return empty JSON so the UI doesn't crash
        return new Response('[]', {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-MOS-Offline': 'true' },
        });
    }
}

async function cacheFirstStatic(req) {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
        const response = await fetch(req);
        if (response.ok) {
            const cache = await caches.open(SHELL_CACHE);
            cache.put(req, response.clone());
        }
        return response;
    } catch {
        return new Response('', { status: 503 });
    }
}

// ── Message: allow page to request last sync time ────────────────────────────
self.addEventListener('message', async event => {
    if (event.data === 'getLastSync') {
        const cache  = await caches.open(API_CACHE);
        const stored = await cache.match('__last_sync__');
        const ts     = stored ? await stored.text() : null;
        event.ports[0].postMessage(ts ? parseInt(ts) : null);
    }
    if (event.data === 'clearApiCache') {
        await caches.delete(API_CACHE);
        event.ports[0].postMessage('cleared');
    }
});
