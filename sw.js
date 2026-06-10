/* 321健康新生活 — 離線快取 Service Worker
   更新 App 後，把下面的版本號改一下（例如 v17 → v18），
   使用者重新開啟時就會自動下載最新版。 */
const CACHE = '321health-v18';
const ASSETS = ['./', './index.html'];

// 安裝：預先快取首頁
self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).catch(function () {})
  );
});

// 啟用：清掉舊版本快取
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) { return caches.delete(k); }
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

// 取用：先回快取（離線可用），同時背景更新
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') { return; }
  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
