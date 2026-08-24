/* KD Intelligence — per-user localStorage isolation. */
(function () {
  'use strict';

  const LEGACY_KEY = 'kriptodanik_state';
  const PREFIX = 'kd_state_v2:';
  let patched = false;
  let activeScope = null;
  let switching = false;

  function app() {
    try { return typeof App !== 'undefined' ? App : window.App || null; } catch (_) { return window.App || null; }
  }

  function userIdentity() {
    const name = (document.getElementById('kdAccountName')?.textContent || '').trim();
    const email = (document.getElementById('settingsEmail')?.textContent || '').trim();
    if (name && name !== 'Гость') return `user:${(email && email !== '—' ? email : name).trim().toLowerCase()}`;
    return 'guest';
  }

  function keyFor(scope) {
    return PREFIX + encodeURIComponent(scope);
  }

  function readRaw(scope) {
    try { return localStorage.getItem(keyFor(scope)); } catch (_) { return null; }
  }

  function migrateLegacy(scope) {
    if (scope === 'guest' || readRaw(scope)) return;
    try {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (!legacy) return;
      const parsed = JSON.parse(legacy);
      const identity = String(parsed?.userData?.name || '').trim().toLowerCase();
      const currentName = (document.getElementById('kdAccountName')?.textContent || '').trim().toLowerCase();
      if (identity && currentName && identity === currentName) localStorage.setItem(keyFor(scope), legacy);
    } catch (_) {}
  }

  function patchStorageMethods() {
    const A = app();
    if (!A || patched) return false;

    const originalLoad = typeof A.loadState === 'function' ? A.loadState.bind(A) : null;
    const originalSave = typeof A.saveState === 'function' ? A.saveState.bind(A) : null;
    if (!originalLoad || !originalSave) return false;

    A.loadState = function () {
      const scope = activeScope || userIdentity();
      migrateLegacy(scope);
      const scoped = readRaw(scope);
      const originalGet = localStorage.getItem.bind(localStorage);
      try {
        localStorage.getItem = function (key) {
          if (key === LEGACY_KEY) return scoped;
          return originalGet(key);
        };
        return originalLoad();
      } finally {
        localStorage.getItem = originalGet;
      }
    };

    A.saveState = function () {
      const scope = activeScope || userIdentity();
      const scopedKey = keyFor(scope);
      const originalSet = localStorage.setItem.bind(localStorage);
      try {
        localStorage.setItem = function (key, value) {
          if (key === LEGACY_KEY) return originalSet(scopedKey, value);
          return originalSet(key, value);
        };
        return originalSave();
      } finally {
        localStorage.setItem = originalSet;
      }
    };

    patched = true;
    return true;
  }

  function refreshForScope(scope) {
    const A = app();
    if (!A || !patched || switching || scope === activeScope) return;
    switching = true;
    try {
      activeScope = scope;
      A.loadState();
      A.applyUserData?.();
      A.updateBalanceDisplay?.();
      A.updateAll?.();
      A.renderCurrentSection?.();
      A.renderDashboard?.();
      A.renderJournal?.();
      A.updateBadges?.();
    } catch (error) {
      console.warn('KD user-scope refresh:', error);
    } finally {
      switching = false;
    }
  }

  function start() {
    if (!patchStorageMethods()) return false;
    refreshForScope(userIdentity());

    const accountName = document.getElementById('kdAccountName');
    if (accountName && !window.__kdUserScopeObserver) {
      const observer = new MutationObserver(() => refreshForScope(userIdentity()));
      observer.observe(accountName, { childList: true, characterData: true, subtree: true });
      window.__kdUserScopeObserver = observer;
    }

    if (!window.__kdUserScopeTimer) {
      window.__kdUserScopeTimer = setInterval(() => refreshForScope(userIdentity()), 1000);
    }
    return true;
  }

  function boot() {
    if (start()) return;
    setTimeout(start, 100);
    setTimeout(start, 500);
    setTimeout(start, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
