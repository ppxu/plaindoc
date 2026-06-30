import { describe, expect, it } from "vitest";
import offlineAssetCacheSource from "../pwa/offlineAssetCache.ts?raw";
import { collectOfflineAssetUrls } from "../pwa/offlineAssetCache";

describe("offline asset cache", () => {
  it("warms the current app shell cache version", () => {
    expect(offlineAssetCacheSource).toContain('const OFFLINE_CACHE_NAME = "plaindoc-shell-v2"');
  });

  it("collects the app shell and same-origin resources under the app base path", () => {
    const urls = collectOfflineAssetUrls({
      baseUrl: "/plaindoc/",
      origin: "https://ppxu.github.io",
      resourceUrls: [
        "https://ppxu.github.io/plaindoc/assets/index.js",
        "https://ppxu.github.io/plaindoc/assets/index.css",
        "https://ppxu.github.io/other-app/assets/index.js",
        "https://cdn.example.com/plaindoc/assets/index.js"
      ]
    });

    expect(urls).toEqual([
      "https://ppxu.github.io/plaindoc/",
      "https://ppxu.github.io/plaindoc/manifest.webmanifest",
      "https://ppxu.github.io/plaindoc/favicon.svg",
      "https://ppxu.github.io/plaindoc/icon-192.png",
      "https://ppxu.github.io/plaindoc/icon-512.png",
      "https://ppxu.github.io/plaindoc/assets/index.js",
      "https://ppxu.github.io/plaindoc/assets/index.css"
    ]);
  });
});
