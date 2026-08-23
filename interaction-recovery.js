/* KriptoDanik AI — interaction recovery v1.12.3
 * Defensive bootstrap for cases where the main SPA starts visually but its
 * click bindings are missing or a stale full-screen layer captures input.
 */
(function () {
  'use strict';

  const APP_SRC = 'app.js?v=1.12.0';
  const RUNTIME_SRC = 'runtime-fixes.js?v=1.12.3';
  let appLoadRequested = false;
  let runtimeLoadRequested = false;

  function getApp() {
    try {
      if (typeof App !== 'undefined') return App;
    } catch (_) {}
    return window.App || null;
  }

  function load(src, marker) {
    if (document.querySelector(`script[data-${marker}]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset[marker] = 'true';
    document.head.appendChild(script);
  }

  function releaseLayers() {
    document.querySelectorAll(
      '.onboarding-overlay, .coach-tour-overlay, .mobile-nav-scrim, #kdAuthOverlay, #screenshotLightbox'
    ).forEach(layer => {
      const style = getComputedStyle(layer);
      const hidden = layer.hidden || layer.getAttribute('aria-hidden') === 'true' ||
        style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
      if (hidden) layer.style.pointerEvents = 'none';
    });
  }

  function bindNavigation() {
    const app = getApp();
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
      if (item.dataset.kdRecoveryBound === '1') return;
      item.dataset.kdRecoveryBound = '1';
      item.addEventListener('click', function () {
        const currentApp = app || getApp();
        if (currentApp && typeof currentApp.showSection === 'function') {
          document.querySelectorAll('.nav-item[data-section]').forEach(node => node.classList.remove('active'));
          this.classList.add('active');
          currentApp.showSection(this.dataset.section);
          if (typeof currentApp.closeMobileNav === 'function') currentApp.closeMobileNav();
        }
      });
    });
  }

  function boot() {
    releaseLayers();
    const app = getApp();

    // If app.js did not execute, recover it from the same directory.
    if (!app && !appLoadRequested) {
      appLoadRequested = true;
      load(APP_SRC, 'kd-recovery-app');
    }

    // Give the application a moment to create App, then load the interaction fixes.
    if (!runtimeLoadRequested && getApp()) {
      runtimeLoadRequested = true;
      load(RUNTIME_SRC, 'kd-recovery-runtime');
    }

    bindNavigation();
  }

  function schedule() {
    boot();
    [100, 400, 1000, 2000, 4000].forEach(delay => setTimeout(boot, delay));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }
  window.addEventListener('load', boot, { once: true });
})();
