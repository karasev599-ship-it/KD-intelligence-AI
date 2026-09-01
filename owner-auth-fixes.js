/* KD owner/auth recovery v1.0.0 */
(function () {
  'use strict';

  async function loadSession() {
    try {
      const response = await fetch('/api/auth?action=me', { credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.authenticated || !data.user) return null;
      window.KD_AUTH_USER = data.user;
      return data.user;
    } catch (_) {
      return null;
    }
  }

  function addAdminLink(user) {
    if (!user?.is_admin) return;
    if (document.getElementById('kdOwnerAdminLink')) return;
    const host = document.querySelector('#settings-profile, #kdAccountPanel, .kd-account-panel, .kd-account-copy')?.parentElement;
    if (!host) return;
    const link = document.createElement('a');
    link.id = 'kdOwnerAdminLink';
    link.href = '/admin.html';
    link.textContent = '👑 Админка';
    link.style.cssText = 'display:flex;align-items:center;justify-content:center;text-decoration:none;width:100%;box-sizing:border-box;padding:11px 14px;margin-top:8px;border-radius:11px;background:linear-gradient(135deg,#7865ff,#a38cff);color:#fff;font-weight:800;';
    host.appendChild(link);
  }

  function restoreCharacter() {
    const existing = document.querySelectorAll('img[src*="hero-character"], [data-character="hero-character"]');
    existing.forEach(img => {
      img.hidden = false;
      img.style.display = '';
      img.style.visibility = 'visible';
      img.style.opacity = '1';
    });
  }

  async function boot() {
    const user = await loadSession();
    addAdminLink(user);
    restoreCharacter();
    setTimeout(() => { addAdminLink(window.KD_AUTH_USER); restoreCharacter(); }, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
  window.addEventListener('load', boot, { once: true });
})();
