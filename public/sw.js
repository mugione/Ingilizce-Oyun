/* Basit service worker — kurulabilirlik (A2HS) + çevrimdışı yedek
   Strateji: ağ öncelikli, başarısızsa önbellek. */
const CACHE = "kelime-oyunu-v1";
const CORE = [
  "/",
  "/index.html",
  "/style.css",
  "/game.js",
  "/pwa.js",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return; // POST vb. dokunma
  e.respondWith(
    fetch(req)
      .then((res) => {
        // Başarılı yanıtı önbelleğe kopyala (çevrimdışı için)
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match("/"))
      )
  );
});
