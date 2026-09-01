/* KD owner/auth recovery v1.1.0 */
(function () {
  'use strict';

  async function loadSession() {
    try {
      const response = await fetch('/api/auth?action=me', { credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.authenticated || !data.user) return null;
      window.KD_AUTH_USER = data.user;
      return data.user;
    } catch (_) { return null; }
  }

  function syncProfile(user) {
    if (!user) return;
    const name = user.name || user.username || user.email?.split('@')[0] || 'Пользователь';
    const avatar = name.trim().charAt(0).toUpperCase() || 'K';
    document.querySelectorAll('#kdAccountName').forEach(el => { el.textContent = name; });
    document.querySelectorAll('#kdAccountAvatar').forEach(el => { el.textContent = avatar; });
    document.querySelectorAll('#kdAccountPlan').forEach(el => { el.textContent = user.pro_active ? 'PRO' : 'FREE'; });
    const email = document.querySelector('#settings-profile input[type="email"], #settings-profile .profile-email');
    if (email && 'value' in email && !email.value) email.value = user.email || '';
  }

  function addAdminLink(user) {
    if (!user?.is_admin || document.getElementById('kdOwnerAdminLink')) return;
    const host = document.querySelector('#settings-profile, #kdAccountPanel, .kd-account-panel') || document.querySelector('.kd-account-copy')?.parentElement;
    if (!host) return;
    const link = document.createElement('a');
    link.id = 'kdOwnerAdminLink';
    link.href = '/admin.html';
    link.textContent = '👑 Админка';
    link.style.cssText = 'display:flex;align-items:center;justify-content:center;text-decoration:none;width:100%;box-sizing:border-box;padding:11px 14px;margin-top:8px;border-radius:11px;background:linear-gradient(135deg,#7865ff,#a38cff);color:#fff;font-weight:800;';
    host.appendChild(link);
  }

  function restoreCharacter() {
    document.querySelectorAll('img[src*="hero-character"], [data-character="hero-character"]').forEach(img => {
      img.hidden = false; img.removeAttribute('aria-hidden'); img.style.display = ''; img.style.visibility = 'visible'; img.style.opacity = '1';
    });
  }

  async function boot() {
    const user = await loadSession();
    syncProfile(user);
    addAdminLink(user);
    restoreCharacter();
    setTimeout(() => { syncProfile(window.KD_AUTH_USER); addAdminLink(window.KD_AUTH_USER); restoreCharacter(); }, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
  window.addEventListener('load', boot, { once: true });
})();
