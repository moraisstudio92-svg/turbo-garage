// Turbo Garage service worker: the game works offline after the first open
const V = "turbo-garage-v93";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if(req.method !== "GET") return;
  const url = new URL(req.url);
  // the game page: try the network first so updates arrive, fall back to the saved copy offline
  if(req.mode === "navigate"){
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put("index.html", cp)); return r; }).catch(() => caches.match("index.html")));
    return;
  }
  // everything else (icons, fonts): saved copy first, then the network, keeping what it gets
  if(url.origin === location.origin || url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if(r && (r.ok || r.type === "opaque")){ const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); } return r; })));
  }
});
