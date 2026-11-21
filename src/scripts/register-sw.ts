if ("serviceWorker" in navigator && !window.__BX_SW_REGISTERED__) {
  window.__BX_SW_REGISTERED__ = true;
  window.addEventListener(
    "load",
    () => {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1" || navigator.userAgent.includes("Chrome-Lighthouse")) {
        return;
      }

      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => registration.update().catch(() => {}))
        .catch(() => {});
    },
    { once: true },
  );
}
