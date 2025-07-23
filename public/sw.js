const CACHE_NAME = 'bx-site-v1.0.0'
const urlsToCache = [
  '/',
  '/blog',
  '/projects',
  '/about',
  '/offline.html',
  '/fonts/GeistVF.woff2',
  '/fonts/GeistMonoVF.woff2',
  '/fonts/ClashDisplay-Semibold.woff2',
  '/favicon.ico',
  '/logo.png',
  '/ogImage.png'
]

// 安装事件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache)
      })
  )
  self.skipWaiting()
})

// 激活事件
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// 请求拦截
self.addEventListener('fetch', (event) => {
  // 只缓存GET请求
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果有缓存，返回缓存
        if (response) {
          return response
        }

        return fetch(event.request).then((response) => {
          // 检查响应有效性
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // 克隆响应
          const responseToCache = response.clone()

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })

          return response
        }).catch(() => {
          // 网络失败时，对于页面请求返回离线页面
          if (event.request.destination === 'document') {
            return caches.match('/offline.html')
          }
        })
      })
  )
})

// 消息处理
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
}) 