const CACHE='valen-v1';
const ASSETS=['/','/index.html','/dashboard.html','/about.html','/chat.html','/en/index.html','/en/dashboard.html','/en/about.html','/en/chat.html','/assets/style.css','/assets/app.js','/manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))))});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))) });