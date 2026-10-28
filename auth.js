/* KD Intelligence AI — account, trial and billing client v1.0.2 */
(() => {
  'use strict';
  if (window.__KD_AUTH_CLIENT__) return;
  window.__KD_AUTH_CLIENT__ = true;

  const $ = (id) => document.getElementById(id);
  const overlay = $('kdAuthOverlay');
  const signupForm = $('kdSignupForm');
  const loginForm = $('kdLoginForm');
  const accountPanel = $('kdAccountPanel');
  const errorBox = $('kdAuthError');
  if (!overlay || !signupForm || !loginForm) {
    console.error('KD auth: required auth markup is missing.');
    return;
  }

  let currentUser = null;
  let busy = false;

  function showError(message) {
    if (errorBox) errorBox.textContent = message || '';
  }

  function setBusy(form, value) {
    if (!form) return;
    const button = form.querySelector('button[type="submit"]');
    if (button) {
      if (value && !button.dataset.originalText) button.dataset.originalText = button.textContent;
      button.disabled = value;
      button.textContent = value ? 'Подождите…' : (button.dataset.originalText || button.textContent);
    }
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store',
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || ('Ошибка сервера: ' + response.status));
    return data;
  }

  function syncAppScope(user) {
    if (!user) return;
    window.KD_AUTH_USER = user;
    const app = window.App;
    if (app && typeof app.setStorageScope === 'function') {
      try { app.setStorageScope(user.email || user.id, { migrate: false }); }
      catch (error) { console.warn('KD auth: could not switch profile storage scope.', error); }
    }
    const onboardingName = $('onboardingName');
    if (onboardingName && !onboardingName.value && user.name) onboardingName.value = user.name;
  }

  function renderAccount(user) {
    currentUser = user || null;
    window.KD_AUTH_USER = currentUser;
    const name = user ? (user.name || user.username || user.email?.split('@')[0] || 'Пользователь') : 'Гость';
    const initial = name.trim().charAt(0).toUpperCase() || 'K';
    const isPro = !!user?.pro_active;
    const trialActive = !!user?.trial_active;
    const days = Number(user?.trial_days_left || 0);

    if ($('kdAccountName')) $('kdAccountName').textContent = name;
    if ($('kdAccountAvatar')) $('kdAccountAvatar').textContent = initial;
    if ($('kdAccountPlan')) $('kdAccountPlan').textContent = isPro ? 'PRO' : (trialActive ? 'FREE · TRIAL' : 'FREE');
    if ($('kdPanelPlan')) $('kdPanelPlan').textContent = isPro ? 'PRO' : (trialActive ? 'FREE TRIAL' : 'FREE');
    if ($('kdPanelUntil')) {
      $('kdPanelUntil').textContent = isPro
        ? (user.pro_until ? 'PRO до ' + new Date(user.pro_until).toLocaleDateString('ru-RU') : 'Подписка PRO активна')
        : (trialActive ? 'Осталось ' + days + ' дн. полного доступа' : 'Пробный период завершён');
    }
    if (accountPanel) accountPanel.hidden = !user;
    signupForm.hidden = !!user;
    loginForm.hidden = !!user;
    overlay.querySelectorAll('[data-auth-tab]').forEach(button => {
      button.hidden = !!user;
      button.classList.toggle('active', !user && button.dataset.authTab === 'signup');
    });
    const title = $('kdAuthTitle');
    const subtitle = $('kdAuthSubtitle');
    if (title) title.textContent = user ? 'Ваш аккаунт KD Intelligence AI' : 'Регистрация в KD Intelligence AI';
    if (subtitle) subtitle.textContent = user
      ? '21 день полного доступа для новых аккаунтов. PRO — 4,99 $ в месяц.'
      : 'Создай аккаунт, чтобы открыть торговый профиль и получить 21 день полного доступа.';
    const close = $('kdAuthClose');
    if (close) close.style.display = user ? '' : 'none';
    if (user?.is_admin) addAdminLink(user);
  }

  function addAdminLink(user) {
    if (!user?.is_admin || $('kdOwnerAdminLink')) return;
    const host = $('kdAccountPanel') || document.querySelector('.kd-account-copy')?.parentElement;
    if (!host) return;
    const link = document.createElement('a');
    link.id = 'kdOwnerAdminLink';
    link.href = '/admin.html';
    link.textContent = '👑 Админка';
    link.style.cssText = 'display:flex;align-items:center;justify-content:center;text-decoration:none;width:100%;box-sizing:border-box;padding:11px 14px;margin-top:8px;border-radius:11px;background:linear-gradient(135deg,#7865ff,#a38cff);color:#fff;font-weight:800;';
    host.appendChild(link);
  }

  function openAuth(mode = 'signup') {
    showError('');
    overlay.hidden = false;
    signupForm.hidden = mode !== 'signup';
    loginForm.hidden = mode !== 'login';
    if (accountPanel) accountPanel.hidden = !currentUser;
    overlay.querySelectorAll('[data-auth-tab]').forEach(button => {
      button.classList.toggle('active', button.dataset.authTab === mode);
      button.hidden = !!currentUser;
    });
    if (currentUser) {
      signupForm.hidden = true;
      loginForm.hidden = true;
    }
  }

  function closeAuth() {
    if (!currentUser) return;
    overlay.hidden = true;
    showError('');
  }

  async function submitAuth(form, action) {
    if (busy) return;
    busy = true;
    setBusy(form, true);
    showError('');
    try {
      const body = Object.fromEntries(new FormData(form).entries());
      const data = await request('/api/auth?action=' + action, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      if (!data.user) throw new Error('Сервер не вернул данные аккаунта.');
      renderAccount(data.user);
      syncAppScope(data.user);
      overlay.hidden = true;
      form.reset();
      if (window.App && typeof window.App.showOnboarding === 'function' && !window.App.onboardingDone) {
        if ($('onboardingName') && data.user.name) $('onboardingName').value = data.user.name;
        window.App.showOnboarding();
      }
    } catch (error) {
      showError(error.message || 'Не удалось выполнить запрос. Попробуй ещё раз.');
    } finally {
      busy = false;
      setBusy(form, false);
    }
  }

  signupForm.addEventListener('submit', event => {
    event.preventDefault();
    submitAuth(signupForm, 'signup');
  });
  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    submitAuth(loginForm, 'login');
  });

  overlay.querySelectorAll('[data-auth-tab]').forEach(button => {
    button.addEventListener('click', () => openAuth(button.dataset.authTab));
  });
  $('kdAuthClose')?.addEventListener('click', closeAuth);
  $('kdAccountButton')?.addEventListener('click', () => openAuth(currentUser ? 'account' : 'signup'));
  $('kdLogoutButton')?.addEventListener('click', async () => {
    try { await request('/api/auth?action=logout', { method: 'POST', body: '{}' }); }
    catch (error) { showError(error.message); return; }
    currentUser = null;
    window.KD_AUTH_USER = null;
    location.reload();
  });
  $('kdUpgradeButton')?.addEventListener('click', async () => {
    const button = $('kdUpgradeButton');
    if (!currentUser) { openAuth('signup'); return; }
    if (button) { button.disabled = true; button.textContent = 'Подключаем оплату…'; }
    showError('');
    try {
      const data = await request('/api/billing?action=checkout', { method: 'POST', body: '{}' });
      if (data.checkout_url) location.href = data.checkout_url;
      else if (data.active) {
        const fresh = await request('/api/auth?action=me');
        renderAccount(fresh.user);
      } else throw new Error('Платёжная ссылка не получена.');
    } catch (error) {
      showError(error.message || 'Не удалось открыть оплату PRO.');
    } finally {
      if (button) { button.disabled = false; button.textContent = 'Подключить PRO · 4,99 $'; }
    }
  });

  async function boot() {
    try {
      const params = new URLSearchParams(location.search);
      const sessionId = params.get('session_id');
      if (params.get('billing') === 'success' && sessionId) {
        try {
          const result = await request('/api/billing?action=confirm', {
            method: 'POST',
            body: JSON.stringify({ session_id: sessionId })
          });
          if (result.user) renderAccount(result.user);
        } catch (error) {
          showError('Оплата вернулась, но подтверждение не завершено: ' + error.message);
        }
        params.delete('billing');
        params.delete('session_id');
        const query = params.toString();
        history.replaceState({}, '', location.pathname + (query ? '?' + query : '') + location.hash);
      } else if (params.get('billing') === 'cancelled') {
        params.delete('billing');
        const query = params.toString();
        history.replaceState({}, '', location.pathname + (query ? '?' + query : '') + location.hash);
      }

      const data = await request('/api/auth?action=me');
      if (data.authenticated && data.user) {
        renderAccount(data.user);
        syncAppScope(data.user);
        overlay.hidden = true;
      } else {
        renderAccount(null);
        openAuth('signup');
      }
    } catch (error) {
      console.warn('KD auth session check failed:', error);
      renderAccount(null);
      openAuth('signup');
      showError('Не удалось проверить сессию. Регистрация может быть недоступна, пока сервер не настроен: ' + error.message);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
