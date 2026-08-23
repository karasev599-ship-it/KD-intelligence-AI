(() => {
  "use strict";
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js?v=1.12.4", { updateViaCache: "none" }).catch(() => {});
  }, { once: true });
})();
