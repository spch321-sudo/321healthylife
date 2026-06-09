/* NEW START 健康新生活 — Service Worker
   策略:
   - 導覽(HTML):network-first → 線上永遠拿最新版,離線時回退快取
   - 字型等資源:cache-first(背景更新)
   注意:本檔需與 index.html 放在 GitHub 同一資料夾。 */
const CACHE = 'newstart-shell-v16-2';

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(['./', 'index.html']).catch(function () {});
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  // HTML 導覽:先網路,失敗(離線)才回快取
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (r) {
        var cp = r.clone();
        caches.open(CACHE).then(function (c) { c.put(req, cp); });
        return r;
      }).catch(function () {
        return caches.match(req).then(function (m) {
          return m || caches.match('index.html') || caches.match('./');
        });
      })
    );
    return;
  }

  // 其他資源(字型/CDN):先快取,背景補抓更新
  e.respondWith(
    caches.match(req).then(function (m) {
      var fp = fetch(req).then(function (r) {
        if (r && r.status === 200 && (r.type === 'basic' || r.type === 'cors')) {
          var cp = r.clone();
          caches.open(CACHE).then(function (c) { c.put(req, cp); });
        }
        return r;
      }).catch(function () { return m; });
      return m || fp;
    })
  );
});
