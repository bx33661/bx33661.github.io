const CACHE_NAME = 'bx-blog-v1.1.0'
const STATIC_CACHE = 'bx-blog-static-v1.1.0'
const DYNAMIC_CACHE = 'bx-blog-dynamic-v1.1.0'
const IMAGE_CACHE = 'bx-blog-images-v1.1.0'

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/blog/',
  '/about/',
  '/album/',
  '/offline/',
  '/site.webmanifest',
  '/logo.svg',
  '/fonts/ClashDisplay-Semibold.woff2',
  '/fonts/GeistVF.woff2',
  '/fonts/GeistMonoVF.woff2',
  '/favicon.ico',
  '/logo.ico',
  '/logo.png'
]

// 安装 Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[SW] Static assets cached')
        return self.skipWaiting()
      })
      .catch(error => {
        console.error('[SW] Cache failed:', error)
      })
  )
})

// 激活 Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Activating...')
  
  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // 立即控制所有客户端
      self.clients.claim()
    ])
  )
})

// 拦截网络请求
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // 只处理 HTTP/HTTPS 请求
  if (!url.protocol.startsWith('http')) {
    return
  }

  // 跳过 Google Analytics 等统计服务
  if (url.origin.includes('google-analytics.com') || 
      url.origin.includes('googletagmanager.com') ||
      url.origin.includes('ahrefs.com')) {
    return
  }

  event.respondWith(
    handleRequest(request)
  )
})

// 处理请求的策略
async function handleRequest(request) {
  const url = new URL(request.url)
  const normalizedPath =
    url.pathname.length > 1 && url.pathname.endsWith('/')
      ? url.pathname.slice(0, -1)
      : url.pathname
  
  try {
    // 1. 静态资源：缓存优先
    if (STATIC_ASSETS.includes(url.pathname) || STATIC_ASSETS.includes(`${normalizedPath}/`)) {
      return await cacheFirst(request, STATIC_CACHE)
    }
    
    // 2. 图片资源：缓存优先，但在线更新
    if (request.destination === 'image' || 
        url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
      return await cacheFirst(request, IMAGE_CACHE, 30 * 24 * 60 * 60 * 1000) // 30天
    }
    
    // 3. HTML 页面：网络优先，缓存备用
    if (request.destination === 'document' || 
        url.pathname.startsWith('/blog/') ||
        url.pathname.startsWith('/album/') ||
        url.pathname.startsWith('/notes/') ||
        url.pathname.startsWith('/tags/')) {
      return await networkFirst(request, DYNAMIC_CACHE)
    }
    
    // 4. API 请求：网络优先
    if (url.pathname.startsWith('/api/')) {
      return await networkFirst(request, DYNAMIC_CACHE, 5 * 60 * 1000) // 5分钟
    }
    
    // 5. 其他资源：网络优先，缓存备用
    return await networkFirst(request, DYNAMIC_CACHE)
    
  } catch (error) {
    console.error('[SW] Request handling failed:', error)
    
    // 返回离线页面
    if (request.destination === 'document') {
      const cache = await caches.open(STATIC_CACHE)
      return await cache.match('/offline') || 
             new Response('网络连接失败，请检查网络连接', {
               status: 503,
               statusText: 'Service Unavailable'
             })
    }
    
    throw error
  }
}

// 缓存优先策略
async function cacheFirst(request, cacheName, maxAge = 24 * 60 * 60 * 1000) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  if (cached) {
    const dateHeader = cached.headers.get('date')
    const cachedTime = dateHeader ? new Date(dateHeader).getTime() : 0
    const now = Date.now()
    
    // 检查缓存是否过期
    if (now - cachedTime < maxAge) {
      console.log('[SW] Cache hit:', request.url)
      // 在后台更新缓存
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone())
        }
      }).catch(() => {})
      
      return cached
    }
  }
  
  // 缓存未命中或过期，从网络获取
  try {
    const response = await fetch(request)
    if (response.ok) {
      console.log('[SW] Network fetch and cache:', request.url)
      await cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // 网络失败，返回缓存（即使过期）
    if (cached) {
      console.log('[SW] Network failed, using stale cache:', request.url)
      return cached
    }
    throw error
  }
}

// 网络优先策略
async function networkFirst(request, cacheName, timeout = 3000) {
  const cache = await caches.open(cacheName)
  
  try {
    // 设置超时
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(request, {
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      console.log('[SW] Network success, updating cache:', request.url)
      await cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url, error.message)
    
    const cached = await cache.match(request)
    if (cached) {
      console.log('[SW] Cache fallback:', request.url)
      return cached
    }
    
    throw error
  }
}

// 监听消息（用于手动缓存清理）
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      ).then(() => {
        event.ports[0].postMessage({ success: true })
      })
    })
  }
}) 
