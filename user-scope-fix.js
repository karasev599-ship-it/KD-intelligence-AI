/* KD Intelligence — per-user localStorage isolation. */
(function () {
  'use strict';

  const LEGACY_KEY = 'kriptodanik_state';
  const MARKET_MODE_KEY = 'kd_market_mode';
  const PREFIX = 'kd_state_v2:';
  let activeScope = null;
  let switching = false;
  let storagePatched = false;

  function app() {
    try { return typeof App !== 'undefined' ? App : window.App || null; } catch (_) { return window.App || null; }
  }

  function userIdentity() {
    const name = (document.getElementById('kdAccountName')?.textContent || '').trim();
    const email = (document.getElementById('settingsEmail')?.textContent || '').trim();
    if (name && name !== 'Гость') return `user:${(email && email !== '—' ? email : name).trim().toLowerCase()}`;
    return 'guest';
  }

  function keyFor(scope) { return PREFIX + encodeURIComponent(scope); }
  function scopedKey(key, scope = activeScope || userIdentity()) {
    if (key === LEGACY_KEY) return keyFor(scope);
    if (key === MARKET_MODE_KEY) return `${PREFIX}market:${encodeURIComponent(scope)}`;
    return key;
  }

  function rawGet(key) {
    try {
      const original = Storage.prototype.__kdOriginalGetItem || Storage.prototype.getItem;
      return original.call(localStorage, key);
    } catch (_) { return null; }
  }

  function rawSet(key, value) {
    try {
      const original = Storage.prototype.__kdOriginalSetItem || Storage.prototype.setItem;
      original.call(localStorage, key, value);
    } catch (_) {}
  }

  function migrateLegacy(scope) {
    if (scope === 'guest') return;
    const target = keyFor(scope);
    try {
      if (rawGet(target)) return;
      const legacy = rawGet(LEGACY_KEY);
      if (!legacy) return;
      const parsed = JSON.parse(legacy);
      const identity = String(parsed?.userData?.name || '').trim().toLowerCase();
      const currentName = (document.getElementById('kdAccountName')?.textContent || '').trim().toLowerCase();
      if (identity && currentName && identity === currentName) rawSet(target, legacy);
    } catch (_) {}
  }

  function patchStorage() {
    if (storagePatched || !Storage?.prototype) return true;
    const proto = Storage.prototype;
    const originalGet = proto.getItem;
    const originalSet = proto.setItem;
    const originalRemove = proto.removeItem;

    try {
      Object.defineProperty(proto, '__kdOriginalGetItem', { value: originalGet, configurable: true });
      Object.defineProperty(proto, '__kdOriginalSetItem', { value: originalSet, configurable: true });
      Object.defineProperty(proto, '__kdOriginalRemoveItem', { value: originalRemove, configurable: true });
      proto.getItem = function (key) { return originalGet.call(this, scopedKey(key)); };
      proto.setItem = function (key, value) { return originalSet.call(this, scopedKey(key), value); };
      proto.removeItem = function (key) { return originalRemove.call(this, scopedKey(key)); };
      storagePatched = true;
      return true;
    } catch (error) {
      console.warn('KD user-scope storage patch unavailable:', error);
      return false;
    }
  }

  function patchApp() {
    const A = app();
    if (!A || typeof A.loadState !== 'function' || typeof A.saveState !== 'function') return false;
    if (!A.__kdUserScopePatched) {
      const originalLoad = A.loadState.bind(A);
      const originalSave = A.saveState.bind(A);
      A.loadState = function () { migrateLegacy(activeScope || userIdentity()); return originalLoad(); };
      A.saveState = function () { return originalSave(); };
      A.__kdUserScopePatched = true;
    }
    return true;
  }

  function refreshForScope(scope) {
    const A = app();
    if (!A || !storagePatched || switching || scope === activeScope) return;
    switching = true;
    try {
      activeScope = scope;
      migrateLegacy(scope);
      A.loadState();
      A.applyUserData?.();
      A.updateBalanceDisplay?.();
      A.updateAll?.();
      A.renderCurrentSection?.();
      A.renderDashboard?.();
      A.renderJournal?.();
      A.updateBadges?.();
      const modeKey = `${PREFIX}market:${encodeURIComponent(scope)}`;
      const storedMode = rawGet(modeKey);
      if (storedMode === 'crypto' || storedMode === 'forex') {
        A.marketMode = storedMode;
        A.renderMarketMode?.();
      }
    } catch (error) {
      console.warn('KD user-scope refresh:', error);
    } finally {
      switching = false;
    }
  }

  function start() {
    if (!patchStorage() || !patchApp()) return false;
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
