/* KD Intelligence — safe UI rebrand layer.
 * Deliberately changes user-facing labels only. Technical identifiers,
 * API routes, storage keys, Supabase fields and legacy compatibility names stay intact.
 */
(function () {
  'use strict';

  const BRAND = 'KD Intelligence';
  const DESC = 'Trading Intelligence';
  const TAGLINE = 'AI-интеллект для анализа, дисциплины и контроля риска.';
  const EN_TAGLINE = 'AI-powered trading intelligence for disciplined traders.';

  const replacements = [
    ['KriptoDanik AI · AI Коуч', 'KD Intelligence · AI Коуч'],
    ['KriptoDanik AI · AI Coach', 'KD Intelligence · AI Coach'],
    ['KRIPTODANIK AI • TRADING INTELLIGENCE', 'KD INTELLIGENCE • TRADING INTELLIGENCE'],
    ['KRIPTODANIK AI', 'KD INTELLIGENCE'],
    ['KriptoDanik AI', BRAND],
    ['KriptoDanik', BRAND],
    ['AI-проводник в трейдинге.', TAGLINE],
    ['AI-проводник', 'AI-интеллект']
  ];

  function replaceText(value) {
    let out = value;
    for (const [from, to] of replacements) out = out.split(from).join(to);
    return out;
  }

  function rewriteVisibleText(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const next = replaceText(node.nodeValue || '');
      if (next !== node.nodeValue) node.nodeValue = next;
    });
  }

  function rewriteAttributes(root) {
    if (!root) return;
    root.querySelectorAll('[alt],[title],[aria-label],[placeholder]').forEach(el => {
      ['alt', 'title', 'aria-label', 'placeholder'].forEach(attr => {
        if (!el.hasAttribute(attr)) return;
        const value = el.getAttribute(attr);
        const next = replaceText(value || '');
        if (next !== value) el.setAttribute(attr, next);
      });
    });
  }

  function setCoreBranding() {
    document.title = 'KD Intelligence — Trading Intelligence';
    const meta = (selector, content) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };
    meta('meta[name="description"]', 'KD Intelligence — AI-интеллект для трейдинга. Анализ сделок, журнал, контроль риска и развитие торговой дисциплины.');
    meta('meta[property="og:title"]', 'KD Intelligence — Trading Intelligence');
    meta('meta[property="og:description"]', EN_TAGLINE);
    meta('meta[property="og:image:alt"]', BRAND);
    meta('meta[name="twitter:title"]', 'KD Intelligence — Trading Intelligence');
    meta('meta[name="twitter:description"]', EN_TAGLINE);

    const version = document.querySelector('meta[name="application-version"]');
    if (version) version.setAttribute('content', '1.9.0');

    const appName = document.getElementById('appName');
    const appSub = document.getElementById('appSub');
    if (appName) appName.textContent = BRAND;
    if (appSub) appSub.textContent = DESC;

    document.querySelectorAll('#settings-about span').forEach(el => {
      if (/AI v\d+\.\d+\.\d+/.test(el.textContent)) el.textContent = 'AI v1.9.0';
    });
    document.querySelectorAll('#settings-profile .info-row span').forEach(el => {
      if (/^v\d+\.\d+\.\d+$/.test(el.textContent.trim())) el.textContent = 'v1.9.0';
    });
  }

  function apply() {
    try {
      setCoreBranding();
      rewriteVisibleText(document.body);
      rewriteAttributes(document.body);
      document.querySelectorAll('.wizard-philosophy').forEach(el => {
        el.textContent = 'KD Intelligence не является поставщиком сигналов и не предсказывает рынок. Наша задача — помочь вам соблюдать дисциплину, организовать рабочее пространство и следовать вашей собственной торговой стратегии.';
      });
      document.documentElement.dataset.kdBrand = 'kd-intelligence';
      window.KD_BRAND = { name: BRAND, descriptor: DESC, version: '1.9.0' };
    } catch (error) {
      console.warn('KD Intelligence rebrand:', error);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();
  window.addEventListener('load', apply, { once: true });

  const startObserver = () => {
    if (!document.body || window.__kdRebrandObserver) return;
    const observer = new MutationObserver(() => apply());
    observer.observe(document.body, { childList: true, subtree: true });
    window.__kdRebrandObserver = observer;
    setTimeout(() => observer.disconnect(), 12000);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  else startObserver();
})();
