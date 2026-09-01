const CACHE = "kd-intelligence-v1.13.0";
const CORE = [
  "./",
  "./index.html",
  "./style.css?v=1.12.5",
  "./chart.js?v=1.12.0",
  "./brand-fallback.js?v=1.12.5",
  "./interaction-recovery.js?v=1.12.6",
  "./owner-auth-fixes.js?v=1.0.0",
  "./app.js?v=1.12.0",
  "./runtime-fixes.js?v=1.12.3",
  "./scanner-pro.js?v=1.12.0",
  "./auth.js?v=2.2.0",
  "./sw-register.js?v=1.12.3",
  "./manifest.webmanifest"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin || event.request.method !== "GET") return;
  event.respondWith(fetch(event.request, { cache: "no-store" }).then(response => {
    if (response && response.ok) { const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{}); }
    return response;
  }).catch(() => caches.match(event.request).then(response => response || caches.match("./index.html")));
});
