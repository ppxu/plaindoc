const CACHE_NAME = "plaindoc-shell-v1";
const APP_SCOPE = "/plaindoc/";
const APP_SHELL = [APP_SCOPE, `${APP_SCOPE}manifest.webmanifest`, `${APP_SCOPE}favicon.svg`];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(APP_SCOPE)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, APP_SCOPE));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await safeCachePut(cache, request, response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request.url, { ignoreSearch: true })) || (await cache.match(fallbackUrl));
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request.url, { ignoreSearch: true });
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    await safeCachePut(cache, request, response.clone());
  }
  return response;
}

async function safeCachePut(cache, request, response) {
  try {
    await cache.put(request, response);
  } catch {
    // Runtime cache writes are best-effort; online responses should still reach the page.
  }
}
