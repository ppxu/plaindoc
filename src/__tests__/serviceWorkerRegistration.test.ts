import { describe, expect, it } from "vitest";
import serviceWorkerSource from "../../public/sw.js?raw";
import mainSource from "../main.tsx?raw";
import { createServiceWorkerRegistration } from "../pwa/serviceWorkerRegistration";

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

  it("ships a GitHub Pages-scoped service worker cache", () => {
    expect(serviceWorkerSource).toContain('const APP_SCOPE = "/plaindoc/"');
    expect(serviceWorkerSource).toContain('self.addEventListener("install"');
    expect(serviceWorkerSource).toContain('self.addEventListener("activate"');
    expect(serviceWorkerSource).toContain('self.addEventListener("fetch"');
    expect(serviceWorkerSource).toContain("networkFirst(request, APP_SCOPE)");
    expect(serviceWorkerSource).toContain('cache.match(request.url, { ignoreSearch: true })');
  });
});
