/* 321健康新生活 Service Worker — 改版時請將 CACHE 版本 +1 */
const CACHE = 'newstart321-v1';
const ASSETS = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS);}).catch(function(){}));
});
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    }).then(function(){return self.clients.claim();})
  );
});
self.addEventListener('fetch', function(e){
  if(e.request.method!=='GET') return;
  e.respondWith(
    caches.match(e.request).then(function(cached){
      var net = fetch(e.request).then(function(resp){
        if(resp && resp.status===200 && resp.type==='basic'){
          var cp=resp.clone(); caches.open(CACHE).then(function(c){c.put(e.request,cp);});
        }
        return resp;
      }).catch(function(){ return cached; });
      return cached || net;   /* 先回快取（離線可用），背景再更新 */
    })
  );
});
