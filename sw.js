/**
 * 暖记 - WarmBook Service Worker
 * 缓存策略：Cache-First（静态资源）
 */

const CACHE_NAME = 'warmbook-cache-v5';
// 需要预缓存的文件列表
const PRECACHE_URLS = [
  'index.html',
  'manifest.json',
  'css/style.css?v=5',
  'js/i18n.js?v=5',
  'js/icons.js?v=5',
  'js/data.js?v=5',
  'js/components.js?v=5',
  'js/charts.js?v=5',
  'js/app.js?v=5'
];

/**
 * install 事件：预缓存所有静态资源
 */
self.addEventListener('install', function (event) {
  console.log('[SW] 安装中，开始预缓存资源...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        console.log('[SW] 正在缓存资源列表:', PRECACHE_URLS);
        return cache.addAll(PRECACHE_URLS);
      })
      .then(function () {
        console.log('[SW] 所有资源缓存完成');
        // 立即激活，不等待旧的 service worker 被替换
        return self.skipWaiting();
      })
      .catch(function (error) {
        console.error('[SW] 预缓存失败:', error);
      })
  );
});

/**
 * activate 事件：清理旧版本缓存
 */
self.addEventListener('activate', function (event) {
  console.log('[SW] 激活中，清理旧缓存...');
  event.waitUntil(
    caches.keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function (name) {
              return name !== CACHE_NAME;
            })
            .map(function (name) {
              console.log('[SW] 删除旧缓存:', name);
              return caches.delete(name);
            })
        );
      })
      .then(function () {
        console.log('[SW] 旧缓存清理完成');
        // 立即控制所有页面
        return self.clients.claim();
      })
  );
});

/**
 * fetch 事件：缓存优先，网络回退
 */
self.addEventListener('fetch', function (event) {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function (cachedResponse) {
        if (cachedResponse) {
          // 缓存命中，直接返回缓存内容
          return cachedResponse;
        }
        // 缓存未命中，尝试从网络获取
        return fetch(event.request)
          .then(function (networkResponse) {
            // 检查是否是有效的响应
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type !== 'basic'
            ) {
              return networkResponse;
            }
            // 克隆响应并缓存（因为响应流只能被消费一次）
            var responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(function (cache) {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          })
          .catch(function (error) {
            console.warn('[SW] 网络请求失败，且无缓存可用:', event.request.url, error);
            // 可在此处返回离线回退页面
          });
      })
  );
});