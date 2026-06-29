import { warmOfflineAssetCache } from "./offlineAssetCache";

export interface ServiceWorkerRegistrationConfig {
  scriptUrl: string;
  options: RegistrationOptions;
}

export function createServiceWorkerRegistration(baseUrl: string): ServiceWorkerRegistrationConfig {
  const scope = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return {
    scriptUrl: `${scope}sw.js`,
    options: { scope }
  };
}

export async function checkForServiceWorkerUpdate(registration: ServiceWorkerRegistration): Promise<void> {
  try {
    await registration.update();
  } catch {
    // Update checks are best-effort; the current app shell should remain usable.
  }
}

export function registerServiceWorker(): void {
  if (import.meta.env.DEV || typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const registration = createServiceWorkerRegistration(import.meta.env.BASE_URL);
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(registration.scriptUrl, registration.options)
      .then((activeRegistration) =>
        checkForServiceWorkerUpdate(activeRegistration).then(() => warmOfflineAssetCache(import.meta.env.BASE_URL))
      )
      .catch(() => {
        // Offline support is progressive enhancement; app startup must not depend on it.
      });
  });
}
