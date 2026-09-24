const CACHE_NAME = 'app-v6'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (url.origin === location.origin && url.pathname.startsWith('/cdn-cgi/rum')) {
    event.respondWith(
      Promise.resolve(new Response(null, {
        status: 204,
        headers: { 'Cache-Control': 'no-store' }
      }))
    )
    return
  }

  if (request.method !== 'GET') return
  if (url.origin !== location.origin) return
  if (url.pathname.startsWith('/cdn-cgi/')) return
  if (url.pathname.startsWith('/api')) return
  if (request.mode === 'navigate') return
  // 构建产物都带内容哈希，交给浏览器的 immutable 缓存处理。
  // 避免旧 Service Worker 将 Nginx 的 SPA fallback HTML 缓存为 JS/CSS。
  if (url.pathname.startsWith('/assets/')) return

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      const cached = await cache.match(request)
      if (cached) return cached

      try {
        const response = await fetch(request)
        if (response.ok) {
          await cache.put(request, response.clone())
        }
        return response
      } catch {
        return new Response('Network error', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        })
      }
    })()
  )
})
