/* KriptoDanik AI — interaction recovery v1.12.4
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
    const layers = document.querySelectorAll(
      '.onboarding-overlay, .coach-tour-overlay, .mobile-nav-scrim, #kdAuthOverlay, #screenshotLightbox'
    );

    layers.forEach(layer => {
      const style = getComputedStyle(layer);
      const id = layer.id;
      const isActive = layer.classList.contains('active');
      const isHidden = layer.hidden || layer.getAttribute('aria-hidden') === 'true';

      // The mobile scrim is only allowed to capture input while the sidebar is
      // explicitly open. This prevents a stale scrim from covering the whole UI.
      if (layer.classList.contains('mobile-nav-scrim')) {
        const sidebarOpen = document.querySelector('.sidebar.mobile-open');
        if (!sidebarOpen) {
          layer.classList.remove('active');
          layer.style.pointerEvents = 'none';
        }
        return;
      }

      // Auth overlay is controlled by the hidden attribute. Never let a stale
      // class alone turn it into an invisible click-blocking layer.
      if (id === 'kdAuthOverlay' && isHidden) {
        layer.style.pointerEvents = 'none';
        return;
      }

      // Onboarding / coach / lightbox may legitimately be active. When they are
      // not active or are visually hidden, they must never capture pointer input.
      const visuallyHidden = style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
      if (!isActive || isHidden || visuallyHidden) {
        layer.style.pointerEvents = 'none';
      } else {
        layer.style.pointerEvents = '';
      }
    });

    // Last-resort check: if an overlay is physically sitting under the center
    // point while it is not supposed to be open, remove it from hit testing.
    try {
      const hit = document.elementFromPoint(Math.floor(window.innerWidth / 2), Math.floor(window.innerHeight / 2));
      const blocking = hit?.closest?.('.onboarding-overlay, .coach-tour-overlay, .mobile-nav-scrim, #kdAuthOverlay, #screenshotLightbox');
      if (blocking && !blocking.classList.contains('active') && blocking.id !== 'kdAuthOverlay') {
        blocking.style.pointerEvents = 'none';
      }
      if (blocking?.id === 'kdAuthOverlay' && blocking.hidden) blocking.style.pointerEvents = 'none';
    } catch (_) {}
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

    if (!app && !appLoadRequested) {
      appLoadRequested = true;
      load(APP_SRC, 'kd-recovery-app');
    }

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
