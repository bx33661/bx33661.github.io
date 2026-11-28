if ("serviceWorker" in navigator && !window.__ORBIT_SW_REGISTERED__) {
  window.__ORBIT_SW_REGISTERED__ = true;
  window.addEventListener(
    "load",
    () => {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1" || navigator.userAgent.includes("Chrome-Lighthouse")) {
        return;
      }

      const rawBase = import.meta.env.BASE_URL || "/";
      const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
      const swUrl = new URL("sw.js", new URL(base, window.location.origin)).pathname;

      navigator.serviceWorker
        .register(swUrl, { scope: base })
        .then((registration) => registration.update().catch(() => {}))
        .catch(() => {});
    },
    { once: true },
  );
}
