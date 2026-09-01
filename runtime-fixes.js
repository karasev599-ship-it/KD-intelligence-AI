/* KriptoDanik AI — runtime fixes v1.12.3 */
(function () {
  'use strict';

  function getApp() {
    try { if (typeof App !== 'undefined') return App; } catch (_) {}
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

  function releaseStaleInteractionLayers() {
    const layers = document.querySelectorAll('.onboarding-overlay, .coach-tour-overlay, .mobile-nav-scrim, #kdAuthOverlay, #screenshotLightbox');
    layers.forEach(layer => {
      const computed = window.getComputedStyle(layer);
      const hiddenAttr = layer.hidden || layer.getAttribute('aria-hidden') === 'true';
      const visuallyHidden = computed.display === 'none' || computed.visibility === 'hidden' || computed.opacity === '0';
      layer.style.pointerEvents = hiddenAttr || visuallyHidden ? 'none' : '';
    });
  }

  function ensureNavigationWorks() {
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
      if (item.dataset.kdRuntimeNavBound === '1') return;
      item.dataset.kdRuntimeNavBound = '1';
      item.addEventListener('click', function () {
        const app = getApp();
        if (!app || typeof app.showSection !== 'function') return;
        document.querySelectorAll('.nav-item[data-section]').forEach(node => node.classList.remove('active'));
        this.classList.add('active');
        app.showSection(this.dataset.section);
        if (typeof app.closeMobileNav === 'function') app.closeMobileNav();
      });
    });
  }

  function patchCoachDom() {
    const app = getApp();
    if (!app || app.__kdRuntimeCoachFix) return;
    app.__kdRuntimeCoachFix = true;
    const originalAppend = app.appendMessage;
    if (typeof originalAppend === 'function') app.appendMessage = function (role, content) { resolveCoachNodes(this); return originalAppend.call(this, role, content); };
    const originalShowTyping = app.showTypingIndicator;
    if (typeof originalShowTyping === 'function') app.showTypingIndicator = function () { resolveCoachNodes(this); return originalShowTyping.call(this); };
    const originalRenderHistory = app.renderAIHistory;
    if (typeof originalRenderHistory === 'function') app.renderAIHistory = function () { resolveCoachNodes(this); return originalRenderHistory.call(this); };
    const originalRenderWelcome = app.renderAIWelcome;
    if (typeof originalRenderWelcome === 'function') app.renderAIWelcome = function () { resolveCoachNodes(this); return originalRenderWelcome.call(this); };
    const originalHandle = app.handleAIQuery;
    if (typeof originalHandle === 'function') app.handleAIQuery = async function () { resolveCoachNodes(this); return originalHandle.call(this); };
    resolveCoachNodes(app);
  }

  function fixCoachWorkspace() {
    const app = getApp();
    if (!app) return;
    const nodes = resolveCoachNodes(app);
    if (!nodes?.messages) return;
    try {
      if (Array.isArray(app.aiHistory) && app.aiHistory.length && typeof app.renderAIHistory === 'function') app.renderAIHistory();
      else if (!nodes.messages.children.length && typeof app.renderAIWelcome === 'function') app.renderAIWelcome();
    } catch (error) { console.warn('KD AI Coach render fix:', error); }
    const liveMessages = document.getElementById('aiMessages');
    if (liveMessages) {
      app.aiMessages = liveMessages;
      liveMessages.querySelectorAll('.ai-msg-wrapper').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
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
    if (brandBalance) brandBalance.textContent = balanceDisplay?.textContent || '$ ' + Number(app.getCurrentBalance()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    script.onerror = () => console.warn('KD economic calendar integration failed to load.');
    document.head.appendChild(script);
  }

  function bindNavigationRefresh() {
    document.querySelectorAll('.nav-item[data-section="intelligence"]').forEach(button => {
      if (button.dataset.kdCoachRefreshBound === '1') return;
      button.dataset.kdCoachRefreshBound = '1';
      button.addEventListener('click', function () {
        setTimeout(fixCoachWorkspace, 0); setTimeout(fixCoachWorkspace, 100); setTimeout(fixCoachWorkspace, 300);
      });
    });
  }

  function patchForexMarketPulse() {
    const app = getApp();
    if (!app || app.__kdForexMarketFix || typeof app.loadMarketPulse !== 'function') return;
    app.__kdForexMarketFix = true;
    const originalLoadMarketPulse = app.loadMarketPulse.bind(app);
    app.renderMarketMode = (function (original) { return function () {
      original.call(this);
      if (this.marketMode !== 'forex') return;
      if (this.marketContextTitle) this.marketContextTitle.textContent = 'Форекс';
      if (this.marketSourceLabel) this.marketSourceLabel.textContent = 'ECB reference rates + Gold API';
      if (this.marketStrategyContext) this.marketStrategyContext.textContent = 'Отслеживаем EUR/USD, GBP/USD и XAU/USD: валютные курсы и спот золота для собственного анализа. Никаких торговых сигналов.';
      if (this.marketStrategyTags) this.marketStrategyTags.innerHTML = ['EUR/USD','GBP/USD','XAU/USD','ECB / rates'].map(t => `<span>${this.escapeHtml(t)}</span>`).join('');
    }; })(app.renderMarketMode);
    app.loadMarketPulse = async function (silent = false) {
      if (this.marketMode !== 'forex') return originalLoadMarketPulse(silent);
      if (!this.marketPulseGrid) return;
      this.renderMarketSession(); this.renderMarketMode(); if (!silent) this.renderMarketPulseLoading();
      const started = performance.now();
      try {
        const nowDate = new Date(); const previousDate = new Date(nowDate); previousDate.setUTCDate(previousDate.getUTCDate() - 3); const fmt = d => d.toISOString().slice(0,10);
        const [latestFxResponse, previousFxResponse, goldResponse] = await Promise.all([
          fetch('https://api.frankfurter.app/latest?from=USD&to=EUR,GBP',{cache:'no-store'}),
          fetch(`https://api.frankfurter.app/${fmt(previousDate)}?from=USD&to=EUR,GBP`,{cache:'no-store'}),
          fetch('https://api.gold-api.com/price/XAU',{cache:'no-store'})
        ]);
        if (!latestFxResponse.ok || !previousFxResponse.ok || !goldResponse.ok) throw new Error('Forex market data source unavailable');
        const latestFx = await latestFxResponse.json(); const previousFx = await previousFxResponse.json(); const gold = await goldResponse.json();
        const fxRows = ['EUR','GBP'].map(code => {
          const usdPerUnit = Number(latestFx?.rates?.[code]); const previousUsdPerUnit = Number(previousFx?.rates?.[code]);
          if (!Number.isFinite(usdPerUnit) || usdPerUnit <= 0) throw new Error(`Missing ${code} rate`);
          const last = 1 / usdPerUnit; const previous = Number.isFinite(previousUsdPerUnit) && previousUsdPerUnit > 0 ? 1 / previousUsdPerUnit : null; const pct = previous ? ((last-previous)/previous)*100 : null;
          return {symbol:`${code}USD`,label:`${code}/USD`,name:code,lastPrice:last,priceChangePercent:pct,previousPrice:previous,source:'Frankfurter / ECB'};
        });
        const goldPrice = Number(gold?.price); if (!Number.isFinite(goldPrice) || goldPrice <= 0) throw new Error('Missing XAU price');
        fxRows.push({symbol:'XAUUSD',label:'XAU/USD',name:'XAU',lastPrice:goldPrice,priceChangePercent:null,previousPrice:null,source:'Gold API'});
        const now = new Date(); const latency = Math.round(performance.now()-started);
        this.marketPulseGrid.innerHTML = fxRows.map(row => {
          const pct = this.marketNum(row.priceChangePercent); const isGold = row.symbol === 'XAUUSD'; const decimals = isGold ? 2 : 5; const price = row.lastPrice.toFixed(decimals); const change = pct === null ? '—' : this.marketFmtPct(pct); const changeClass = pct === null ? '' : (pct >= 0 ? 'positive' : 'negative'); const previous = row.previousPrice === null ? '—' : row.previousPrice.toFixed(decimals);
          return `<article class="pulse-card glass-panel"><div class="pulse-top"><span>${this.escapeHtml(row.label)}</span><em class="${changeClass}">${change}</em></div><strong>${isGold ? '$' + Number(price).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : price}</strong><div class="pulse-range" title="${isGold?'Спот XAU/USD':'Курс относительно USD'}"><i style="width:50%"></i></div><div class="pulse-range-labels"><span>${isGold?'XAU':row.name}</span><span>LIVE</span><span>USD</span></div><div class="pulse-row"><span>${isGold?'Спот':'Курс'}</span><b>${isGold?'XAU / USD':row.label}</b></div><div class="pulse-row"><span>Предыдущий</span><b>${previous}</b></div><div class="pulse-row"><span>Источник</span><b>${this.escapeHtml(row.source)}</b></div></article>`;
        }).join('') + `<div class="pulse-source glass-panel">Frankfurter / ECB + Gold API · ${now.toLocaleTimeString()} · ${latency} ms · режим: Форекс.</div>`;
        if (this.marketLiveStatus) this.marketLiveStatus.textContent='Данные актуальны'; if (this.marketLastUpdated) this.marketLastUpdated.textContent=now.toLocaleTimeString(); if (this.marketLatency) this.marketLatency.textContent=latency+' ms';
        const analysis=document.getElementById('marketAiAnalysis'); if (analysis) analysis.innerHTML='<div class="analysis-list"><div><b>Рынок</b><p>Форекс · EUR/USD, GBP/USD и XAU/USD · данные получены сейчас.</p></div><div><b>Курсы</b><p>EUR/USD и GBP/USD — справочные курсы ECB через Frankfurter. XAU/USD — текущий спот золота.</p></div><div><b>Источник</b><p>Данные предназначены для собственного анализа и не являются торговым сигналом.</p></div></div>';
        await Promise.all([this.loadMarketCalendar(),this.loadMarketNews()]);
      } catch (error) {
        console.error('Forex Market Pulse fix:',error);
        if (this.marketPulseGrid) this.marketPulseGrid.innerHTML='<div class="module-empty glass-panel"><div class="module-empty-icon">⌁</div><h3>Форекс недоступен</h3><p>Не удалось получить EUR/USD, GBP/USD и XAU/USD. Никаких выдуманных значений не показываем.</p><button class="btn-primary" onclick="App.loadMarketPulse()">Повторить</button></div>';
        if (this.marketLiveStatus) this.marketLiveStatus.textContent='Нет соединения'; if (this.marketLatency) this.marketLatency.textContent='—';
        await Promise.all([this.loadMarketCalendar(),this.loadMarketNews()]);
      }
    };
  }

  /* Restore the owner profile controls without trusting the browser for authorization.
     The API already returns is_admin as part of the authenticated user payload. */
  function restoreOwnerProfile() {
    const app = getApp();
    const user = app?.userData || window.KD_AUTH_USER || null;
    if (!user || !user.is_admin) return;
    const accountPanel = document.querySelector('#kdAccountPanel, .kd-account-panel');
    const profileHost = accountPanel || document.querySelector('.kd-account-copy')?.parentElement;
    if (!profileHost || document.getElementById('kdOwnerAdminLink')) return;
    const link = document.createElement('a');
    link.id = 'kdOwnerAdminLink'; link.href = '/admin.html'; link.textContent = '👑 Админка';
    link.style.cssText = 'display:flex;align-items:center;justify-content:center;text-decoration:none;width:100%;box-sizing:border-box;padding:11px 14px;margin-top:4px;border-radius:11px;background:linear-gradient(135deg,#7865ff,#a38cff);color:#fff;font-weight:800;';
    link.addEventListener('click', e => { e.stopPropagation(); });
    profileHost.appendChild(link);
  }

  /* Keep the dashboard character visible even when a stale CSS rule or an old
     persisted state hides it. Only the known character asset is targeted. */
  function restoreDashboardCharacter() {
    const candidates = document.querySelectorAll('img[src*="hero-character"], [data-character="hero-character"]');
    candidates.forEach(node => {
      node.hidden = false; node.removeAttribute('aria-hidden'); node.style.display = ''; node.style.visibility = 'visible'; node.style.opacity = '1';
    });
    const hero = document.querySelector('.dashboard-hero, .hero-card, .welcome-hero');
    if (hero && !hero.querySelector('img[src*="hero-character"]')) {
      const img = document.createElement('img'); img.src='assets/hero-character-clean.png'; img.alt='KD Intelligence character'; img.loading='eager'; img.className='kd-restored-hero-character';
      img.onerror=()=>{ img.onerror=null; img.src='assets/hero-character.png'; };
      img.style.cssText='position:absolute;right:18px;bottom:0;max-height:280px;width:auto;pointer-events:none;z-index:2;object-fit:contain;';
      hero.style.position='relative'; hero.appendChild(img);
    }
  }

  function run() {
    releaseStaleInteractionLayers(); ensureNavigationWorks();
    const app = getApp(); if (!app) return;
    patchCoachDom(); fixDashboardBalance(); loadEconomicCalendarFix(); patchForexMarketPulse(); restoreOwnerProfile(); restoreDashboardCharacter();
    if (typeof window.KDRefreshBrandDashboard === 'function') { try { window.KDRefreshBrandDashboard(); } catch (_) {} }
    bindNavigationRefresh();
    setTimeout(releaseStaleInteractionLayers,0); setTimeout(releaseStaleInteractionLayers,150); setTimeout(releaseStaleInteractionLayers,700);
    setTimeout(fixCoachWorkspace,0); setTimeout(fixCoachWorkspace,150); setTimeout(fixCoachWorkspace,700);
    setTimeout(restoreOwnerProfile,100); setTimeout(restoreOwnerProfile,500); setTimeout(restoreDashboardCharacter,100); setTimeout(restoreDashboardCharacter,700);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();
  window.addEventListener('load',run);
})();
