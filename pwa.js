const BUILD_VERSION = "__BUILD_VERSION__";

function browserCanUsePwa() {
  return (
    typeof window !== "undefined"
    && typeof document !== "undefined"
    && typeof navigator !== "undefined"
    && "serviceWorker" in navigator
    && /^[a-f0-9]{12}$/.test(BUILD_VERSION)
  );
}

/**
 * Starts optional PWA features without making them a requirement for studying.
 *
 * A new worker deliberately waits for the browser's normal lifecycle instead of
 * calling skipWaiting. This keeps an in-progress tab on its coherent old bundle.
 */
export function initPwa({
  onConnectivityChange,
  onUpdateReady,
  onInstallAvailable,
} = {}) {
  let disposed = false;
  let deferredInstallPrompt = null;
  let registration = null;
  let registrationUpdateListener = null;
  let installingWorker = null;
  let installingStateListener = null;

  const notifyConnectivity = () => {
    if (disposed) return;
    try { onConnectivityChange?.({ online: navigator.onLine !== false }); } catch { /* UI callback is optional. */ }
  };
  const notifyInstallAvailability = () => {
    if (disposed) return;
    try { onInstallAvailable?.({ promptInstall }); } catch { /* UI callback is optional. */ }
  };
  const notifyUpdate = () => {
    if (disposed) return;
    // A waiting worker is newer than this page. Do not expose this page's
    // version as if it were the incoming version.
    try { onUpdateReady?.(); } catch { /* UI callback is optional. */ }
  };
  const onBeforeInstallPrompt = (event) => {
    // The browser decides whether this event exists. Do not show a pretend prompt.
    event.preventDefault();
    deferredInstallPrompt = event;
    notifyInstallAvailability();
  };
  const onAppInstalled = () => {
    deferredInstallPrompt = null;
    if (!disposed) {
      try { onInstallAvailable?.({ promptInstall: null }); } catch { /* UI callback is optional. */ }
    }
  };

  async function promptInstall() {
    const prompt = deferredInstallPrompt;
    if (!prompt || disposed) return false;
    deferredInstallPrompt = null;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      return choice?.outcome === "accepted";
    } catch {
      return false;
    } finally {
      if (!disposed) {
        try { onInstallAvailable?.({ promptInstall: null }); } catch { /* UI callback is optional. */ }
      }
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("online", notifyConnectivity);
    window.addEventListener("offline", notifyConnectivity);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
  }

  if (typeof navigator !== "undefined") notifyConnectivity();

  if (browserCanUsePwa()) {
    const workerUrl = new URL(`./sw.js?v=${BUILD_VERSION}`, document.baseURI);
    void navigator.serviceWorker.register(workerUrl, {
      scope: "./",
      updateViaCache: "none",
    }).then((nextRegistration) => {
      if (disposed) return;
      registration = nextRegistration;
      if (registration.waiting && navigator.serviceWorker.controller) notifyUpdate();
      registrationUpdateListener = () => {
        // Use the registration captured by this callback. dispose() can clear
        // the public reference while an already queued update event is firing.
        if (disposed) return;
        const installing = nextRegistration.installing;
        if (!installing) return;
        if (installing === installingWorker) return;
        if (installingWorker && installingStateListener) {
          installingWorker.removeEventListener?.("statechange", installingStateListener);
        }
        installingWorker = installing;
        installingStateListener = () => {
          if (disposed) return;
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            notifyUpdate();
          }
        };
        installing.addEventListener("statechange", installingStateListener);
      };
      registration.addEventListener("updatefound", registrationUpdateListener);
      // Some browsers expose an installing worker before updatefound is
      // observed, so inspect it once after attaching the listener.
      registrationUpdateListener();
    }).catch(() => {
      // Offline study remains usable when registration is unavailable or blocked.
    });
  }

  return {
    async promptInstall() {
      return promptInstall();
    },
    dispose() {
      disposed = true;
      if (registration && registrationUpdateListener) {
        registration.removeEventListener?.("updatefound", registrationUpdateListener);
      }
      if (installingWorker && installingStateListener) {
        installingWorker.removeEventListener?.("statechange", installingStateListener);
      }
      registration = null;
      registrationUpdateListener = null;
      installingWorker = null;
      installingStateListener = null;
      deferredInstallPrompt = null;
      if (typeof window !== "undefined") {
        window.removeEventListener("online", notifyConnectivity);
        window.removeEventListener("offline", notifyConnectivity);
        window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        window.removeEventListener("appinstalled", onAppInstalled);
      }
    },
  };
}
