/* KriptoDanik AI — interaction recovery v1.12.6 */
(function () {
  'use strict';
  const APP_SRC = 'app.js?v=1.12.0';
  const RUNTIME_SRC = 'runtime-fixes.js?v=1.12.3';
  const OWNER_SRC = 'owner-auth-fixes.js?v=1.0.0';
  let appLoadRequested = false, runtimeLoadRequested = false, ownerLoadRequested = false;
  function getApp() { try { if (typeof App !== 'undefined') return App; } catch (_) {} return window.App || null; }
  function load(src, marker) {
    if (document.querySelector(`script[data-${marker}]`)) return;
    const script = document.createElement('script'); script.src = src; script.async = false; script.dataset[marker] = 'true'; document.head.appendChild(script);
  }
  function releaseLayers() {
    document.querySelectorAll('.onboarding-overlay, .coach-tour-overlay, .mobile-nav-scrim, #kdAuthOverlay, #screenshotLightbox').forEach(layer => {
      const style = getComputedStyle(layer), hidden = layer.hidden || layer.getAttribute('aria-hidden') === 'true';
      const visuallyHidden = style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
      if (layer.classList.contains('mobile-nav-scrim')) {
        const open = document.querySelector('.sidebar.mobile-open'); layer.style.pointerEvents = open ? '' : 'none'; if (!open) layer.classList.remove('active');
      } else if (hidden || visuallyHidden) layer.style.pointerEvents = 'none'; else layer.style.removeProperty('pointer-events');
    });
  }
  function bindNavigation() {
    const app = getApp();
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
      if (item.dataset.kdRecoveryBound === '1') return;
      item.dataset.kdRecoveryBound = '1';
      item.addEventListener('click', function () {
        const currentApp = app || getApp(); if (!currentApp || typeof currentApp.showSection !== 'function') return;
        document.querySelectorAll('.nav-item[data-section]').forEach(node => node.classList.remove('active')); this.classList.add('active'); currentApp.showSection(this.dataset.section); if (typeof currentApp.closeMobileNav === 'function') currentApp.closeMobileNav();
      });
    });
  }
  function boot() {
    releaseLayers(); const app = getApp();
    if (!app && !appLoadRequested) { appLoadRequested = true; load(APP_SRC, 'kd-recovery-app'); }
    if (getApp() && !runtimeLoadRequested) { runtimeLoadRequested = true; load(RUNTIME_SRC, 'kd-recovery-runtime'); }
    if (getApp() && !ownerLoadRequested) { ownerLoadRequested = true; load(OWNER_SRC, 'kd-recovery-owner'); }
    bindNavigation();
  }
  function schedule() { boot(); [100,400,1000,2000,4000].forEach(delay => setTimeout(boot, delay)); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once:true }); else schedule();
  window.addEventListener('load', boot, { once:true });
})();
