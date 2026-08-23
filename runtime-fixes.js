/* KriptoDanik AI — runtime fixes v1.1.1 */
(function () {
  'use strict';

  function getApp() {
    return window.App || null;
  }

  function resolveCoachNodes(app) {
    if (!app) return null;
    const messages = document.getElementById('aiMessages');
    const input = document.querySelector('#section-intelligence #aiInput, #section-intelligence textarea, #section-intelligence input[type="text"]');
    if (messages) app.aiMessages = messages;
    if (input) app.aiInput = input;
    return { messages, input };
  }

  function patchCoachDom() {
    const app = getApp();
    if (!app || app.__kdRuntimeCoachFix) return;
    app.__kdRuntimeCoachFix = true;

    const originalAppend = app.appendMessage;
    if (typeof originalAppend === 'function') {
      app.appendMessage = function (role, content) {
        resolveCoachNodes(this);
        return originalAppend.call(this, role, content);
      };
    }

    const originalShowTyping = app.showTypingIndicator;
    if (typeof originalShowTyping === 'function') {
      app.showTypingIndicator = function () {
        resolveCoachNodes(this);
        return originalShowTyping.call(this);
      };
    }

    const originalRenderHistory = app.renderAIHistory;
    if (typeof originalRenderHistory === 'function') {
      app.renderAIHistory = function () {
        resolveCoachNodes(this);
        return originalRenderHistory.call(this);
      };
    }

    const originalRenderWelcome = app.renderAIWelcome;
    if (typeof originalRenderWelcome === 'function') {
      app.renderAIWelcome = function () {
        resolveCoachNodes(this);
        return originalRenderWelcome.call(this);
      };
    }

    const originalHandle = app.handleAIQuery;
    if (typeof originalHandle === 'function') {
      app.handleAIQuery = async function () {
        resolveCoachNodes(this);
        return originalHandle.call(this);
      };
    }

    resolveCoachNodes(app);
  }

  function fixCoachWorkspace() {
    const app = getApp();
    if (!app) return;
    const nodes = resolveCoachNodes(app);
    if (!nodes?.messages) return;

    try {
      if (Array.isArray(app.aiHistory) && app.aiHistory.length && typeof app.renderAIHistory === 'function') {
        app.renderAIHistory();
      } else if (!nodes.messages.children.length && typeof app.renderAIWelcome === 'function') {
        app.renderAIWelcome();
      }
    } catch (error) {
      console.warn('KriptoDanik AI Coach render fix:', error);
    }

    const liveMessages = document.getElementById('aiMessages');
    if (liveMessages) {
      app.aiMessages = liveMessages;
      liveMessages.querySelectorAll('.ai-msg-wrapper').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    }
  }

  function fixDashboardBalance() {
    const app = getApp();
    if (!app) return;
    app.userData = app.userData && typeof app.userData === 'object' ? app.userData : {};
    const capital = Number.parseFloat(app.userData.capital);
    if (!Number.isFinite(capital) || capital <= 0 || capital === 10000) app.userData.capital = 100000;
    try { app.updateBalanceDisplay(); } catch (_) {}
    const balanceDisplay = document.getElementById('balanceDisplay');
    const brandBalance = document.getElementById('brandBalance');
    if (brandBalance) {
      brandBalance.textContent = balanceDisplay?.textContent || '$ ' + Number(app.getCurrentBalance()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    const brandBalanceSub = document.getElementById('brandBalanceSub');
    if (brandBalanceSub && Array.isArray(app.trades) && app.trades.length === 0) brandBalanceSub.textContent = 'Стартовый капитал';
    try { app.saveState(); } catch (_) {}
  }

  function loadEconomicCalendarFix() {
    if (document.querySelector('script[data-kd-economic-calendar]')) return;
    const script = document.createElement('script');
    script.src = 'economic-calendar.js?v=1.0.0';
    script.async = true;
    script.dataset.kdEconomicCalendar = 'true';
    script.onerror = () => console.warn('KriptoDanik economic calendar integration failed to load.');
    document.head.appendChild(script);
  }

  function bindNavigationRefresh() {
    document.querySelectorAll('.nav-item[data-section="intelligence"]').forEach(button => {
      if (button.dataset.kdCoachRefreshBound === '1') return;
      button.dataset.kdCoachRefreshBound = '1';
      button.addEventListener('click', function () {
        setTimeout(fixCoachWorkspace, 0);
        setTimeout(fixCoachWorkspace, 100);
        setTimeout(fixCoachWorkspace, 300);
      });
    });
  }

  function run() {
    const app = getApp();
    if (!app) return;
    patchCoachDom();
    fixDashboardBalance();
    loadEconomicCalendarFix();
    if (typeof window.KDRefreshBrandDashboard === 'function') {
      try { window.KDRefreshBrandDashboard(); } catch (_) {}
    }
    bindNavigationRefresh();
    setTimeout(fixCoachWorkspace, 0);
    setTimeout(fixCoachWorkspace, 150);
    setTimeout(fixCoachWorkspace, 700);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
  window.addEventListener('load', run);
})();
