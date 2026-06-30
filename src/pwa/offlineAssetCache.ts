const OFFLINE_CACHE_NAME = "plaindoc-shell-v1";

interface OfflineAssetInput {
  baseUrl: string;
  origin: string;
  resourceUrls: string[];
}

export function collectOfflineAssetUrls({ baseUrl, origin, resourceUrls }: OfflineAssetInput): string[] {
  const scope = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const seen = new Set<string>();
  const urls = [
    `${origin}${scope}`,
    `${origin}${scope}manifest.webmanifest`,
    `${origin}${scope}favicon.svg`,
    `${origin}${scope}icon-192.png`,
    `${origin}${scope}icon-512.png`,
    ...resourceUrls
  ];

  return urls.filter((url) => {
    if (seen.has(url)) return false;
    seen.add(url);

    try {
      const parsed = new URL(url);
      return parsed.origin === origin && parsed.pathname.startsWith(scope);
    } catch {
      return false;
    }
  });
}

export async function warmOfflineAssetCache(baseUrl: string): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window) || !("performance" in window)) {
    return;
  }

  const resourceUrls = performance
    .getEntriesByType("resource")
    .map((entry) => entry.name)
    .filter((url) => Boolean(url));
  const urls = collectOfflineAssetUrls({ baseUrl, origin: window.location.origin, resourceUrls });
  const cache = await caches.open(OFFLINE_CACHE_NAME);

  await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "reload" });
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch {
        // A missed warm-cache entry should not affect the running app.
      }
    })
  );
}
