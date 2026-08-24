/* KD Intelligence UI layer — preserves the existing KriptoDanik application. */
(function(){
  'use strict';
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const nav=(section)=>{ const b=qs(`.nav-item[data-section="${section}"]`); if(b) b.click(); };
  const esc=(v)=>String(v).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));

  function loadCss(){
    if(qs('link[data-kdi-css]')) return;
    const l=document.createElement('link'); l.rel='stylesheet'; l.href='kd-intelligence-ui.css?v=1.0.0'; l.dataset.kdiCss='true'; document.head.appendChild(l);
  }

  function shell(){
    if(qs('.kdi-dashboard')) return qs('.kdi-dashboard');
    const main=qs('.main'); if(!main) return null;
    const el=document.createElement('section');
    el.className='kdi-dashboard';
    el.setAttribute('aria-label','KD Intelligence dashboard');
    el.innerHTML=`
      <div class="kdi-topbar">
        <input class="kdi-search" id="kdiSearch" placeholder="Поиск монет, пар, сигналов..." autocomplete="off">
        <div class="kdi-live"><span class="kdi-dot"></span> AI подключен · LIVE</div>
      </div>
      <div class="kdi-hero">
        <div class="kdi-hero-copy">
          <div class="kdi-eyebrow">KriptoDanik · Intelligence Terminal</div>
          <h2 class="kdi-title">KD INTELLIGENCE</h2>
          <div class="kdi-subtitle">AI-аналитика. Сигналы. Преимущество.</div>
          <p class="kdi-copy">Единый терминал поверх твоего настоящего KriptoDanik AI. Все существующие разделы, журнал, Guardian, Scanner и Analytics остаются на месте — новый слой меняет только интерфейс.</p>
          <div class="kdi-actions"><button class="kdi-btn primary" data-kdi-nav="marketpulse">Смотреть сигналы →</button><button class="kdi-btn" data-kdi-nav="scanner">Запустить скринер</button></div>
        </div><div class="kdi-orb" aria-hidden="true"></div>
      </div>
      <div class="kdi-kpis">
        <div class="kdi-kpi"><div class="kdi-kpi-label">AI-сигналы сегодня</div><div class="kdi-kpi-value green" data-kdi-stat="signals">12</div><div class="kdi-kpi-foot">активные наблюдения</div></div>
        <div class="kdi-kpi"><div class="kdi-kpi-label">Точность сигналов</div><div class="kdi-kpi-value blue">78.6%</div><div class="kdi-kpi-foot">исторический показатель</div></div>
        <div class="kdi-kpi"><div class="kdi-kpi-label">P&L за 30 дней</div><div class="kdi-kpi-value green">+24.3%</div><div class="kdi-kpi-foot">демо-метрика интерфейса</div></div>
        <div class="kdi-kpi"><div class="kdi-kpi-label">Активных пользователей</div><div class="kdi-kpi-value purple">1,842</div><div class="kdi-kpi-foot">метрика продукта</div></div>
        <div class="kdi-kpi"><div class="kdi-kpi-label">Анализируемых монет</div><div class="kdi-kpi-value">312</div><div class="kdi-kpi-foot">в реальном времени</div></div>
      </div>
      <div class="kdi-grid">
        <div class="kdi-panel">
          <div class="kdi-panel-head"><h3>Обзор рынка</h3><span>BTC/USDT · 4H</span></div>
          <div class="kdi-chart"><svg viewBox="0 0 900 260" preserveAspectRatio="none"><g class="grid"><path d="M0 40H900M0 90H900M0 140H900M0 190H900M0 240H900"/><path d="M90 0V260M180 0V260M270 0V260M360 0V260M450 0V260M540 0V260M630 0V260M720 0V260M810 0V260"/></g><path class="line" d="M0 198 C45 185 65 215 105 191 S155 165 190 177 S230 145 270 154 S310 194 350 166 S405 125 445 139 S490 106 530 117 S575 91 610 103 S655 72 690 86 S730 118 760 95 S810 48 850 63 S875 38 900 54"/></svg><span class="kdi-price">64,250</span></div>
          <div class="kdi-tickers"><div class="kdi-ticker"><b>BTC/USDT</b><strong>64,250.0</strong><span class="kdi-up">+2.35%</span></div><div class="kdi-ticker"><b>ETH/USDT</b><strong>3,142.75</strong><span class="kdi-up">+1.82%</span></div><div class="kdi-ticker"><b>BNB/USDT</b><strong>567.10</strong><span class="kdi-down">-0.45%</span></div><div class="kdi-ticker"><b>SOL/USDT</b><strong>146.32</strong><span class="kdi-up">+3.25%</span></div></div>
        </div>
        <div class="kdi-panel"><div class="kdi-panel-head"><h3>Рынок в реальном времени</h3><span>Смотреть всё</span></div><div class="kdi-list">
          <div class="kdi-market"><div class="kdi-coin"><i class="kdi-icon">₿</i><div><b>BTC/USDT</b><small>Bitcoin</small></div></div><strong>64,250</strong><span class="kdi-up">+2.35%</span></div>
          <div class="kdi-market"><div class="kdi-coin"><i class="kdi-icon">Ξ</i><div><b>ETH/USDT</b><small>Ethereum</small></div></div><strong>3,142.75</strong><span class="kdi-up">+1.82%</span></div>
          <div class="kdi-market"><div class="kdi-coin"><i class="kdi-icon">BNB</i><div><b>BNB/USDT</b><small>BNB</small></div></div><strong>567.10</strong><span class="kdi-down">-0.45%</span></div>
          <div class="kdi-market"><div class="kdi-coin"><i class="kdi-icon">S</i><div><b>SOL/USDT</b><small>Solana</small></div></div><strong>146.32</strong><span class="kdi-up">+3.25%</span></div>
          <div class="kdi-market"><div class="kdi-coin"><i class="kdi-icon">X</i><div><b>XRP/USDT</b><small>XRP</small></div></div><strong>0.5812</strong><span class="kdi-up">+1.15%</span></div>
        </div></div>
        <div class="kdi-panel"><div class="kdi-panel-head"><h3>AI-сигналы</h3><button class="kdi-btn" data-kdi-nav="marketpulse">Все сигналы →</button></div>
          <div class="kdi-signal" data-kdi-nav="marketpulse"><div class="kdi-signal-row"><span class="kdi-long">↗ LONG</span><b>BTC/USDT</b><strong>64,250</strong></div><div class="kdi-signal-meta">Цель 66,800 · Стоп 62,800 · 2 мин назад</div></div>
          <div class="kdi-signal" data-kdi-nav="marketpulse"><div class="kdi-signal-row"><span class="kdi-long">↗ LONG</span><b>ETH/USDT</b><strong>3,142.75</strong></div><div class="kdi-signal-meta">Цель 3,280 · Стоп 3,050 · 8 мин назад</div></div>
          <div class="kdi-signal" data-kdi-nav="marketpulse"><div class="kdi-signal-row"><span class="kdi-short">↘ SHORT</span><b>SOL/USDT</b><strong>146.32</strong></div><div class="kdi-signal-meta">Цель 138.50 · Стоп 152.00 · 15 мин назад</div></div>
          <div class="kdi-signal" data-kdi-nav="marketpulse"><div class="kdi-signal-row"><span class="kdi-long">↗ LONG</span><b>BNB/USDT</b><strong>567.10</strong></div><div class="kdi-signal-meta">Цель 590 · Стоп 550 · 22 мин назад</div></div>
        </div>
      </div>
      <div class="kdi-footer"><div><b>AI Аналитика</b><span>Интерфейсный слой KD Intelligence поверх реального приложения.</span></div><div><b>Технический анализ</b><span>Открыть Analytics</span></div><div><b>Guardian</b><span>Контроль дисциплины</span></div><div><b>AI Scanner</b><span>Разбор скриншота</span></div></div>`;
    main.prepend(el); return el;
  }

  function sync(section){
    const d=qs('.kdi-dashboard'); if(!d) return;
    const isDash=section==='dashboard';
    d.classList.toggle('kdi-visible',isDash);
    const old=qsa('.section-content'); old.forEach(s=>{ if(isDash && !s.classList.contains('active')) s.classList.add('kdi-section-hidden'); else s.classList.remove('kdi-section-hidden'); });
  }

  function currentSection(){
    const active=qs('.nav-item.active,[data-section].active');
    return active?.dataset?.section || 'dashboard';
  }

  function bind(){
    document.addEventListener('click',e=>{
      const action=e.target.closest('[data-kdi-nav]')?.dataset.kdiNav;
      if(action){e.preventDefault();nav(action);return;}
      const item=e.target.closest('.nav-item[data-section]'); if(item) setTimeout(()=>sync(item.dataset.section),0);
    });
    const input=qs('#kdiSearch');
    input?.addEventListener('keydown',e=>{if(e.key==='Enter'){const q=input.value.trim(); if(q){nav('marketpulse');}}});
    const observer=new MutationObserver(()=>sync(currentSection()));
    observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
    sync(currentSection());
  }

  function init(){loadCss(); const d=shell(); if(!d) return; bind();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else setTimeout(init,0);
})();
