const CACHE_NAME = "astro-orbit-v1.0.0";
const STATIC_CACHE = "astro-orbit-static-v1.0.0";
const DYNAMIC_CACHE = "astro-orbit-dynamic-v1.0.0";
const IMAGE_CACHE = "astro-orbit-images-v1.0.0";

const SCOPE_PATH = new URL(self.registration.scope).pathname.replace(/\/+$/, "");
const withScope = (path) => `${SCOPE_PATH}${path}`;

const STATIC_ASSETS = [
  withScope("/offline/"),
  withScope("/site.webmanifest"),
  withScope("/brand/orbit-logo.svg"),
  withScope("/brand/orbit-logo-32.png"),
  withScope("/brand/orbit-logo-192.png"),
  withScope("/brand/apple-touch-icon.png"),
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error("[SW] Cache failed:", error);
      }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== IMAGE_CACHE) {
              return caches.delete(cacheName);
            }
          }),
        ),
      ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!url.protocol.startsWith("http") || url.origin !== self.location.origin) return;

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const normalizedPath =
    url.pathname.length > 1 && url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;

  try {
    if (STATIC_ASSETS.includes(url.pathname) || STATIC_ASSETS.includes(`${normalizedPath}/`)) {
      return await cacheFirst(request, STATIC_CACHE);
    }

    if (request.destination === "image" || /\.(jpg|jpeg|png|gif|svg|webp|avif)$/i.test(url.pathname)) {
      return await cacheFirst(request, IMAGE_CACHE, 30 * 24 * 60 * 60 * 1000);
    }

    if (
      request.destination === "document" ||
      url.pathname.startsWith(withScope("/blog/")) ||
      url.pathname.startsWith(withScope("/zh/")) ||
      url.pathname.startsWith(withScope("/en/")) ||
      url.pathname.startsWith(withScope("/galleries/")) ||
      url.pathname.startsWith(withScope("/notes/"))
    ) {
      return await networkFirst(request, DYNAMIC_CACHE, 0);
    }

    if (url.pathname.startsWith(withScope("/api/"))) {
      return await networkFirst(request, DYNAMIC_CACHE, 5 * 60 * 1000);
    }

    return await networkFirst(request, DYNAMIC_CACHE);
  } catch (error) {
    console.error("[SW] Request handling failed:", error);

    if (request.destination === "document") {
      const cache = await caches.open(STATIC_CACHE);
      return (
        (await cache.match(withScope("/offline/"))) ||
        (await cache.match(withScope("/offline"))) ||
        new Response("Network connection unavailable. Please check your connection and try again.", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      );
    }

    throw error;
  }
}

async function cacheFirst(request, cacheName, maxAge = 24 * 60 * 60 * 1000) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const dateHeader = cached.headers.get("date");
    const cachedTime = dateHeader ? new Date(dateHeader).getTime() : 0;
    if (Date.now() - cachedTime < maxAge) {
      fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
        })
        .catch(() => {});
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

async function networkFirst(request, cacheName, timeout = 3000) {
  const cache = await caches.open(cacheName);

  try {
    let response;
    if (timeout > 0) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      response = await fetch(request, { signal: controller.signal });
      clearTimeout(timeoutId);
    } else {
      response = await fetch(request);
    }
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (event.data && event.data.type === "CLEAR_CACHE") {
    caches.keys().then((cacheNames) => {
      Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName))).then(() => {
        event.ports?.[0]?.postMessage({ success: true });
      });
    });
  }
});
