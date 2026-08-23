/* KriptoDanik AI — interaction recovery v1.12.5
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
    try { if (typeof App !== 'undefined') return App; } catch (_) {}
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
    const layers = document.querySelectorAll('.onboarding-overlay, .coach-tour-overlay, .mobile-nav-scrim, #kdAuthOverlay, #screenshotLightbox');
    layers.forEach(layer => {
      const style = getComputedStyle(layer);
      const id = layer.id;
      const isActive = layer.classList.contains('active');
      const isHidden = layer.hidden || layer.getAttribute('aria-hidden') === 'true';
      const visuallyHidden = style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';

      if (layer.classList.contains('mobile-nav-scrim')) {
        const sidebarOpen = document.querySelector('.sidebar.mobile-open');
        if (!sidebarOpen) {
          layer.classList.remove('active');
          layer.style.pointerEvents = 'none';
        } else {
          layer.style.removeProperty('pointer-events');
        }
        return;
      }

      // CRITICAL: visible modals must regain pointer events. The previous
      // recovery version left pointer-events:none inline on hidden overlays;
      // when App/auth later made them visible, they remained completely dead.
      if (id === 'kdAuthOverlay') {
        if (isHidden || visuallyHidden) layer.style.pointerEvents = 'none';
        else layer.style.removeProperty('pointer-events');
        return;
      }

      if (isActive && !isHidden && !visuallyHidden) layer.style.removeProperty('pointer-events');
      else layer.style.pointerEvents = 'none';
    });

    try {
      const hit = document.elementFromPoint(Math.floor(window.innerWidth / 2), Math.floor(window.innerHeight / 2));
      const blocking = hit?.closest?.('.onboarding-overlay, .coach-tour-overlay, .mobile-nav-scrim, #kdAuthOverlay, #screenshotLightbox');
      if (blocking) {
        const hidden = blocking.hidden || blocking.getAttribute('aria-hidden') === 'true';
        const active = blocking.classList.contains('active');
        if (hidden || (!active && getComputedStyle(blocking).display === 'none')) blocking.style.pointerEvents = 'none';
        else blocking.style.removeProperty('pointer-events');
      }
    } catch (_) {}
  }

  function bindNavigation() {
    const app = getApp();
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
      if (item.dataset.kdRecoveryBound === '1') return;
      item.dataset.kdRecoveryBound = '1';
      item.addEventListener('click', function () {
        const currentApp = app || getApp();
        if (!currentApp || typeof currentApp.showSection !== 'function') return;
        document.querySelectorAll('.nav-item[data-section]').forEach(node => node.classList.remove('active'));
        this.classList.add('active');
        currentApp.showSection(this.dataset.section);
        if (typeof currentApp.closeMobileNav === 'function') currentApp.closeMobileNav();
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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
  window.addEventListener('load', boot, { once: true });
})();
