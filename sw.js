// Turbo Garage service worker. Each release has its own cache; a new release waits until the player taps BORA!
const V = "turbo-garage-v128";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(CORE.map(u => fetch(new Request(u, {cache:"reload"})).then(r => c.put(u, r))))));
});
self.addEventListener("message", e => { if(e.data === "skipWaiting") self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("turbo-garage-") && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if(req.method !== "GET") return;
  const url = new URL(req.url);
  if(url.pathname.endsWith("/version.json") || url.pathname.endsWith("/sw.js")) return;   // always straight from the network
  // the game page is served from this release's copy, so the version only changes when the player accepts the update
  if(req.mode === "navigate"){
    e.respondWith(caches.open(V).then(c => c.match("index.html")).then(hit => hit || fetch(req)));
    return;
  }
  if(url.origin === location.origin || url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")){
    e.respondWith(caches.open(V).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if(r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }))));
  }
});
