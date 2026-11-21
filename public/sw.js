const CACHE_NAME = "bx-blog-v1.4.0";
const STATIC_CACHE = "bx-blog-static-v1.4.0";
const DYNAMIC_CACHE = "bx-blog-dynamic-v1.4.0";
const IMAGE_CACHE = "bx-blog-images-v1.4.0";

// 需要缓存的静态资源
const STATIC_ASSETS = [
  "/offline/",
  "/site.webmanifest",
  "/brand/bx-logo.svg",
  "/brand/bx-logo-32.png",
  "/brand/bx-logo-192.png",
  "/brand/apple-touch-icon.png",
];

// 安装 Service Worker
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

// 激活 Service Worker
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

// 拦截网络请求
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // 只处理同源 HTTP/HTTPS 请求，避免缓存跨域/opaque 响应
  if (!url.protocol.startsWith("http") || url.origin !== self.location.origin) {
    return;
  }

  // CyberChef 静态包体积较大，保持网络直连，避免被站点缓存策略污染
  if (url.pathname.startsWith("/vendor/cyberchef/")) {
    return;
  }

  event.respondWith(handleRequest(request));
});

// 处理请求的策略
async function handleRequest(request) {
  const url = new URL(request.url);
  const normalizedPath =
    url.pathname.length > 1 && url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;

  try {
    // 1. 静态资源：缓存优先
    if (STATIC_ASSETS.includes(url.pathname) || STATIC_ASSETS.includes(`${normalizedPath}/`)) {
      return await cacheFirst(request, STATIC_CACHE);
    }

    // 2. 图片资源：缓存优先，但在线更新
    if (request.destination === "image" || /\.(jpg|jpeg|png|gif|svg|webp|avif)$/i.test(url.pathname)) {
      return await cacheFirst(request, IMAGE_CACHE, 30 * 24 * 60 * 60 * 1000);
    }

    // 3. HTML 页面：网络优先，缓存备用
    if (
      request.destination === "document" ||
      url.pathname.startsWith("/blog/") ||
      url.pathname.startsWith("/en/") ||
      url.pathname.startsWith("/galleries/") ||
      url.pathname.startsWith("/album/") ||
      url.pathname.startsWith("/notes/")
    ) {
      return await networkFirst(request, DYNAMIC_CACHE, 0);
    }

    // 4. API 请求：网络优先
    if (url.pathname.startsWith("/api/")) {
      return await networkFirst(request, DYNAMIC_CACHE, 5 * 60 * 1000);
    }

    // 5. 其他资源：网络优先，缓存备用
    return await networkFirst(request, DYNAMIC_CACHE);
  } catch (error) {
    console.error("[SW] Request handling failed:", error);

    // 返回离线页面
    if (request.destination === "document") {
      const cache = await caches.open(STATIC_CACHE);
      return (
        (await cache.match("/offline/")) ||
        (await cache.match("/offline")) ||
        new Response("网络连接失败，请检查网络连接", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      );
    }

    throw error;
  }
}

// 缓存优先策略
async function cacheFirst(request, cacheName, maxAge = 24 * 60 * 60 * 1000) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const dateHeader = cached.headers.get("date");
    const cachedTime = dateHeader ? new Date(dateHeader).getTime() : 0;
    const now = Date.now();

    if (now - cachedTime < maxAge) {
      fetch(request)
        .then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
        })
        .catch(() => {});

      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// 网络优先策略
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

    if (response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    throw error;
  }
}

// 监听消息（用于手动缓存清理）
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
