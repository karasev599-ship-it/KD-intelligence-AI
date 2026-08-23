/* KriptoDanik AI — optional enhancement loader.
 * Core application startup is handled by index.html + app.js only.
 * This file must never load App, auth, or the Service Worker.
 */
(function () {
  'use strict';

  function loadScript(src, marker, onload) {
    if (window[marker] || document.querySelector(`script[data-${marker}]`)) {
      if (window[marker] && onload) onload();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset[marker] = 'true';
    script.onload = () => { window[marker] = true; if (onload) onload(); };
    script.onerror = () => console.warn('KD optional loader failed:', src);
    document.head.appendChild(script);
  }

  function applyKDFavicon() {
    const href = 'assets/favicon.svg?v=1.12.0';
    let icon = document.querySelector('link[data-kd-favicon]');
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      icon.type = 'image/svg+xml';
      icon.dataset.kdFavicon = 'true';
      document.head.appendChild(icon);
    }
    icon.href = href;
  }

  function loadOptionalFeatures() {
    applyKDFavicon();
    loadScript('kd-rebrand.js?v=1.12.0', 'kdRebrandLoaded');
    loadScript('ai-upgrades.js?v=1.12.0', 'kdAiUpgradesLoaded', () => {
      try { window.KDRefreshAIUpgrades?.(); } catch (_) {}
      loadScript('scanner-frontend-fix.js?v=1.12.0', 'kdScannerFrontendFixLoaded');
    });
    loadScript('trade-import.js?v=1.12.0', 'kdTradeImportLoaded', () => {
      try { window.KDTradeImport?.init?.(); } catch (_) {}
      if (!document.querySelector('link[data-kd-trade-import-css]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'trade-import.css?v=1.12.0';
        link.dataset.kdTradeImportCss = 'true';
        document.head.appendChild(link);
      }
    });

    // Defensive recovery: if the SPA rendered but its main JS or click bindings
    // did not start, recover them from the same directory.
    loadScript('interaction-recovery.js?v=1.12.3', 'kdInteractionRecoveryLoaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadOptionalFeatures, { once: true });
  } else {
    loadOptionalFeatures();
  }
})();
