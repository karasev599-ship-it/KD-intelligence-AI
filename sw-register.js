(() => {
  "use strict";
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js?v=1.22.2", { updateViaCache: "none" }).catch(() => {});
  }, { once: true });
})();
