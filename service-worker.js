const CACHE = 'nrss26-v6';
const CORE = [
  './', './index.html', './styles.css', './app.js', './conference-data.json', './manifest.json',
  './assets/summit-logo.png', './assets/mountain-brand.png', './assets/icon-192.png', './assets/icon-512.png',
  './assets/arizona-science-center.png', './assets/scitech-institute.png', './assets/midwestern-university.png',
  './assets/burton-family-foundation.png', './assets/freeport-mcmoran.png', './assets/srp.png'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(resp => {
    const copy = resp.clone(); caches.open(CACHE).then(c=>c.put(event.request,copy)); return resp;
  }).catch(()=>caches.match(event.request).then(r=>r || caches.match('./index.html'))));
});
