import { describe, expect, it, vi } from "vitest";
import serviceWorkerSource from "../../public/sw.js?raw";
import mainSource from "../main.tsx?raw";
import { checkForServiceWorkerUpdate, createServiceWorkerRegistration } from "../pwa/serviceWorkerRegistration";

describe("service worker registration", () => {
  it("uses the Vite base path for the script URL and registration scope", () => {
    expect(createServiceWorkerRegistration("/plaindoc/")).toEqual({
      scriptUrl: "/plaindoc/sw.js",
      options: { scope: "/plaindoc/" }
    });
  });

  it("normalizes base paths without a trailing slash", () => {
    expect(createServiceWorkerRegistration("/plaindoc")).toEqual({
      scriptUrl: "/plaindoc/sw.js",
      options: { scope: "/plaindoc/" }
    });
  });

  it("registers the service worker from the app entrypoint", () => {
    expect(mainSource).toContain('from "./pwa/serviceWorkerRegistration"');
    expect(mainSource).toContain("registerServiceWorker()");
  });

  it("checks for service worker updates without failing the registration flow", async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    await expect(
      checkForServiceWorkerUpdate({ update } as unknown as ServiceWorkerRegistration)
    ).resolves.toBeUndefined();
    expect(update).toHaveBeenCalledOnce();

    const blockedUpdate = vi.fn().mockRejectedValue(new Error("update blocked"));
    await expect(
      checkForServiceWorkerUpdate({ update: blockedUpdate } as unknown as ServiceWorkerRegistration)
    ).resolves.toBeUndefined();
    expect(blockedUpdate).toHaveBeenCalledOnce();
  });

  it("ships a GitHub Pages-scoped service worker cache", () => {
    expect(serviceWorkerSource).toContain('const CACHE_NAME = "plaindoc-shell-v2"');
    expect(serviceWorkerSource).toContain('const APP_SCOPE = "/plaindoc/"');
    expect(serviceWorkerSource).toContain("`${APP_SCOPE}icon-192.png`");
    expect(serviceWorkerSource).toContain("`${APP_SCOPE}icon-512.png`");
    expect(serviceWorkerSource).toContain('self.addEventListener("install"');
    expect(serviceWorkerSource).toContain('self.addEventListener("activate"');
    expect(serviceWorkerSource).toContain('self.addEventListener("fetch"');
    expect(serviceWorkerSource).toContain("networkFirst(request, APP_SCOPE)");
    expect(serviceWorkerSource).toContain('cache.match(request.url, { ignoreSearch: true })');
  });

  it("does not fail online responses when runtime cache writes are blocked", () => {
    expect(serviceWorkerSource).toContain("safeCachePut(cache, request, response.clone())");
    expect(serviceWorkerSource).toContain("async function safeCachePut");
    expect(serviceWorkerSource).toContain("Runtime cache writes are best-effort");
    expect(serviceWorkerSource).not.toContain("await cache.put(request, response.clone())");
  });
});
