"use strict";

/* ============================================================
   KD INTELLIGENCE AI — RELEASE CANDIDATE (SPRINT 10)
   ============================================================ */

const KD_BUILD_VERSION = '1.22.0';

function kdLocalDateKey(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function kdMaxDrawdownPercent(trades, startingCapital) {
    const start = Number(startingCapital);
    const initial = Number.isFinite(start) && start > 0 ? start : 100000;
    let equity = initial;
    let peak = initial;
    let maxDd = 0;

    for (const trade of (Array.isArray(trades) ? [...trades].reverse() : [])) {
        const pnl = Number.parseFloat(trade?.pnl);
        if (!Number.isFinite(pnl)) continue;
        equity += pnl;
        if (equity > peak) peak = equity;
        if (peak > 0) {
            const dd = ((peak - equity) / peak) * 100;
            if (dd > maxDd) maxDd = dd;
        }
    }
    return maxDd;
}

const App = {

    // ===== DATA =====
    trades: [],
    filteredTrades: [],
    currentPage: 1,
    pageSize: 10,
    editingTradeId: null,

    currentDate: new Date(),
    selectedDate: new Date(),
    events: [],

    guardianRules: [],
    guardianSummary: { score: null, passed: 0, failed: 0, nodata: 0 },
    guardianViolations: [],

    analyticsCharts: {},
    guardianCharts: {},
    performanceCharts: {},
    equityChartInstance: null,
    dashboardCharts: {},
    marketCache: null,

    currentLang: 'ru',
    userData: {},
    storageScope: 'anonymous',
    onboardingDone: false,
    accentPalette: ['purple', 'blue', 'green', 'yellow', 'red'],

    aiHistory: [],
    strategies: [],
    builtInStrategy: {
        id: 'builtin_owner_strategy', protected: true, name: 'My Built-in Strategy', market: 'Crypto', timeframe: '4H → 5M',
        tags: ['Built-in','Protected','4H → 5M','Pin Bar','Range','FVG','IFVG'],
        entry: 'На 4H определить максимум и минимум предыдущей сессии. Перенести уровни на 5M и искать ТВХ по Pin Bar, Range, FVG или IFVG. Обязательное условие: должно быть подтверждение.',
        exit: 'Точные правила выхода не заданы в исходном ТЗ.',
        notes: 'Точное определение confirmation владельцем стратегии ещё не задано. Не добавлять самостоятельно дополнительные условия, фильтры или правила.',
        createdAt: '2026-08-13T00:00:00.000Z'
    },

    translations: {
        ru: {
            nav_dashboard: 'Дашборд',
            nav_journal: 'Журнал',
            nav_calendar: 'Календарь',
            nav_analytics: 'Аналитика',
            nav_performance: 'Показатели',
            nav_guardian: 'Guardian',
            nav_intelligence: 'AI Коуч',
            nav_settings: 'Настройки',
            nav_academy: 'Академия',
            nav_strategy: 'Библиотека стратегий',
            nav_marketpulse: 'Market Pulse',
            online: 'AI подключен',
            balance: 'Баланс',
            balance_live: 'Актуальный баланс',
            greeting: 'Добрый день',
            greeting_morning: 'Доброе утро',
            greeting_afternoon: 'Добрый день',
            greeting_evening: 'Добрый вечер',
            welcome: 'Добро пожаловать,',
            equity_curve: 'Кривая доходности',
            total_trades: 'Всего сделок',
            win_rate: 'Win Rate',
            avg_rr: 'Средний RR',
            total_pnl: 'Общий P&L',
            date: 'Дата', asset: 'Актив', side: 'Сторона', entry: 'Вход', exit: 'Выход', rr: 'RR', result: 'Результат', status: 'Статус',
            empty_equity_title: 'Пока нет данных для кривой доходности',
            empty_equity_desc: 'Добавьте первую сделку в Journal — и здесь появится динамика вашего баланса.',
            empty_rdist_title: 'Нет сделок для распределения по R',
            empty_besttime_title: 'Недостаточно истории торговли',
            empty_besttime_desc: 'Как только у вас будет минимум 5 сделок, здесь появится анализ ваших самых результативных торговых сессий.',
            besttime_desc: 'Показывает вашу среднюю доходность (R) по каждой торговой сессии, чтобы вы видели, когда торгуете эффективнее всего.',
            empty_assets_title: 'Нет сделок по активам',
            empty_notifications: 'Уведомлений пока нет.',
            empty_analytics: 'Аналитика пока недоступна.',
            empty_performance: 'Пока недостаточно данных для показателей.',
            empty_guardian: 'Guardian начнёт отслеживать дисциплину после первой сделки.',
            empty_journal: 'Сделок пока нет. Добавьте первую!',
            empty_calendar_events: 'Событий на этот день нет.',
            empty_calendar_trades: 'Сделок в этот день нет.',
            ai_disclaimer: 'KD Intelligence AI не является финансовым советником, не даёт торговых сигналов и не предсказывает направление рынка. Он помогает вам соблюдать собственную торговую стратегию, правила и дисциплину.',

            // ===== v1.0.7 — Smart Dashboard =====
            today_overview: 'Сегодня',
            today_pnl: 'P&L сегодня',
            today_trades: 'Сделок сегодня',
            today_winrate: 'Win Rate сегодня',
            discipline_score: 'Дисциплина',
            no_data_short: '—',
            no_data: 'Нет данных',
            guardian_status: 'Статус Guardian',
            guardian_passed: 'Соблюдено',
            guardian_failed: 'Нарушено',
            guardian_nodata: 'Нет данных',
            guardian_nodata_yet: 'Guardian: нет данных',
            recent_trades: 'Последние сделки',
            no_trades_yet_dash: 'Сделок пока нет',
            add_first_trade: 'Добавить первую сделку',
            quick_actions: 'Быстрые действия',
            qa_add_trade: 'Добавить сделку',
            qa_open_journal: 'Открыть Journal',
            qa_open_guardian: 'Открыть Guardian',
            qa_open_analytics: 'Открыть Analytics',
            dash_welcome_title: 'Добро пожаловать в KD Intelligence AI',
            dash_welcome_no_data: 'Пока нет данных для торговли',
            dash_welcome_cta: 'Начните с записи первой сделки.',
            coach_snapshot: 'AI Coach',
            coach_snapshot_empty: 'Добавьте первую сделку, чтобы получить персональные рекомендации.',
            tour_skip: 'Пропустить тур',

            // ===== v1.0.8 — Academy =====
            academy_header_title: 'Изучите систему. Торгуйте по плану.',
            academy_header_sub: 'Короткие практические уроки про риск, размер позиции, плечо и ликвидацию — плюс настоящий калькулятор.',
            academy_back: 'Назад в Академию',
            nav_scanner: 'AI Scanner',
            scanner_title: 'AI Scanner',
            scanner_sub: 'Загрузите скриншот графика, чтобы начать структурированный разбор сделки — прикрепите его к записи в Journal.',
            scanner_honesty_note: 'Scanner загружает и оптимизирует скриншот, затем может распознать текстовые метки через OCR (актив, таймфрейм, LONG/SHORT и названия структур). Числовые уровни не угадываются — проверьте результат перед сохранением.',
            scanner_upload_title: 'Загрузите скриншот графика',
            scanner_upload_sub: 'PNG или JPG, до 5МБ',
            scanner_choose_file: 'Выбрать файл',
            scanner_start_over: 'Начать заново',
            scanner_result_title: 'Результат сканирования',
            scanner_asset: 'Актив',
            scanner_direction: 'Направление',
            scanner_timeframe: 'Таймфрейм',
            scanner_entry: 'Вход',
            scanner_stoploss: 'Stop Loss',
            scanner_takeprofit: 'Take Profit',
            scanner_setup: 'Сетап / заметки',
            scanner_structures_title: 'Обнаруженные структуры',
            scanner_structures_note: 'Ничего не определяется автоматически — отметьте структуры, которые вы сами видите на графике.',
            scanner_disclaimer: 'Это не гарантированный сигнал и не обещание прибыли — только структурированный способ зафиксировать то, что вы видите на своём графике. Confidence отражает ручной разбор, а не автоматическую вероятность.',
            scanner_cancel: 'Отмена',
            scanner_confirm: 'Подтвердить → В Journal',
            scanner_not_detected: 'Не определено — требуется подтверждение',
            scanner_confidence_label: 'Confidence: N/A (ручной разбор, без модели компьютерного зрения)',
            scanner_view_screenshot: 'Открыть скриншот',
            scanner_learn_more: 'Подробнее',
            scanner_analyze: 'Анализировать скриншот',
            scanner_ocr_label: 'Распознанный текст на скриншоте',
        },
        en: {
            nav_dashboard: 'Dashboard',
            nav_journal: 'Journal',
            nav_calendar: 'Calendar',
            nav_analytics: 'Analytics',
            nav_performance: 'Performance',
            nav_guardian: 'Guardian',
            nav_intelligence: 'AI Coach',
            nav_settings: 'Settings',
            nav_academy: 'Academy',
            nav_strategy: 'Strategy Library',
            nav_marketpulse: 'Market Pulse',
            online: 'AI Connected',
            balance: 'Balance',
            balance_live: 'Live balance',
            greeting: 'Good day',
            greeting_morning: 'Good Morning',
            greeting_afternoon: 'Good Afternoon',
            greeting_evening: 'Good Evening',
            welcome: 'Welcome,',
            equity_curve: 'Equity Curve',
            total_trades: 'Total Trades',
            win_rate: 'Win Rate',
            avg_rr: 'Avg RR',
            total_pnl: 'Total P&L',
            date: 'Date', asset: 'Asset', side: 'Side', entry: 'Entry', exit: 'Exit', rr: 'RR', result: 'Result', status: 'Status',
            empty_equity_title: 'No equity data yet',
            empty_equity_desc: 'Add your first trade in the Journal and your balance history will show up here.',
            empty_rdist_title: 'No trades to build an R-distribution yet',
            empty_besttime_title: 'Not enough trading history',
            empty_besttime_desc: 'Once you have at least 5 trades, this panel will show which trading session tends to work best for you.',
            besttime_desc: 'Shows your average return (R) per trading session, so you can see when you trade most effectively.',
            empty_assets_title: 'No trades by asset yet',
            empty_notifications: 'No notifications yet.',
            empty_analytics: 'No analytics available yet.',
            empty_performance: 'Not enough trading history yet.',
            empty_guardian: 'Guardian will start tracking your discipline after your first trade.',
            empty_journal: 'No trades yet. Add your first one!',
            empty_calendar_events: 'No events on this day.',
            empty_calendar_trades: 'No trades on this day.',
            ai_disclaimer: 'KD Intelligence AI is not a financial advisor, does not give trading signals, and does not predict market direction. It helps you follow your own trading strategy, rules, and discipline.',

            // ===== v1.0.7 — Smart Dashboard =====
            today_overview: 'Today',
            today_pnl: "Today's P&L",
            today_trades: "Today's trades",
            today_winrate: "Today's win rate",
            discipline_score: 'Discipline',
            no_data_short: '—',
            no_data: 'No data',
            guardian_status: 'Guardian Status',
            guardian_passed: 'Passed',
            guardian_failed: 'Failed',
            guardian_nodata: 'No data',
            guardian_nodata_yet: 'Guardian: no data yet',
            recent_trades: 'Recent Trades',
            no_trades_yet_dash: 'No trades yet',
            add_first_trade: 'Add your first trade',
            quick_actions: 'Quick Actions',
            qa_add_trade: 'Add Trade',
            qa_open_journal: 'Open Journal',
            qa_open_guardian: 'Open Guardian',
            qa_open_analytics: 'Open Analytics',
            dash_welcome_title: 'Добро пожаловать в KD Intelligence AI',
            dash_welcome_no_data: 'No trading data yet',
            dash_welcome_cta: 'Start by recording your first trade.',
            coach_snapshot: 'AI Coach',
            coach_snapshot_empty: 'Add your first trade to receive personalized insights.',
            tour_skip: 'Skip tour',

            // ===== v1.0.8 — Academy =====
            academy_header_title: 'Learn the system. Trade with a plan.',
            academy_header_sub: 'Short, practical lessons on risk, position size, leverage, and liquidation — plus a real calculator.',
            academy_back: 'Back to Academy',
            nav_scanner: 'AI Scanner',
            scanner_title: 'AI Scanner',
            scanner_sub: 'Upload a chart screenshot to start a structured trade review — attach it to your Journal entry.',
            scanner_honesty_note: 'The Scanner loads and optimizes your screenshot, then can read chart labels with OCR (asset, timeframe, LONG/SHORT and structure names). Price levels are never guessed — review the result before saving.',
            scanner_upload_title: 'Upload a chart screenshot',
            scanner_upload_sub: 'PNG or JPG, up to 5MB',
            scanner_choose_file: 'Choose file',
            scanner_start_over: 'Start over',
            scanner_result_title: 'Scan Result',
            scanner_asset: 'Asset',
            scanner_direction: 'Direction',
            scanner_timeframe: 'Timeframe',
            scanner_entry: 'Entry',
            scanner_stoploss: 'Stop Loss',
            scanner_takeprofit: 'Take Profit',
            scanner_setup: 'Setup / notes',
            scanner_structures_title: 'Detected Structures',
            scanner_structures_note: 'Nothing is auto-detected — check any structures you identify on this chart yourself.',
            scanner_disclaimer: 'This is not a guaranteed signal or a promise of profit — only a structured way to log what you see on your own chart. Confidence reflects manual review, not an automated probability.',
            scanner_cancel: 'Cancel',
            scanner_confirm: 'Confirm → Add to Journal',
            scanner_not_detected: 'Not detected — needs confirmation',
            scanner_confidence_label: 'Confidence: N/A (manual review, no vision-AI model connected)',
            scanner_view_screenshot: 'View screenshot',
            scanner_learn_more: 'Learn more',
            scanner_analyze: 'Analyze screenshot',
            scanner_ocr_label: 'OCR text found on screenshot',
        }
    },

    // Translation lookup helper — falls back to the Russian string, then the key itself.
    t(key) {
        const dict = this.translations[this.currentLang] || this.translations.ru;
        return dict[key] !== undefined ? dict[key] : (this.translations.ru[key] !== undefined ? this.translations.ru[key] : key);
    },

    // Any value that originates from a user, an import, or an external feed
    // must pass through this helper before it is interpolated into HTML.
    escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[char]);
    },

    // ===== INIT =====
    init() {
        // Idempotent boot: a second script evaluation, BFCache restore, or a
        // duplicate DOMContentLoaded path must never bind the UI twice.
        if (this.__initialized || this.__initializing) return;
        this.__initializing = true;
        try {
            this.loadState();
            this.initData();
            this.cacheElements();
            this.bindEvents();
            this.applyTheme();
            this.applyAccent();
            this.renderAll();
            this.updateGreeting();

        // v1.8.9 — Dashboard is the guaranteed boot section.
        // The HTML intentionally has no active section by default, so the
        // application must establish one during boot regardless of onboarding
        // state. Onboarding can safely appear above the Dashboard.
        try {
            this.applyUserData();

            this.navItems.forEach(n => n.classList.remove('active'));

            const dashNav = Array.from(this.navItems)
                .find(n => n.dataset.section === 'dashboard');

            if (dashNav) dashNav.classList.add('active');

            this.showSection('dashboard');
        } catch (err) {
            console.error('KD Intelligence boot navigation failed:', err);

            // Last-resort recovery: make Dashboard visible even if a chart
            // or optional widget throws during initialization.
            const dashboard = document.getElementById('section-dashboard');

            if (dashboard) {
                document.querySelectorAll('.section-content')
                    .forEach(section => section.classList.remove('active'));

                dashboard.classList.add('active');
            }
        }

        if (!this.onboardingDone) {
            this.showOnboarding();
        }

            this.startMarketPulseAutoRefresh();
            this.__initialized = true;
            console.log(`KD Intelligence AI ${KD_BUILD_VERSION} initialized.`);
        } catch (error) {
            console.error('KD Intelligence boot failed:', error);
            this.__initialized = false;
            throw error;
        } finally {
            this.__initializing = false;
        }
    },

    // ===== LOCALSTORAGE =====
    normalizeStorageScope(scope) {
        const raw = String(scope || 'anonymous').trim().toLowerCase();
        if (!raw || raw === 'anonymous') return 'anonymous';
        return raw.replace(/[^a-z0-9._@-]/g, '_').slice(0, 96) || 'anonymous';
    },

    getStorageKey() {
        const scope = this.normalizeStorageScope(this.storageScope);
        return scope === 'anonymous' ? 'kriptodanik_state' : `kriptodanik_state:${scope}`;
    },

    getScopedStorageKey(name) {
        const base = String(name || '').trim();
        if (!base) return this.getStorageKey();
        const scope = this.normalizeStorageScope(this.storageScope);
        return scope === 'anonymous' ? `kriptodanik:${base}` : `kriptodanik:${scope}:${base}`;
    },

    readStateFromStorage(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.warn('Failed to parse saved state:', e);
            return null;
        }
    },

    setStorageScope(scope, options = {}) {
        const nextScope = this.normalizeStorageScope(scope);
        if (nextScope === this.storageScope && !options.force) return;
        const previousKey = this.getStorageKey();
        const previousState = this.readStateFromStorage(previousKey);
        const previousScope = this.storageScope;
        this.storageScope = nextScope;
        const nextKey = this.getStorageKey();
        const existingTarget = this.readStateFromStorage(nextKey);
        if (previousState && options.migrate !== false && previousScope === 'anonymous' && nextScope !== 'anonymous') {
            try {
                if (!existingTarget) localStorage.setItem(nextKey, JSON.stringify(previousState));
                // Do not leave the old unscoped profile available after login.
                localStorage.removeItem(previousKey);
            } catch (e) { console.warn('Failed to migrate user-scoped state:', e); }
        }
        if (options.load !== false) {
            this.marketMode = localStorage.getItem(this.getScopedStorageKey('market_mode')) === 'forex' ? 'forex' : 'crypto';
            this.loadState();
            this.initData();
            this.renderAll();
            this.applyUserData?.();
            this.updateGreeting?.();
        }
    },

    reviveEvents(rawEvents) {
        return (rawEvents || []).map(e => ({ ...e, date: new Date(e.date) })).filter(e => !isNaN(e.date));
    },

    isValidImportData(data) {
        if (!data || typeof data !== 'object' || !Array.isArray(data.trades)) return false;
        const validDate = value => typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
        const validNumber = value => Number.isFinite(Number(value));
        const validText = value => typeof value === 'string';
        const validStatus = value => ['win', 'loss', 'breakeven'].includes(value);

        if (!data.trades.every(trade => trade && typeof trade === 'object' &&
            validDate(trade.date) && validText(trade.asset) && ['BUY', 'SELL'].includes(trade.side) &&
            validNumber(trade.entry) && validNumber(trade.exit) && validNumber(trade.rr) &&
            validNumber(trade.pnl) && validText(trade.result) && validStatus(trade.status))) return false;

        if (data.events !== undefined && (!Array.isArray(data.events) || !data.events.every(event =>
            event && typeof event === 'object' && validDate(event.date) && validText(event.title)))) return false;

        return data.userData === undefined || (data.userData && typeof data.userData === 'object' && !Array.isArray(data.userData));
    },

    loadMarketCache() {
        try {
            const raw = localStorage.getItem(this.getScopedStorageKey('market_cache'));
            const parsed = raw ? JSON.parse(raw) : null;
            if (parsed && Array.isArray(parsed.results) && parsed.results.length && Number.isFinite(Number(parsed.savedAt))) {
                this.marketCache = { results: parsed.results, savedAt: Number(parsed.savedAt), mode: parsed.mode === 'forex' ? 'forex' : 'crypto' };
            }
        } catch (_) { this.marketCache = null; }
    },

    saveMarketCache(results, mode=this.marketMode==='forex'?'forex':'crypto') {
        if (!Array.isArray(results) || !results.length) return;
        const snapshot = { results, savedAt: Date.now(), mode };
        this.marketCache = snapshot;
        try { localStorage.setItem(this.getScopedStorageKey('market_cache'), JSON.stringify(snapshot)); } catch (_) {}
    },

    loadState() {
        this.loadMarketCache();
        try {
            let state = this.readStateFromStorage(this.getStorageKey());
            // Never silently copy the anonymous profile into a logged-in
            // account. Anonymous -> user migration is explicit and happens only
            // inside setStorageScope(..., { migrate: true }).
            if (state) {
                this.currentLang = state.lang || 'ru';
                this.onboardingDone = state.onboardingDone || false;
                this.userData = state.userData || {};
                this.trades = state.trades || [];
                this.events = this.reviveEvents(state.events);
                this.guardianRules = state.guardianRules || [];
                this.guardianViolations = state.guardianViolations || [];
                this.aiHistory = state.aiHistory || [];
                this.strategies = Array.isArray(state.strategies) ? state.strategies.filter(s => !s.protected) : [];
            }
        } catch (e) { console.warn('Failed to load state:', e); }
    },

    saveState() {
        try {
            // Keep long-lived browser storage bounded. Trading data remains intact;
            // only conversational/diagnostic history is pruned to prevent a years-old
            // account from eventually hitting the localStorage quota.
            const aiHistory = Array.isArray(this.aiHistory) ? this.aiHistory.slice(-200) : [];
            const guardianViolations = Array.isArray(this.guardianViolations) ? this.guardianViolations.slice(-200) : [];
            this.aiHistory = aiHistory;
            this.guardianViolations = guardianViolations;
            const state = {
                lang: this.currentLang,
                onboardingDone: this.onboardingDone,
                userData: this.userData,
                trades: this.trades,
                events: this.events,
                guardianRules: this.guardianRules,
                guardianViolations,
                aiHistory,
                strategies: this.strategies || [],
            };
            localStorage.setItem(this.getStorageKey(), JSON.stringify(state));
        } catch (e) { console.warn('Failed to save state:', e); }
    },

    // ===== DATA =====
    // NOTE (v1.0.6): brand-new accounts must start completely empty. We never seed
    // trades, events, or Guardian history — only the Guardian RULE DEFINITIONS
    // (the fixed checklist of discipline rules) are initialized, because those are
    // product configuration, not user activity. Their "passed" status is only ever
    // computed from real trades (see updateGuardianStats).
    initData() {
        this.filteredTrades = [...this.trades];
        if (this.guardianRules.length !== 6) this.initGuardianRuleDefinitions();
        this.currentDate = new Date();
        this.selectedDate = new Date();
        if (!Array.isArray(this.strategies)) this.strategies = [];
    },

    initGuardianRuleDefinitions() {
        // Defaults are intentionally NOT "passed: true" — a rule has no
        // business claiming compliance before it has ever been evaluated
        // against real trade data. updateGuardianStats() sets the real
        // state on every call; these are just the safe starting values.
        this.guardianRules = [
            { id: 1, name: 'Риск на сделку ≤ 1%', passed: false, state: 'nodata', icon: '🛡' },
            { id: 2, name: 'Не более 5 сделок в день', passed: false, state: 'nodata', icon: '📊' },
            { id: 3, name: 'Stop Loss всегда установлен', passed: false, state: 'nodata', icon: '🎯' },
            { id: 4, name: 'Дневной лимит не превышен', passed: false, state: 'nodata', icon: '📉' },
            { id: 5, name: 'Нет торговли в эмоциях', passed: false, state: 'nodata', icon: '🧠' },
            { id: 6, name: 'План сделки соблюдён', passed: false, state: 'nodata', icon: '📋' }
        ];
        this.guardianViolations = [];
        this.saveState();
    },

    // ===== ACCOUNT BALANCE (dynamic, always derived from real trades) =====
    getCurrentBalance() {
        const parsedCapital = Number.parseFloat(this.userData?.capital);

        // Если профиль не содержит capital, используем стартовый депозит текущего
        // продукта — $100 000. Это совпадает с branded Dashboard и не создаёт
        // ложных сделок: баланс меняется только от реальных записей Journal.
        const start =
            Number.isFinite(parsedCapital) && parsedCapital > 0
                ? parsedCapital
                : 100000;

        const pnlSum = (this.trades || []).reduce((sum, t) => {
            const pnl = Number.parseFloat(t?.pnl);
            return sum + (Number.isFinite(pnl) ? pnl : 0);
        }, 0);

        return start + pnlSum;
    },

    updateBalanceDisplay() {
        if (this.balanceDisplay) this.balanceDisplay.textContent = '$ ' + this.getCurrentBalance().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    // ===== CACHE =====
    cacheElements() {
        this.navItems = document.querySelectorAll('.nav-item');
        this.sections = {
            strategy: document.getElementById('section-strategy'),
            marketpulse: document.getElementById('section-marketpulse'),
                    dashboard: document.getElementById('section-dashboard'),
            journal: document.getElementById('section-journal'),
            analytics: document.getElementById('section-analytics'),
            calendar: document.getElementById('section-calendar'),
            performance: document.getElementById('section-performance'),
            guardian: document.getElementById('section-guardian'),
            academy: document.getElementById('section-academy'),
            scanner: document.getElementById('section-scanner'),
            intelligence: document.getElementById('section-intelligence'),
            settings: document.getElementById('section-settings')
        };
        this.pageTitle = document.getElementById('pageTitle');
        this.pageGreeting = document.getElementById('pageGreeting');
        this.userNameDisplay = document.getElementById('userNameDisplay');

        // Search & Notifications
        this.searchWrapper = document.getElementById('searchWrapper');
        this.searchBtn = document.getElementById('searchBtn');
        this.searchPopover = document.getElementById('searchPopover');
        this.globalSearchInput = document.getElementById('globalSearchInput');
        this.globalSearchResults = document.getElementById('globalSearchResults');
        this.notifWrapper = document.getElementById('notifWrapper');
        this.notifBtn = document.getElementById('notifBtn');
        this.notifPopover = document.getElementById('notifPopover');
        this.notifResults = document.getElementById('notifResults');
        this.notifBadge = document.getElementById('notifBadge');

        // Dashboard
        this.balanceDisplay = document.getElementById('balanceDisplay');
        this.dailyTargetDisplay = document.getElementById('dailyTargetDisplay');
        this.dailyTargetSub = document.getElementById('dailyTargetSub');
        this.dailyLossDisplay = document.getElementById('dailyLossDisplay');
        this.dailyLossSub = document.getElementById('dailyLossSub');
        this.riskPerTradeDisplay = document.getElementById('riskPerTradeDisplay');
        this.riskPerTradeSub = document.getElementById('riskPerTradeSub');
        this.tpPreferredRR = document.getElementById('tpPreferredRR');
        this.tpSession = document.getElementById('tpSession');
        this.tpTodayProgress = document.getElementById('tpTodayProgress');
        this.tpProgressFill = document.getElementById('tpProgressFill');
        this.winRateDonutChart = document.getElementById('winRateDonutChart');
        this.assetDonutChart = document.getElementById('assetDonutChart');
        this.winRateDisplay = document.getElementById('winRateDisplay');
        this.totalTradesDisplay = document.getElementById('totalTradesDisplay');
        this.winTradesDisplay = document.getElementById('winTradesDisplay');
        this.lossTradesDisplay = document.getElementById('lossTradesDisplay');

        // Journal
        this.journalBody = document.getElementById('journalBody');
        this.filterAsset = document.getElementById('filterAsset');
        this.filterResult = document.getElementById('filterResult');
        this.journalSearch = document.getElementById('journalSearch');
        this.addTradeBtn = document.getElementById('addTradeBtn');
        this.tradeModalOverlay = document.getElementById('tradeModalOverlay');
        this.tradeModalTitle = document.getElementById('tradeModalTitle');
        this.tradeModalCancel = document.getElementById('tradeModalCancel');
        this.tradeModalSave = document.getElementById('tradeModalSave');
        this.tFields = {
            asset: document.getElementById('tAsset'),
            direction: document.getElementById('tDirection'),
            entry: document.getElementById('tEntry'),
            exit: document.getElementById('tExit'),
            size: document.getElementById('tSize'),
            riskPercent: document.getElementById('tRiskPercent'),
            rr: document.getElementById('tRR'),
            pnl: document.getElementById('tPnl'),
            date: document.getElementById('tDate'),
            session: document.getElementById('tSession'),
            strategy: document.getElementById('tStrategy'),
            status: document.getElementById('tStatus'),
            emotionBefore: document.getElementById('tEmotionBefore'),
            emotionAfter: document.getElementById('tEmotionAfter'),
            notes: document.getElementById('tNotes')
        };
        this.tFormError = document.getElementById('tFormError');
        this.journalBadge = document.getElementById('journalBadge');
        this.jTotalTrades = document.getElementById('jTotalTrades');
        this.jWinRate = document.getElementById('jWinRate');
        this.jAvgRR = document.getElementById('jAvgRR');
        this.jTotalPnL = document.getElementById('jTotalPnL');

        // Calendar
        this.calendarGrid = document.getElementById('calendarGrid');
        this.calendarMonth = document.getElementById('calendarMonth');
        this.prevMonthBtn = document.getElementById('prevMonth');
        this.nextMonthBtn = document.getElementById('nextMonth');
        this.selectedDateLabel = document.getElementById('selectedDateLabel');
        this.eventsList = document.getElementById('eventsList');
        this.eventsCount = document.getElementById('eventsCount');
        this.selectedDateTradesLabel = document.getElementById('selectedDateTradesLabel');
        this.dayTradesList = document.getElementById('dayTradesList');
        this.dayTradesCount = document.getElementById('dayTradesCount');
        this.eventInput = document.getElementById('eventInput');
        this.eventType = document.getElementById('eventType');
        this.addEventBtn = document.getElementById('addEventBtn');
        this.calendarBadge = document.getElementById('calendarBadge');

        // Analytics
        this.aTotalPnl = document.getElementById('aTotalPnl');
        this.aWinRate = document.getElementById('aWinRate');
        this.aProfitFactor = document.getElementById('aProfitFactor');
        this.aAvgRR = document.getElementById('aAvgRR');
        this.aTotalTrades = document.getElementById('aTotalTrades');
        this.aWinningTrades = document.getElementById('aWinningTrades');
        this.aLosingTrades = document.getElementById('aLosingTrades');
        this.aAvgWin = document.getElementById('aAvgWin');
        this.aAvgLoss = document.getElementById('aAvgLoss');
        this.aBestDay = document.getElementById('aBestDay');
        this.aWorstDay = document.getElementById('aWorstDay');
        this.aBestTrade = document.getElementById('aBestTrade');
        this.aWorstTrade = document.getElementById('aWorstTrade');
        this.aMaxWinStreak = document.getElementById('aMaxWinStreak');
        this.aMaxLossStreak = document.getElementById('aMaxLossStreak');
        this.analyticsEquityChart = document.getElementById('analyticsEquityChart');
        this.analyticsMonthlyChart = document.getElementById('analyticsMonthlyChart');
        this.analyticsAssetDonutChart = document.getElementById('analyticsAssetDonutChart');

        // Performance
        this.perfTotalReturn = document.getElementById('perfTotalReturn');
        this.perfBestMonth = document.getElementById('perfBestMonth');
        this.perfBestSession = document.getElementById('perfBestSession');
        this.perfTotalTrades = document.getElementById('perfTotalTrades');
        this.perfEquityChart = document.getElementById('perfEquityChart');
        this.perfMonthlyChart = document.getElementById('perfMonthlyChart');
        this.perfSessionsChart = document.getElementById('perfSessionsChart');

        // AI Assistant
        this.aiMessages = document.getElementById('aiMessages');
        this.aiInput = document.getElementById('aiInput');
        this.askBtn = document.getElementById('askBtn');
        this.dashAskBtn = document.getElementById('dashAskBtn');

        // v1.0.7 — Smart Dashboard
        this.dashWelcomeHero = document.getElementById('dashWelcomeHero');
        this.dashWelcomeAddTradeBtn = document.getElementById('dashWelcomeAddTradeBtn');
        this.dashTodayOverview = document.getElementById('dashTodayOverview');
        this.todayPnlDisplay = document.getElementById('todayPnlDisplay');
        this.todayTradesDisplay = document.getElementById('todayTradesDisplay');
        this.todayWinRateDisplay = document.getElementById('todayWinRateDisplay');
        this.todayDisciplineDisplay = document.getElementById('todayDisciplineDisplay');
        this.dashGuardianCard = document.getElementById('dashGuardianCard');
        this.dashRecentTrades = document.getElementById('dashRecentTrades');
        this.qaAddTrade = document.getElementById('qaAddTrade');
        this.qaOpenJournal = document.getElementById('qaOpenJournal');
        this.qaOpenGuardian = document.getElementById('qaOpenGuardian');
        this.qaOpenAnalytics = document.getElementById('qaOpenAnalytics');

        // v1.0.8 — Academy
        this.academyGridView = document.getElementById('academyGridView');
        this.academyLessonView = document.getElementById('academyLessonView');
        this.academyGrid = document.getElementById('academyGrid');
        this.academyLessonBody = document.getElementById('academyLessonBody');
        this.academyBackBtn = document.getElementById('academyBackBtn');

        // v1.1.0 — AI Scanner
        this.scannerUploadView = document.getElementById('scannerUploadView');
        this.scannerReviewView = document.getElementById('scannerReviewView');
        this.scannerDropzone = document.getElementById('scannerDropzone');
        this.scannerFileInput = document.getElementById('scannerFileInput');
        this.scannerUploadBtn = document.getElementById('scannerUploadBtn');
        this.scannerBackBtn = document.getElementById('scannerBackBtn');
        this.scannerPreviewImg = document.getElementById('scannerPreviewImg');
        this.scannerConfidenceNote = document.getElementById('scannerConfidenceNote');
        this.scannerAsset = document.getElementById('scannerAsset');
        this.scannerTimeframe = document.getElementById('scannerTimeframe');
        this.scannerEntry = document.getElementById('scannerEntry');
        this.scannerStopLoss = document.getElementById('scannerStopLoss');
        this.scannerTakeProfit = document.getElementById('scannerTakeProfit');
        this.scannerSetup = document.getElementById('scannerSetup');
        this.scannerStructuresGrid = document.getElementById('scannerStructuresGrid');
        this.scannerCancelBtn = document.getElementById('scannerCancelBtn');
        this.scannerConfirmBtn = document.getElementById('scannerConfirmBtn');
        this.scannerAnalyzeBtn = document.getElementById('scannerAnalyzeBtn');
        this.scannerAnalysisStatus = document.getElementById('scannerAnalysisStatus');
        this.scannerOcrText = document.getElementById('scannerOcrText');
        this.scannerObjectUrl = null;

        this.strategyGrid = document.getElementById('strategyGrid');
        this.strategyEmpty = document.getElementById('strategyEmpty');
        this.strategySearch = document.getElementById('strategySearch');
        this.strategyFilter = document.getElementById('strategyFilter');
        this.strategyAddBtn = document.getElementById('strategyAddBtn');
        this.strategyEmptyBtn = document.getElementById('strategyEmptyBtn');
        this.marketPulseGrid = document.getElementById('marketPulseGrid');
        this.marketRefreshBtn = document.getElementById('marketRefreshBtn');
        this.marketModeButtons = [...document.querySelectorAll('[data-market-mode]')];
        this.marketCalendar = document.getElementById('marketCalendar');
        this.marketNews = document.getElementById('marketNews');
        this.marketCalendarStatus = document.getElementById('marketCalendarStatus');
        this.marketNewsStatus = document.getElementById('marketNewsStatus');
        this.marketContextTitle = document.getElementById('marketContextTitle');
        this.marketStrategyContext = document.getElementById('marketStrategyContext');
        this.marketStrategyTags = document.getElementById('marketStrategyTags');
        this.marketSourceLabel = document.getElementById('marketSourceLabel');
        this.marketMode = localStorage.getItem(this.getScopedStorageKey('market_mode')) === 'forex' ? 'forex' : 'crypto';
        this.marketLiveStatus = document.getElementById('marketLiveStatus');
        this.marketLastUpdated = document.getElementById('marketLastUpdated');
        this.marketLatency = document.getElementById('marketLatency');
        this.marketRefreshTimer = null;
        this.screenshotLightbox = document.getElementById('screenshotLightbox');
        this.lightboxImg = document.getElementById('lightboxImg');
        this.lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
        this.clearChatBtn = document.getElementById('clearChatBtn');
        this.aiSuggestions = document.getElementById('aiSuggestions');

        // Guardian
        this.guardianScore = document.getElementById('guardianScore');
        this.guardianScoreBadge = document.getElementById('guardianScoreBadge');
        this.guardianDayStatus = document.getElementById('guardianDayStatus');
        this.guardianStreak = document.getElementById('guardianStreak');
        this.guardianRulesList = document.getElementById('guardianRulesList');
        this.guardianTimeline = document.getElementById('guardianTimeline');
        this.guardianRecommendations = document.getElementById('guardianRecommendations');
        this.guardianHistoryCount = document.getElementById('guardianHistoryCount');
        this.guardianRiskValue = document.getElementById('guardianRiskValue');
        this.guardianRiskMeta = document.getElementById('guardianRiskMeta');
        this.guardianDrawdownValue = document.getElementById('guardianDrawdownValue');
        this.guardianDrawdownMeta = document.getElementById('guardianDrawdownMeta');
        this.guardianTradesTodayValue = document.getElementById('guardianTradesTodayValue');
        this.guardianTradesTodayMeta = document.getElementById('guardianTradesTodayMeta');
        this.guardianViolationsValue = document.getElementById('guardianViolationsValue');
        this.guardianViolationsMeta = document.getElementById('guardianViolationsMeta');
        this.guardianDisciplineChart = document.getElementById('guardianDisciplineChart');

        // Settings
        this.settingsTabs = document.querySelectorAll('.settings-tab-btn');
        this.settingsContents = document.querySelectorAll('.settings-tab-content');
        this.settingsName = document.getElementById('settingsName');
        this.settingsEmailInput = document.getElementById('settingsEmailInput');
        this.settingsUsernameInput = document.getElementById('settingsUsernameInput');
        this.settingsUsername = document.getElementById('settingsUsername');
        this.settingsEmail = document.getElementById('settingsEmail');
        this.settingsMemberSince = document.getElementById('settingsMemberSince');
        this.settingsPlan = document.getElementById('settingsPlan');
        this.saveProfileBtn = document.getElementById('saveProfileBtn');
        this.settingsCapital = document.getElementById('settingsCapital');
        this.settingsRisk = document.getElementById('settingsRisk');
        this.settingsDailyLoss = document.getElementById('settingsDailyLoss');
        this.settingsDailyTarget = document.getElementById('settingsDailyTarget');
        this.settingsMaxTrades = document.getElementById('settingsMaxTrades');
        this.settingsRiskMode = document.getElementById('settingsRiskMode');
        this.settingsRR = document.getElementById('settingsRR');
        this.settingsTradingStyle = document.getElementById('settingsTradingStyle');
        this.settingsSession = document.getElementById('settingsSession');
        this.saveTradingBtn = document.getElementById('saveTradingBtn');
        this.settingsLang = document.getElementById('settingsLang');
        this.settingsDateFormat = document.getElementById('settingsDateFormat');
        this.settingsCurrency = document.getElementById('settingsCurrency');
        this.themeOptions = document.querySelectorAll('.theme-option');
        this.accentOptions = document.querySelectorAll('.accent-option');
        this.saveAppearanceBtn = document.getElementById('saveAppearanceBtn');
        this.exportTradesBtn = document.getElementById('exportTradesBtn');
        this.exportJournalBtn = document.getElementById('exportJournalBtn');
        this.importDataBtn = document.getElementById('importDataBtn');
        this.importCsvBtn = document.getElementById('importCsvBtn');
        this.importCsvInput = document.getElementById('importCsvInput');
        this.clearAllDataBtn = document.getElementById('clearAllDataBtn');

        // Onboarding Wizard
        this.onboardingOverlay = document.getElementById('onboardingOverlay');
        this.onboardingName = document.getElementById('onboardingName');
        this.onboardingCapital = document.getElementById('onboardingCapital');
        this.onboardingRisk = document.getElementById('onboardingRisk');
        this.onboardingDailyTarget = document.getElementById('onboardingDailyTarget');
        this.onboardingDailyLoss = document.getElementById('onboardingDailyLoss');
        this.onboardingRR = document.getElementById('onboardingRR');
        this.onboardingSession = document.getElementById('onboardingSession');
        this.onboardingStrategy = document.getElementById('onboardingStrategy');
        this.onboardingMarkets = document.querySelectorAll('#onboardingMarkets input[type="checkbox"]');
        this.onboardingAssets = document.querySelectorAll('#onboardingAssets input[type="checkbox"]');
        this.wizardProgressBar = document.getElementById('wizardProgressBar');
        this.wizardStepLabel = document.getElementById('wizardStepLabel');
        this.wizardStepTitle = document.getElementById('wizardStepTitle');
        this.wizardStepSubtitle = document.getElementById('wizardStepSubtitle');
        this.wizardStepError = document.getElementById('wizardStepError');
        this.wizardSteps = document.querySelectorAll('.wizard-step');
        this.wizardBackBtn = document.getElementById('wizardBackBtn');
        this.wizardNextBtn = document.getElementById('wizardNextBtn');
        this.resetTradingProfileBtn = document.getElementById('resetTradingProfileBtn');

        // AI Coach product tour
        this.coachTourOverlay = document.getElementById('coachTourOverlay');
        this.tourTitle = document.getElementById('tourTitle');
        this.tourBody = document.getElementById('tourBody');
        this.tourStepLabel = document.getElementById('tourStepLabel');
        this.tourProgressBar = document.getElementById('tourProgressBar');
        this.tourNextBtn = document.getElementById('tourNextBtn');
        this.tourBackBtn = document.getElementById('tourBackBtn');
        this.tourSkipBtn = document.getElementById('tourSkipBtn');

        // Avatar upload
        this.avatarEditBtn = document.getElementById('avatarEditBtn');
        this.avatarFileInput = document.getElementById('avatarFileInput');
        this.headerAvatar = document.getElementById('headerAvatar');
        this.settingsAvatar = document.getElementById('settingsAvatar');

        this.langButtons = document.querySelectorAll('.lang-selector button');

        // v1.0.9.1 — mobile/iPad-portrait nav toggle
        this.mobileNavToggle = document.getElementById('mobileNavToggle');
        this.mobileNavScrim = document.getElementById('mobileNavScrim');
        this.sidebarEl = document.querySelector('.sidebar');
        this.kdAccountButton = document.getElementById('kdAccountButton');
        this.kdAccountAvatar = document.getElementById('kdAccountAvatar');
    },

    // ===== BIND EVENTS =====
    bindEvents() {
        if (!this.navItems || typeof this.navItems.forEach !== 'function') return;
        this.navItems.forEach(item => {
            item.dataset.kdNavBound = '1';
            item.addEventListener('click', () => {
                this.navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');
                const section = item.dataset.section;
                this.showSection(section);
                this.closeMobileNav();
            });
        });

        // v1.0.9.1 — mobile/iPad-portrait nav toggle (sidebar becomes a
        // slide-in overlay below 768px instead of disappearing with no
        // way to reopen it).
        if (this.mobileNavToggle) this.mobileNavToggle.addEventListener('click', () => this.toggleMobileNav());
        if (this.mobileNavScrim) this.mobileNavScrim.addEventListener('click', () => this.closeMobileNav());
        // Account/avatar are navigation controls, not decorative elements.
        // They always open the profile tab in Settings.
        const openProfileSettings = () => {
            this.navItems.forEach(n => n.classList.remove('active'));
            const nav = Array.from(this.navItems).find(n => n.dataset.section === 'settings');
            if (nav) nav.classList.add('active');
            this.showSection('settings');
            this.settingsTabs?.forEach(t => t.classList.toggle('active', t.dataset.tab === 'profile'));
            this.settingsContents?.forEach(c => c.classList.toggle('active', c.id === 'settings-profile'));
            this.closeMobileNav();
        };
        if (this.kdAccountButton) this.kdAccountButton.addEventListener('click', openProfileSettings);
        if (this.headerAvatar) this.headerAvatar.addEventListener('click', openProfileSettings);

        // Search
        if (this.searchBtn) this.searchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closePopover(this.notifPopover);
            this.togglePopover(this.searchPopover);
            if (this.searchPopover.classList.contains('open') && this.globalSearchInput) {
                this.globalSearchInput.focus();
            }
        });
        if (this.globalSearchInput) this.globalSearchInput.addEventListener('input', () => {
            this.renderSearchResults(this.globalSearchInput.value.trim());
        });

        // Notifications
        if (this.notifBtn) this.notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closePopover(this.searchPopover);
            this.togglePopover(this.notifPopover);
            if (this.notifPopover.classList.contains('open')) this.renderNotifications();
        });

        document.addEventListener('click', (e) => {
            if (this.searchWrapper && !this.searchWrapper.contains(e.target)) this.closePopover(this.searchPopover);
            if (this.notifWrapper && !this.notifWrapper.contains(e.target)) this.closePopover(this.notifPopover);
        });

        // Journal
        if (this.addTradeBtn) this.addTradeBtn.addEventListener('click', () => this.openTradeModal());
        if (this.tradeModalCancel) this.tradeModalCancel.addEventListener('click', () => this.closeTradeModal());
        if (this.tradeModalSave) this.tradeModalSave.addEventListener('click', () => this.submitTradeForm());
        if (this.tradeModalOverlay) this.tradeModalOverlay.addEventListener('click', (e) => {
            if (e.target === this.tradeModalOverlay) this.closeTradeModal();
        });
        if (this.filterAsset) this.filterAsset.addEventListener('change', () => this.applyFilters());
        if (this.filterResult) this.filterResult.addEventListener('change', () => this.applyFilters());
        if (this.journalSearch) this.journalSearch.addEventListener('input', () => this.applyFilters());

        // Calendar
        if (this.prevMonthBtn) this.prevMonthBtn.addEventListener('click', () => this.changeMonth(-1));
        if (this.nextMonthBtn) this.nextMonthBtn.addEventListener('click', () => this.changeMonth(1));
        if (this.addEventBtn) this.addEventBtn.addEventListener('click', () => this.addEvent());
        if (this.eventInput) this.eventInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.addEvent();
        });

        // AI Assistant
        if (this.askBtn) this.askBtn.addEventListener('click', () => this.handleAIQuery());
        if (this.dashAskBtn) this.dashAskBtn.addEventListener('click', () => {
            this.navItems.forEach(n => n.classList.remove('active'));
            const targetNav = Array.from(this.navItems).find(n => n.dataset.section === 'intelligence');
            if (targetNav) targetNav.classList.add('active');
            this.showSection('intelligence');
        });

        // v1.0.7 — Smart Dashboard: Quick Actions reuse existing
        // navigation (showSection) and the existing trade modal
        // (openTradeModal) — no duplicated logic.
        if (this.dashWelcomeAddTradeBtn) this.dashWelcomeAddTradeBtn.addEventListener('click', () => this.openTradeModal());
        if (this.qaAddTrade) this.qaAddTrade.addEventListener('click', () => this.openTradeModal());
        const goTo = (section) => {
            this.navItems.forEach(n => n.classList.remove('active'));
            const targetNav = Array.from(this.navItems).find(n => n.dataset.section === section);
            if (targetNav) targetNav.classList.add('active');
            this.showSection(section);
            this.closeMobileNav();
        };
        if (this.qaOpenJournal) this.qaOpenJournal.addEventListener('click', () => goTo('journal'));
        if (this.qaOpenGuardian) this.qaOpenGuardian.addEventListener('click', () => goTo('guardian'));
        if (this.qaOpenAnalytics) this.qaOpenAnalytics.addEventListener('click', () => goTo('analytics'));
        if (this.academyBackBtn) this.academyBackBtn.addEventListener('click', () => this.showAcademyGrid());

        // v1.1.0 — AI Scanner
        if (this.scannerUploadBtn) this.scannerUploadBtn.addEventListener('click', () => this.scannerFileInput && this.scannerFileInput.click());
        if (this.scannerDropzone) {
            this.scannerDropzone.addEventListener('click', () => this.scannerFileInput && this.scannerFileInput.click());
            this.scannerDropzone.addEventListener('dragover', (e) => { e.preventDefault(); this.scannerDropzone.classList.add('dragover'); });
            this.scannerDropzone.addEventListener('dragleave', () => this.scannerDropzone.classList.remove('dragover'));
            this.scannerDropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                this.scannerDropzone.classList.remove('dragover');
                if (e.dataTransfer.files && e.dataTransfer.files[0]) this.handleScannerFile(e.dataTransfer.files[0]);
            });
        }
        if (this.scannerFileInput) this.scannerFileInput.addEventListener('change', (e) => this.handleScannerFile(e.target.files[0]));
        if (this.scannerBackBtn) this.scannerBackBtn.addEventListener('click', () => this.showScannerUpload());
        if (this.scannerCancelBtn) this.scannerCancelBtn.addEventListener('click', () => this.showScannerUpload());
        if (this.scannerConfirmBtn) this.scannerConfirmBtn.addEventListener('click', () => this.confirmScannerResult());
        if (this.scannerAnalyzeBtn) this.scannerAnalyzeBtn.addEventListener('click', () => this.analyzeScannerImage());
        document.addEventListener('paste', (e) => {
            const items = Array.from(e.clipboardData?.items || []);
            const imageItem = items.find(item => item.type && item.type.startsWith('image/'));
            if (imageItem && this.currentSection === 'scanner') {
                e.preventDefault();
                this.handleScannerFile(imageItem.getAsFile());
            }
        });

        if (this.strategyAddBtn) this.strategyAddBtn.addEventListener('click', () => this.openStrategyModal());
        if (this.strategyEmptyBtn) this.strategyEmptyBtn.addEventListener('click', () => this.openStrategyModal());
        if (this.strategySearch) this.strategySearch.addEventListener('input', () => this.renderStrategyLibrary());
        if (this.strategyFilter) this.strategyFilter.addEventListener('change', () => this.renderStrategyLibrary());
        if (this.marketRefreshBtn) this.marketRefreshBtn.addEventListener('click', () => this.loadMarketPulse());
        this.marketModeButtons.forEach(btn => btn.addEventListener('click', () => { this.marketMode = btn.dataset.marketMode; localStorage.setItem(this.getScopedStorageKey('market_mode'), this.marketMode === 'forex' ? 'forex' : 'crypto'); this.renderMarketMode(); this.loadMarketPulse(); }));
        this.renderMarketMode();
        const scannerDirLong = document.getElementById('scannerDirLong');
        const scannerDirShort = document.getElementById('scannerDirShort');
        if (scannerDirLong) scannerDirLong.addEventListener('click', () => this.setScannerDirection('long'));
        if (scannerDirShort) scannerDirShort.addEventListener('click', () => this.setScannerDirection('short'));
        if (this.scannerPreviewImg) this.scannerPreviewImg.addEventListener('click', () => this.openLightbox(this.scannerScreenshot));

        // Screenshot lightbox (Scanner preview + Journal "view screenshot")
        if (this.lightboxCloseBtn) this.lightboxCloseBtn.addEventListener('click', () => this.closeLightbox());
        if (this.screenshotLightbox) this.screenshotLightbox.addEventListener('click', (e) => { if (e.target === this.screenshotLightbox) this.closeLightbox(); });
        if (this.aiInput) this.aiInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.handleAIQuery();
        });
        if (this.clearChatBtn) this.clearChatBtn.addEventListener('click', () => this.clearChat());
        if (this.aiSuggestions) {
            this.aiSuggestions.querySelectorAll('.ai-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    const query = chip.dataset.query;
                    if (query) {
                        this.aiInput.value = query;
                        this.handleAIQuery();
                    }
                });
            });
        }

        // Settings Tabs & Saves
        this.settingsTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.settingsTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.settingsContents.forEach(c => c.classList.remove('active'));
                const target = document.getElementById('settings-' + tab.dataset.tab);
                if (target) target.classList.add('active');
            });
        });
        if (this.saveProfileBtn) this.saveProfileBtn.addEventListener('click', () => this.saveSettings('profile'));
        if (this.saveTradingBtn) this.saveTradingBtn.addEventListener('click', () => this.saveSettings('trading'));
        if (this.saveAppearanceBtn) this.saveAppearanceBtn.addEventListener('click', () => this.saveSettings('appearance'));

        this.accentOptions.forEach((opt, i) => {
            opt.addEventListener('click', () => {
                this.accentOptions.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                this.userData.accent = this.accentPalette[i] || 'purple';
                this.applyAccent();
                this.saveState();
            });
        });
        this.themeOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                this.themeOptions.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                this.userData.theme = opt.dataset.theme;
                this.applyTheme();
                this.saveState();
            });
        });
        if (this.settingsLang) this.settingsLang.addEventListener('change', () => {
            this.currentLang = this.settingsLang.value;
            this.applyLanguage();
            this.saveState();
            this.langButtons.forEach(b => b.classList.toggle('active', b.dataset.lang === this.currentLang));
        });

        // Data actions
        if (this.exportTradesBtn) this.exportTradesBtn.addEventListener('click', () => this.exportData('trades'));
        if (this.exportJournalBtn) this.exportJournalBtn.addEventListener('click', () => this.exportData('all'));
        if (this.importDataBtn) this.importDataBtn.addEventListener('click', () => this.importData());
        if (this.importCsvBtn) this.importCsvBtn.addEventListener('click', () => this.importCsvInput?.click());
        if (this.importCsvInput) this.importCsvInput.addEventListener('change', (e) => this.importCsvFile(e));
        if (this.clearAllDataBtn) this.clearAllDataBtn.addEventListener('click', () => this.clearAllData());

        this.langButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.langButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentLang = btn.dataset.lang;
                this.applyLanguage();
                this.saveState();
                if (this.settingsLang) this.settingsLang.value = this.currentLang;
            });
        });

        if (this.wizardNextBtn) {
            this.wizardNextBtn.addEventListener('click', () => this.wizardNext());
        }
        if (this.wizardBackBtn) {
            this.wizardBackBtn.addEventListener('click', () => this.wizardBack());
        }
        // Keyboard-friendly onboarding: Enter advances the current step;
        // this makes the first-name field immediately usable without requiring a mouse.
        const wizardFields = [this.onboardingName, this.onboardingCapital, this.onboardingRisk, this.onboardingDailyTarget, this.onboardingDailyLoss, this.onboardingRR, this.onboardingSession, this.onboardingStrategy];
        wizardFields.filter(Boolean).forEach(field => field.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && field.tagName !== 'TEXTAREA') {
                e.preventDefault();
                this.wizardNext();
            }
        }));
        if (this.resetTradingProfileBtn) {
            this.resetTradingProfileBtn.addEventListener('click', () => this.resetTradingProfile());
        }
        if (this.tourNextBtn) this.tourNextBtn.addEventListener('click', () => this.tourNext());
        if (this.tourBackBtn) this.tourBackBtn.addEventListener('click', () => this.tourBack());
        if (this.tourSkipBtn) this.tourSkipBtn.addEventListener('click', () => this.finishCoachTour());
        // v1.0.7 — keyboard navigation for the tour, only while it's open.
        document.addEventListener('keydown', (e) => {
            if (!this.coachTourOverlay || !this.coachTourOverlay.classList.contains('active')) return;
            if (e.key === 'Escape') { e.preventDefault(); this.finishCoachTour(); }
            else if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); this.tourNext(); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); this.tourBack(); }
        });
        if (this.avatarEditBtn) this.avatarEditBtn.addEventListener('click', () => this.avatarFileInput && this.avatarFileInput.click());
        if (this.avatarFileInput) this.avatarFileInput.addEventListener('change', (e) => this.handleAvatarUpload(e));
        this.applyLanguage();

        let resizeTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (typeof window.reinitCharts === 'function') window.reinitCharts();
            }, 250);
        });
    },

    // ===== LANGUAGE =====
    applyLanguage() {
        document.documentElement.lang = this.currentLang;
        const t = this.translations[this.currentLang] || this.translations.ru;
        document.querySelectorAll('[data-key]').forEach(el => {
            const key = el.dataset.key;
            if (t[key] !== undefined) el.textContent = t[key];
        });
        // Re-render the pieces of the UI whose text is generated dynamically in JS
        // (empty states, notifications, dashboard extras) so a language switch
        // applies instantly everywhere, not just to static labels.
        this.renderNotifications();
        this.renderDashboardExtras();
        this.renderDashboardSmartWidgets();
        this.renderDashboardGuardianCard();
        this.updatePageTitle();
        if (this.trades.length === 0) this.initEquityChart();
        // v1.0.8 — Academy content is generated in JS per language, so it
        // needs an explicit re-render on language switch too.
        if (this.sections && this.sections.academy && this.sections.academy.classList.contains('active')) {
            if (this.currentLessonId && this.academyLessonView && this.academyLessonView.style.display !== 'none') {
                this.openAcademyLesson(this.currentLessonId);
            } else {
                this.renderAcademyGrid();
            }
        }
        // v1.1.0 — re-localize the Scanner review screen's dynamically
        // generated text WITHOUT wiping anything the user has already
        // typed or checked (re-running renderScannerReview() would reset
        // every field back to empty, which would be a real data-loss bug,
        // not just a translation refresh).
        if (this.scannerReviewView && this.scannerReviewView.style.display !== 'none') {
            if (this.scannerConfidenceNote) this.scannerConfidenceNote.innerHTML = `<span class="scanner-confidence-badge">${this.t('scanner_confidence_label')}</span>`;
            if (this.scannerStructuresGrid) {
                this.scannerStructuresGrid.querySelectorAll('.ms-learn-link').forEach(link => {
                    link.textContent = this.t('scanner_learn_more') + ' →';
                });
            }
            [this.scannerAsset, this.scannerTimeframe, this.scannerEntry, this.scannerStopLoss, this.scannerTakeProfit].forEach(el => {
                if (el && !el.value) el.placeholder = this.t('scanner_not_detected');
            });
        }
    },

    // v1.0.9.1 — mobile/iPad-portrait nav toggle
    toggleMobileNav() {
        if (!this.sidebarEl) return;
        const isOpen = this.sidebarEl.classList.toggle('mobile-open');
        if (this.mobileNavScrim) this.mobileNavScrim.classList.toggle('active', isOpen);
    },

    closeMobileNav() {
        if (this.sidebarEl) this.sidebarEl.classList.remove('mobile-open');
        if (this.mobileNavScrim) this.mobileNavScrim.classList.remove('active');
    },

    // ===== THEME & ACCENT =====
    applyTheme() {
        const theme = this.userData.theme || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        this.themeOptions.forEach(o => o.classList.toggle('active', o.dataset.theme === theme));
    },

    applyAccent() {
        const accent = this.userData.accent || 'purple';
        document.documentElement.setAttribute('data-accent', accent);
        const idx = this.accentPalette.indexOf(accent);
        this.accentOptions.forEach((o, i) => o.classList.toggle('active', i === idx));
    },

    // ===== ONBOARDING WIZARD =====
    wizardStepMeta: {
        1: { title: 'Добро пожаловать в KD Intelligence AI', subtitle: 'Давайте настроим ваш профиль трейдера' },
        2: { title: 'Ваши торговые параметры', subtitle: 'Это станет основой вашего Trading Profile' },
        3: { title: 'Ваши предпочтения', subtitle: 'Сессия и любимые рынки/активы' },
        4: { title: 'Ваша торговая стратегия', subtitle: 'Опишите её своими словами' }
    },

    showOnboarding() {
        if (!this.onboardingOverlay) return;
        this.wizardStep = 1;
        this.goToWizardStep(1);
        this.onboardingOverlay.classList.add('active');
    },

    goToWizardStep(step) {
        this.wizardStep = step;
        if (this.wizardSteps) {
            this.wizardSteps.forEach(el => {
                el.style.display = parseInt(el.dataset.step) === step ? '' : 'none';
            });
        }
        const meta = this.wizardStepMeta[step];
        if (meta) {
            if (this.wizardStepTitle) this.wizardStepTitle.textContent = meta.title;
            if (this.wizardStepSubtitle) this.wizardStepSubtitle.textContent = meta.subtitle;
        }
        if (this.wizardStepLabel) this.wizardStepLabel.textContent = `Шаг ${step} из 4`;
        if (this.wizardProgressBar) this.wizardProgressBar.style.width = (step / 4 * 100) + '%';
        if (this.wizardBackBtn) this.wizardBackBtn.style.visibility = step === 1 ? 'hidden' : 'visible';
        if (this.wizardNextBtn) this.wizardNextBtn.textContent = step === 4 ? 'Завершить настройку' : 'Далее';
        if (this.wizardStepError) this.wizardStepError.textContent = '';
    },

    validateWizardStep(step) {
        if (step === 1) {
            if (!this.onboardingName.value.trim()) return 'Пожалуйста, введите ваше имя';
        }
        if (step === 2) {
            if (isNaN(parseFloat(this.onboardingCapital.value)) || parseFloat(this.onboardingCapital.value) <= 0) return 'Укажите начальный баланс';
            if (isNaN(parseFloat(this.onboardingRisk.value)) || parseFloat(this.onboardingRisk.value) <= 0) return 'Укажите риск на сделку';
            if (isNaN(parseFloat(this.onboardingDailyTarget.value)) || parseFloat(this.onboardingDailyTarget.value) <= 0) return 'Укажите дневную цель прибыли';
            if (isNaN(parseFloat(this.onboardingDailyLoss.value)) || parseFloat(this.onboardingDailyLoss.value) <= 0) return 'Укажите максимальный дневной убыток';
        }
        if (step === 3) {
            const marketsChecked = Array.from(this.onboardingMarkets).some(cb => cb.checked);
            const assetsChecked = Array.from(this.onboardingAssets).some(cb => cb.checked);
            if (!marketsChecked) return 'Выберите хотя бы один рынок';
            if (!assetsChecked) return 'Выберите хотя бы один актив';
        }
        if (step === 4) {
            if (!this.onboardingStrategy.value.trim()) return 'Опишите вашу торговую стратегию';
        }
        return null;
    },

    wizardNext() {
        const error = this.validateWizardStep(this.wizardStep);
        if (error) {
            if (this.wizardStepError) this.wizardStepError.textContent = error;
            return;
        }
        if (this.wizardStep < 4) {
            this.goToWizardStep(this.wizardStep + 1);
        } else {
            this.completeOnboarding();
        }
    },

    wizardBack() {
        if (this.wizardStep > 1) this.goToWizardStep(this.wizardStep - 1);
    },

    completeOnboarding() {
        const name = this.onboardingName.value.trim() || 'Trader';
        const capital = parseFloat(this.onboardingCapital.value) || 100000;
        const risk = parseFloat(this.onboardingRisk.value) || 1;
        const dailyTarget = parseFloat(this.onboardingDailyTarget.value) || 800;
        const dailyLoss = parseFloat(this.onboardingDailyLoss.value) || 300;
        const rr = this.onboardingRR.value || '1:2';
        const session = this.onboardingSession.value || 'ny';
        const markets = Array.from(this.onboardingMarkets).filter(cb => cb.checked).map(cb => cb.value);
        const assets = Array.from(this.onboardingAssets).filter(cb => cb.checked).map(cb => cb.value);
        const strategy = this.onboardingStrategy.value.trim();

        this.userData = { ...this.userData, name, capital, risk, dailyTarget, dailyLoss, rr, session, markets, assets, strategy, maxTradesPerDay: Number.parseInt(this.userData?.maxTradesPerDay, 10) || 5 };
        this.onboardingDone = true;
        if (this.onboardingOverlay) this.onboardingOverlay.classList.remove('active');
        this.applyUserData();
        this.saveState();
        // Requirement: never drop a user straight onto the Dashboard after onboarding —
        // greet them and walk them through the workspace first.
        this.showCoachTour();
    },

    // ============================================================
    // FIRST USER EXPERIENCE — AI Coach greeting + interactive product tour
    // ============================================================
    tourSteps: [
        { key: 'intro' },
        { key: 'dashboard', nav: 'dashboard' },
        { key: 'journal', nav: 'journal' },
        { key: 'calendar', nav: 'calendar' },
        { key: 'academy', nav: 'academy' },
        { key: 'strategy', nav: 'strategy' },
        { key: 'marketpulse', nav: 'marketpulse' },
        { key: 'analytics', nav: 'analytics' },
        { key: 'performance', nav: 'performance' },
        { key: 'guardian', nav: 'guardian' },
        { key: 'intelligence', nav: 'intelligence' },
        { key: 'settings', nav: 'settings' },
        { key: 'final' }
    ],

    tourCopy: {
        ru: {
            intro: {
                title: 'Знакомство с KD Intelligence AI',
                body: 'Здравствуйте.<br><br>Меня зовут KD Intelligence AI.<br>Я ваш персональный AI Trading Coach.<br><br>Я никогда не скажу вам, когда покупать или продавать.<br>Я не предсказываю рынок.<br><br>Моя задача — помочь вам сохранять дисциплину, следовать <strong>вашей собственной</strong> торговой стратегии, анализировать прогресс и становиться лучше со временем.<br><br>Прежде чем начать, позвольте познакомить вас с вашим рабочим пространством.'
            },
            dashboard: { title: 'Dashboard', body: 'Здесь вы видите общую картину: текущий баланс, дневную цель, лимит убытка и риск на сделку. Вы будете открывать эту страницу каждый раз, когда садитесь торговать — чтобы свериться с планом на день.' },
            journal: { title: 'Journal', body: 'Journal — это единый источник правды для всего приложения. Каждая сделка, которую вы здесь фиксируете, питает Dashboard, Analytics, Performance и Guardian. Записывайте сюда каждую сделку сразу после её закрытия.' },
            calendar: { title: 'Calendar', body: 'Календарь показывает ваши сделки и события по дням. Используйте его, чтобы увидеть, в какие дни вы торговали, и планировать заметки, анализы или перерывы заранее.' },
            academy: { title: 'Academy', body: 'Академия — обучающий раздел про риск-менеджмент, размер позиции, плечо и ликвидацию, с практическим калькулятором позиции. Материалы объясняют концепции — Guardian отдельно проверяет ваши реальные сделки.' },
            strategy: { title: 'Библиотека стратегий', body: 'Здесь хранятся твои торговые системы: правила входа, стопа, выхода и фильтры. AI Coach помогает сверять журнал с заданными правилами.' },
            marketpulse: { title: 'Market Pulse', body: 'Здесь можно посмотреть актуальный контекст по доступным рынкам. Никаких сигналов и прогнозов — только данные для собственного анализа.' },
            analytics: { title: 'Analytics', body: 'Здесь ваша статистика раскладывается по полочкам: Win Rate, Profit Factor, лучшие и худшие сделки, серии побед и поражений. Загляните сюда, когда захотите понять, что реально работает в вашей торговле.' },
            performance: { title: 'Performance', body: 'Performance показывает динамику во времени — помесячно и по торговым сессиям. Полезно раз в неделю или в месяц, чтобы увидеть общий тренд, а не отдельную сделку.' },
            guardian: { title: 'Guardian', body: 'Guardian следит за соблюдением ваших собственных правил риск-менеджмента и дисциплины и подсвечивает нарушения. Он начнёт работать, как только появятся первые сделки.' },
            intelligence: { title: 'AI Coach', body: 'Это я. Спрашивайте меня о дисциплине, психологии, риск-менеджменте, вашей стратегии или о том, что видно в журнале. Я не даю торговых сигналов — я помогаю думать яснее.' },
            settings: { title: 'Settings', body: 'В настройках вы можете изменить профиль, торговые параметры, тему оформления, язык и управлять своими данными — экспорт, импорт, полная очистка.' },
            final: {
                title: 'Приятного использования, KD Intelligence AI',
                body: 'Приятного использования, KD Intelligence AI.<br><br><span class="tour-disclaimer">KD Intelligence AI не является финансовым советником, не даёт торговых сигналов и не предсказывает направление рынка. Он помогает вам соблюдать собственную торговую стратегию, правила и дисциплину.</span><br><br>Каждое торговое решение — ваше. Удачи.'
            }
        },
        en: {
            intro: {
                title: 'Meet KD Intelligence AI',
                body: 'Welcome.<br><br>My name is KD Intelligence AI.<br>I\'m your personal AI Trading Coach.<br><br>I will never tell you when to Buy or Sell.<br>I don\'t predict the market.<br><br>My purpose is to help you stay disciplined, follow <strong>your own</strong> trading strategy, analyze your progress and improve over time.<br><br>Before we begin, let me introduce your trading workspace.'
            },
            dashboard: { title: 'Dashboard', body: 'This is your at-a-glance view: current balance, daily profit goal, daily loss limit, and risk per trade. You\'ll open this every time you sit down to trade, to check in against your plan for the day.' },
            journal: { title: 'Journal', body: 'The Journal is the single source of truth for the whole app. Every trade you log here feeds the Dashboard, Analytics, Performance, and Guardian. Log each trade right after you close it.' },
            calendar: { title: 'Calendar', body: 'The Calendar shows your trades and events by day. Use it to see which days you traded, and to plan notes, reviews, or breaks ahead of time.' },
            academy: { title: 'Academy', body: 'Academy is an educational section covering risk management, position size, leverage, and liquidation, with a practical position-size calculator. It teaches the concepts — Guardian separately checks your real trades.' },
            strategy: { title: 'Strategy Library', body: 'Store your trading systems here: entry, stop, exit and filter rules. AI Coach can help compare Journal data with your rules.' },
            marketpulse: { title: 'Market Pulse', body: 'See current context for supported markets. No signals or predictions — only data for your own analysis.' },
            analytics: { title: 'Analytics', body: 'This breaks your stats down in detail: win rate, profit factor, best and worst trades, winning and losing streaks. Come here when you want to understand what\'s actually working in your trading.' },
            performance: { title: 'Performance', body: 'Performance shows your trend over time — monthly and by trading session. Useful weekly or monthly, to see the bigger picture rather than a single trade.' },
            guardian: { title: 'Guardian', body: 'Guardian watches whether you\'re sticking to your own risk-management and discipline rules, and flags violations. It starts working as soon as you log your first trades.' },
            intelligence: { title: 'AI Coach', body: 'That\'s me. Ask me about discipline, psychology, risk management, your strategy, or what your journal shows. I don\'t give trading signals — I help you think more clearly.' },
            settings: { title: 'Settings', body: 'In Settings you can edit your profile, trading parameters, appearance theme, language, and manage your data — export, import, or a full reset.' },
            final: {
                title: 'Enjoy using KD Intelligence AI',
                body: 'Enjoy using KD Intelligence AI.<br><br><span class="tour-disclaimer">KD Intelligence AI is not a financial advisor, does not give trading signals, and does not predict market direction. It helps you follow your own trading strategy, rules, and discipline.</span><br><br>Every trading decision is yours. Good luck.'
            }
        }
    },

    showCoachTour() {
        if (!this.coachTourOverlay) return;
        this.tourStepIndex = 0;
        this.goToTourStep(0);
        this.coachTourOverlay.classList.add('active'); this.coachTourOverlay.setAttribute('aria-hidden','false');
    },

    goToTourStep(index) {
        this.tourStepIndex = index;
        const step = this.tourSteps[index];
        const copy = (this.tourCopy[this.currentLang] || this.tourCopy.ru)[step.key];
        if (this.tourTitle) this.tourTitle.textContent = copy.title;
        if (this.tourBody) this.tourBody.innerHTML = copy.body;
        if (this.tourStepLabel) this.tourStepLabel.textContent = `${index + 1} / ${this.tourSteps.length}`;
        if (this.tourProgressBar) this.tourProgressBar.style.width = ((index + 1) / this.tourSteps.length * 100) + '%';
        if (this.tourNextBtn) this.tourNextBtn.textContent = index === this.tourSteps.length - 1
            ? (this.currentLang === 'en' ? 'Start trading' : 'Начать торговать')
            : (this.currentLang === 'en' ? 'Next' : 'Далее');
        if (this.tourBackBtn) this.tourBackBtn.style.visibility = index === 0 ? 'hidden' : 'visible';

        // Highlight the matching nav item, if this step corresponds to one.
        this.navItems.forEach(n => n.classList.remove('tour-highlight'));
        if (step.nav) {
            const navBtn = Array.from(this.navItems).find(n => n.dataset.section === step.nav);
            if (navBtn) navBtn.classList.add('tour-highlight');
        }
    },

    tourNext() {
        if (this.tourStepIndex < this.tourSteps.length - 1) {
            this.goToTourStep(this.tourStepIndex + 1);
        } else {
            this.finishCoachTour();
        }
    },

    tourBack() {
        if (this.tourStepIndex > 0) this.goToTourStep(this.tourStepIndex - 1);
    },

    finishCoachTour() {
        if (this.coachTourOverlay) { this.coachTourOverlay.classList.remove('active'); this.coachTourOverlay.setAttribute('aria-hidden','true'); }
        this.navItems.forEach(n => n.classList.remove('tour-highlight'));
        // Only now does the Dashboard actually open.
        this.navItems.forEach(n => n.classList.remove('active'));
        const dashNav = Array.from(this.navItems).find(n => n.dataset.section === 'dashboard');
        if (dashNav) dashNav.classList.add('active');
        this.showSection('dashboard');
    },

    // v1.1.0 — screenshot lightbox
    openLightbox(src) {
        if (!src || !this.screenshotLightbox || !this.lightboxImg) return;
        this.lightboxImg.src = src;
        this.screenshotLightbox.classList.add('active');
    },
    closeLightbox() {
        if (this.screenshotLightbox) this.screenshotLightbox.classList.remove('active');
    },

    // ===== AVATAR =====
    handleAvatarUpload(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { this.showToast(this.currentLang === 'en' ? 'Please choose an image file' : 'Пожалуйста, выберите файл изображения'); return; }
        if (file.size > 2 * 1024 * 1024) { this.showToast(this.currentLang === 'en' ? 'Image must be under 2MB' : 'Изображение должно быть меньше 2МБ'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
            this.userData.avatar = ev.target.result;
            this.applyAvatar();
            this.saveState();
            this.showToast(this.currentLang === 'en' ? 'Avatar updated' : 'Аватар обновлён');
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    },

    getInitial() {
        const name = (this.userData.name || '').trim();
        return name ? name.charAt(0).toUpperCase() : 'T';
    },

    applyAvatar() {
        const avatar = this.userData.avatar;
        [this.headerAvatar, this.settingsAvatar].forEach(el => {
            if (!el) return;
            if (avatar) {
                el.style.backgroundImage = `url(${avatar})`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
                el.textContent = '';
            } else {
                el.style.backgroundImage = '';
                el.textContent = this.getInitial();
            }
        });
    },

    resetTradingProfile() {
        if (!confirm('Сбросить торговый профиль? Journal, Calendar, Analytics, Performance и история Guardian сохранятся.')) return;
        this.userData = {};
        this.onboardingDone = false;
        this.saveState();
        this.showOnboarding();
        this.showToast('Торговый профиль сброшен');
    },

    updateGreeting() {
        const hour = new Date().getHours();
        let key = 'greeting_evening';
        if (hour < 12) key = 'greeting_morning';
        else if (hour < 18) key = 'greeting_afternoon';
        if (this.pageGreeting) this.pageGreeting.textContent = this.t(key);
        this.updatePageTitle();
    },

    // "Welcome, {UserName}" — keeps the <span id="userNameDisplay"> node intact
    // while translating only the leading text, so the name never gets clobbered.
    updatePageTitle() {
        if (!this.pageTitle || !this.pageTitle.firstChild) return;
        this.pageTitle.firstChild.textContent = this.t('welcome') + ' ';
    },

    applyUserData() {
        if (!this.userData || !this.onboardingDone) return;
        this.updateBalanceDisplay();
        if (this.userNameDisplay) this.userNameDisplay.textContent = this.userData.name || 'Трейдер';
        this.applyAvatar();
        this.applyTheme();
        this.applyAccent();
        this.updateGreeting();
        this.renderTradingProfileCards();
        this.renderTodaysProgress();
        
        if (this.settingsName) this.settingsName.value = this.userData.name || '';
        if (this.settingsUsername) this.settingsUsername.textContent = this.userData.name || 'Трейдер';
        if (this.settingsEmail) this.settingsEmail.textContent = this.userData.email || 'user@kriptodanik.ai';
        if (this.settingsMemberSince) this.settingsMemberSince.textContent = this.userData.memberSince || new Date().toLocaleDateString();
        if (this.settingsPlan) this.settingsPlan.textContent = this.userData.plan || 'Pro';
        if (this.settingsCapital) this.settingsCapital.value = this.userData.capital || 100000;
        if (this.settingsRisk) this.settingsRisk.value = this.userData.risk || '1.0';
        if (this.settingsDailyLoss) this.settingsDailyLoss.value = this.userData.dailyLoss || 500;
        if (this.settingsDailyTarget) this.settingsDailyTarget.value = this.userData.dailyTarget || 800;
        if (this.settingsMaxTrades) this.settingsMaxTrades.value = this.userData.maxTradesPerDay || 5;
        if (this.settingsRiskMode) this.settingsRiskMode.value = this.userData.riskGuardMode || 'block';
        if (this.settingsRR) this.settingsRR.value = this.userData.rr || '1:2';
        if (this.settingsTradingStyle) this.settingsTradingStyle.value = this.userData.tradingStyle || 'day';
        if (this.settingsSession) this.settingsSession.value = this.userData.session || 'ny';
        if (this.settingsLang) this.settingsLang.value = this.currentLang || 'ru';
        if (this.settingsCurrency) this.settingsCurrency.value = this.userData.currency || 'USD';
        
        this.updateDashboardStats();
        this.initEquityChart();
        this.initDashboardCharts();
        this.renderDashboardExtras();
        this.updateGuardianStats();
        this.initGuardianChart();
        
        if (this.aiHistory.length === 0) {
            this.renderAIWelcome();
        } else {
            this.renderAIHistory();
        }
    },

    renderTradingProfileCards() {
        const dailyTarget = this.userData.dailyTarget || 0;
        const dailyLoss = this.userData.dailyLoss || 0;
        const risk = this.userData.risk || 0;
        const capital = this.userData.capital || 0;

        if (this.dailyTargetDisplay) this.dailyTargetDisplay.textContent = dailyTarget.toFixed(2) + ' $';
        if (this.dailyLossDisplay) this.dailyLossDisplay.textContent = dailyLoss.toFixed(2) + ' $';
        if (this.riskPerTradeDisplay) this.riskPerTradeDisplay.textContent = risk.toFixed(2) + ' %';
        if (this.riskPerTradeSub) this.riskPerTradeSub.textContent = (capital * risk / 100).toFixed(2) + ' $';

        if (this.tpPreferredRR) this.tpPreferredRR.textContent = this.userData.rr || '—';
        const sessionLabels = { london: 'London', ny: 'New York', asia: 'Asian', sydney: 'Sydney' };
        if (this.tpSession) this.tpSession.textContent = sessionLabels[this.userData.session] || '—';
    },

    renderTodaysProgress() {
        const today = kdLocalDateKey();
        const todayPnl = this.trades
            .filter(t => t.date === today)
            .reduce((sum, t) => sum + (typeof t.pnl === 'number' && !isNaN(t.pnl) ? t.pnl : 0), 0);

        const dailyTarget = this.userData.dailyTarget || 0;
        const dailyLoss = this.userData.dailyLoss || 0;

        if (this.tpTodayProgress) {
            this.tpTodayProgress.textContent = (todayPnl >= 0 ? '+' : '') + todayPnl.toFixed(2) + ' $';
        }
        if (this.dailyTargetSub) {
            const pct = dailyTarget > 0 ? Math.min(Math.max(todayPnl / dailyTarget * 100, 0), 100) : 0;
            this.dailyTargetSub.textContent = (todayPnl >= 0 ? '+' : '') + todayPnl.toFixed(2) + ' $ (' + pct.toFixed(0) + '%)';
        }
        if (this.dailyLossSub) {
            const lossPct = dailyLoss > 0 ? Math.min(Math.max(-todayPnl / dailyLoss * 100, 0), 100) : 0;
            this.dailyLossSub.textContent = (todayPnl < 0 ? todayPnl.toFixed(2) : '0.00') + ' $ (' + lossPct.toFixed(0) + '%)';
        }
        if (this.tpProgressFill) {
            if (todayPnl >= 0) {
                const pct = dailyTarget > 0 ? Math.min(todayPnl / dailyTarget * 100, 100) : 0;
                this.tpProgressFill.style.width = pct + '%';
                this.tpProgressFill.classList.remove('negative');
            } else {
                const pct = dailyLoss > 0 ? Math.min(-todayPnl / dailyLoss * 100, 100) : 0;
                this.tpProgressFill.style.width = pct + '%';
                this.tpProgressFill.classList.add('negative');
            }
        }
    },

    // ===== NAVIGATION =====
    showSection(section) {
        this.currentSection = section;
        Object.keys(this.sections).forEach(key => {
            if (this.sections[key]) this.sections[key].classList.toggle('active', key === section);
        });
        this.navItems.forEach(n => n.classList.remove('active'));
        this.navItems.forEach(n => {
            if (n.dataset.section === section) n.classList.add('active');
        });

        try {
            if (section === 'journal') { this.renderJournal(); this.updateJournalStats(); }
            if (section === 'calendar') { this.renderCalendar(); this.updateCalendarBadge(); }
            if (section === 'analytics') { this.updateAnalytics(); }
            if (section === 'guardian') { this.updateGuardianStats(); this.initGuardianChart(); }
            if (section === 'academy') { this.renderAcademyGrid(); }
            if (section === 'scanner') { this.showScannerUpload(); }
            if (section === 'performance') { this.updatePerformanceStats(); this.initPerfEquityChart(); this.initPerfMonthlyChart(); this.initPerfSessionsChart(); }
            if (section === 'dashboard') { this.initDashboardCharts(); this.updateDashboardStats(); }
            if (section === 'strategy') { this.renderStrategyLibrary(); this.renderStrategyIntelligence(); }
            if (section === 'marketpulse') { this.renderMarketPulseLoading(); this.loadMarketPulse(); }
            if (section === 'intelligence') { this.renderAIWelcome(); }
            this.applyLanguage();
        } catch (err) {
            // A module must never make the whole SPA appear non-clickable.
            // Keep the requested section visible and surface a small local notice.
            console.error(`KD Intelligence section render failed: ${section}`, err);
            const target = this.sections?.[section];
            if (target) {
                const existing = target.querySelector('.kd-section-error');
                if (!existing) {
                    const note = document.createElement('div');
                    note.className = 'kd-section-error';
                    note.textContent = this.currentLang === 'en' ? 'This module could not refresh. Your saved data is safe.' : 'Модуль не удалось обновить. Сохранённые данные в безопасности.';
                    target.prepend(note);
                }
            }
        }
    },

    // ============================================================
    // STRATEGY LIBRARY / MARKET PULSE
    // ============================================================
    renderStrategyLibrary() {
        if (!this.strategyGrid || !this.strategyEmpty) return;
        const q=(this.strategySearch?.value||'').trim().toLowerCase(), filter=this.strategyFilter?.value||'all';
        const list=[this.builtInStrategy,...(this.strategies||[]).filter(x=>!x.protected)].filter(x=>{const hay=[x.name,x.market,x.timeframe,x.entry,x.exit,x.notes,...(x.tags||[])].join(' ').toLowerCase(); return (!q||hay.includes(q))&&(filter==='all'||(filter==='active'?!x.archived:!!x.archived));});
        this.strategyEmpty.style.display=list.length?'none':'block';
        this.strategyGrid.innerHTML=list.map(s=>s.protected?`<article class="strategy-card glass-panel strategy-protected"><div class="strategy-card-head"><div><span class="module-eyebrow">BUILT-IN · PROTECTED</span><h3>${this.escapeHtml(s.name)}</h3></div><span class="strategy-protected-badge">🔒 Protected</span></div><div class="strategy-tags">${s.tags.map(t=>`<span>${this.escapeHtml(t)}</span>`).join('')}</div><div class="strategy-rule"><b>Логика</b><p>${this.escapeHtml(s.entry)}</p></div><div class="strategy-rule"><b>Выход</b><p>${this.escapeHtml(s.exit)}</p></div><div class="strategy-rule"><b>Ограничение</b><p>${this.escapeHtml(s.notes)}</p></div><div class="strategy-footer"><span>Оригинальная стратегия владельца продукта</span><span class="strategy-lock-note">Редактирование и удаление недоступны</span></div></article>`:`<article class="strategy-card glass-panel ${s.archived?'is-archived':''}"><div class="strategy-card-head"><div><span class="module-eyebrow">${this.escapeHtml(s.market||'MARKET')} · ${this.escapeHtml(s.timeframe||'—')}</span><h3>${this.escapeHtml(s.name)}</h3></div><button class="icon-btn" data-strategy-action="archive" data-id="${this.escapeHtml(s.id)}">${s.archived?'↩':'⌁'}</button></div><div class="strategy-tags">${(s.tags||[]).slice(0,6).map(t=>`<span>${this.escapeHtml(t)}</span>`).join('')}</div><div class="strategy-rule"><b>Вход</b><p>${this.escapeHtml(s.entry||'Не задано')}</p></div><div class="strategy-rule"><b>Выход</b><p>${this.escapeHtml(s.exit||'Не задано')}</p></div><div class="strategy-footer"><span>Пользовательская стратегия · ${new Date(s.createdAt).toLocaleDateString()}</span><div><button class="btn-secondary small" data-strategy-action="edit" data-id="${this.escapeHtml(s.id)}">Изменить</button><button class="btn-danger small" data-strategy-action="delete" data-id="${this.escapeHtml(s.id)}">Удалить</button></div></div></article>`).join('');
        this.strategyGrid.querySelectorAll('[data-strategy-action]').forEach(btn=>btn.addEventListener('click',()=>this.handleStrategyAction(btn.dataset.strategyAction,btn.dataset.id)));
    },
    renderStrategyIntelligence() {
        const grid = this.strategyGrid;
        if (!grid) return;
        let panel = document.getElementById('strategyIntelligencePanel');
        if (!panel) {
            panel = document.createElement('section');
            panel.id = 'strategyIntelligencePanel';
            panel.className = 'glass-panel strategy-intelligence-panel';
            grid.parentNode?.insertBefore(panel, grid);
        }
        const a = this.tradingAnalytics || this.refreshTradingBreakdowns();
        const rows = Array.isArray(a.byStrategy) ? [...a.byStrategy].filter(x => x.key !== 'Unknown').sort((x,y) => y.pnl - x.pnl) : [];
        if (!rows.length) {
            panel.innerHTML = '<div class="module-eyebrow">STRATEGY INTELLIGENCE</div><h3>Стратегии начнут получать статистику после первой сделки</h3><p class="muted">Добавь стратегию в библиотеку и укажи её название в Journal — тогда KD Intelligence свяжет результаты сделок с правилами стратегии.</p>';
            return;
        }
        const generated = a.generatedAt ? new Date(a.generatedAt).toLocaleTimeString() : '—';
        panel.innerHTML = `<div class="strategy-intel-head"><div><span class="module-eyebrow">STRATEGY INTELLIGENCE</span><h3>Как реально работают твои стратегии</h3><small class="muted">Снимок аналитики: ${this.escapeHtml(generated)}</small></div><span class="strategy-intel-count">${rows.length} стратег${rows.length===1?'ия':'ий'}</span></div><div class="strategy-intel-grid">${rows.slice(0,6).map(r => {
            const pnl = Number(r.pnl)||0;
            const pnlClass = pnl > 0 ? 'positive' : pnl < 0 ? 'negative' : '';
            return `<article class="strategy-intel-card"><strong>${this.escapeHtml(r.key)}</strong><div class="strategy-intel-metrics"><span>${r.trades} сдел.</span><span>${r.winRate.toFixed(0)}% WR</span><span>${r.avgRR.toFixed(2)}R avg</span></div><b class="${pnlClass}">${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} $</b></article>`;
        }).join('')}</div>`;
    },
    openStrategyModal(id=null) {
        const existing=id?(this.strategies||[]).find(s=>s.id===id):null; if(existing?.protected||id===this.builtInStrategy.id){this.showToast('Protected Strategy нельзя редактировать');return;}
        const ask=(label,val='')=>{const v=prompt(label,val);return v===null?null:v.trim()};
        const name=ask('Название стратегии',existing?.name||'');if(name===null)return; const market=ask('Рынок / инструмент',existing?.market||'');if(market===null)return; const timeframe=ask('Таймфрейм',existing?.timeframe||'');if(timeframe===null)return; const entry=ask('Правила входа',existing?.entry||'');if(entry===null)return; const exit=ask('Правила выхода',existing?.exit||'');if(exit===null)return; const tags=ask('Теги через запятую',(existing?.tags||[]).join(', '));if(tags===null)return; const notes=ask('Дополнительные правила / заметки',existing?.notes||'');if(notes===null)return;
        const item={id:existing?.id||('str_'+Date.now()),protected:false,name:name||'Без названия',market,timeframe,entry,exit,tags:tags.split(',').map(x=>x.trim()).filter(Boolean),notes,archived:existing?.archived||false,createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
        this.strategies=existing?this.strategies.map(x=>x.id===id?item:x):[item,...(this.strategies||[]).filter(x=>!x.protected)];this.saveState();this.renderStrategyLibrary();
    },
    handleStrategyAction(action,id){const s=(this.strategies||[]).find(x=>x.id===id);if(!s||s.protected||id===this.builtInStrategy.id){if(s?.protected)this.showToast('Protected Strategy нельзя изменять');return;}if(action==='edit')this.openStrategyModal(id);if(action==='archive'){s.archived=!s.archived;s.updatedAt=new Date().toISOString();this.saveState();this.renderStrategyLibrary();}if(action==='delete'&&confirm('Удалить пользовательскую стратегию?')){this.strategies=this.strategies.filter(x=>x.id!==id);this.saveState();this.renderStrategyLibrary();}},

    renderMarketPulseLoading(){
        if(this.marketPulseGrid)this.marketPulseGrid.innerHTML='<div class="module-loading glass-panel">Загружаю актуальные данные…</div>';
        if(this.marketCalendar)this.marketCalendar.innerHTML='<div class="market-feed-loading">Загружаю календарь…</div>';
        if(this.marketNews)this.marketNews.innerHTML='<div class="market-feed-loading">Загружаю новости…</div>';
        if(this.marketLiveStatus)this.marketLiveStatus.textContent='Обновление…';
    },
    startMarketPulseAutoRefresh(){
        if(this.marketRefreshTimer) clearInterval(this.marketRefreshTimer);
        this.marketRefreshTimer=setInterval(()=>{
            const section=document.getElementById('section-marketpulse');
            if(section?.classList.contains('active')) this.loadMarketPulse(true);
        },60000);
    },
    marketNum(v){const n=Number(v);return Number.isFinite(n)?n:null;},
    marketFmtPrice(v){const n=this.marketNum(v);if(n===null)return '—';return '$'+n.toLocaleString(undefined,{maximumFractionDigits:n<1?6:2});},
    marketFmtPct(v){const n=this.marketNum(v);if(n===null)return '—';return (n>=0?'+':'')+n.toFixed(2)+'%';},
    getMarketSession(date=new Date()){const h=date.getUTCHours()+date.getUTCMinutes()/60;const sessions=[['Азия',0,8],['Европа',7,16],['США',13,22]];const active=sessions.filter(([,start,end])=>h>=start&&h<end).map(([name])=>name);let current=active.length?active.join(' · '):'Межсессионное окно';let prev=h<7?'США':h<13?'Азия':'Европа';if(h>=22)prev='США';return {current,prev,h};},
    renderMarketMode(){
        const mode=this.marketMode==='forex'?'forex':'crypto';
        this.marketModeButtons?.forEach(b=>b.classList.toggle('active',b.dataset.marketMode===mode));
        if(this.marketContextTitle)this.marketContextTitle.textContent=mode==='crypto'?'Крипта':'Форекс';
        if(this.marketSourceLabel)this.marketSourceLabel.textContent=mode==='crypto'?'Binance + экономический календарь':'Forex economic calendar + рыночные данные';
        if(this.marketStrategyContext)this.marketStrategyContext.textContent=mode==='crypto'?'Отслеживаем BTC/ETH/SOL и события USD, ставки, инфляцию, занятость и крупные крипто-публикации — именно они чаще всего меняют риск-аппетит и волатильность крипты.':'Отслеживаем EUR/USD, GBP/USD и XAU/USD (золото), а также экономический календарь. Важность события определяется его влиянием на валюты и золото.';
        if(this.marketStrategyTags)this.marketStrategyTags.innerHTML=(mode==='crypto'?['BTC','ETH','USD / ставки','Risk-on / Risk-off']:['EUR/USD','GBP/USD','XAU/USD','ЦБ / инфляция']).map(t=>`<span>${this.escapeHtml(t)}</span>`).join('');
    },
    renderMarketSession(){const els={current:document.getElementById('marketCurrentSession'),status:document.getElementById('marketSessionStatus'),clock:document.getElementById('marketSessionClock'),prev:document.getElementById('marketPreviousSession')};if(!els.current)return;const d=new Date(),s=this.getMarketSession(d);els.current.textContent=s.current;els.status.textContent='UTC '+String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0');els.clock.textContent=d.toISOString().slice(0,16).replace('T',' ');els.prev.textContent='Предыдущая основная сессия: '+s.prev;},
    getMarketSnapshotForJournal(){
        const mode=this.marketMode==='forex'?'forex':'crypto';
        const cache=this.marketCache;
        if(!cache?.results?.length || (cache.mode && cache.mode!==mode)) return null;
        const results=cache.results.map(t=>({
            symbol:this.marketDisplayName(t,mode),
            pct:Number(t.priceChangePercent)||0,
            price:Number(t.lastPrice)||null
        }));
        return {mode, savedAt:Number(cache.savedAt)||Date.now(), results};
    },
    formatMarketSnapshotForJournal(){
        const snap=this.getMarketSnapshotForJournal();
        if(!snap) return '';
        const label=snap.mode==='forex'?'Forex':'Crypto';
        const items=snap.results.slice(0,3).map(x=>`${x.symbol} ${x.pct>=0?'+':''}${x.pct.toFixed(2)}%`).join(', ');
        const age=Math.max(0,Math.floor((Date.now()-snap.savedAt)/60000));
        return `[Market ${label} snapshot: ${items}; ${age} min ago]`;
    },
    buildMarketAnalysis(results){
        const box=document.getElementById('marketAiAnalysis');if(!box)return;
        if(!results?.length){box.innerHTML='<p class="muted">Нет актуальных рыночных данных для анализа.</p>';return;}
        const rows=results.map(t=>{const pct=+t.priceChangePercent||0,hi=+t.highPrice,lo=+t.lowPrice,last=+t.lastPrice,range=hi-lo,pos=range?((last-lo)/range*100):50;return {name:this.marketDisplayName(t,this.marketMode==='forex'?'forex':'crypto'),pct,pos,volume:+t.quoteVolume||0};});
        const strongest=[...rows].sort((a,b)=>Math.abs(b.pct)-Math.abs(a.pct))[0];
        box.innerHTML=`<div class="analysis-list"><div><b>Рынок</b><p>${this.marketMode==='crypto'?'Криптовалюты':'Форекс'} · данные получены сейчас.</p></div><div><b>Движение</b><p>${strongest.name} показывает наибольшее 24h изменение среди наблюдаемых активов: <strong>${strongest.pct>=0?'+':''}${strongest.pct.toFixed(2)}%</strong>.</p></div><div><b>Влияющие события</b><p>Смотри красные события календаря и новости с меткой «Высокое влияние» ниже. Они не являются торговым сигналом.</p></div></div>`;
    },
    marketImpactClass(impact){const x=String(impact||'').toLowerCase();if(x.includes('high')||x.includes('выс'))return 'high';if(x.includes('medium')||x.includes('сред'))return 'medium';return 'low';},
    marketImpactLabel(impact){const c=this.marketImpactClass(impact);return c==='high'?'ВАЖНО':c==='medium'?'СРЕДНЕ':'НИЗКО';},
    marketEscape(v){return this.escapeHtml(v==null?'':String(v));},
    marketSafeUrl(value){try{const url=new URL(String(value));return ['http:','https:'].includes(url.protocol)?url.href:'#';}catch(_){return '#';}},
    async loadMarketCalendar(){
        const mode=this.marketMode==='forex'?'forex':'crypto';
        if(this.marketCalendarStatus)this.marketCalendarStatus.textContent='Обновление…';

        const fetchJson=async(url)=>{
            const candidates=[
                url,
                'https://api.allorigins.win/raw?url='+encodeURIComponent(url),
                'https://r.jina.ai/http://'+url.replace(/^https:\/\//,'')
            ];
            for(const candidate of candidates){
                const controller=new AbortController();
                const timer=setTimeout(()=>controller.abort(),9000);
                try{
                    const r=await fetch(candidate,{cache:'no-store',signal:controller.signal});
                    if(!r.ok)continue;
                    const text=await r.text();
                    try{return JSON.parse(text);}catch(_){
                        const a=text.indexOf('['),b=text.lastIndexOf(']');
                        if(a>=0&&b>a)return JSON.parse(text.slice(a,b+1));
                    }
                }catch(_){
                }finally{clearTimeout(timer);}
            }
            return null;
        };

        const normalize=(raw,source)=>{
            const list=Array.isArray(raw)?raw:(Array.isArray(raw?.events)?raw.events:[]);
            return list.map(e=>({
                title:e.title??e.Event??e.event??e.Category??'Economic event',
                country:e.country??e.Country??e.currency??e.Currency??'',
                date:e.date??e.Date??e.datetime??e.datetimeUTC??'',
                impact:e.impact??e.Impact??e.importance??e.Importance??'',
                actual:e.actual??e.Actual??'',
                forecast:e.forecast??e.Forecast??'',
                previous:e.previous??e.Previous??'',
                source
            })).filter(e=>e.title&&e.date);
        };

        try{
            // Primary source is our own static JSON. GitHub Actions refreshes it
            // hourly from the public Forex Factory calendar feed, avoiding browser
            // CORS/rate-limit problems and keeping the site usable as a static page.
            let payload=await fetchJson('./calendar.json?v='+Date.now());
            let source=payload?.source||'Forex Factory calendar · cached';
            let rows=normalize(payload?.events??payload,source);

            // Live fallback when the scheduled GitHub refresh has not happened yet.
            if(!rows.length){
                const urls=[
                    'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
                    'https://nfs.faireconomy.media/ff_calendar_nextweek.json'
                ];
                const live=await Promise.all(urls.map(fetchJson));
                rows=live.flatMap((x,i)=>normalize(x,'Forex Factory · '+(i?'next week':'this week')));
                source='Forex Factory · live';
            }
            if(!rows.length)throw new Error('Calendar feed returned no events');

            const currencies=mode==='forex'
                ? new Set(['USD','EUR','GBP','JPY','CAD','AUD','NZD','CHF','CNY'])
                : new Set(['USD','EUR','GBP','JPY','CAD','AUD','NZD','CHF','CNY']);
            const now=Date.now()-2*3600e3;
            const until=Date.now()+8*24*3600e3;
            const seen=new Set();

            rows=rows.map(e=>({...e,_date:new Date(e.date)}));
            rows=rows.filter(e=>{
                const d=new Date(e.date);
                return !Number.isNaN(d.getTime())&&d.getTime()>=now&&d.getTime()<=until&&currencies.has(String(e.country).toUpperCase());
            }).filter(e=>{
                const key=[e.country,e.title,new Date(e.date).toISOString()].join('|');
                if(seen.has(key))return false;seen.add(key);return true;
            }).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,45);

            if(!rows.length)throw new Error('No upcoming events in selected window');
            const esc=v=>this.marketEscape(String(v??'—'));
            const affects=e=>mode==='forex'
                ? `${esc(e.country)} · валютный рынок`
                : (String(e.country).toUpperCase()==='USD'?'BTC · ETH · риск-активы':'крипторынок');
            const impactClass=e=>this.marketImpactClass(e.impact||'');
            const impactLabel=e=>{
                const c=impactClass(e);return e.impact?this.marketImpactLabel(e.impact):'ОЖИДАЕТСЯ';
            };

            this.marketCalendar.innerHTML=rows.map(e=>{
                const d=new Date(e.date);
                const time=d.toLocaleString([], {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
                const c=impactClass(e);
                return `<article class="calendar-row impact-${c}">
                    <div class="calendar-impact"><span class="impact-dot ${c}"></span><b>${impactLabel(e)}</b></div>
                    <div class="calendar-time">${time}</div>
                    <div class="calendar-event"><strong>${esc(e.title)}</strong><small>${esc(e.country)} · Влияет на: ${affects(e)}</small></div>
                    <div class="calendar-values"><span>Факт <b>${esc(e.actual)}</b></span><span>Прогноз <b>${esc(e.forecast)}</b></span><span>Пред. <b>${esc(e.previous)}</b></span></div>
                </article>`;
            }).join('');

            if(this.marketCalendarStatus)this.marketCalendarStatus.textContent=`${rows.length} событий · ${source} · ${new Date().toLocaleTimeString()}`;
        }catch(err){
            console.error('Market calendar error:',err);
            if(this.marketCalendar)this.marketCalendar.innerHTML='<div class="market-feed-empty"><b>Календарь временно недоступен.</b><span>Не удалось получить актуальный источник. Реальные события не подменяем.</span></div>';
            if(this.marketCalendarStatus)this.marketCalendarStatus.textContent='Календарь недоступен';
        }
    },
    async loadMarketNews(){
        const mode=this.marketMode==='forex'?'forex':'crypto';
        if(this.marketNewsStatus)this.marketNewsStatus.textContent='Обновление…';

        const feeds=mode==='forex'
            ? [
                {name:'FXStreet',url:'https://www.fxstreet.com/rss/news'},
                {name:'Google News',url:'https://news.google.com/rss/search?q=forex%20OR%20%22EUR%2FUSD%22%20OR%20%22GBP%2FUSD%22%20OR%20%22USD%2FJPY%22%20OR%20%22Federal%20Reserve%22%20OR%20ECB%20OR%20%22Bank%20of%20England%22%20when%3A2d&hl=en-US&gl=US&ceid=US:en'}
            ]
            : [
                {name:'CoinDesk',url:'https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml'},
                {name:'Google News',url:'https://news.google.com/rss/search?q=Bitcoin%20OR%20Ethereum%20OR%20Solana%20OR%20crypto%20when%3A2d&hl=en-US&gl=US&ceid=US:en'}
            ];

        const parseRSS=xml=>{
            const doc=new DOMParser().parseFromString(xml,'text/xml');
            if(doc.querySelector('parsererror'))return [];
            return [...doc.querySelectorAll('item')].map(item=>({
                title:item.querySelector('title')?.textContent?.trim()||'',
                link:item.querySelector('link')?.textContent?.trim()||'',
                date:item.querySelector('pubDate')?.textContent?.trim()||'',
                source:item.querySelector('source')?.textContent?.trim()||''
            })).filter(x=>x.title&&x.link);
        };

        const fetchFeed=async feed=>{
            const urls=[
                'https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(feed.url),
                'https://api.allorigins.win/raw?url='+encodeURIComponent(feed.url)
            ];
            for(const url of urls){
                const controller=new AbortController();
                const timer=setTimeout(()=>controller.abort(),10000);
                try{
                    const r=await fetch(url,{cache:'no-store',signal:controller.signal});
                    if(!r.ok)continue;
                    const text=await r.text();
                    try{
                        const json=JSON.parse(text);
                        if(json.status==='ok'&&Array.isArray(json.items)){
                            return json.items.map(x=>({title:x.title||'',link:x.link||'',date:x.pubDate||'',source:feed.name}));
                        }
                    }catch(_){}
                    const parsed=parseRSS(text);
                    if(parsed.length)return parsed.map(x=>({...x,source:x.source||feed.name}));
                }catch(_){
                    // try the next transport
                }finally{
                    clearTimeout(timer);
                }
            }
            return [];
        };

        try{
            const collected=(await Promise.all(feeds.map(fetchFeed))).flat();
            const seen=new Set();
            const rows=collected
                .filter(x=>{
                    const key=x.title.toLowerCase().replace(/\s+/g,' ');
                    if(seen.has(key))return false;
                    seen.add(key); return true;
                })
                .map(x=>{
                    const text=x.title.toLowerCase();
                    let impact='low';
                    if(/fed|ecb|boe|boj|rate|interest rate|inflation|cpi|ppi|nfp|payroll|unemployment|central bank|intervention|sec|etf|hack|exploit/.test(text))impact='high';
                    else if(/forex|foreign exchange|currency|dollar|euro|pound|yen|bitcoin|ethereum|crypto|binance|solana|market/.test(text))impact='medium';
                    return {x,impact};
                })
                .sort((a,b)=>new Date(b.x.date||0)-new Date(a.x.date||0))
                .slice(0,12);

            if(!rows.length)throw new Error('all news feeds failed');

            this.marketNews.innerHTML=rows.map(({x,impact})=>{
                const dt=x.date?new Date(x.date):null;
                const date=dt&&!Number.isNaN(dt.getTime())
                    ? dt.toLocaleString([], {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})
                    : '—';
                const affects=mode==='forex'
                    ? (impact==='high'?'USD · EUR · GBP · JPY · ставки':'валютный рынок')
                    : (impact==='high'?'BTC · ETH · SOL · риск-аппетит':'крипторынок');
                return `<article class="news-row impact-${impact}">
                    <div class="news-impact"><span class="impact-dot ${impact}"></span><b>${this.marketImpactLabel(impact)}</b></div>
                    <div class="news-main">
                        <a href="${this.marketEscape(this.marketSafeUrl(x.link))}" target="_blank" rel="noopener noreferrer">${this.marketEscape(x.title)}</a>
                        <small>${this.marketEscape(x.source||'Источник')} · ${date}</small>
                        <span>Влияет на: ${this.marketEscape(affects)}</span>
                    </div>
                </article>`;
            }).join('');

            if(this.marketNewsStatus)this.marketNewsStatus.textContent=`${rows.length} свежих публикаций · обновлено ${new Date().toLocaleTimeString()}`;
        }catch(err){
            console.error('Market news error:',err);
            if(this.marketNews)this.marketNews.innerHTML='<div class="market-feed-empty"><b>Новости временно недоступны.</b><span>Все внешние источники не ответили. Пустоту не заменяем выдуманными новостями.</span></div>';
            if(this.marketNewsStatus)this.marketNewsStatus.textContent='Источники новостей недоступны';
        }
    },
    marketFmtForex(code, value){
        const n=this.marketNum(value); if(n===null)return '—';
        return n.toLocaleString(undefined,{minimumFractionDigits:code==='XAU'?2:code==='GBP'||code==='EUR'?4:3,maximumFractionDigits:code==='XAU'?2:code==='GBP'||code==='EUR'?4:3});
    },
    marketDisplayName(t, mode){
        if(mode!=='forex') return String(t.symbol||'').replace('USDT','')+'/USDT';
        const code=String(t.code||String(t.symbol||'').replace('USD','')).toUpperCase();
        return code==='XAU'?'XAU / USD':`${code} / USD`;
    },
    marketCardHtml(t, mode, cached=false){
        const pct=this.marketNum(t.priceChangePercent)||0;
        const hi=this.marketNum(t.highPrice), lo=this.marketNum(t.lowPrice), last=this.marketNum(t.lastPrice);
        const range=(hi!==null&&lo!==null)?Math.max(hi-lo,0):0;
        const pos=range?Math.max(0,Math.min(100,(last-lo)/range*100)):50;
        const code=String(t.code||'').toUpperCase();
        const price=mode==='forex'?this.marketFmtForex(code,last):this.marketFmtPrice(last);
        const low=mode==='forex'?this.marketFmtForex(code,lo):this.marketFmtPrice(lo);
        const high=mode==='forex'?this.marketFmtForex(code,hi):this.marketFmtPrice(hi);
        const source=mode==='forex'?(code==='XAU'?'PAXG / USD proxy':'Frankfurter / ECB'):(cached?'Кэш':'Binance');
        const primaryLabel=mode==='forex'?'Изменение':'24h high';
        const primaryValue=mode==='forex'?this.marketFmtPct(pct):this.marketFmtPrice(hi);
        const secondaryLabel=mode==='forex'?'Источник':'24h low';
        const secondaryValue=mode==='forex'?source:this.marketFmtPrice(lo);
        const tertiaryLabel=mode==='forex'?'Единица':'Объём 24h';
        const tertiaryValue=mode==='forex'?(code==='XAU'?'1 тройская унция': '1 USD'):(this.marketNum(t.quoteVolume)===null?'—':'$'+Number(t.quoteVolume).toLocaleString(undefined,{maximumFractionDigits:0}));
        return `<article class="pulse-card glass-panel ${cached?'is-cached':''}"
                    data-market-code="${this.marketEscape(code||t.symbol||'')}">
            <div class="pulse-top"><span>${this.marketEscape(this.marketDisplayName(t,mode))}</span><em class="${pct>=0?'positive':'negative'}">${this.marketFmtPct(pct)}</em></div>
            <strong>${price}</strong>
            <div class="pulse-range" title="Положение внутри расчётного диапазона"><i style="width:${pos}%"></i></div>
            <div class="pulse-range-labels"><span>${low}</span><span>${pos.toFixed(0)}%</span><span>${high}</span></div>
            <div class="pulse-row"><span>${primaryLabel}</span><b>${primaryValue}</b></div>
            <div class="pulse-row"><span>${secondaryLabel}</span><b>${secondaryValue}</b></div>
            <div class="pulse-row"><span>${tertiaryLabel}</span><b>${tertiaryValue}</b></div>
        </article>`;
    },
    async fetchJsonWithTimeout(url, timeout=9000){
        const controller=new AbortController();
        const timer=setTimeout(()=>controller.abort(),timeout);
        try{
            const r=await fetch(url,{cache:'no-store',signal:controller.signal});
            if(!r.ok)throw new Error(`${r.status}`);
            return await r.json();
        }finally{clearTimeout(timer);}
    },
    async loadMarketPulse(silent=false){
        if(!this.marketPulseGrid)return;
        this.renderMarketSession(); this.renderMarketMode();
        if(!silent)this.renderMarketPulseLoading();
        const started=performance.now();
        const mode=this.marketMode==='forex'?'forex':'crypto';
        try{
            let results=[];
            if(mode==='crypto'){
                const symbols=['BTCUSDT','ETHUSDT','SOLUSDT'];
                results=await Promise.all(symbols.map(symbol=>this.fetchJsonWithTimeout(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)));
                results=results.map(x=>({...x,code:String(x.symbol||'').replace('USDT','')}));
            }else{
                // Forex mode intentionally shows EUR, GBP and Gold — not crypto assets.
                const nowDate=new Date();
                const prevDate=new Date(nowDate); prevDate.setUTCDate(prevDate.getUTCDate()-3);
                const fmt=d=>d.toISOString().slice(0,10);
                const [latest,previous]=await Promise.all([
                    this.fetchJsonWithTimeout('https://api.frankfurter.app/latest?from=USD&to=EUR,GBP'),
                    this.fetchJsonWithTimeout(`https://api.frankfurter.app/${fmt(prevDate)}?from=USD&to=EUR,GBP`)
                ]);
                results=['EUR','GBP'].map(code=>{
                    const usdToCurrency=Number(latest.rates?.[code]);
                    const prevUsdToCurrency=Number(previous.rates?.[code]);
                    // Frankfurter returns USD -> EUR/GBP. Render the conventional
                    // EUR/USD and GBP/USD pairs by inverting the reference rate.
                    const last=usdToCurrency>0 ? 1/usdToCurrency : NaN;
                    const prev=prevUsdToCurrency>0 ? 1/prevUsdToCurrency : NaN;
                    const pct=Number.isFinite(prev) && prev ? ((last-prev)/prev*100) : 0;
                    const spread=Math.max(Math.abs(last)*0.003,0.0001);
                    return {symbol:`${code}USD`,code,lastPrice:last,priceChangePercent:pct,highPrice:last+spread,lowPrice:last-spread,quoteVolume:null};
                });

                // Gold is represented by PAXG/USD, a spot-gold-backed market pair.
                // It gives us a live market quote without adding an API key to the client.
                try{
                    const gold=await this.fetchJsonWithTimeout('https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT');
                    results.push({symbol:'USDXAU',code:'XAU',lastPrice:Number(gold.lastPrice),priceChangePercent:Number(gold.priceChangePercent)||0,highPrice:Number(gold.highPrice),lowPrice:Number(gold.lowPrice),quoteVolume:Number(gold.quoteVolume)||null});
                }catch(goldErr){
                    // Secondary public source. If it does not respond, fail honestly instead of inventing gold data.
                    const gold=await this.fetchJsonWithTimeout('https://api.gold-api.com/price/XAU',7000);
                    const last=Number(gold.price ?? gold.value ?? gold.close);
                    if(!Number.isFinite(last))throw goldErr;
                    results.push({symbol:'USDXAU',code:'XAU',lastPrice:last,priceChangePercent:0,highPrice:last,lowPrice:last,quoteVolume:null});
                }
            }

            const latency=Math.round(performance.now()-started),now=new Date();
            const cards=results.map(t=>this.marketCardHtml(t,mode)).join('');
            this.marketPulseGrid.innerHTML=cards+`<div class="pulse-source glass-panel">${mode==='crypto'?'Binance public API':'Frankfurter (ECB reference rates) + live gold market'} · ${now.toLocaleTimeString()} · ${latency} ms · режим: ${mode==='crypto'?'Крипта':'Форекс'}.</div>`;
            this.saveMarketCache(results,mode);
            if(this.marketLiveStatus)this.marketLiveStatus.textContent='Данные актуальны';
            if(this.marketLastUpdated)this.marketLastUpdated.textContent=now.toLocaleTimeString();
            if(this.marketLatency)this.marketLatency.textContent=latency+' ms';
            this.buildMarketAnalysis(results);
            await Promise.all([this.loadMarketCalendar(),this.loadMarketNews()]);
        }catch(err){
            console.error('Market pulse error:',err);
            const cached=this.marketCache;
            if(cached?.results?.length && (!cached.mode || cached.mode===mode)){
                this.renderCachedMarket(cached.results,cached.savedAt,Date.now()-cached.savedAt,cached.mode||mode);
            }else if(this.marketPulseGrid){
                this.marketPulseGrid.innerHTML='<div class="module-empty glass-panel"><div class="module-empty-icon">⌁</div><h3>Рынок недоступен</h3><p>Не удалось получить данные выбранного рынка. Никаких выдуманных значений не показываем.</p><button class="btn-primary" onclick="App.loadMarketPulse()">Повторить</button></div>';
            }
            if(this.marketLiveStatus)this.marketLiveStatus.textContent='Нет соединения';
            if(this.marketLatency)this.marketLatency.textContent='—';
            await Promise.all([this.loadMarketCalendar(),this.loadMarketNews()]);
        }
    },
    renderCachedMarket(results,savedAt,age,mode=this.marketMode==='forex'?'forex':'crypto'){
        const ageMin=Math.floor(age/60000);
        this.marketPulseGrid.innerHTML=results.map(t=>this.marketCardHtml(t,mode,true)).join('')+`<div class="pulse-source glass-panel">Последний успешно полученный снимок рынка от ${new Date(savedAt).toLocaleTimeString()} · кэш ${ageMin} мин.</div>`;
        this.buildMarketAnalysis(results);
        if(this.marketLastUpdated)this.marketLastUpdated.textContent=new Date(savedAt).toLocaleTimeString();
        if(this.marketLatency)this.marketLatency.textContent='кэш';
    },
    // ============================================================
    // DASHBOARD
    // ============================================================
    updateDashboardStats() {
        const stats = this.computeTradeStats(this.trades);
        const total = stats.total;
        const wins = stats.wins;
        const losses = stats.losses;
        
        if (this.totalTradesDisplay) this.totalTradesDisplay.textContent = total;
        if (this.winTradesDisplay) this.winTradesDisplay.textContent = wins + ' (' + Math.round(stats.winRate) + '%)';
        if (this.lossTradesDisplay) this.lossTradesDisplay.textContent = losses + ' (' + Math.round((total ? losses / total * 100 : 0)) + '%)';
        if (this.winRateDisplay) this.winRateDisplay.textContent = Math.round(stats.winRate) + '%';
        if (this.journalBadge) this.journalBadge.textContent = total;
        
        this.initDashboardCharts();
        this.renderDashboardSmartWidgets();
        this.renderBrandRecentTrades();
        this.saveState();
    },

    renderBrandRecentTrades() {
        const box = document.getElementById('brandRecentTrades');
        if (!box) return;
        if (!this.trades.length) {
            box.innerHTML = '<div class="brand-empty-trades"><div>Пока нет реальных сделок</div><small>Добавленные тобой сделки появятся здесь автоматически.</small></div>';
            return;
        }
        box.innerHTML = this.trades.slice(0,5).map(t => {
            const cls = t.status === 'win' ? 'win' : (t.status === 'loss' ? 'loss' : '');
            return `<div class="brand-trade-row"><span>${this.escapeHtml(t.asset || '—')}</span><span>${t.side === 'BUY' ? 'LONG' : 'SHORT'}</span><span>${this.escapeHtml(t.entry ?? '—')}</span><span>${this.escapeHtml(t.exit ?? '—')}</span><span class="${cls}">${this.escapeHtml(t.result || '—')}</span><span>${this.escapeHtml(t.rr || '—')}</span><span>${this.escapeHtml(t.date || '—')}</span></div>`;
        }).join('');
    },

    // ============================================================
    // v1.0.7 — SMART DASHBOARD
    // Reads only real stored state (this.trades, this.guardianRules /
    // this.guardianSummary) — no crypto-safe id fallback, no demo data, no separate
    // Guardian re-implementation. Every empty case renders an honest
    // neutral state instead of a fabricated number.
    // ============================================================
    renderDashboardSmartWidgets() {
        const en = this.currentLang === 'en';
        const total = this.trades.length;

        // Welcome hero — visible ONLY for a genuinely empty account.
        if (this.dashWelcomeHero) this.dashWelcomeHero.style.display = total === 0 ? 'block' : 'none';
        if (this.dashTodayOverview) this.dashTodayOverview.style.opacity = total === 0 ? '0.5' : '1';

        // ----- Today Overview -----
        const today = kdLocalDateKey();
        const todayTrades = this.trades.filter(t => t.date === today);
        const todayPnl = todayTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
        const todayWins = todayTrades.filter(t => t.status === 'win').length;

        if (this.todayPnlDisplay) {
            this.todayPnlDisplay.textContent = todayTrades.length === 0 ? this.t('no_data_short')
                : (todayPnl >= 0 ? '+' : '') + todayPnl.toFixed(2) + ' $';
        }
        if (this.todayTradesDisplay) this.todayTradesDisplay.textContent = todayTrades.length;
        if (this.todayWinRateDisplay) {
            this.todayWinRateDisplay.textContent = todayTrades.length === 0 ? this.t('no_data_short')
                : Math.round(todayWins / todayTrades.length * 100) + '%';
        }
        if (this.todayDisciplineDisplay) {
            const s = this.guardianSummary || {};
            this.todayDisciplineDisplay.textContent = (s.score === null || s.score === undefined) ? this.t('no_data_short') : s.score + '%';
        }

        // ----- Recent Trades -----
        if (this.dashRecentTrades) {
            if (total === 0) {
                this.dashRecentTrades.innerHTML = `<div class="panel-empty-state" style="padding:16px 0;"><div class="panel-empty-title">${this.t('no_trades_yet_dash')}</div></div><button class="btn-secondary full-width" id="dashRecentAddTradeBtn">${this.t('add_first_trade')}</button>`;
                const btn = document.getElementById('dashRecentAddTradeBtn');
                if (btn) btn.addEventListener('click', () => this.openTradeModal());
            } else {
                const recent = this.trades.slice(0, 5);
                let html = '';
                recent.forEach(t => {
                    const resultClass = t.status === 'win' ? 'green' : (t.status === 'loss' ? 'red' : '');
                    html += `
                        <div class="dash-recent-trade-row">
                            <div class="dash-recent-trade-main">
                                <span class="dash-recent-trade-asset">${this.escapeHtml(t.asset)}</span>
                                <span class="dash-recent-trade-meta">${this.escapeHtml(t.side)} · ${this.escapeHtml(t.date || '')}</span>
                            </div>
                            <span class="dash-recent-trade-result ${resultClass}">${this.escapeHtml(t.result || '—')}</span>
                        </div>`;
                });
                this.dashRecentTrades.innerHTML = html;
            }
        }
    },

    // Guardian Status card — reads this.guardianSummary, computed once
    // inside updateGuardianStats(). No second evaluation pass here.
    renderDashboardGuardianCard() {
        if (!this.dashGuardianCard) return;
        const en = this.currentLang === 'en';
        const s = this.guardianSummary || { score: null, passed: 0, failed: 0, nodata: 0 };
        if (this.trades.length === 0) {
            this.dashGuardianCard.innerHTML = `<div class="panel-empty-state" style="padding:12px 0;"><div class="panel-empty-title">${this.t('guardian_nodata_yet')}</div></div>`;
            return;
        }
        this.dashGuardianCard.innerHTML = `
            <div class="dash-guardian-summary">
                <div class="dash-guardian-score-row">
                    <span class="score-num">${s.score === null ? '—' : s.score + '%'}</span>
                </div>
                <div class="dash-guardian-breakdown">
                    <span class="green">✅ ${s.passed} ${this.t('guardian_passed')}</span>
                    <span class="red">⚠️ ${s.failed} ${this.t('guardian_failed')}</span>
                    <span style="color:var(--text-secondary);">— ${s.nodata} ${this.t('guardian_nodata')}</span>
                </div>
            </div>`;
    },

    initDashboardCharts() {
        if (typeof Chart === 'undefined') return;
        const total = this.trades.length;
        const wins = this.trades.filter(t => t.status === 'win').length;
        const losses = this.trades.filter(t => t.status === 'loss').length;
        
        if (this.winRateDonutChart) {
            if (this.dashboardCharts.winRate) this.dashboardCharts.winRate.destroy();
            this.dashboardCharts.winRate = new Chart(this.winRateDonutChart, {
                type: 'doughnut',
                data: { labels: ['Побед', 'Поражений'], datasets: [{ data: [wins || 1, losses || 1], backgroundColor: ['#43c6a0', '#ef4444'], borderColor: '#13161c', borderWidth: 3 }] },
                options: { responsive: true, maintainAspectRatio: false, cutout: '78%', plugins: { legend: { display: false } } }
            });
        }

        if (this.assetDonutChart) {
            if (this.dashboardCharts.asset) this.dashboardCharts.asset.destroy();
            const assetsMap = {};
            this.trades.forEach(t => { if(!assetsMap[t.asset]) assetsMap[t.asset] = 0; assetsMap[t.asset]++; });
            const labels = Object.keys(assetsMap);
            const data = Object.values(assetsMap);
            this.dashboardCharts.asset = new Chart(this.assetDonutChart, {
                type: 'doughnut', data: { labels: labels, datasets: [{ data: data.length ? data : [1], backgroundColor: ['#7c5cfc', '#fbbf24', '#43c6a0', '#ef4444', '#f97316'], borderColor: '#13161c', borderWidth: 2 }] },
                options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { display: false } } }
            });
        }
    },

    // ============================================================
    // DASHBOARD — R-distribution, Best Trading Time, Asset list, AI box
    // These panels used to ship as static fake HTML. They now render
    // entirely from real trade data and show honest empty states.
    // ============================================================
    renderDashboardExtras() {
        this.renderRDistribution();
        this.renderBestTradingTime();
        this.renderAssetList();
        this.renderDashAIInsight();
    },

    renderRDistribution() {
        const container = document.getElementById('rDistributionBody');
        if (!container) return;
        if (this.trades.length === 0) {
            container.innerHTML = '';
            this.renderEmptyState(container, this.t('empty_rdist_title'));
            return;
        }
        const buckets = [
            { label: '> 3R', min: 3, max: Infinity },
            { label: '2R – 3R', min: 2, max: 3 },
            { label: '1R – 2R', min: 1, max: 2 },
            { label: '0R – 1R', min: 0, max: 1 },
            { label: '< 0R', min: -Infinity, max: 0 }
        ];
        const rrValues = this.trades.map(t => parseFloat(t.rr)).filter(v => !isNaN(v));
        const total = rrValues.length || 1;
        const counts = buckets.map(b => rrValues.filter(v => v >= b.min && v < b.max).length);
        const maxCount = Math.max(...counts, 1);
        let html = '';
        buckets.forEach((b, i) => {
            const count = counts[i];
            const pct = Math.round(count / total * 100);
            const widthPct = Math.round(count / maxCount * 100);
            html += `<div class="bar-row"><span class="bar-label">${b.label}</span><div class="bar-track"><div class="bar-fill" style="width:${widthPct}%;"></div></div><span class="bar-val">${count} (${pct}%)</span></div>`;
        });
        container.innerHTML = html;
    },

    // "Best Trading Time" is computed per trading SESSION (London/NY/Asian/Sydney),
    // since that's the timing data we actually collect per trade — not a fabricated
    // hour-by-hour heatmap we have no real data to back up.
    renderBestTradingTime() {
        const container = document.getElementById('bestTimeBody');
        if (!container) return;
        const MIN_TRADES = 5;
        if (this.trades.length < MIN_TRADES) {
            container.innerHTML = '';
            this.renderEmptyState(container, this.t('empty_besttime_title'), this.t('empty_besttime_desc'));
            return;
        }
        const sessionLabels = { london: 'London', ny: 'New York', asia: 'Asian', sydney: 'Sydney' };
        const totals = {};
        this.trades.forEach(t => {
            const key = t.session && sessionLabels[t.session] ? t.session : null;
            if (!key) return;
            if (!totals[key]) totals[key] = { rr: 0, count: 0 };
            totals[key].rr += parseFloat(t.rr) || 0;
            totals[key].count++;
        });
        const rows = Object.keys(totals).map(k => ({ label: sessionLabels[k], avgRR: totals[k].rr / totals[k].count, count: totals[k].count }));
        if (rows.length === 0) {
            this.renderEmptyState(container, this.t('empty_besttime_title'), this.t('empty_besttime_desc'));
            return;
        }
        rows.sort((a, b) => b.avgRR - a.avgRR);
        const maxAbs = Math.max(...rows.map(r => Math.abs(r.avgRR)), 0.1);
        let html = `<p class="panel-note">${this.t('besttime_desc')}</p>`;
        rows.forEach(r => {
            const widthPct = Math.max(6, Math.round(Math.abs(r.avgRR) / maxAbs * 100));
            const cls = r.avgRR >= 0 ? 'positive' : 'negative';
            html += `<div class="bar-row"><span class="bar-label">${r.label}</span><div class="bar-track"><div class="bar-fill ${cls}" style="width:${widthPct}%;"></div></div><span class="bar-val">${(r.avgRR >= 0 ? '+' : '')}${r.avgRR.toFixed(1)}R · ${r.count}</span></div>`;
        });
        container.innerHTML = html;
    },

    renderAssetList() {
        const container = document.getElementById('assetListBody');
        if (!container) return;
        if (this.trades.length === 0) {
            container.innerHTML = '';
            this.renderEmptyState(container, this.t('empty_assets_title'));
            return;
        }
        const assetsMap = {};
        this.trades.forEach(t => { assetsMap[t.asset] = (assetsMap[t.asset] || 0) + 1; });
        const total = this.trades.length;
        const colors = ['#7c5cfc', '#fbbf24', '#43c6a0', '#ef4444', '#f97316'];
        const entries = Object.entries(assetsMap).sort((a, b) => b[1] - a[1]);
        let html = '';
        entries.forEach(([asset, count], i) => {
            const pct = Math.round(count / total * 100);
            html += `<div><span class="dot" style="background:${colors[i % colors.length]};"></span> ${this.escapeHtml(asset)} <span class="asset-val">${count} (${pct}%)</span></div>`;
        });
        container.innerHTML = html;
    },

    // Dashboard AI box: a short, honest, data-grounded snippet — never a
    // fabricated warning. It only ever references real Guardian violations
    // or real trade counts, and never predicts the market or gives signals.
    renderDashAIInsight() {
        const msgEl = document.getElementById('dashAIMsg');
        const subEl = document.getElementById('dashAIMsgSub');
        if (!msgEl || !subEl) return;
        if (this.trades.length === 0) {
            msgEl.textContent = this.currentLang === 'en'
                ? 'Log your first trade in the Journal and I\'ll start tracking your discipline.'
                : 'Добавьте первую сделку в Journal — и я начну отслеживать вашу дисциплину.';
            subEl.textContent = this.currentLang === 'en'
                ? 'I coach — I never predict the market or send buy/sell signals.'
                : 'Я коуч — я не предсказываю рынок и не даю сигналы Buy/Sell.';
            return;
        }
        const violations = (this.guardianRules || []).filter(r => !r.passed);
        const total = this.trades.length;
        const wins = this.trades.filter(t => t.status === 'win').length;
        const winRate = Math.round(wins / total * 100);
        if (violations.length > 0) {
            msgEl.textContent = this.currentLang === 'en'
                ? `Guardian flagged ${violations.length} rule${violations.length === 1 ? '' : 's'} today: ${violations[0].name}.`
                : `Guardian сегодня отметил нарушений: ${violations.length} (${violations[0].name}).`;
            subEl.textContent = this.currentLang === 'en' ? 'Open Guardian for the full breakdown.' : 'Откройте Guardian для подробностей.';
        } else {
            msgEl.textContent = this.currentLang === 'en'
                ? `You have ${total} logged trades with a ${winRate}% win rate so far.`
                : `У вас ${total} сделок в журнале, Win Rate ${winRate}%.`;
            subEl.textContent = this.currentLang === 'en' ? 'Ask me anything about your journal, discipline, or strategy.' : 'Спросите меня о журнале, дисциплине или стратегии.';
        }
    },

    initEquityChart() {
        if (typeof Chart === 'undefined') return;
        const canvas = document.getElementById('equityChart');
        const wrapper = document.getElementById('equityChartWrapper');
        if (!canvas) return;
        if (this.equityChartInstance) { this.equityChartInstance.destroy(); this.equityChartInstance = null; }

        if (this.trades.length === 0) {
            canvas.style.display = 'none';
            this.renderEmptyState(wrapper, this.t('empty_equity_title'), this.t('empty_equity_desc'));
            return;
        }
        canvas.style.display = '';
        this.clearEmptyState(wrapper);

        // Real cumulative balance, ordered chronologically, starting from the user's declared capital.
        const sorted = [...this.trades].sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.id - b.id));
        let running = parseFloat(this.userData.capital) || 0;
        const labels = ['Старт'];
        const data = [running];
        sorted.forEach(t => {
            running += (parseFloat(t.pnl) || 0);
            labels.push(t.date || '');
            data.push(running);
        });

        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 180);
        gradient.addColorStop(0, 'rgba(124, 92, 252, 0.3)');
        gradient.addColorStop(1, 'rgba(124, 92, 252, 0)');
        this.equityChartInstance = new Chart(canvas, {
            type: 'line', data: { labels: labels, datasets: [{ label: 'Equity', data, borderColor: '#7c5cfc', backgroundColor: gradient, borderWidth: 3, pointRadius: 3, pointBackgroundColor: '#7c5cfc', pointBorderColor: '#fff', pointBorderWidth: 1, tension: 0.35, fill: true }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#8892a0', maxTicksLimit: 8 } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892a0' } } } }
        });
    },

    // ===== Reusable empty-state helper =====
    // Every panel that used to ship with fake numbers now renders a real
    // "not enough data yet" message here instead, using a small overlay
    // that sits on top of the panel without destroying its DOM structure.
    renderEmptyState(container, title, desc) {
        if (!container) return;
        this.clearEmptyState(container);
        const el = document.createElement('div');
        el.className = 'panel-empty-state';
        el.innerHTML = `<div class="panel-empty-icon">📭</div><div class="panel-empty-title">${title}</div>${desc ? `<div class="panel-empty-desc">${desc}</div>` : ''}`;
        container.appendChild(el);
    },

    clearEmptyState(container) {
        if (!container) return;
        const existing = container.querySelector('.panel-empty-state');
        if (existing) existing.remove();
    },

    formatTradeDate(value) {
        if (!value) return '—';
        const raw = String(value);
        const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return raw;
        const [_, y, m, d] = match;
        const format = this.userData?.dateFormat || this.settingsDateFormat?.value || 'DD.MM.YYYY';
        if (format === 'MM/DD/YYYY') return `${m}/${d}/${y}`;
        if (format === 'YYYY-MM-DD') return raw;
        return `${d}.${m}.${y}`;
    },

    // Shared trade aggregation used by Journal/Analytics/Dashboard helpers.
    // Keeping this in one place prevents small differences in win-rate/RR math.
    computeTradeStats(trades = this.trades) {
        const list = Array.isArray(trades) ? trades : [];
        const wins = list.filter(t => t.status === 'win').length;
        const losses = list.filter(t => t.status === 'loss').length;
        const rrValues = list.map(t => Number(t.rr)).filter(Number.isFinite);
        const pnlValues = list.map(t => Number(t.pnl)).filter(Number.isFinite);
        const totalRR = rrValues.reduce((a,b) => a+b, 0);
        const totalPnL = pnlValues.reduce((a,b) => a+b, 0);
        return {
            total: list.length,
            wins,
            losses,
            breakevens: Math.max(0, list.length - wins - losses),
            winRate: list.length ? wins / list.length * 100 : 0,
            totalRR,
            avgRR: rrValues.length ? totalRR / rrValues.length : 0,
            totalPnL
        };
    },

    // ============================================================
    // JOURNAL
    // ============================================================
    applyFilters() {
        const asset = this.filterAsset?.value || '';
        const result = this.filterResult?.value || '';
        const search = this.journalSearch?.value?.toLowerCase() || '';
        this.filteredTrades = this.trades.filter(trade => {
            const matchAsset = !asset || trade.asset === asset;
            const matchResult = !result || trade.status === result;
            const matchSearch = !search || trade.asset.toLowerCase().includes(search) || trade.side.toLowerCase().includes(search);
            return matchAsset && matchResult && matchSearch;
        });
        this.currentPage = 1;
        this.renderJournal();
        this.updateJournalStats();
    },

    renderJournal() {
        if (!this.journalBody) return;
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageData = this.filteredTrades.slice(start, end);

        if (pageData.length === 0) {
            this.journalBody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:48px 0;color:var(--text-secondary);">${this.t('empty_journal')}</td></tr>`;
            return;
        }

        let html = '';
        pageData.forEach(trade => {
            const status = ['win', 'loss', 'breakeven'].includes(trade.status) ? trade.status : 'breakeven';
            const statusLabel = status === 'win' ? 'Прибыль' : (status === 'loss' ? 'Убыток' : 'Без результата');
            const result = String(trade.result ?? '');
            const resultClass = status === 'breakeven' ? 'result-neutral' : (result.startsWith('+') ? 'result-positive' : 'result-negative');
            const sideClass = trade.side === 'BUY' ? 'side-buy' : 'side-sell';
            // v1.1.0 — trades saved via the AI Scanner carry a `screenshot`
            // (base64 dataURL) field; existing trades simply don't have
            // one, so this button only renders when it's actually present.
            const screenshotBtn = trade.screenshot
                ? `<button class="journal-screenshot-btn" data-screenshot-id="${this.escapeHtml(trade.id)}" title="${this.escapeHtml(this.t('scanner_view_screenshot'))}">🖼️</button>`
                : '';
            html += `<tr>
                        <td>${this.escapeHtml(this.formatTradeDate(trade.date))}</td>
                        <td class="asset-cell">${this.escapeHtml(trade.asset)}</td>
                        <td class="${sideClass}">${this.escapeHtml(trade.side)}</td>
                        <td>${this.escapeHtml(trade.entry)}</td>
                        <td>${this.escapeHtml(trade.exit)}</td>
                        <td>${this.escapeHtml(trade.rr)}</td>
                        <td class="${resultClass}">${this.escapeHtml(result)}</td>
                        <td><span class="status-badge ${status}">${statusLabel}</span></td>
                        <td>
                            ${screenshotBtn}
                            <button class="edit-btn" data-id="${this.escapeHtml(trade.id)}" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;transition:0.2s;margin-right:8px;" title="Редактировать">✎</button>
                            <button class="delete-btn" data-id="${this.escapeHtml(trade.id)}" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;transition:0.2s;" title="Удалить">✕</button>
                        </td>
                    </tr>`;
        });
        this.journalBody.innerHTML = html;

        this.journalBody.querySelectorAll('[data-screenshot-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.screenshotId);
                const trade = this.trades.find(t => t.id === id);
                if (trade && trade.screenshot) this.openLightbox(trade.screenshot);
            });
        });

        this.journalBody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.openTradeModal(id);
            });
        });

        this.journalBody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                if(confirm('Удалить сделку?')) {
                    this.trades = this.trades.filter(t => t.id !== id);
                    this.filteredTrades = [...this.trades];
                    this.syncAfterTradeChange();
                }
            });
        });
    },

    updateJournalStats() {
        const stats = this.computeTradeStats(this.filteredTrades);
        const total = stats.total;
        const winRate = stats.winRate;
        const avgRR = stats.avgRR;
        const totalPnL = stats.totalPnL;

        if (this.jTotalTrades) this.jTotalTrades.textContent = total;
        if (this.jWinRate) { this.jWinRate.textContent = winRate.toFixed(1) + '%'; this.jWinRate.className = 'stat-number ' + (winRate >= 50 ? 'green' : 'red'); }
        if (this.jAvgRR) this.jAvgRR.textContent = avgRR.toFixed(1);
        if (this.jTotalPnL) { this.jTotalPnL.textContent = (totalPnL >= 0 ? '+' : '') + totalPnL.toFixed(2) + ' $'; this.jTotalPnL.className = 'stat-number ' + (totalPnL >= 0 ? 'green' : 'red'); }
    },

    syncAfterTradeChange() {
        this.renderJournal();
        this.updateJournalStats();
        this.updateDashboardStats();
        this.updateBalanceDisplay();
        this.renderTodaysProgress();
        this.initEquityChart();
        this.renderDashboardExtras();
        this.updateAnalytics();
        this.refreshTradingBreakdowns();
        this.updateGuardianStats();
        this.initGuardianChart();
        this.renderCalendar();
        this.updateCalendarBadge();
        this.updateNotifBadge();
        if (this.perfEquityChart) { this.updatePerformanceStats(); this.initPerfEquityChart(); this.initPerfMonthlyChart(); this.initPerfSessionsChart(); }
        this.saveState();

        // v1.8.5 — immediately refresh the custom branded Dashboard.
        if (typeof window !== 'undefined' &&
            typeof window.KDRefreshBrandDashboard === 'function') {
            window.KDRefreshBrandDashboard();
        }
    },

    openTradeModal(tradeId = null, fromScanner = false) {
        if (!this.tradeModalOverlay) return;
        this.editingTradeId = tradeId;
        // v1.1.0 — a screenshot pending from the Scanner should only ever
        // attach to the trade the Scanner itself is handing off. Every
        // other way of opening this modal (+ Add Trade, Quick Actions,
        // the empty-state CTA, editing an existing trade) clears it
        // defensively here in one place, rather than at every call site.
        if (!fromScanner) this.pendingScannerScreenshot = null;
        Object.values(this.tFields).forEach(el => { if (el) { el.value = ''; el.classList.remove('input-invalid'); } });
        document.querySelectorAll('#tradeModalOverlay .form-error').forEach(el => el.textContent = '');

        const trade = tradeId ? this.trades.find(t => t.id === tradeId) : null;
        if (this.tradeModalTitle) this.tradeModalTitle.textContent = trade ? 'Редактировать сделку' : 'Новая сделка';
        if (this.tradeModalSave) this.tradeModalSave.textContent = trade ? 'Сохранить изменения' : 'Сохранить сделку';

        if (trade) {
            const f = this.tFields;
            f.asset.value = trade.asset;
            f.direction.value = trade.side === 'BUY' ? 'long' : 'short';
            f.entry.value = trade.entry;
            f.exit.value = trade.exit;
            f.size.value = trade.size != null ? trade.size : '';
            f.riskPercent.value = trade.riskPercent;
            f.rr.value = trade.rr;
            f.pnl.value = trade.pnl;
            f.date.value = trade.date;
            f.session.value = trade.session || '';
            f.strategy.value = trade.strategy || '';
            f.status.value = trade.status;
            f.emotionBefore.value = trade.emotionBefore || 'calm';
            f.emotionAfter.value = trade.emotionAfter || 'calm';
            f.notes.value = trade.notes || '';
        } else {
            if (this.tFields.date) this.tFields.date.value = kdLocalDateKey();
            if (this.tFields.emotionBefore) this.tFields.emotionBefore.value = 'calm';
            if (this.tFields.emotionAfter) this.tFields.emotionAfter.value = 'calm';
        }

        this.tradeModalOverlay.classList.add('active');
        if (this.tFields.asset) this.tFields.asset.focus();
    },

    closeTradeModal() {
        if (!this.tradeModalOverlay) return;
        this.tradeModalOverlay.classList.remove('active');
        this.editingTradeId = null;
        // v1.1.0 — if the user backs out of the modal (rather than saving),
        // a screenshot pending from the Scanner must not linger and attach
        // itself to some later, unrelated trade.
        this.pendingScannerScreenshot = null;
    },

    validateTradeForm() {
        const f = this.tFields;
        const errors = {};

        const asset = f.asset.value.trim();
        if (!asset) errors.asset = 'Укажите актив';

        const direction = f.direction.value;
        if (!direction) errors.direction = 'Выберите направление';

        const entry = parseFloat(f.entry.value);
        if (isNaN(entry) || entry <= 0) errors.entry = 'Введите цену входа';

        const exit = parseFloat(f.exit.value);
        if (isNaN(exit) || exit <= 0) errors.exit = 'Введите цену выхода';

        const riskPercent = parseFloat(f.riskPercent.value);
        if (isNaN(riskPercent) || riskPercent <= 0) errors.riskPercent = 'Укажите риск в %';

        const rr = parseFloat(f.rr.value);
        if (isNaN(rr)) errors.rr = 'Укажите RR';

        const pnl = parseFloat(f.pnl.value);
        if (isNaN(pnl)) errors.pnl = 'Укажите P&L';

        const date = f.date.value;
        if (!date || isNaN(new Date(date).getTime())) errors.date = 'Укажите дату';

        const session = f.session.value;
        if (!session) errors.session = 'Выберите сессию';

        const strategy = f.strategy.value.trim();
        if (!strategy) errors.strategy = 'Укажите стратегию';

        const status = f.status.value;
        if (!status) errors.status = 'Выберите статус';

        if (!errors.rr && !errors.status) {
            if (status === 'win' && rr <= 0) errors.rr = 'При статусе Win значение RR должно быть положительным';
            else if (status === 'loss' && rr >= 0) errors.rr = 'При статусе Loss значение RR должно быть отрицательным';
            else if (status === 'breakeven' && Math.abs(rr) > 0.05) errors.rr = 'При Break Even значение RR должно быть около 0';
        }

        if (!errors.pnl && !errors.status) {
            if (status === 'win' && pnl <= 0) errors.pnl = 'Для Win P&L должен быть положительным';
            else if (status === 'loss' && pnl >= 0) errors.pnl = 'Для Loss P&L должен быть отрицательным';
            else if (status === 'breakeven' && Math.abs(pnl) > 0.01) errors.pnl = 'Для Break Even P&L должен быть около 0';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
            values: { asset, direction, entry, exit, riskPercent, rr, pnl, date, session, strategy, status }
        };
    },

    submitTradeForm() {
        const f = this.tFields;
        const { valid, errors, values } = this.validateTradeForm();

        document.querySelectorAll('#tradeModalOverlay .form-error').forEach(el => el.textContent = '');
        Object.values(f).forEach(el => { if (el) el.classList.remove('input-invalid'); });

        if (!valid) {
            Object.keys(errors).forEach(key => {
                const errorEl = document.getElementById('t' + key.charAt(0).toUpperCase() + key.slice(1) + 'Error');
                if (errorEl) errorEl.textContent = errors[key];
                if (f[key]) f[key].classList.add('input-invalid');
            });
            if (this.tFormError) this.tFormError.textContent = 'Пожалуйста, исправьте отмеченные поля';
            return;
        }

        const size = parseFloat(f.size.value);
        const result = (values.rr > 0 ? '+' : (values.rr < 0 ? '-' : '')) + Math.abs(values.rr).toFixed(1) + 'R';
        const tradeFields = {
            date: values.date,
            asset: values.asset,
            side: values.direction === 'long' ? 'BUY' : 'SELL',
            entry: values.entry,
            exit: values.exit,
            size: isNaN(size) ? null : size,
            riskPercent: values.riskPercent,
            rr: values.rr,
            pnl: values.pnl,
            result,
            status: values.status,
            session: values.session,
            strategy: values.strategy,
            emotionBefore: f.emotionBefore.value,
            emotionAfter: f.emotionAfter.value,
            notes: f.notes.value.trim()
        };
        // v1.1.0 — AI Scanner screenshot attachment. Only ever added to
        // tradeFields when a screenshot is actually pending (i.e. this
        // Add Trade flow came from the Scanner's "Confirm" step) — the
        // key is omitted entirely otherwise, so editing an existing trade
        // that already has a screenshot never overwrites or clears it via
        // the {...oldTrade, ...tradeFields} merge below, and a normal
        // manual "+ Add Trade" never attaches a stray leftover screenshot.
        if (this.pendingScannerScreenshot) {
            tradeFields.screenshot = this.pendingScannerScreenshot;
        }

        // v1.36 — enforce the user's configured risk guard before a NEW trade
        // enters storage. Historical/imported trades remain readable and are
        // evaluated by Guardian, but a new manual trade cannot silently push
        // the account beyond its declared rules.
        if (!this.editingTradeId) {
            const riskLimit = Number.parseFloat(this.userData?.risk);
            const dailyLossLimit = Number.parseFloat(this.userData?.dailyLoss);
            const maxTradesRaw = Number.parseInt(this.userData?.maxTradesPerDay, 10);
            const maxTradesPerDay = Number.isFinite(maxTradesRaw) && maxTradesRaw >= 1 ? Math.min(maxTradesRaw, 50) : 5;
            const tradeDate = String(values.date || '').slice(0, 10);
            const sameDay = (this.trades || []).filter(t => String(t?.date || '').slice(0, 10) === tradeDate);
            const existingLoss = sameDay.reduce((sum, t) => {
                const p = Number(t?.pnl);
                return sum + (Number.isFinite(p) && p < 0 ? Math.abs(p) : 0);
            }, 0);
            const projectedLoss = existingLoss + (values.pnl < 0 ? Math.abs(values.pnl) : 0);
            const violations = [];
            if (Number.isFinite(riskLimit) && riskLimit > 0 && values.riskPercent > riskLimit) {
                violations.push(`риск ${values.riskPercent}% выше лимита ${riskLimit}%`);
            }
            if (Number.isFinite(dailyLossLimit) && dailyLossLimit > 0 && projectedLoss > dailyLossLimit) {
                violations.push(`дневной убыток $${projectedLoss.toFixed(2)} превысит лимит $${dailyLossLimit.toFixed(2)}`);
            }
            if (sameDay.length >= maxTradesPerDay) {
                violations.push(`достигнут лимит ${maxTradesPerDay} сделок за день`);
            }
            if (violations.length) {
                const message = `Guardian: ${violations.join('; ')}.`;
                if (this.userData?.riskGuardMode === 'warn') {
                    tradeFields.riskViolations = [...violations];
                    if (this.tFormError) this.tFormError.textContent = `${message} Сделка сохранена в режиме предупреждения.`;
                    if (typeof this.showToast === 'function') this.showToast(`${message} Сохранено с предупреждением.`, 'warning');
                } else {
                    if (this.tFormError) this.tFormError.textContent = `Guardian не сохранил сделку: ${violations.join('; ')}.`;
                    if (typeof this.showToast === 'function') this.showToast(`Guardian не сохранил сделку: ${violations.join('; ')}.`, 'error');
                    return;
                }
            }
        }

        const isEdit = this.editingTradeId !== null;
        if (isEdit) {
            const idx = this.trades.findIndex(t => t.id === this.editingTradeId);
            if (idx > -1) this.trades[idx] = { ...this.trades[idx], ...tradeFields, id: this.editingTradeId };
        } else {
            // IDs may come from CSV/exchange imports as strings or UUIDs.
            // Never let a non-numeric imported id turn the next manual trade into NaN.
            const numericIds = (this.trades || [])
                .map(t => Number(t?.id))
                .filter(Number.isFinite);
            const nextId = numericIds.length ? Math.max(...numericIds) + 1 : 1;
            const newTrade = { id: nextId, ...tradeFields };
            this.trades.unshift(newTrade);
        }
        this.filteredTrades = [...this.trades];
        this.currentPage = 1;
        // Consumed — cleared regardless of edit/new so it can never leak
        // into a later, unrelated trade save.
        this.pendingScannerScreenshot = null;

        // v1.8.5 — close the modal first so a rendering error can never
        // leave the interface stuck in a half-updated state.
        this.saveState();
        this.closeTradeModal();

        try {
            this.syncAfterTradeChange();
        } catch (err) {
            console.error('Trade UI sync failed:', err);
        }

        // Always return to Dashboard after a successful trade save.
        this.navItems.forEach(n => n.classList.remove('active'));

        const dashNav = Array.from(this.navItems)
            .find(n => n.dataset.section === 'dashboard');

        if (dashNav) dashNav.classList.add('active');

        if (typeof this.showSection === 'function') {
            this.showSection('dashboard');
        }

        if (typeof window !== 'undefined' &&
            typeof window.KDRefreshBrandDashboard === 'function') {
            window.KDRefreshBrandDashboard();
        }

        // One more render on the next browser frame.
        // This makes the Dashboard update even if Chart.js or another
        // visual component finishes rendering asynchronously.
        requestAnimationFrame(() => {
            try {
                this.updateDashboardStats();
                this.updateBalanceDisplay();
                this.renderDashboardExtras();

                if (typeof window !== 'undefined' &&
                    typeof window.KDRefreshBrandDashboard === 'function') {
                    window.KDRefreshBrandDashboard();
                }
            } catch (err) {
                console.error('Dashboard refresh failed:', err);
            }
        });

        const violations = (this.guardianRules || []).filter(r => !r.passed).length;
        const baseMsg = isEdit ? 'Сделка обновлена!' : 'Сделка успешно добавлена!';
        this.showToast(violations > 0 ? `${baseMsg} Guardian: ${violations} нарушени${violations === 1 ? 'е' : 'я'} правил` : baseMsg);
    },

    // ============================================================
    // HEADER: SEARCH & NOTIFICATIONS
    // ============================================================
    togglePopover(popover) {
        if (!popover) return;
        popover.classList.toggle('open');
    },

    closePopover(popover) {
        if (!popover) return;
        popover.classList.remove('open');
    },

    renderSearchResults(query) {
        if (!this.globalSearchResults) return;
        if (!query) {
            this.globalSearchResults.innerHTML = `<div class="header-popover-empty">Начните вводить запрос...</div>`;
            return;
        }
        const q = query.toLowerCase();
        const tradeMatches = this.trades.filter(t =>
            t.asset.toLowerCase().includes(q) ||
            t.side.toLowerCase().includes(q) ||
            (t.date || '').includes(q)
        ).slice(0, 5);
        const eventMatches = this.events.filter(e => e.title.toLowerCase().includes(q)).slice(0, 5);

        if (tradeMatches.length === 0 && eventMatches.length === 0) {
            this.globalSearchResults.innerHTML = `<div class="header-popover-empty">Ничего не найдено по запросу «${this.escapeHtml(query)}»</div>`;
            return;
        }

        let html = '';
        tradeMatches.forEach(t => {
            html += `
                <button class="header-popover-item" data-kind="trade" data-asset="${this.escapeHtml(t.asset)}">
                    <span class="header-popover-item-icon">${t.status === 'win' ? '📈' : '📉'}</span>
                    <span class="header-popover-item-body">
                        <span class="header-popover-item-title">${this.escapeHtml(t.asset)} · ${this.escapeHtml(t.side)}</span>
                        <span class="header-popover-item-desc">${this.escapeHtml(t.date)} · ${this.escapeHtml(t.result)}</span>
                    </span>
                </button>`;
        });
        eventMatches.forEach(e => {
            const dateLabel = e.date.toLocaleDateString();
            html += `
                <button class="header-popover-item" data-kind="event" data-timestamp="${e.date.getTime()}">
                    <span class="header-popover-item-icon">📅</span>
                    <span class="header-popover-item-body">
                        <span class="header-popover-item-title">${this.escapeHtml(e.title)}</span>
                        <span class="header-popover-item-desc">${dateLabel}</span>
                    </span>
                </button>`;
        });
        this.globalSearchResults.innerHTML = html;

        this.globalSearchResults.querySelectorAll('.header-popover-item[data-kind="trade"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const asset = btn.dataset.asset;
                this.closePopover(this.searchPopover);
                this.navItems.forEach(n => n.classList.remove('active'));
                const nav = Array.from(this.navItems).find(n => n.dataset.section === 'journal');
                if (nav) nav.classList.add('active');
                this.showSection('journal');
                if (this.journalSearch) { this.journalSearch.value = asset; this.applyFilters(); }
            });
        });
        this.globalSearchResults.querySelectorAll('.header-popover-item[data-kind="event"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const ts = parseInt(btn.dataset.timestamp);
                this.closePopover(this.searchPopover);
                this.navItems.forEach(n => n.classList.remove('active'));
                const nav = Array.from(this.navItems).find(n => n.dataset.section === 'calendar');
                if (nav) nav.classList.add('active');
                this.currentDate = new Date(ts);
                this.selectedDate = new Date(ts);
                this.showSection('calendar');
            });
        });
    },

    getNotifications() {
        const notifications = [];
        const en = this.currentLang === 'en';
        const today = kdLocalDateKey();
        const todayTrades = this.trades.filter(t => t.date === today);
        const lossesToday = todayTrades.filter(t => t.status === 'loss').length;

        (this.guardianRules || []).filter(r => !r.passed).forEach(r => {
            notifications.push({ icon: '⚠️', title: en ? 'Guardian rule violation' : 'Нарушение правила Guardian', desc: r.name, tag: 'warning' });
        });

        if (lossesToday >= 3) {
            notifications.push({ icon: '🛑', title: en ? 'Daily loss limit' : 'Дневной лимит убытков', desc: en ? `${lossesToday} losing trades today` : `${lossesToday} убыточных сделок сегодня`, tag: 'warning' });
        }

        const todayEvents = this.getEventsForDate(new Date());
        if (todayEvents.length > 0) {
            notifications.push({ icon: '📅', title: en ? `Events today (${todayEvents.length})` : `События сегодня (${todayEvents.length})`, desc: todayEvents.map(e => e.title).join(', '), tag: 'info' });
        }

        // No synthetic "all good" notification — an empty list means an
        // empty list. The UI renders the real "No notifications yet" state.
        return notifications;
    },

    renderNotifications() {
        if (!this.notifResults) return;
        const notifications = this.getNotifications();
        if (notifications.length === 0) {
            this.notifResults.innerHTML = `<div class="header-popover-item non-interactive"><span class="header-popover-item-body"><span class="header-popover-item-desc">${this.t('empty_notifications')}</span></span></div>`;
            return;
        }
        let html = '';
        notifications.forEach(n => {
            html += `
                <div class="header-popover-item non-interactive">
                    <span class="header-popover-item-icon">${n.icon}</span>
                    <span class="header-popover-item-body">
                        <span class="header-popover-item-title">${this.escapeHtml(n.title)}</span>
                        <span class="header-popover-item-desc">${this.escapeHtml(n.desc)}</span>
                    </span>
                </div>`;
        });
        this.notifResults.innerHTML = html;
    },

    updateNotifBadge() {
        if (!this.notifBadge) return;
        const activeCount = this.getNotifications().filter(n => n.tag === 'warning').length;
        if (activeCount > 0) {
            this.notifBadge.textContent = activeCount;
            this.notifBadge.style.display = 'flex';
        } else {
            this.notifBadge.style.display = 'none';
        }
    },

    // ============================================================
    // CALENDAR
    // ============================================================
    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
        this.updateCalendarBadge();
    },

    renderCalendar() {
        if (!this.calendarGrid) return;
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.calendarMonth.textContent = monthNames[month] + ' ' + year;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        const today = new Date();

        let html = '';
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        weekdays.forEach(d => { html += `<div class="calendar-weekday">${d}</div>`; });

        for (let i = 0; i < firstDay; i++) {
            const prevDay = daysInPrevMonth - firstDay + i + 1;
            html += `<div class="calendar-day-cell other-month">${prevDay}</div>`;
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = d === this.selectedDate.getDate() && month === this.selectedDate.getMonth() && year === this.selectedDate.getFullYear();
            const dayEvents = this.getEventsForDate(dateObj);
            const dayTrades = this.getTradesForDate(dateObj);
            let cls = 'calendar-day-cell';
            if (isToday) cls += ' today';
            if (isSelected) cls += ' selected';
            if (dayEvents.length > 0) cls += ' has-event';
            if (dayTrades.length > 0) cls += ' has-trade';
            html += `<div class="${cls}" data-date="${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}">${d}</div>`;
        }
        this.calendarGrid.innerHTML = html;

        this.calendarGrid.querySelectorAll('.calendar-day-cell:not(.other-month)').forEach(el => {
            el.addEventListener('click', () => {
                const parts = el.dataset.date.split('-');
                this.selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                this.renderCalendar();
                this.renderEvents();
                this.renderDayTrades();
            });
        });
        this.renderEvents();
        this.renderDayTrades();
    },

    getTradesForDate(date) {
        const y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
        return this.trades.filter(t => {
            const td = new Date(t.date);
            return td.getFullYear() === y && td.getMonth() === m && td.getDate() === d;
        });
    },

    renderDayTrades() {
        if (!this.dayTradesList) return;
        const dayTrades = this.getTradesForDate(this.selectedDate);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (this.selectedDateTradesLabel) this.selectedDateTradesLabel.textContent = monthNames[this.selectedDate.getMonth()] + ' ' + this.selectedDate.getDate() + ', ' + this.selectedDate.getFullYear();
        if (this.dayTradesCount) this.dayTradesCount.textContent = dayTrades.length + ' сделок';

        if (dayTrades.length === 0) {
            this.dayTradesList.innerHTML = `<div class="no-events">${this.t('empty_calendar_trades')}</div>`;
            return;
        }
        const statusLabels = { win: 'Win', loss: 'Loss', breakeven: 'BE' };
        let html = '';
        dayTrades.forEach(t => {
            const status = ['win', 'loss', 'breakeven'].includes(t.status) ? t.status : 'breakeven';
            const resultColor = status === 'win' ? 'var(--brand-green)' : (status === 'loss' ? 'var(--brand-red)' : 'var(--text-secondary)');
            html += `
                <div class="trade-item-modern ${status}">
                    <div class="trade-item-top">
                        <span class="trade-item-title">${this.escapeHtml(t.asset)} · ${this.escapeHtml(t.side)} · ${statusLabels[status]}</span>
                        <span class="trade-item-result" style="color:${resultColor};">${this.escapeHtml(t.result)}</span>
                    </div>
                    <span class="trade-item-meta">${t.strategy ? this.escapeHtml(t.strategy) + ' · ' : ''}${t.session ? this.escapeHtml(t.session.toUpperCase()) : ''}</span>
                    ${t.notes ? `<span class="trade-item-notes">${this.escapeHtml(t.notes)}</span>` : ''}
                </div>`;
        });
        this.dayTradesList.innerHTML = html;
    },

    getEventsForDate(date) {
        return this.events.filter(e =>
            e.date.getDate() === date.getDate() &&
            e.date.getMonth() === date.getMonth() &&
            e.date.getFullYear() === date.getFullYear()
        );
    },

    renderEvents() {
        if (!this.eventsList) return;
        const eventsForDate = this.getEventsForDate(this.selectedDate);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        this.selectedDateLabel.textContent = monthNames[this.selectedDate.getMonth()] + ' ' + this.selectedDate.getDate() + ', ' + this.selectedDate.getFullYear();
        this.eventsCount.textContent = eventsForDate.length + ' событий';

        if (eventsForDate.length === 0) {
            this.eventsList.innerHTML = `<div class="no-events">${this.t('empty_calendar_events')}</div>`;
            return;
        }
        let html = '';
        eventsForDate.forEach(event => {
            const colorMap = { trade: 'green', alert: 'orange', meeting: 'purple', analysis: 'yellow', break: 'secondary' };
            const type = Object.prototype.hasOwnProperty.call(colorMap, event.type) ? event.type : 'analysis';
            html += `
                    <div class="event-item-modern" style="border-left-color: var(--brand-${colorMap[type]});">
                        <span class="event-dot ${type}"></span>
                        <span class="event-title">${this.escapeHtml(event.title)}</span>
                        <span class="event-type">${this.escapeHtml(type)}</span>
                        <button class="event-delete" data-id="${this.escapeHtml(event.id)}" title="Delete">×</button>
                    </div>
                `;
        });
        this.eventsList.innerHTML = html;
        this.eventsList.querySelectorAll('.event-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                if(confirm('Удалить это событие?')) {
                    this.deleteEvent(id);
                }
            });
        });
    },

    addEvent() {
        const title = this.eventInput?.value?.trim();
        const type = this.eventType?.value || 'trade';
        if (!title) { alert('Пожалуйста, введите название события'); return; }
        const newEvent = { id: Math.max(...this.events.map(e => e.id), 0) + 1, date: new Date(this.selectedDate), title, type };
        this.events.push(newEvent);
        if (this.eventInput) this.eventInput.value = '';
        this.renderCalendar();
        this.updateCalendarBadge();
        this.updateNotifBadge();
        this.saveState();
    },

    deleteEvent(id) {
        this.events = this.events.filter(e => e.id !== id);
        this.renderCalendar();
        this.updateCalendarBadge();
        this.updateNotifBadge();
        this.saveState();
    },

    updateCalendarBadge() {
        if (!this.calendarBadge) return;
        const now = new Date();
        const count = this.events.filter(e =>
            e.date.getMonth() === now.getMonth() &&
            e.date.getFullYear() === now.getFullYear()
        ).length;
        this.calendarBadge.textContent = count;
    },

    // ============================================================
    // ANALYTICS
    // ============================================================
    updateAnalytics() {
        this.initAnalyticsCharts();
        this.updateAnalyticsStats();
        this.refreshTradingBreakdowns();
        this.renderStrategyIntelligence();
    },

    // v1.27 — one normalized analytics snapshot for every downstream module.
    // Journal remains the source of truth; Dashboard/Analytics/Performance/AI
    // can consume the same breakdowns instead of independently reinterpreting trades.
    refreshTradingBreakdowns() {
        const trades = Array.isArray(this.trades) ? this.trades : [];
        const groups = (keyFn) => {
            const map = {};
            trades.forEach(t => {
                const key = String(keyFn(t) || 'Unknown').trim() || 'Unknown';
                if (!map[key]) map[key] = { key, trades: 0, pnl: 0, rr: 0, wins: 0, losses: 0 };
                const g = map[key];
                const pnl = Number(t.pnl);
                const rr = Number(t.rr);
                g.trades += 1;
                if (Number.isFinite(pnl)) g.pnl += pnl;
                if (Number.isFinite(rr)) g.rr += rr;
                if (t.status === 'win') g.wins += 1;
                if (t.status === 'loss') g.losses += 1;
            });
            return Object.values(map).map(g => ({
                ...g,
                winRate: g.trades ? (g.wins / g.trades) * 100 : 0,
                avgRR: g.trades ? g.rr / g.trades : 0
            }));
        };
        const byAsset = groups(t => t.asset);
        const bySession = groups(t => t.session);
        const byStrategy = groups(t => t.strategy);
        const totalPnl = trades.reduce((sum, t) => { const n = Number(t.pnl); return sum + (Number.isFinite(n) ? n : 0); }, 0);
        const totalRR = trades.reduce((sum, t) => { const n = Number(t.rr); return sum + (Number.isFinite(n) ? n : 0); }, 0);
        const wins = trades.filter(t => t.status === 'win').length;
        const losses = trades.filter(t => t.status === 'loss').length;
        this.tradingAnalytics = {
            totalTrades: trades.length, totalPnl, totalRR, wins, losses,
            winRate: trades.length ? (wins / trades.length) * 100 : 0,
            byAsset, bySession, byStrategy,
            bestAsset: [...byAsset].sort((a,b) => b.pnl - a.pnl)[0] || null,
            bestSession: [...bySession].sort((a,b) => b.avgRR - a.avgRR)[0] || null,
            bestStrategy: [...byStrategy].sort((a,b) => b.pnl - a.pnl)[0] || null,
            generatedAt: new Date().toISOString()
        };
        return this.tradingAnalytics;
    },

    updateAnalyticsStats() {
        const total = this.trades.length;
        const banner = document.getElementById('analyticsEmptyBanner');
        const mainContent = document.getElementById('analyticsMainContent');
        if (banner) {
            banner.style.display = total === 0 ? 'flex' : 'none';
            if (total === 0) banner.innerHTML = `<div class="panel-empty-icon">📭</div><div class="panel-empty-title">${this.t('empty_analytics')}</div>`;
        }
        if (mainContent) mainContent.style.opacity = total === 0 ? '0.35' : '1';
        if (total === 0) {
            const elements = [this.aTotalPnl, this.aWinRate, this.aProfitFactor, this.aAvgRR, this.aTotalTrades, this.aWinningTrades, this.aLosingTrades, this.aAvgWin, this.aAvgLoss, this.aBestDay, this.aWorstDay, this.aBestTrade, this.aWorstTrade, this.aMaxWinStreak, this.aMaxLossStreak];
            elements.forEach(el => { if(el) el.textContent = '—'; });
            if(this.aTotalPnl) this.aTotalPnl.textContent = '+0.00 $';
            if(this.aTotalTrades) this.aTotalTrades.textContent = '0';
            return;
        }

        const stats = this.computeTradeStats(this.trades);
        const wins = stats.wins;
        const losses = stats.losses;
        const rrValues = this.trades.map(t => parseFloat(t.rr)).filter(v => !isNaN(v));
        const totalPnL = stats.totalPnL;
        const winRate = stats.winRate;
        const avgRR = stats.avgRR;
        const profitFactor = rrValues.filter(v => v > 0).reduce((a, b) => a + b, 0) / Math.abs(rrValues.filter(v => v < 0).reduce((a, b) => a + b, 0) || 1);
        const avgWin = rrValues.filter(v => v > 0).length > 0 ? rrValues.filter(v => v > 0).reduce((a, b) => a + b, 0) / rrValues.filter(v => v > 0).length : 0;
        const avgLoss = rrValues.filter(v => v < 0).length > 0 ? rrValues.filter(v => v < 0).reduce((a, b) => a + b, 0) / rrValues.filter(v => v < 0).length : 0;

        const dayMap = {};
        this.trades.forEach(t => {
            if(!dayMap[t.date]) dayMap[t.date] = 0;
            dayMap[t.date] += parseFloat(t.rr) || 0;
        });
        let bestDay = '—', worstDay = '—';
        if(Object.keys(dayMap).length > 0) {
            const sortedDays = Object.keys(dayMap).sort((a,b) => dayMap[b] - dayMap[a]);
            bestDay = sortedDays[0] + ' (' + (dayMap[sortedDays[0]] >= 0 ? '+' : '') + dayMap[sortedDays[0]].toFixed(1) + 'R)';
            worstDay = sortedDays[sortedDays.length-1] + ' (' + (dayMap[sortedDays[sortedDays.length-1]] >= 0 ? '+' : '') + dayMap[sortedDays[sortedDays.length-1]].toFixed(1) + 'R)';
        }

        let bestTrade = 0, worstTrade = 0;
        rrValues.forEach(v => {
            if (v > bestTrade) bestTrade = v;
            if (v < worstTrade) worstTrade = v;
        });

        let maxWinStreak = 0, maxLossStreak = 0, curWin = 0, curLoss = 0;
        this.trades.forEach(t => {
            if(t.status === 'win') { curWin++; curLoss = 0; if(curWin > maxWinStreak) maxWinStreak = curWin; }
            else if(t.status === 'loss') { curLoss++; curWin = 0; if(curLoss > maxLossStreak) maxLossStreak = curLoss; }
            else { curWin = 0; curLoss = 0; }
        });

        if (this.aTotalPnl) { this.aTotalPnl.textContent = (totalPnL >= 0 ? '+' : '') + totalPnL.toFixed(2) + ' $'; }
        if (this.aWinRate) { this.aWinRate.textContent = winRate.toFixed(1) + '%'; }
        if (this.aProfitFactor) { this.aProfitFactor.textContent = profitFactor.toFixed(2); }
        if (this.aAvgRR) { this.aAvgRR.textContent = avgRR.toFixed(1); }
        if (this.aTotalTrades) this.aTotalTrades.textContent = total;
        if (this.aWinningTrades) this.aWinningTrades.textContent = wins;
        if (this.aLosingTrades) this.aLosingTrades.textContent = losses;
        if (this.aAvgWin) { this.aAvgWin.textContent = '+' + avgWin.toFixed(1) + 'R'; }
        if (this.aAvgLoss) { this.aAvgLoss.textContent = '-' + Math.abs(avgLoss).toFixed(1) + 'R'; }
        if (this.aBestDay) this.aBestDay.textContent = bestDay;
        if (this.aWorstDay) this.aWorstDay.textContent = worstDay;
        if (this.aBestTrade) { this.aBestTrade.textContent = '+' + bestTrade.toFixed(1) + 'R'; }
        if (this.aWorstTrade) { this.aWorstTrade.textContent = '-' + Math.abs(worstTrade).toFixed(1) + 'R'; }
        if (this.aMaxWinStreak) this.aMaxWinStreak.textContent = maxWinStreak;
        if (this.aMaxLossStreak) this.aMaxLossStreak.textContent = maxLossStreak;
    },

    initAnalyticsCharts() {
        if (typeof Chart === 'undefined') return;
        if (this.analyticsEquityChart) {
            if (this.analyticsCharts.equity) this.analyticsCharts.equity.destroy();
            let cumulative = 0;
            const data = this.trades.map(t => {
                cumulative += parseFloat(t.rr) || 0;
                return cumulative;
            });
            const labels = this.trades.map((_, i) => '#' + (i+1));
            const ctx = this.analyticsEquityChart.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 180);
            gradient.addColorStop(0, 'rgba(124, 92, 252, 0.3)');
            gradient.addColorStop(1, 'rgba(124, 92, 252, 0)');
            this.analyticsCharts.equity = new Chart(this.analyticsEquityChart, {
                type: 'line', data: { labels: labels, datasets: [{ label: 'Equity (R)', data: data, borderColor: '#7c5cfc', backgroundColor: gradient, borderWidth: 3, pointRadius: 2, tension: 0.4, fill: true }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#8892a0', maxTicksLimit: 10 } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892a0' } } } }
            });
        }

        if (this.analyticsMonthlyChart) {
            if (this.analyticsCharts.monthly) this.analyticsCharts.monthly.destroy();
            const monthly = {};
            this.trades.forEach(t => {
                const month = t.date.slice(0, 7);
                if (!monthly[month]) monthly[month] = 0;
                monthly[month] += parseFloat(t.rr) || 0;
            });
            const sortedKeys = Object.keys(monthly).sort().slice(-6);
            const labels = sortedKeys;
            const data = sortedKeys.map(k => monthly[k]);
            this.analyticsCharts.monthly = new Chart(this.analyticsMonthlyChart, {
                type: 'bar', data: { labels: labels, datasets: [{ label: 'P&L (R)', data: data, backgroundColor: data.map(v => v >= 0 ? 'rgba(67, 198, 160, 0.7)' : 'rgba(239, 68, 68, 0.7)'), borderColor: data.map(v => v >= 0 ? '#43c6a0' : '#ef4444'), borderWidth: 2, borderRadius: 4 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#8892a0' } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892a0' } } } }
            });
        }

        if (this.analyticsAssetDonutChart) {
            if (this.analyticsCharts.asset) this.analyticsCharts.asset.destroy();
            const assetsMap = {};
            this.trades.forEach(t => { if(!assetsMap[t.asset]) assetsMap[t.asset] = 0; assetsMap[t.asset]++; });
            const labels = Object.keys(assetsMap);
            const data = Object.values(assetsMap);
            const colors = ['#7c5cfc', '#fbbf24', '#43c6a0', '#ef4444', '#f97316'];
            this.analyticsCharts.asset = new Chart(this.analyticsAssetDonutChart, {
                type: 'doughnut', data: { labels: labels, datasets: [{ data: data, backgroundColor: colors.slice(0, data.length), borderColor: '#13161c', borderWidth: 2 }] },
                options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: '#8892a0', font: { size: 11, family: 'Inter' }, padding: 12 } } } }
            });
        }
    },

    // ============================================================
    // PERFORMANCE
    // ============================================================
    updatePerformanceStats() {
        const analytics = this.refreshTradingBreakdowns();
        const total = analytics.totalTrades;
        const banner = document.getElementById('performanceEmptyBanner');
        const mainContent = document.getElementById('performanceMainContent');
        if (banner) {
            banner.style.display = total === 0 ? 'flex' : 'none';
            if (total === 0) banner.innerHTML = `<div class="panel-empty-icon">📭</div><div class="panel-empty-title">${this.t('empty_performance')}</div>`;
        }
        if (mainContent) mainContent.style.opacity = total === 0 ? '0.35' : '1';
        const rrValues = this.trades.map(t => parseFloat(t.rr)).filter(v => !isNaN(v));
        const totalReturn = rrValues.reduce((a, b) => a + b, 0);

        if (this.perfTotalReturn) this.perfTotalReturn.textContent = (totalReturn >= 0 ? '+' : '') + totalReturn.toFixed(1) + 'R';
        if (this.perfTotalTrades) this.perfTotalTrades.textContent = total;

        const monthly = {};
        this.trades.forEach(t => {
            const month = (t.date || '').slice(0, 7);
            if (!month) return;
            if (!monthly[month]) monthly[month] = 0;
            monthly[month] += parseFloat(t.rr) || 0;
        });
        const monthKeys = Object.keys(monthly);
        if (this.perfBestMonth) {
            this.perfBestMonth.textContent = monthKeys.length > 0
                ? monthKeys.reduce((best, k) => monthly[k] > monthly[best] ? k : best, monthKeys[0])
                : '—';
        }

        const sessionMap = { london: 'London', ny: 'New York', asia: 'Asian', sydney: 'Sydney' };
        const bestSession = analytics.bestSession;
        if (this.perfBestSession) this.perfBestSession.textContent = bestSession ? (sessionMap[bestSession.key] || bestSession.key) : '—';

        // v1.29 — performance must reflect the same normalized analytics snapshot
        // used by Journal/Analytics/Guardian/Coach.
        const bestAsset = analytics.bestAsset;
        const bestStrategy = analytics.bestStrategy;
        const perfAsset = document.getElementById('perfBestAsset');
        const perfStrategy = document.getElementById('perfBestStrategy');
        if (perfAsset) perfAsset.textContent = bestAsset ? `${bestAsset.key} · ${bestAsset.pnl >= 0 ? '+' : ''}${bestAsset.pnl.toFixed(2)} $` : '—';
        if (perfStrategy) perfStrategy.textContent = bestStrategy ? `${bestStrategy.key} · ${bestStrategy.pnl >= 0 ? '+' : ''}${bestStrategy.pnl.toFixed(2)} $` : '—';
    },

    initPerfEquityChart() {
        if (typeof Chart === 'undefined') return;
        if (!this.perfEquityChart) return;
        if (this.performanceCharts.equity) this.performanceCharts.equity.destroy();
        let cumulative = 0;
        const data = this.trades.map(t => { cumulative += parseFloat(t.rr) || 0; return cumulative; });
        const labels = this.trades.map((_, i) => '#' + (i + 1));
        const ctx = this.perfEquityChart.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 180);
        gradient.addColorStop(0, 'rgba(124, 92, 252, 0.3)');
        gradient.addColorStop(1, 'rgba(124, 92, 252, 0)');
        this.performanceCharts.equity = new Chart(this.perfEquityChart, {
            type: 'line',
            data: { labels: labels, datasets: [{ label: 'Equity (R)', data: data, borderColor: '#7c5cfc', backgroundColor: gradient, borderWidth: 3, pointRadius: 2, tension: 0.4, fill: true }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#8892a0', maxTicksLimit: 10 } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892a0' } } } }
        });
    },

    initPerfMonthlyChart() {
        if (typeof Chart === 'undefined') return;
        if (!this.perfMonthlyChart) return;
        if (this.performanceCharts.monthly) this.performanceCharts.monthly.destroy();
        const monthly = {};
        this.trades.forEach(t => {
            const month = (t.date || '').slice(0, 7);
            if (!month) return;
            if (!monthly[month]) monthly[month] = 0;
            monthly[month] += parseFloat(t.rr) || 0;
        });
        const sortedKeys = Object.keys(monthly).sort().slice(-6);
        const data = sortedKeys.map(k => monthly[k]);
        this.performanceCharts.monthly = new Chart(this.perfMonthlyChart, {
            type: 'bar',
            data: { labels: sortedKeys, datasets: [{ label: 'P&L (R)', data: data, backgroundColor: data.map(v => v >= 0 ? 'rgba(67, 198, 160, 0.7)' : 'rgba(239, 68, 68, 0.7)'), borderColor: data.map(v => v >= 0 ? '#43c6a0' : '#ef4444'), borderWidth: 2, borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#8892a0' } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892a0' } } } }
        });
    },

    initPerfSessionsChart() {
        if (typeof Chart === 'undefined') return;
        if (!this.perfSessionsChart) return;
        if (this.performanceCharts.sessions) this.performanceCharts.sessions.destroy();
        // Uses the real `session` field recorded on each trade (London/NY/Asian/Sydney)
        // rather than deriving an hour from a date-only string, which had no reliable
        // time-of-day information to begin with.
        const sessionLabels = { london: 'London', ny: 'New York', asia: 'Asian', sydney: 'Sydney' };
        const sessionTotals = { London: 0, 'New York': 0, Asian: 0, Sydney: 0 };
        this.trades.forEach(t => {
            const label = sessionLabels[t.session];
            if (label) sessionTotals[label] += parseFloat(t.rr) || 0;
        });
        const labels = Object.keys(sessionTotals);
        const data = Object.values(sessionTotals);
        this.performanceCharts.sessions = new Chart(this.perfSessionsChart, {
            type: 'bar',
            data: { labels: labels, datasets: [{ label: 'P&L по сессиям (R)', data: data, backgroundColor: data.map(v => v >= 0 ? 'rgba(124, 92, 252, 0.7)' : 'rgba(239, 68, 68, 0.7)'), borderColor: data.map(v => v >= 0 ? '#7c5cfc' : '#ef4444'), borderWidth: 2, borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#8892a0' } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892a0' } } } }
        });
    },

    // Alias kept for the chart.js reinit helper, which calls initRiskChart() when guardianCharts is populated.
    initRiskChart() {
        this.initGuardianChart();
    },

    // ============================================================
    // AI ASSISTANT
    // ============================================================
    renderAIWelcome() {
        if (!this.aiMessages) return;
        const name = this.userData.name || 'Трейдер';
        const en = this.currentLang === 'en';
        const today = kdLocalDateKey();
        const todayTrades = this.trades.filter(t => t.date === today);
        const totalToday = todayTrades.length;
        const winsToday = todayTrades.filter(t => t.status === 'win').length;
        const wrToday = totalToday > 0 ? Math.round((winsToday / totalToday) * 100) : 0;
        const lastTrade = this.trades.length > 0 ? this.trades[0].result : '—';
        const violations = (this.guardianRules || []).filter(r => !r.passed).length;
        const disciplineLabel = this.trades.length === 0 ? (en ? 'No data yet' : 'Пока нет данных')
            : (violations === 0 ? (en ? 'Good' : 'Хорошая') : (en ? `${violations} flagged` : `${violations} нарушений`));
        const disciplineColor = this.trades.length === 0 ? 'var(--text-secondary)' : (violations === 0 ? 'var(--brand-green)' : 'var(--brand-red)');

        let html = `
            <div class="ai-msg-wrapper ai">
                <div class="ai-msg-avatar">AI</div>
                <div class="ai-msg-bubble">
                    <div class="ai-welcome-card">
                        <h2>${en ? 'Welcome' : 'Добро пожаловать'}, <strong>${this.escapeHtml(name)}</strong> 👋</h2>
                        <p style="color:var(--text-secondary); font-size:14px;">${en ? 'Your personal AI Trading Coach is ready.' : 'Ваш персональный AI-коуч готов помочь.'}</p>
                        <div class="stats-grid">
                            <div class="stat-line"><span>📊 ${en ? 'Trades today' : 'Сделок сегодня'}</span><span>${totalToday}</span></div>
                            <div class="stat-line"><span>🎯 Win Rate</span><span class="highlight">${totalToday > 0 ? wrToday + '%' : '—'}</span></div>
                            <div class="stat-line"><span>⚡ ${en ? 'Discipline' : 'Дисциплина'}</span><span style="color:${disciplineColor};">${disciplineLabel}</span></div>
                            <div class="stat-line"><span>🚀 ${en ? 'Last trade' : 'Последняя сделка'}</span><span class="highlight">${this.escapeHtml(lastTrade)}</span></div>
                        </div>
                        <p style="color:var(--text-secondary); font-size:13px; margin-top:12px;">${en ? 'Pick a prompt below or ask me anything.' : 'Выберите действие ниже или задайте вопрос.'}</p>
                    </div>
                </div>
            </div>
        `;
        this.aiMessages.innerHTML = html;
        this.scrollToBottom();
    },

    renderAIHistory() {
        if (!this.aiMessages) return;
        let html = '';
        this.aiHistory.forEach(msg => {
            const cls = msg.role === 'user' ? 'user' : 'ai';
            const avatar = msg.role === 'user' ? (this.currentLang === 'en' ? 'You' : 'Вы') : 'AI';
            const messageContent = msg.role === 'user'
                ? this.escapeHtml(msg.content)
                : msg.content;
            html += `
                <div class="ai-msg-wrapper ${cls}">
                    <div class="ai-msg-avatar">${avatar}</div>
                    <div class="ai-msg-bubble">${messageContent}</div>
                </div>
            `;
        });
        this.aiMessages.innerHTML = html;
        this.scrollToBottom();
    },

    // ============================================================
    // AI COACH — response engine
    // ------------------------------------------------------------
    // No external LLM call is wired up yet (this is a static front-end
    // app with no backend), so this is a topic-aware, rule-based coach:
    // it detects intent from keywords, then always grounds its answer
    // in the user's REAL journal data (win rate, RR, Guardian rule
    // status, sessions, streaks) rather than a fixed pool of unrelated
    // canned sentences. It never generates Buy/Sell signals or market
    // predictions — every branch below is either a coaching question,
    // a stats readout, or general risk/psychology education.
    //
    // To upgrade this to a real LLM-backed coach later: swap
    // `this.generateCoachReply(question)` below for an async call to
    // your inference endpoint, passing the same `stats` object as
    // context so responses stay grounded in the user's real journal.
    // ============================================================
    getCoachStats() {
        const baseStats = this.computeTradeStats(this.trades);
        const total = baseStats.total;
        const wins = baseStats.wins;
        const losses = baseStats.losses;
        const winRate = total > 0 ? Math.round(baseStats.winRate) : null;
        const avgRR = baseStats.total ? baseStats.avgRR : null;
        let curLoss = 0, maxLossStreak = 0, curWin = 0, maxWinStreak = 0;
        this.trades.forEach(t => {
            if (t.status === 'loss') { curLoss++; curWin = 0; maxLossStreak = Math.max(maxLossStreak, curLoss); }
            else if (t.status === 'win') { curWin++; curLoss = 0; maxWinStreak = Math.max(maxWinStreak, curWin); }
            else { curWin = 0; curLoss = 0; }
        });
        // current (most recent) streak, using the natural array order (newest first, per submitTradeForm unshift)
        let recentStreak = 0, recentType = null;
        for (const t of this.trades) {
            if (t.status !== 'win' && t.status !== 'loss') break;
            if (recentType === null) { recentType = t.status; recentStreak = 1; }
            else if (t.status === recentType) recentStreak++;
            else break;
        }
        const violations = (this.guardianRules || []).filter(r => !r.passed);
        const sessionLabels = { london: 'London', ny: 'New York', asia: 'Asian', sydney: 'Sydney' };
        const bestSession = (() => {
            const totals = {};
            this.trades.forEach(t => {
                if (!t.session) return;
                if (!totals[t.session]) totals[t.session] = { rr: 0, count: 0 };
                totals[t.session].rr += parseFloat(t.rr) || 0;
                totals[t.session].count++;
            });
            const entries = Object.entries(totals);
            if (!entries.length) return null;
            entries.sort((a, b) => (b[1].rr / b[1].count) - (a[1].rr / a[1].count));
            return { label: sessionLabels[entries[0][0]] || entries[0][0], avgRR: entries[0][1].rr / entries[0][1].count };
        })();
        const analytics = this.refreshTradingBreakdowns();
        const risk = this.getRiskEngineSnapshot(this.trades);
        return {
            total, wins, losses, winRate, avgRR, maxWinStreak, maxLossStreak, recentStreak, recentType, violations, bestSession,
            risk,
            totalPnL: analytics.totalPnl,
            bestAsset: analytics.bestAsset,
            bestStrategy: analytics.bestStrategy,
            byAsset: analytics.byAsset,
            bySession: analytics.bySession,
            byStrategy: analytics.byStrategy
        };
    },

    getMarketContextForAI() {
        const mode = this.marketMode === 'forex' ? 'forex' : 'crypto';
        try {
            const cached = JSON.parse(localStorage.getItem(this.getScopedStorageKey('market_cache')) || 'null');
            if (!cached?.results?.length) return { mode, available: false, stale: true, ageMinutes: null, assets: [] };
            const savedAt = Number(cached.savedAt);
            const ageMinutes = Number.isFinite(savedAt) ? Math.max(0, Math.floor((Date.now() - savedAt) / 60000)) : null;
            const cacheMode = cached.mode === 'forex' ? 'forex' : 'crypto';
            if (cacheMode !== mode) return { mode, available: false, stale: true, ageMinutes, assets: [] };
            const assets = cached.results.map(t => ({
                symbol: this.marketDisplayName(t, mode),
                price: Number(t.lastPrice),
                change24h: Number(t.priceChangePercent),
                high24h: Number(t.highPrice),
                low24h: Number(t.lowPrice)
            })).filter(x => Number.isFinite(x.price));
            return { mode, available: assets.length > 0, stale: ageMinutes === null || ageMinutes > 30, ageMinutes, savedAt, assets };
        } catch (_) {
            return { mode, available: false, stale: true, ageMinutes: null, assets: [] };
        }
    },

    getIntegratedContext() {
        const stats = this.getCoachStats();
        const marketContext = this.getMarketContextForAI();
        const market = marketContext.assets.map(t => ({
            ...t,
            savedAt: marketContext.savedAt
        }));
        const recent = [...this.trades].slice(0, 5).map(t => ({
            asset: t.asset, direction: t.direction, status: t.status,
            pnl: Number(t.pnl) || 0, rr: Number(t.rr) || 0,
            session: t.session || '—', strategy: t.strategy || '—'
        }));
        return { stats, market, marketContext, recent };
    },

    renderIntegratedCoachContext() {
        const el = document.getElementById('aiContextSnapshot');
        if (!el) return;
        const c = this.getIntegratedContext();
        if (!c.stats.total) {
            el.innerHTML = '<span class="coach-context-empty">Нет сделок — AI Coach ждёт первую запись в Journal.</span>';
            return;
        }
        const m = c.market?.[0];
        const mc = c.marketContext || {};
        const modeLabel = mc.mode === 'forex' ? 'Forex' : 'Crypto';
        const freshness = mc.available ? (mc.stale ? 'устарел' : `${mc.ageMinutes ?? 0} мин`) : 'не синхронизирован';
        const marketText = m ? `${m.symbol} ${m.change24h >= 0 ? '+' : ''}${m.change24h.toFixed(2)}% · ${modeLabel} · ${freshness}` : `${modeLabel} · ${freshness}`;
        el.innerHTML = `<span>Journal: <b>${c.stats.total}</b> сделок</span><span>Win Rate: <b>${c.stats.winRate ?? '—'}%</b></span><span>Avg RR: <b>${c.stats.avgRR === null ? '—' : (c.stats.avgRR >= 0 ? '+' : '') + c.stats.avgRR.toFixed(2) + 'R'}</b></span><span>Max DD: <b>${kdMaxDrawdownPercent(this.trades, this.userData?.capital).toFixed(2)}%</b></span><span>Market: <b>${this.escapeHtml(marketText)}</b></span>`;
    },

    // Very small keyword-based intent classifier. Order matters — first match wins.
    classifyCoachIntent(question) {
        const q = question.toLowerCase();
        const has = (words) => words.some(w => q.includes(w));
        if (has(['sell', 'buy', 'продавать', 'покупать', 'сигнал', 'signal', 'куда пойдет', 'вырастет', 'упадет', 'прогноз', 'predict'])) return 'signal_request';
        if (has(['ошиб', 'mistake', 'error'])) return 'mistakes';
        if (has(['психолог', 'psycholog', 'эмоц', 'emotion', 'страх', 'fear', 'жадност', 'greed'])) return 'psychology';
        if (has(['плечо', 'leverage', 'маржа', 'margin', 'ликвидац', 'liquidat'])) return 'leverage';
        if (has(['размер позиции', 'position size', 'лот', 'notional', 'номинал'])) return 'position_size';
        if (has(['риск', 'risk', '管理'])) return 'risk';
        if (has(['дисциплин', 'disciplin'])) return 'discipline';
        if (has(['стратег', 'strateg'])) return 'strategy';
        if (has(['журнал', 'journal', 'сегодня', 'today', 'проанализ', 'analy'])) return 'journal_review';
        if (has(['сессия', 'session', 'время', 'best time', 'лучшее время'])) return 'session';
        if (has(['статист', 'stat', 'win rate', 'winrate', 'рекоменд', 'recommend'])) return 'stats';
        return 'general';
    },

    generateCoachReply(question) {
        const en = this.currentLang === 'en';
        const s = this.getCoachStats();
        const intent = this.classifyCoachIntent(question);
        const name = this.userData.name || (en ? 'trader' : 'трейдер');

        if (intent === 'signal_request') {
            return en
                ? "I don't give Buy/Sell signals and I don't predict where the market is going — that's outside what I do. What I <em>can</em> help with: does the setup you're looking at match the rules in your own strategy? Walk me through your entry criteria and I'll help you check it against your plan."
                : "Я не даю сигналы Buy/Sell и не предсказываю движение рынка — это не моя задача. Но я могу помочь с другим: подходит ли сетап, который вы рассматриваете, под правила вашей собственной стратегии? Опишите критерии входа — разберём вместе, соответствует ли он вашему плану.";
        }

        if (s.total === 0) {
            return en
                ? `You haven't logged any trades yet, ${name}, so I don't have anything real to analyze. Once you add a few trades in the Journal, I can talk through your win rate, RR, and discipline patterns with actual numbers instead of guesses.`
                : `Пока в журнале нет сделок, ${name}, поэтому мне не с чем работать по-настоящему. Добавьте несколько сделок в Journal — и я смогу говорить о вашем Win Rate, RR и дисциплине на основе реальных цифр, а не догадок.`;
        }

        switch (intent) {
            case 'mistakes': {
                if (s.maxLossStreak >= 3) {
                    return en
                        ? `Looking at your journal, your longest losing streak is ${s.maxLossStreak} trades in a row. That's usually where discipline slips — revenge sizing, skipping the plan, or forcing a setup. Check your notes on those trades: were the entries actually valid, or did you break your own rules to get in?`
                        : `По вашему журналу самая длинная серия убытков — ${s.maxLossStreak} сделок подряд. Обычно именно в такие моменты дисциплина проседает — увеличение риска "на отыгрыш", пропуск плана, вход без сетапа. Посмотрите заметки по этим сделкам: вход действительно был по правилам, или вы их нарушили?`;
                }
                return en
                    ? `Your loss streaks are short so far (max ${s.maxLossStreak}), which is a good sign for discipline. If you want to find real mistakes, open the Journal and filter by "Loss" — check whether your emotion-before field says calm on those, or something else.`
                    : `Серии убытков у вас пока короткие (максимум ${s.maxLossStreak} подряд) — это хороший знак для дисциплины. Чтобы найти реальные ошибки, откройте Journal и отфильтруйте по "Убыток" — посмотрите, что вы отмечали в поле эмоций перед этими сделками.`;
            }
            case 'psychology': {
                return en
                    ? `Psychology shows up in your data more than people expect. Right now you're on a ${s.recentStreak > 0 ? s.recentStreak + '-trade ' + (s.recentType === 'win' ? 'winning' : 'losing') + ' streak' : 'mixed run'}. ${s.recentType === 'loss' && s.recentStreak >= 2 ? 'After a losing streak, the biggest risk is forcing the next trade to "get it back." Consider taking a short break before your next entry.' : s.recentType === 'win' && s.recentStreak >= 3 ? 'After a winning streak, overconfidence tends to creep in — watch your position sizing on the next trade.' : 'Log how you feel before and after each trade in the Journal so we can spot patterns over time.'}`
                    : `Психология заметнее в данных, чем кажется. Сейчас у вас ${s.recentStreak > 0 ? s.recentStreak + ' сделк' + (s.recentStreak === 1 ? 'а' : 'и') + ' подряд в ' + (s.recentType === 'win' ? 'плюс' : 'минус') : 'смешанная динамика'}. ${s.recentType === 'loss' && s.recentStreak >= 2 ? 'После серии убытков главный риск — форсировать следующую сделку, чтобы "отыграться". Возможно, стоит сделать паузу перед следующим входом.' : s.recentType === 'win' && s.recentStreak >= 3 ? 'После серии побед часто подкрадывается излишняя уверенность — проверьте размер позиции на следующей сделке.' : 'Отмечайте своё состояние до и после каждой сделки в Journal — так мы сможем отследить закономерности со временем.'}`;
            }
            case 'position_size': {
                const capital = this.userData.capital;
                const risk = this.userData.risk;
                return en
                    ? `Position size should come FROM your risk, not the other way around: Max risk ($) = Capital × Risk %, then Position size = Max risk ÷ Stop distance.${(capital && risk) ? ` With your configured capital ($${capital}) and risk (${risk}%), your max planned loss per trade is about $${(capital * risk / 100).toFixed(2)} — before fees, slippage, or funding.` : ' Set your capital and risk % in Settings and I can use your real numbers here.'} There's a full worked example and a live calculator in Academy → Position Size.`
                    : `Размер позиции должен вытекать ИЗ вашего риска, а не наоборот: Максимальный риск ($) = Капитал × Риск %, затем Размер позиции = Максимальный риск ÷ Расстояние до стопа.${(capital && risk) ? ` С вашими текущими настройками (капитал $${capital}, риск ${risk}%) максимальный запланированный убыток на сделку — около $${(capital * risk / 100).toFixed(2)}, до учёта комиссий, проскальзывания и funding.` : ' Укажите капитал и риск % в Настройках — тогда я смогу использовать ваши реальные цифры.'} Полный разбор с примером и живым калькулятором есть в Академии → Размер позиции.`;
            }
            case 'leverage': {
                return en
                    ? `Leverage changes your margin requirement, not your allowed risk. If your risk per trade is set to 1% of capital, that stays true whether you use 2x or 20x leverage — leverage just lets you control the same notional position with less margin locked up. The real danger is using extra leverage to open a BIGGER position than your risk rules allow, which brings liquidation closer. Academy → Leverage has the full breakdown with a worked example.`
                    : `Плечо меняет требование к марже, а не ваш допустимый риск. Если риск на сделку настроен на 1% капитала, это остаётся верным и при плече 2x, и при 20x — плечо просто позволяет контролировать ту же номинальную позицию, заморозив меньше маржи. Реальная опасность — использовать дополнительное плечо, чтобы открыть БОЛЬШУЮ позицию сверх ваших правил риска, что приближает ликвидацию. Полный разбор с примером — в Академии → Плечо.`;
            }
            case 'risk': {
                const risk = this.userData.risk;
                return en
                    ? `Your declared risk per trade is ${risk ? risk + '%' : 'not set yet'}. The core rule most disciplined traders follow: never risk more on one idea than you're willing to lose on ${risk ? Math.round(100 / risk) : '~20-50'} trades in a row going wrong. If you've been sizing up after losses to "catch up," that's the fastest way to blow through a daily loss limit — Guardian is there to flag exactly that.`
                    : `Ваш заявленный риск на сделку — ${risk ? risk + '%' : 'ещё не задан'}. Базовое правило дисциплинированных трейдеров: никогда не рисковать на одной идее больше, чем вы готовы потерять на ${risk ? Math.round(100 / risk) : '~20-50'} подряд неудачных сделках. Если вы увеличивали размер после убытков, чтобы "отыграться" — это самый быстрый способ пробить дневной лимит убытка. Именно это отслеживает Guardian.`;
            }
            case 'discipline': {
                if (s.violations.length > 0) {
                    return en
                        ? `Guardian currently shows ${s.violations.length} rule${s.violations.length === 1 ? '' : 's'} not being met — top one: "${s.violations[0].name}". Discipline isn't about never breaking a rule, it's about noticing fast and correcting course. Want to open Guardian and go through them one by one?`
                        : `Guardian сейчас показывает ${s.violations.length} нарушени${s.violations.length === 1 ? 'е' : 'я'} — первое: "${s.violations[0].name}". Дисциплина — это не про "никогда не нарушать", а про быстро замечать и исправлять. Хотите открыть Guardian и разобрать их по порядку?`;
                }
                return en
                    ? `Guardian isn't flagging any violations right now — that's a solid foundation. Discipline compounds: the goal isn't a perfect day, it's a long streak of "good enough" days.`
                    : `Guardian сейчас не фиксирует нарушений — хорошая база. Дисциплина работает как сложный процент: цель не в идеальном дне, а в длинной серии "достаточно хороших" дней.`;
            }
            case 'strategy': {
                const strat = this.userData.strategy;
                return en
                    ? (strat
                        ? `Here's the strategy you described during onboarding: "${strat.slice(0, 220)}${strat.length > 220 ? '…' : ''}". I can't tell you if a specific trade will work, but I can help you check whether your logged trades actually follow it — want to review your last few Journal entries against these criteria?`
                        : `You haven't described your strategy yet — add it in Settings → Trading Profile, or during onboarding. Once it's written down, I can help you check whether your real trades are actually following it.`)
                    : (strat
                        ? `Вот стратегия, которую вы описали при онбординге: «${strat.slice(0, 220)}${strat.length > 220 ? '…' : ''}». Я не скажу, сработает ли конкретная сделка, но помогу проверить, действительно ли ваши записанные сделки следуют этой стратегии — разберём последние записи в Journal?`
                        : `Вы ещё не описали свою стратегию — добавьте её в Settings → Торговый профиль. Как только она будет зафиксирована, я смогу помочь проверить, действительно ли ваши реальные сделки ей соответствуют.`);
            }
            case 'session': {
                if (!s.bestSession) {
                    return en ? "I don't have enough session data yet — log the session for each trade and I'll be able to compare them." : "Пока недостаточно данных по сессиям — указывайте сессию в каждой сделке, и я смогу их сравнить.";
                }
                return en
                    ? `Based on your journal, your ${s.bestSession.label} session trades average ${(s.bestSession.avgRR >= 0 ? '+' : '')}${s.bestSession.avgRR.toFixed(1)}R — your best so far. That doesn't guarantee anything going forward, but it's worth noticing if that's also where you feel most prepared.`
                    : `По вашему журналу лучше всего пока идёт сессия ${s.bestSession.label} — средний результат ${(s.bestSession.avgRR >= 0 ? '+' : '')}${s.bestSession.avgRR.toFixed(1)}R. Это не гарантия на будущее, но стоит обратить внимание, совпадает ли это с сессией, где вы чувствуете себя увереннее всего.`;
            }
            case 'journal_review':
            case 'stats':
            default: {
                const wrText = s.winRate !== null ? s.winRate + '%' : '—';
                const rrText = s.avgRR !== null ? (s.avgRR >= 0 ? '+' : '') + s.avgRR.toFixed(1) + 'R' : '—';
                const integrated = this.getIntegratedContext();
                const marketText = integrated.market?.length ? ` Current market context: ${integrated.market.map(m => `${m.symbol} ${m.change24h >= 0 ? '+' : ''}${m.change24h.toFixed(2)}% 24h`).join(', ')}. I use that only as context, not as a prediction or signal.` : '';
                return en
                    ? `Here's where you stand: ${s.total} logged trades, ${wrText} win rate, average ${rrText} per trade.${marketText} ${s.violations.length > 0 ? `Guardian is flagging ${s.violations.length} rule${s.violations.length === 1 ? '' : 's'} right now.` : 'Guardian shows no active rule violations.'} Ask me about your risk management, psychology, or strategy and I'll dig into the specifics.`
                    : `Вот ваша текущая картина: ${s.total} сделок в журнале, Win Rate ${wrText}, средний результат ${rrText} на сделку. ${s.violations.length > 0 ? `Guardian сейчас отмечает ${s.violations.length} нарушени${s.violations.length === 1 ? 'е' : 'я'}.` : 'Guardian не фиксирует активных нарушений.'} Спросите меня про риск-менеджмент, психологию или стратегию — разберём подробнее.`;
            }
        }
    },

    // ============================================================
    // AI COACH — REAL LLM GATEWAY
    // ------------------------------------------------------------
    // The browser never receives the OpenAI API key. It calls our
    // same-origin /api/coach endpoint, which keeps the key server-side.
    // The existing rule-based engine remains as a safe local fallback.
    // ============================================================
    getCoachClientId() {
        try {
            let id = localStorage.getItem(this.getScopedStorageKey('ai_client_id'));
            if (!id) {
                id = (globalThis.crypto?.randomUUID?.() || ('kd-' + Date.now().toString(36)));
                localStorage.setItem(this.getScopedStorageKey('ai_client_id'), id);
            }
            return id;
        } catch (_) {
            return 'kd-anonymous';
        }
    },

    getCoachApiPayload(question) {
        const context = this.getIntegratedContext();
        const history = (this.aiHistory || []).slice(-16).map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: String(m.content || '').slice(0, 5000)
        }));
        return {
            message: question.slice(0, 8000),
            history,
            context: {
                language: this.currentLang,
                user: {
                    name: this.userData?.name || null,
                    strategy: this.userData?.strategy || null,
                    capital: Number(this.userData?.capital) || null,
                    risk: Number(this.userData?.risk) || null,
                    dailyLoss: Number(this.userData?.dailyLoss) || null,
                    dailyTarget: Number(this.userData?.dailyTarget) || null,
                    rr: Number(this.userData?.rr) || null,
                    session: this.userData?.session || null,
                    markets: this.userData?.markets || null,
                    assets: this.userData?.assets || null
                },
                journal: context.stats,
                recentTrades: context.recent,
                market: context.market || [],
                marketContext: context.marketContext || { mode: this.marketMode === 'forex' ? 'forex' : 'crypto', available: false, stale: true }
            },
            clientId: this.getCoachClientId()
        };
    },

    async requestRealCoach(question) {
        const response = await fetch('/api/coach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.getCoachApiPayload(question))
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data?.error || `AI Coach API error (${response.status})`);
        }
        if (!data?.reply) throw new Error('AI Coach вернул пустой ответ.');
        return data.reply;
    },

    async handleAIQuery() {
        const question = this.aiInput?.value?.trim();
        if (!question) return;
        this.appendMessage('user', question);
        this.aiInput.value = '';
        this.showTypingIndicator();

        try {
            const reply = await this.requestRealCoach(question);
            this.hideTypingIndicator();
            this.appendMessage('ai', reply);
        } catch (error) {
            console.warn('Real AI Coach unavailable:', error);
            const fallback = this.generateCoachReply(question);
            const en = this.currentLang === 'en';
            const notice = en
                ? `<div class=\"coach-api-notice\">Local Coach mode: the AI gateway is temporarily unavailable.</div>`
                : `<div class=\"coach-api-notice\">Локальный режим: AI-шлюз временно недоступен. После подключения backend ответы будут генерироваться реальной моделью.</div>`;
            this.hideTypingIndicator();
            this.appendMessage('ai', notice + fallback);
        }
    },

    appendMessage(role, content) {
        const cls = role === 'user' ? 'user' : 'ai';
        const avatar = role === 'user' ? (this.currentLang === 'en' ? 'You' : 'Вы') : 'AI';
        // User-provided chat text must never be interpreted as markup. AI replies
        // retain their existing trusted formatting.
        const messageContent = role === 'user'
            ? this.escapeHtml(content)
            : content;
        this.aiHistory.push({ role, content });
        this.saveState();
        this.hideTypingIndicator();
        const html = `
            <div class="ai-msg-wrapper ${cls}">
                <div class="ai-msg-avatar">${avatar}</div>
                <div class="ai-msg-bubble">${messageContent}</div>
            </div>
        `;
        this.aiMessages.insertAdjacentHTML('beforeend', html);
        this.scrollToBottom();
    },

    showTypingIndicator() {
        this.hideTypingIndicator();
        const indicator = document.createElement('div');
        indicator.className = 'ai-typing-indicator';
        indicator.id = 'aiTypingIndicator';
        indicator.innerHTML = `
            <div class="ai-msg-avatar">AI</div>
            <div class="ai-typing-dots">
                <span></span><span></span><span></span>
            </div>
        `;
        this.aiMessages.appendChild(indicator);
        this.scrollToBottom();
    },

    hideTypingIndicator() {
        const el = document.getElementById('aiTypingIndicator');
        if (el) el.remove();
    },

    clearChat() {
        if (this.aiHistory.length === 0) return;
        if (!confirm('Очистить историю диалога?')) return;
        this.aiHistory = [];
        this.saveState();
        this.renderAIWelcome();
    },

    scrollToBottom() {
        const area = document.getElementById('aiChatArea');
        if (area) {
            setTimeout(() => {
                area.scrollTop = area.scrollHeight;
            }, 50);
        }
    },

    // ============================================================
    // RISK ENGINE — one source of truth for Guardian + AI Coach
    // ============================================================
    getRiskEngineSnapshot(trades = this.trades) {
        const list = Array.isArray(trades) ? trades : [];
        const riskLimit = Number.parseFloat(this.userData?.risk);
        const configuredRisk = Number.isFinite(riskLimit) && riskLimit > 0 ? riskLimit : 1;
        const dailyLimitRaw = Number.parseFloat(this.userData?.dailyLoss);
        const dailyLossLimit = Number.isFinite(dailyLimitRaw) && dailyLimitRaw > 0 ? dailyLimitRaw : null;
        const maxTradesRaw = Number.parseInt(this.userData?.maxTradesPerDay, 10);
        const maxTradesPerDay = Number.isFinite(maxTradesRaw) && maxTradesRaw >= 1 ? Math.min(maxTradesRaw, 50) : 5;
        const negativeEmotions = new Set(['greed', 'fear', 'revenge', 'anxious']);
        const byDay = {};
        list.forEach(t => {
            const day = String(t?.date || '').slice(0, 10);
            if (!day) return;
            if (!byDay[day]) byDay[day] = [];
            byDay[day].push(t);
        });
        const days = Object.keys(byDay).sort();
        const latestDay = days[days.length - 1] || null;
        const latestTrades = latestDay ? byDay[latestDay] : [];
        const latestLoss = latestTrades.reduce((sum, t) => {
            const pnl = Number(t?.pnl);
            return sum + (Number.isFinite(pnl) && pnl < 0 ? Math.abs(pnl) : 0);
        }, 0);
        const riskValues = list.map(t => Number(t?.riskPercent)).filter(Number.isFinite);
        const maxRisk = riskValues.length ? Math.max(...riskValues) : null;
        const riskViolations = list.filter(t => Number.isFinite(Number(t?.riskPercent)) && Number(t.riskPercent) > configuredRisk);
        const dailyLossViolations = Object.entries(byDay).filter(([, dayTrades]) => {
            if (!dailyLossLimit) return false;
            const loss = dayTrades.reduce((sum, t) => {
                const pnl = Number(t?.pnl);
                return sum + (Number.isFinite(pnl) && pnl < 0 ? Math.abs(pnl) : 0);
            }, 0);
            return loss > dailyLossLimit;
        }).map(([date, dayTrades]) => ({
            date,
            loss: dayTrades.reduce((sum, t) => {
                const pnl = Number(t?.pnl);
                return sum + (Number.isFinite(pnl) && pnl < 0 ? Math.abs(pnl) : 0);
            }, 0)
        }));
        const overtradeDays = Object.entries(byDay).filter(([, dayTrades]) => dayTrades.length > maxTradesPerDay)
            .map(([date, dayTrades]) => ({ date, count: dayTrades.length }));
        const emotionViolations = list.filter(t => negativeEmotions.has(String(t?.emotionBefore || '').toLowerCase()));
        const missingPlan = list.filter(t => !String(t?.strategy || '').trim());
        const missingSL = list.filter(t => {
            const candidates = [t?.stopLoss, t?.sl, t?.stop_loss, t?.stop];
            return candidates.every(v => v === undefined || v === null || String(v).trim() === '');
        });
        let curLoss = 0, maxLossStreak = 0;
        let curWin = 0, maxWinStreak = 0;
        list.forEach(t => {
            if (t?.status === 'loss') { curLoss++; curWin = 0; maxLossStreak = Math.max(maxLossStreak, curLoss); }
            else if (t?.status === 'win') { curWin++; curLoss = 0; maxWinStreak = Math.max(maxWinStreak, curWin); }
            else { curLoss = 0; curWin = 0; }
        });
        const latestRiskPassed = riskValues.length ? riskValues.every(v => v <= configuredRisk) : null;
        const latestDailyLossPassed = dailyLossLimit ? latestLoss <= dailyLossLimit : null;
        const latestOvertradePassed = latestDay ? latestTrades.length <= maxTradesPerDay : null;
        const latestEmotionPassed = latestTrades.some(t => t?.emotionBefore)
            ? latestTrades.every(t => !negativeEmotions.has(String(t.emotionBefore || '').toLowerCase()))
            : null;
        const latestPlanPassed = latestTrades.length ? latestTrades.every(t => String(t?.strategy || '').trim()) : null;
        const hasStopLossData = list.some(t => ['stopLoss','sl','stop_loss','stop'].some(k => t?.[k] !== undefined && t?.[k] !== null && String(t[k]).trim() !== ''));
        const latestStopLossPassed = hasStopLossData ? latestTrades.every(t => ['stopLoss','sl','stop_loss','stop'].some(k => t?.[k] !== undefined && t?.[k] !== null && String(t[k]).trim() !== '')) : null;
        const violations = [];
        const add = (code, severity, title, detail, count=1) => violations.push({ code, severity, title, detail, count });
        if (riskViolations.length) add('risk_per_trade', 'high', 'Риск на сделку превышен', `${riskViolations.length} сделок выше лимита ${configuredRisk}%`, riskViolations.length);
        if (dailyLossViolations.length) add('daily_loss', 'critical', 'Дневной лимит убытка превышен', `${dailyLossViolations.length} торговых дней выше лимита`, dailyLossViolations.length);
        if (overtradeDays.length) add('overtrading', 'medium', 'Слишком много сделок за день', `${overtradeDays.length} дней с более чем ${maxTradesPerDay} сделками`, overtradeDays.length);
        if (emotionViolations.length) add('emotion', 'high', 'Эмоциональная торговля', `${emotionViolations.length} сделок отмечены как эмоциональные`, emotionViolations.length);
        if (missingPlan.length) add('missing_plan', 'medium', 'Не указана стратегия', `${missingPlan.length} сделок без стратегии`, missingPlan.length);
        if (hasStopLossData && missingSL.length) add('missing_stop_loss', 'high', 'Не указан Stop Loss', `${missingSL.length} сделок без Stop Loss`, missingSL.length);
        if (maxLossStreak >= 3) add('loss_streak', 'medium', 'Серия убытков', `Максимальная серия: ${maxLossStreak}`, maxLossStreak);
        return {
            configuredRisk, dailyLossLimit, maxTradesPerDay, latestDay,
            latestTradeCount: latestTrades.length, latestLoss,
            maxRisk, maxLossStreak, maxWinStreak,
            riskViolations, dailyLossViolations, overtradeDays, emotionViolations, missingPlan, missingSL,
            violations,
            checks: {
                risk: riskValues.length ? latestRiskPassed : null,
                overtrading: latestOvertradePassed,
                stopLoss: latestStopLossPassed,
                dailyLoss: latestDailyLossPassed,
                emotions: latestEmotionPassed,
                plan: latestPlanPassed
            },
            generatedAt: new Date().toISOString()
        };
    },

    // ============================================================
    // GUARDIAN
    // ============================================================
    updateGuardianStats() {
        const en = this.currentLang === 'en';
        const total = this.trades.length;
        if (total === 0) {
            if (this.guardianScore) this.guardianScore.textContent = '—';
            if (this.guardianDayStatus) this.guardianDayStatus.textContent = en ? 'No data' : 'Нет данных';
            if (this.guardianStreak) this.guardianStreak.textContent = en ? '0 days' : '0 дней';
            if (this.guardianHistoryCount) this.guardianHistoryCount.textContent = '0';
            // Rules themselves must also reset to a neutral "no data" state — not just
            // the summary numbers — so a subsequent renderGuardianRules() call (e.g.
            // triggered by a language switch) can never re-draw a stale "✅ Passed"
            // rule card from before the trades were cleared. `passed: true` here means
            // "not a proven violation" (mirroring the >0-trades branch's nodata
            // handling below) — it does NOT mean "compliant"; renderGuardianRules()
            // reads `state`, not `passed`, for the actual displayed label.
            this.guardianRules.forEach(r => { r.state = 'nodata'; r.passed = true; });
            if (this.guardianScoreBadge) { this.guardianScoreBadge.textContent = en ? 'No data' : 'Нет данных'; this.guardianScoreBadge.className = 'score-badge neutral'; }
            if (this.guardianRulesList) this.guardianRulesList.innerHTML = `<div class="timeline-empty" style="color:var(--text-secondary); text-align:center; padding:20px 0;">${this.t('empty_guardian')}</div>`;
            if (this.guardianTimeline) this.guardianTimeline.innerHTML = `<div class="timeline-empty" style="color:var(--text-secondary); text-align:center; padding:20px 0;">${this.t('empty_guardian')}</div>`;
            if (this.guardianRecommendations) this.guardianRecommendations.innerHTML = '';
            // Shared summary object — the Smart Dashboard's Guardian Status card
            // (v1.0.7) reads this instead of re-running rule evaluation itself.
            this.guardianSummary = { score: null, passed: 0, failed: 0, nodata: this.guardianRules.length };
            this.updateNotifBadge();
            this.renderGuardianRiskSnapshot(null);
            this.renderDashboardGuardianCard();
            return;
        }

        // ------------------------------------------------------------
        // Rule evaluation — every rule below is graded against a specific
        // real field stored on trades, using the user's OWN configured
        // thresholds (risk %, daily loss limit) where available. A rule
        // is only ever 'passed' or 'failed' when we actually have the
        // data to prove it; otherwise it's 'nodata' — it is NEVER assumed
        // passed just because nothing contradicts it.
        //
        // Evaluated over the most recent day that actually has trades
        // (so the card reflects real trading activity, not an
        // artificially empty "today" for someone who traded yesterday).
        // ------------------------------------------------------------
        const dayKeys = [...new Set(this.trades.map(t => t.date))].filter(Boolean).sort();
        const latestDay = dayKeys[dayKeys.length - 1];
        const latestDayTrades = this.trades.filter(t => t.date === latestDay);
        const lossesLatestDay = latestDayTrades.filter(t => t.status === 'loss').length;
        const negativeEmotions = ['greed', 'fear', 'revenge', 'anxious'];

        // 1. Risk per trade <= configured max (default 1%) — uses the real
        //    riskPercent value entered on each trade.
        const riskEngine = this.getRiskEngineSnapshot(this.trades);
        const checks = riskEngine.checks;
        const toState = value => value === null ? 'nodata' : (value ? 'passed' : 'failed');
        this.guardianRules[0].state = toState(checks.risk);
        this.guardianRules[1].state = toState(checks.overtrading);
        this.guardianRules[2].state = toState(checks.stopLoss);
        this.guardianRules[3].state = toState(checks.dailyLoss);
        this.guardianRules[4].state = toState(checks.emotions);
        this.guardianRules[5].state = toState(checks.plan);
        this.guardianViolations = riskEngine.violations.slice(-200);

        // Mirror `.passed` for the small number of places elsewhere that only
        // care about "is this an active violation" — nodata is deliberately
        // NOT a violation, since we have no proof either way.
        this.guardianRules.forEach(r => { r.passed = r.state !== 'failed'; });

        // Score is computed ONLY over rules we could actually evaluate.
        // 'nodata' rules are excluded from both numerator and denominator —
        // including them as "passed" would inflate the score with rules
        // nobody actually verified.
        const evaluated = this.guardianRules.filter(r => r.state !== 'nodata');
        const passedCount = evaluated.filter(r => r.state === 'passed').length;
        const score = evaluated.length > 0 ? Math.round((passedCount / evaluated.length) * 100) : null;

        let badgeText, badgeClass;
        if (score === null) { badgeText = en ? 'No data' : 'Нет данных'; badgeClass = 'neutral'; }
        else if (score >= 80) { badgeText = en ? 'Excellent' : 'Отлично'; badgeClass = ''; }
        else if (score >= 50) { badgeText = en ? 'OK' : 'Нормально'; badgeClass = 'warning'; }
        else { badgeText = en ? 'Needs attention' : 'Требует внимания'; badgeClass = 'danger'; }

        if (this.guardianScore) this.guardianScore.textContent = score === null ? '—' : score + '%';
        if (this.guardianScoreBadge) {
            this.guardianScoreBadge.textContent = badgeText;
            this.guardianScoreBadge.className = 'score-badge ' + badgeClass;
        }

        const failedCount = evaluated.filter(r => r.state === 'failed').length;
        let statusText = en ? '✅ Discipline on track' : '✅ Дисциплина соблюдена';
        if (evaluated.length === 0) statusText = en ? '📋 Not enough data yet' : '📋 Недостаточно данных';
        else if (failedCount > 0) statusText = en ? '⚠️ Watch your limits' : '⚠️ Обратите внимание на лимиты';
        if (this.guardianDayStatus) this.guardianDayStatus.textContent = statusText;

        // Streak: consecutive most-recent days where every EVALUATED rule
        // for that day passed (a day with only 'nodata' rules does not
        // count toward — or break — the streak, since there's nothing to
        // judge it on).
        let streak = 0;
        const uniqueDays = [...dayKeys].reverse();
        for (let day of uniqueDays) {
            const dayTrades = this.trades.filter(t => t.date === day);
            const dayLosses = dayTrades.filter(t => t.status === 'loss').length;
            const dayLossSum = dayTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0);
            const dayHadBadEmotion = dayTrades.some(t => negativeEmotions.includes(t.emotionBefore));
            const dayLimitOk = !dailyLossLimit || dayLossSum <= dailyLossLimit;
            if (dayTrades.length <= 5 && dayLimitOk && !dayHadBadEmotion) {
                streak++;
            } else {
                break;
            }
        }
        if (this.guardianStreak) this.guardianStreak.textContent = streak + (en ? ' days' : ' дней');

        // Shared summary object — reused by the Dashboard's Guardian Status
        // card (v1.0.7) so it never re-implements rule evaluation itself.
        const nodataCount = this.guardianRules.length - evaluated.length;
        this.guardianSummary = { score, passed: passedCount, failed: failedCount, nodata: nodataCount };

        this.renderGuardianRiskSnapshot(riskEngine);
        this.renderGuardianRules();
        this.renderGuardianTimeline();
        this.renderGuardianRecommendations();
        this.updateNotifBadge();
        this.renderDashboardGuardianCard();
    },

    renderGuardianRiskSnapshot(riskEngine) {
        const en = this.currentLang === 'en';
        const cards = [
            this.guardianRiskValue, this.guardianDrawdownValue,
            this.guardianTradesTodayValue, this.guardianViolationsValue
        ];
        if (!riskEngine || !this.trades.length) {
            if (this.guardianRiskValue) this.guardianRiskValue.textContent = '—';
            if (this.guardianRiskMeta) this.guardianRiskMeta.textContent = en ? 'No data' : 'Нет данных';
            if (this.guardianDrawdownValue) this.guardianDrawdownValue.textContent = '—';
            if (this.guardianDrawdownMeta) this.guardianDrawdownMeta.textContent = en ? 'No data' : 'Нет данных';
            if (this.guardianTradesTodayValue) this.guardianTradesTodayValue.textContent = '—';
            if (this.guardianTradesTodayMeta) this.guardianTradesTodayMeta.textContent = en ? 'Limit 5' : 'Лимит 5';
            if (this.guardianViolationsValue) this.guardianViolationsValue.textContent = '—';
            if (this.guardianViolationsMeta) this.guardianViolationsMeta.textContent = en ? 'No active violations' : 'Нет активных нарушений';
            return;
        }
        const riskText = riskEngine.maxRisk === null ? '—' : `${riskEngine.maxRisk.toFixed(2)}%`;
        const riskMeta = riskEngine.maxRisk === null
            ? (en ? `Configured limit ${riskEngine.configuredRisk}%` : `Лимит ${riskEngine.configuredRisk}%`)
            : (en ? `Limit ${riskEngine.configuredRisk}%` : `Лимит ${riskEngine.configuredRisk}%`);
        if (this.guardianRiskValue) this.guardianRiskValue.textContent = riskText;
        if (this.guardianRiskMeta) this.guardianRiskMeta.textContent = riskMeta;

        const loss = Number(riskEngine.latestLoss) || 0;
        const limit = Number(riskEngine.dailyLossLimit);
        const ddText = limit > 0 ? `$${loss.toFixed(2)} / $${limit.toFixed(2)}` : `$${loss.toFixed(2)}`;
        if (this.guardianDrawdownValue) this.guardianDrawdownValue.textContent = ddText;
        if (this.guardianDrawdownMeta) this.guardianDrawdownMeta.textContent = limit > 0
            ? (en ? `${Math.min(100, loss / limit * 100).toFixed(0)}% of daily limit` : `${Math.min(100, loss / limit * 100).toFixed(0)}% дневного лимита`)
            : (en ? 'Daily limit not configured' : 'Дневной лимит не задан');

        if (this.guardianTradesTodayValue) this.guardianTradesTodayValue.textContent = String(riskEngine.latestTradeCount);
        if (this.guardianTradesTodayMeta) this.guardianTradesTodayMeta.textContent = en ? `Limit ${riskEngine.maxTradesPerDay}` : `Лимит ${riskEngine.maxTradesPerDay}`;
        const vCount = riskEngine.violations.reduce((sum, v) => sum + (Number(v.count) || 1), 0);
        if (this.guardianViolationsValue) this.guardianViolationsValue.textContent = String(vCount);
        if (this.guardianViolationsMeta) this.guardianViolationsMeta.textContent = vCount ? (en ? 'Needs attention' : 'Требует внимания') : (en ? 'No active violations' : 'Нет активных нарушений');

        const riskCards = document.querySelectorAll('.guardian-risk-card');
        riskCards.forEach(card => card.classList.remove('risk-ok','risk-warn','risk-danger'));
        if (riskCards[0]) riskCards[0].classList.add(riskEngine.maxRisk === null ? 'risk-warn' : (riskEngine.maxRisk > riskEngine.configuredRisk ? 'risk-danger' : 'risk-ok'));
        if (riskCards[1]) riskCards[1].classList.add(limit > 0 && loss > limit ? 'risk-danger' : (limit > 0 && loss >= limit * .8 ? 'risk-warn' : 'risk-ok'));
        if (riskCards[2]) riskCards[2].classList.add(riskEngine.latestTradeCount > riskEngine.maxTradesPerDay ? 'risk-danger' : (riskEngine.latestTradeCount >= riskEngine.maxTradesPerDay ? 'risk-warn' : 'risk-ok'));
        if (riskCards[3]) riskCards[3].classList.add(vCount ? 'risk-danger' : 'risk-ok');
    },

    renderGuardianRules() {
        if (!this.guardianRulesList) return;
        const en = this.currentLang === 'en';
        let html = '';
        this.guardianRules.forEach(rule => {
            const state = rule.state || (rule.passed ? 'passed' : 'failed');
            const statusClass = state === 'passed' ? 'passed' : (state === 'failed' ? 'failed' : 'nodata');
            const statusText = state === 'passed' ? (en ? '✅ Passed' : '✅ Соблюдено')
                : state === 'failed' ? (en ? '⚠️ Violated' : '⚠️ Нарушение')
                : (en ? '— No data' : '— Нет данных');
            html += `
                <div class="rule-item">
                    <span>${rule.icon} ${rule.name}</span>
                    <span class="rule-status ${statusClass}">${statusText}</span>
                </div>
            `;
        });
        this.guardianRulesList.innerHTML = html;
    },

    renderGuardianTimeline() {
        if (!this.guardianTimeline) return;
        const en = this.currentLang === 'en';
        const total = this.trades.length;
        if (total === 0) {
            this.guardianTimeline.innerHTML = `<div class="timeline-empty" style="color:var(--text-secondary); text-align:center; padding:20px 0;">${this.t('empty_guardian')}</div>`;
            if (this.guardianHistoryCount) this.guardianHistoryCount.textContent = '0';
            return;
        }

        // Every timeline entry is derived directly from a real logged trade —
        // no synthetic padding events, no fabricated "streak" achievements.
        const sortedTrades = [...this.trades].reverse().slice(0, 10);
        const events = sortedTrades.map(t => {
            if (t.status === 'win') {
                return { type: 'achievement', title: en ? '🏆 Disciplined trade' : '🏆 Дисциплинированная сделка', desc: en ? `${t.asset} closed on ${t.date}, result ${t.result || ''}.` : `Сделка по ${t.asset} закрыта ${t.date}, результат ${t.result || ''}.` };
            } else if (t.status === 'loss') {
                return { type: 'warning', title: en ? '⚠️ Loss to review' : '⚠️ Убыток на разбор', desc: en ? `${t.asset} closed on ${t.date} at a loss. Review the entry against your plan.` : `Сделка по ${t.asset} закрыта ${t.date} в минус. Проверьте вход относительно плана.` };
            }
            return { type: 'neutral', title: en ? '📋 Trade logged' : '📋 Сделка записана', desc: `${t.asset} — ${t.date}` };
        });

        if (this.guardianHistoryCount) this.guardianHistoryCount.textContent = events.length;

        let html = '';
        events.slice(0, 8).forEach(e => {
            const icon = e.type === 'achievement' ? '🏆' : (e.type === 'warning' ? '⚠️' : '📋');
            html += `
                <div class="timeline-item">
                    <div class="tl-icon ${e.type}">${icon}</div>
                    <div class="tl-content">
                        <div class="tl-title">${this.escapeHtml(e.title)}</div>
                        <div class="tl-desc">${this.escapeHtml(e.desc)}</div>
                    </div>
                </div>
            `;
        });
        this.guardianTimeline.innerHTML = html;
    },

    renderGuardianRecommendations() {
        if (!this.guardianRecommendations) return;
        const en = this.currentLang === 'en';
        const total = this.trades.length;
        const MIN_TRADES = 3;
        if (total < MIN_TRADES) {
            const label = en
                ? `Not enough data for recommendations yet (${total}/${MIN_TRADES} trades logged).`
                : `Недостаточно данных для рекомендаций (${total}/${MIN_TRADES} сделок в журнале).`;
            this.guardianRecommendations.innerHTML = `<div class="rec-empty" style="color:var(--text-secondary); text-align:center; padding:20px 0;">${label}</div>`;
            return;
        }

        // Data-driven recommendations first (grounded in the user's real journal),
        // topped up with general coaching guidance only if there's room left.
        const s = this.getCoachStats();
        const recs = [];
        if (s.violations.length > 0) {
            recs.push({ icon: '🛡', text: en
                ? `<strong>Guardian:</strong> ${s.violations.length} rule${s.violations.length === 1 ? ' is' : 's are'} currently flagged — start with "${s.violations[0].name}".`
                : `<strong>Guardian:</strong> сейчас отмечено нарушений: ${s.violations.length} — начните с «${s.violations[0].name}».` });
        }
        if (s.maxLossStreak >= 3) {
            recs.push({ icon: '🧠', text: en
                ? `<strong>Coach tip:</strong> your longest losing streak is ${s.maxLossStreak} trades. Consider a short break after 2-3 losses in a row to reset before the next entry.`
                : `<strong>Совет коуча:</strong> ваша самая длинная серия убытков — ${s.maxLossStreak} сделок. После 2-3 убытков подряд полезно сделать паузу перед следующим входом.` });
        }
        if (s.bestSession) {
            recs.push({ icon: '📈', text: en
                ? `<strong>Pattern:</strong> your ${s.bestSession.label} session trades average ${(s.bestSession.avgRR >= 0 ? '+' : '')}${s.bestSession.avgRR.toFixed(1)}R so far — your strongest session in the journal.`
                : `<strong>Закономерность:</strong> сессия ${s.bestSession.label} пока даёт средний результат ${(s.bestSession.avgRR >= 0 ? '+' : '')}${s.bestSession.avgRR.toFixed(1)}R — ваша сильнейшая сессия по журналу.` });
        }
        if (recs.length === 0 || recs.length < 2) {
            recs.push({ icon: '📋', text: en
                ? '<strong>Keep logging:</strong> the more trades in your journal, the more specific these recommendations get.'
                : '<strong>Продолжайте вести журнал:</strong> чем больше сделок в журнале, тем точнее становятся рекомендации.' });
        }

        let html = '';
        recs.slice(0, 2).forEach(rec => {
            html += `
                <div class="rec-card">
                    <span class="rec-icon">${rec.icon}</span> ${rec.text}
                </div>
            `;
        });
        this.guardianRecommendations.innerHTML = html;
    },

    initGuardianChart() {
        if (typeof Chart === 'undefined') return;
        const canvas = this.guardianDisciplineChart;
        if (!canvas) return;
        if (this.guardianCharts.discipline) { this.guardianCharts.discipline.destroy(); this.guardianCharts.discipline = null; }

        const wrapper = canvas.closest('.chart-container') || canvas.parentElement;

        // A brand-new (or fully cleared) account has no trades on ANY day,
        // so there is nothing real to plot. Previously this chart defaulted
        // every day with no trades to a score of 100, which fabricated a
        // full 7-day "perfect discipline" line for users who had never
        // placed a single trade. Now it shows a genuine empty state instead.
        if (this.trades.length === 0) {
            canvas.style.display = 'none';
            this.renderEmptyState(wrapper, this.t('empty_guardian'));
            return;
        }
        canvas.style.display = '';
        this.clearEmptyState(wrapper);

        const days = [];
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = kdLocalDateKey(d);
            days.push(dateStr.slice(5, 10));
            const dayTrades = this.trades.filter(t => t.date === dateStr);
            // Days with no real trades are plotted as `null` (a gap in the
            // line) rather than a fabricated 100 — only days with at least
            // one real trade get a real discipline score.
            let score = null;
            if (dayTrades.length > 0) {
                const losses = dayTrades.filter(t => t.status === 'loss').length;
                score = Math.max(0, 100 - (losses * 15));
            }
            data.push(score);
        }

        this.guardianCharts.discipline = new Chart(canvas, {
            type: 'line', data: { labels: days, datasets: [{ label: 'Дисциплина (%)', data: data, borderColor: '#7c5cfc', backgroundColor: 'rgba(124, 92, 252, 0.1)', borderWidth: 2, spanGaps: false, pointRadius: data.map(v => v === null ? 0 : 4), pointBackgroundColor: data.map(v => v === null ? 'transparent' : (v >= 80 ? '#43c6a0' : v >= 50 ? '#fbbf24' : '#ef4444')), tension: 0.4, fill: true }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#8892a0' } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892a0', min: 0, max: 100 } } } }
        });
    },

    // ============================================================
    // SETTINGS
    // ============================================================
    saveSettings(type) {

        if (type === 'profile') {

            const name = this.settingsName?.value?.trim();
            const email = this.settingsEmailInput?.value?.trim();
            const username = this.settingsUsernameInput?.value?.trim();

            if (name) this.userData.name = name;
            if (email) this.userData.email = email;
            if (username) this.userData.username = username;

            const displayName =
                username ||
                name ||
                "Trader";

            if (this.settingsUsername) {
                this.settingsUsername.textContent = displayName;
            }

            if (this.settingsEmail) {
                this.settingsEmail.textContent =
                    email || "user@kriptodanik.ai";
            }

            if (this.userNameDisplay) {
                this.userNameDisplay.textContent = displayName;
            }

            this.updateGreeting();

        }

        else if (type === 'trading') {

            this.userData.capital =
                parseFloat(this.settingsCapital?.value) || 100000;

            this.userData.risk =
                parseFloat(this.settingsRisk?.value) || 1.0;

            this.userData.dailyLoss =
                parseFloat(this.settingsDailyLoss?.value) || 500;

            this.userData.dailyTarget =
                parseFloat(this.settingsDailyTarget?.value) || 800;

            const configuredMaxTrades = Number.parseInt(this.settingsMaxTrades?.value, 10);
            this.userData.maxTradesPerDay = Number.isFinite(configuredMaxTrades)
                ? Math.min(50, Math.max(1, configuredMaxTrades))
                : 5;
            this.userData.riskGuardMode = this.settingsRiskMode?.value === 'warn' ? 'warn' : 'block';

            this.userData.rr =
                this.settingsRR?.value || "1:2";

            this.userData.tradingStyle =
                this.settingsTradingStyle?.value || "day";

            this.userData.session =
                this.settingsSession?.value || "ny";

            if (this.balanceDisplay) {
                this.updateBalanceDisplay();
            }

        }

        else if (type === 'appearance') {

            const lang =
                this.settingsLang?.value || "ru";

            const currency =
                this.settingsCurrency?.value || "USD";

            if (lang !== this.currentLang) {
                this.currentLang = lang;
                this.applyLanguage();
                this.langButtons.forEach(b => b.classList.toggle('active', b.dataset.lang === this.currentLang));
            }

            this.userData.currency = currency;
            this.userData.dateFormat = this.settingsDateFormat?.value || 'DD.MM.YYYY';

            // Theme/accent are already applied instantly when clicked — this just
            // confirms the current DOM state is what gets persisted.
            this.userData.theme =
                document.querySelector(".theme-option.active")?.dataset.theme || "dark";
            const activeAccentIdx = Array.from(this.accentOptions).findIndex(o => o.classList.contains('active'));
            this.userData.accent = this.accentPalette[activeAccentIdx] || this.userData.accent || 'purple';

        }

        this.saveState();

        if (typeof this.applyUserData === "function") {
            this.applyUserData();
        }

        this.updateDashboardStats();

        this.showToast("Настройки сохранены!");

    },

    // ============================================================
    // DATA EXPORT / IMPORT
    // ============================================================
    exportData(type) {
        let data, filename, mime;
        if (type === 'trades') {
            const headers = ['Date', 'Asset', 'Side', 'Entry', 'Exit', 'RR', 'Result', 'Status'];
            const rows = this.trades.map(t => [t.date, t.asset, t.side, t.entry, t.exit, t.rr, t.result, t.status]);
            let csv = headers.join(',') + '\n';
            rows.forEach(row => { csv += row.join(',') + '\n'; });
            data = csv; filename = 'trades_export.csv'; mime = 'text/csv';
        } else {
            const json = JSON.stringify({ trades: this.trades, events: this.events, userData: this.userData }, null, 2);
            data = json; filename = 'kriptodanik_backup.json'; mime = 'application/json';
        }
        const blob = new Blob([data], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        a.click(); URL.revokeObjectURL(url);
        this.showToast('Экспорт завершен!');
    },

    parseCsvLine(line) {
        const cells = [];
        let cell = '', quoted = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (quoted && line[i + 1] === '"') { cell += '"'; i++; }
                else quoted = !quoted;
            } else if (ch === ',' && !quoted) {
                cells.push(cell.trim()); cell = '';
            } else {
                cell += ch;
            }
        }
        cells.push(cell.trim());
        return cells;
    },

    parseCsvLineWithDelimiter(line, delimiter = ',') {
        if (delimiter === ',') return this.parseCsvLine(line);
        const cells = []; let cell = ''; let quoted = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (quoted && line[i + 1] === '"') { cell += '"'; i++; }
                else quoted = !quoted;
            } else if (ch === delimiter && !quoted) {
                cells.push(cell.trim()); cell = '';
            } else {
                cell += ch;
            }
        }
        cells.push(cell.trim());
        return cells;
    },

    importCsvFile(event) {
        const file = event?.target?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const text = String(reader.result || '').replace(/^\uFEFF/, '');
                const lines = text.split(/\r?\n/).filter(line => line.trim());
                if (lines.length < 2) throw new Error('empty');
                // Exchange exports are often comma- or semicolon-delimited.
                // Detect the delimiter from the header instead of silently
                // treating every semicolon file as one giant column.
                const commaCount = (lines[0].match(/,/g) || []).length;
                const semicolonCount = (lines[0].match(/;/g) || []).length;
                const delimiter = semicolonCount > commaCount ? ';' : ',';
                const parseRow = line => this.parseCsvLineWithDelimiter(line, delimiter);
                const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[\s_-]+/g, ''));
                const indexOf = (...names) => names.map(n => headers.indexOf(n)).find(i => i >= 0);
                const idx = {
                    date: indexOf('date','datetime','time','timestamp'),
                    asset: indexOf('asset','symbol','pair','instrument'),
                    side: indexOf('side','direction','type'),
                    entry: indexOf('entry','entryprice','open','openprice'),
                    exit: indexOf('exit','exitprice','close','closeprice'),
                    rr: indexOf('rr','riskreward','r'),
                    pnl: indexOf('pnl','profit','profitloss','netpnl','result'),
                    status: indexOf('status','outcome'),
                    size: indexOf('size','volume','quantity','qty'),
                    risk: indexOf('risk','riskpercent'),
                    session: indexOf('session'),
                    strategy: indexOf('strategy','setup'),
                    notes: indexOf('notes','note','comment')
                };
                if (idx.asset < 0 || idx.entry < 0 || idx.exit < 0) throw new Error('columns');
                const get = (cells, key) => idx[key] >= 0 ? String(cells[idx[key]] ?? '').trim() : '';
                const parseNum = value => {
                    const n = Number(String(value).replace(/[$€₽,%\s]/g, '').replace(',', '.'));
                    return Number.isFinite(n) ? n : null;
                };
                const normalizeSide = value => {
                    const v = value.toLowerCase();
                    return ['sell','short','s','продажа'].includes(v) ? 'SELL' : 'BUY';
                };
                const normalizeStatus = (value, pnl) => {
                    const v = value.toLowerCase();
                    if (['win','won','profit','profitabl','прибыль','прибыльная'].includes(v)) return 'win';
                    if (['loss','lost','losses','убыток','убыточная'].includes(v)) return 'loss';
                    if (['be','breakeven','break even','безубыток'].includes(v)) return 'breakeven';
                    if (pnl > 0) return 'win';
                    if (pnl < 0) return 'loss';
                    return 'breakeven';
                };
                const imported = [];
                const numericIds = (this.trades || [])
                    .map(t => Number(t?.id))
                    .filter(Number.isFinite);
                let nextId = Math.max(0, ...numericIds);
                for (let row = 1; row < lines.length; row++) {
                    const cells = parseRow(lines[row]);
                    if (!cells.length) continue;
                    const entry = parseNum(get(cells, 'entry'));
                    const exit = parseNum(get(cells, 'exit'));
                    const pnl = idx.pnl >= 0 ? (parseNum(get(cells, 'pnl')) ?? 0) : 0;
                    if (!get(cells, 'asset') || entry === null || exit === null) continue;
                    const rawDate = get(cells, 'date');
                    const date = rawDate ? new Date(rawDate) : new Date();
                    imported.push({
                        id: ++nextId,
                        date: Number.isNaN(date.getTime()) ? kdLocalDateKey() : kdLocalDateKey(date),
                        asset: get(cells, 'asset').toUpperCase(),
                        side: normalizeSide(get(cells, 'side')),
                        entry,
                        exit,
                        size: parseNum(get(cells, 'size')),
                        riskPercent: parseNum(get(cells, 'risk')) ?? (Number(this.userData?.risk) || 1),
                        rr: parseNum(get(cells, 'rr')) ?? 0,
                        pnl,
                        result: `${pnl >= 0 ? '+' : ''}${pnl}`,
                        status: normalizeStatus(get(cells, 'status'), pnl),
                        session: get(cells, 'session').toLowerCase(),
                        strategy: get(cells, 'strategy'),
                        emotionBefore: 'calm', emotionAfter: 'calm',
                        notes: get(cells, 'notes')
                    });
                }
                if (!imported.length) throw new Error('rows');
                this.trades = [...imported, ...this.trades];
                this.filteredTrades = [...this.trades];
                this.syncAfterTradeChange();
                this.showToast(`${imported.length} сделок импортировано из CSV.`);
            } catch (error) {
                console.warn('CSV import failed:', error);
                this.showToast('CSV не распознан. Нужны колонки Asset/Symbol, Entry и Exit.', 'error');
            } finally {
                if (this.importCsvInput) this.importCsvInput.value = '';
            }
        };
        reader.readAsText(file);
    },

    importData() {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (this.isValidImportData(data)) {
                        this.trades = data.trades;
                        this.filteredTrades = [...this.trades];
                        this.events = data.events ? this.reviveEvents(data.events) : this.events;
                        this.userData = data.userData || this.userData;
                        this.renderJournal(); this.updateJournalStats();
                        this.updateDashboardStats(); this.updateAnalytics();
                        this.updateGuardianStats(); this.initGuardianChart();
                        this.renderCalendar(); this.updateCalendarBadge();
                        this.saveState(); this.applyUserData();
                        this.showToast('Импорт данных выполнен успешно!');
                    } else {
                        this.showToast('Ошибка импорта: файл не содержит данных о сделках');
                    }
                } catch (err) {
                    this.showToast('Ошибка импорта: неверный формат файла');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    clearAllData() {
        if (!confirm('⚠️ Это действие удалит ВСЕ ваши данные (сделки, события, историю). Отменить невозможно!')) return;
        this.trades = []; this.filteredTrades = []; this.currentPage = 1;
        this.events = []; this.aiHistory = [];
        this.guardianViolations = [];
        this.renderJournal(); this.updateJournalStats();
        this.updateDashboardStats(); this.updateBalanceDisplay();
        this.initEquityChart(); this.renderDashboardExtras();
        this.updateAnalytics();
        this.updateGuardianStats(); this.initGuardianChart();
        this.renderCalendar(); this.updateCalendarBadge();
        this.renderNotifications(); this.updateNotifBadge();
        this.renderAIWelcome();
        this.saveState();
        this.showToast('Все данные очищены.');
    },

    // ============================================================
    // TOAST NOTIFICATIONS
    // ============================================================
    showToast(message) {
        const old = document.querySelector('.toast');
        if (old) old.remove();
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    },

    // ============================================================
    // RENDER ALL
    // ============================================================
    // ============================================================
    // v1.0.8 — ACADEMY
    // Purely educational content + a standalone calculator. Never reads
    // or writes this.trades/this.userData for its lesson content — the
    // only place real user data appears is the calculator, and only
    // because the user typed it into the calculator's own inputs, which
    // are never saved to the account and never mixed into Guardian/
    // Dashboard/Analytics. Guardian logic itself is not duplicated here;
    // lessons only describe concepts and link out to the real sections.
    // ============================================================
    academyLessons: {
        position_size: {
            icon: '📐', difficulty: { ru: 'Начальный', en: 'Beginner' }, minutes: 4,
            title: { ru: 'Размер позиции', en: 'Position Size' },
            desc: {
                ru: 'Как рассчитать размер позиции исходя из капитала, риска и Stop Loss.',
                en: 'Learn how to calculate the right position size from your capital, risk and Stop Loss.'
            },
            intro: {
                ru: 'В крипте нет единого «лота», как на форексе. Разные биржи используют разный минимальный шаг контракта. Поэтому трейдеры обычно думают в терминах размера позиции, количества актива и номинальной стоимости позиции — а не «лотов».',
                en: 'Crypto has no single universal "lot" the way forex does — every exchange has its own minimum contract step. Traders instead think in terms of position size, quantity of the asset, and notional position value — not "lots".'
            },
            body: {
                ru: `<p><strong>Размер позиции</strong> — это количество актива, которое вы покупаете или продаёте (например, 0.02 BTC).</p>
                     <p><strong>Номинальная стоимость (notional)</strong> — это размер позиции в долларах: количество × цена входа.</p>
                     <p>Размер позиции должен подбираться так, чтобы срабатывание Stop Loss примерно соответствовало вашему запланированному риску в долларах — а не наоборот.</p>`,
                en: `<p><strong>Position size</strong> is the quantity of the asset you buy or sell (e.g. 0.02 BTC).</p>
                     <p><strong>Notional value</strong> is that position size in dollars: quantity × entry price.</p>
                     <p>Position size should be chosen so that hitting your Stop Loss roughly matches your planned dollar risk — not the other way around.</p>`
            },
            formula: { ru: 'Размер позиции = Максимальный риск ($) ÷ Расстояние до стопа ($ за единицу актива)', en: 'Position Size = Max Risk ($) ÷ Stop Distance ($ per unit of asset)' },
            example: {
                ru: 'ОБРАЗОВАТЕЛЬНЫЙ ПРИМЕР (не ваши реальные данные): Капитал $1,000, риск 1% → максимальный риск $10. Вход $50,000, Stop Loss $49,500 → расстояние до стопа $500. Размер позиции = $10 ÷ $500 = 0.02 BTC. Номинал ≈ $1,000.',
                en: 'EDUCATIONAL EXAMPLE (not your real data): Capital $1,000, risk 1% → max risk $10. Entry $50,000, Stop Loss $49,500 → stop distance $500. Position size = $10 ÷ $500 = 0.02 BTC. Notional ≈ $1,000.'
            },
            mistakes: {
                ru: ['Выбирать размер позиции «на глаз», а не по расчёту', 'Путать размер позиции с номинальной стоимостью', 'Игнорировать расстояние до стопа при расчёте размера'],
                en: ['Picking position size by feel instead of calculating it', 'Confusing position size with notional value', 'Ignoring stop distance when sizing the position']
            },
            warning: {
                ru: 'Это образовательный пример, а не расчёт по вашему счёту. Используйте калькулятор ниже для собственных чисел.',
                en: 'This is an educational example, not a calculation against your account. Use the calculator below for your own numbers.'
            },
            hasCalculator: true,
            askCoach: { ru: 'Как рассчитать размер позиции для моей сделки?', en: 'How do I calculate position size for my trade?' }
        },
        risk_per_trade: {
            icon: '🎯', difficulty: { ru: 'Начальный', en: 'Beginner' }, minutes: 3,
            title: { ru: 'Риск на сделку', en: 'Risk Per Trade' },
            desc: {
                ru: 'Сколько вы можете позволить себе потерять до входа в сделку.',
                en: 'Understand how much you can afford to lose before entering a trade.'
            },
            intro: {
                ru: 'Риск на сделку — это доля капитала, которой вы готовы рискнуть в одной сделке, если сработает Stop Loss.',
                en: 'Risk per trade is the share of your capital you are willing to risk on a single trade if the Stop Loss is hit.'
            },
            body: {
                ru: `<p>Цепочка расчёта: <strong>Капитал → Риск % → Максимальный убыток ($) → Расстояние до стопа → Размер позиции</strong>.</p>
                     <p>Сначала решите, сколько процентов капитала вы готовы потерять — обычно 0.5–2%. Затем считайте размер позиции от этой суммы, а не наоборот.</p>`,
                en: `<p>The chain is: <strong>Capital → Risk % → Maximum loss ($) → Stop distance → Position size</strong>.</p>
                     <p>Decide your risk percentage first — typically 0.5–2% — then size the position from that dollar amount, never the other way around.</p>`
            },
            formula: { ru: 'Максимальный убыток ($) = Капитал × Риск %', en: 'Maximum Loss ($) = Capital × Risk %' },
            example: {
                ru: 'ОБРАЗОВАТЕЛЬНЫЙ ПРИМЕР: Капитал $1,000, риск 1% → максимальный запланированный убыток $10. Реальное исполнение может отличаться из-за комиссий, проскальзывания, funding, спреда и цены исполнения — расчёт не может быть абсолютно точным.',
                en: 'EDUCATIONAL EXAMPLE: Capital $1,000, risk 1% → maximum planned loss $10. Real execution can differ due to fees, slippage, funding, spread, and execution price — the calculation can never be perfectly exact.'
            },
            mistakes: {
                ru: ['Рисковать разным % на разных сделках без причины', 'Увеличивать риск после серии убытков, пытаясь отыграться', 'Забывать про комиссии и funding при оценке реального риска'],
                en: ['Risking a different % on different trades with no reason', 'Increasing risk after a losing streak to "catch up"', 'Forgetting fees and funding when estimating real risk']
            },
            warning: { ru: 'Guardian проверяет реальный riskPercent по вашим сделкам — но только если вы его указываете при добавлении сделки.', en: 'Guardian checks your real riskPercent field on trades — but only if you fill it in when logging a trade.' },
            askCoach: { ru: 'Как определить правильный риск на сделку?', en: 'How do I determine the right risk per trade?' }
        },
        stop_loss: {
            icon: '🛑', difficulty: { ru: 'Начальный', en: 'Beginner' }, minutes: 3,
            title: { ru: 'Stop Loss', en: 'Stop Loss' },
            desc: { ru: 'Зачем нужен Stop Loss и как он определяет размер позиции.', en: 'Why a Stop Loss matters and how it drives position size.' },
            intro: { ru: 'Stop Loss — это цена, при которой вы закрываете сделку с убытком, чтобы ограничить дальнейшие потери.', en: 'A Stop Loss is the price at which you close a losing trade to limit further losses.' },
            body: {
                ru: `<p>Расстояние от входа до Stop Loss (в $ или %) — ключевая переменная в расчёте размера позиции: чем дальше стоп, тем меньше должна быть позиция при том же риске в долларах.</p>
                     <p>Stop Loss ставится ДО входа в сделку, на основе логики сетапа — а не после, «на глаз».</p>`,
                en: `<p>The distance from entry to Stop Loss (in $ or %) is the key variable in position sizing: the wider the stop, the smaller the position needs to be for the same dollar risk.</p>
                     <p>Stop Loss is set BEFORE entering the trade, based on the setup's logic — not adjusted afterward by feel.</p>`
            },
            formula: { ru: 'Расстояние до стопа % = (Вход − Stop Loss) ÷ Вход × 100', en: 'Stop Distance % = (Entry − Stop Loss) ÷ Entry × 100' },
            example: { ru: 'ОБРАЗОВАТЕЛЬНЫЙ ПРИМЕР: Вход $50,000, Stop Loss $49,500 → расстояние $500, то есть 1% от цены входа.', en: 'EDUCATIONAL EXAMPLE: Entry $50,000, Stop Loss $49,500 → distance $500, i.e. 1% of entry price.' },
            mistakes: { ru: ['Двигать стоп дальше после того, как цена пошла против вас', 'Не ставить стоп вообще', 'Ставить стоп слишком близко без учёта волатильности актива'], en: ['Moving the stop further away after price goes against you', 'Not setting a stop at all', 'Setting a stop too tight relative to the asset\'s volatility'] },
            warning: { ru: 'В приложении пока нет отдельного поля Stop Loss на сделке — Guardian не может проверить, действительно ли стоп был выставлен.', en: 'The app does not yet have a dedicated Stop Loss field on trades — Guardian cannot verify whether a stop was actually set.' },
            askCoach: { ru: 'Как правильно ставить Stop Loss?', en: 'How should I set my Stop Loss?' }
        },
        leverage: {
            icon: '⚖️', difficulty: { ru: 'Средний', en: 'Intermediate' }, minutes: 5,
            title: { ru: 'Плечо (Leverage)', en: 'Leverage' },
            desc: { ru: 'Экспозиция, маржа и почему большее плечо не значит больший допустимый риск.', en: 'Understand exposure, margin and why higher leverage does not mean higher allowed risk.' },
            intro: { ru: 'Плечо позволяет контролировать более крупную номинальную позицию, используя меньше маржи (залога).', en: 'Leverage lets you control a larger notional position while using less margin (collateral).' },
            body: {
                ru: `<p>Плечо НЕ создаёт прибыль само по себе — оно увеличивает экспозицию. Позиция на $1,000 остаётся позицией на $1,000, независимо от плеча.</p>
                     <p><strong>Более высокое плечо не означает, что можно рисковать бо́льшим процентом капитала.</strong> Если у вас $1,000 капитала и риск 1%, максимальный риск остаётся ≈$10 — переход с плеча 2x на 10x не превращает допустимый риск в $100.</p>
                     <p>Плечо влияет на маржу, но риск по-прежнему определяется размером позиции и Stop Loss.</p>`,
                en: `<p>Leverage does NOT create profit by itself — it magnifies exposure. A $1,000 position stays a $1,000 position, whatever the leverage.</p>
                     <p><strong>Higher leverage does not mean you can risk a higher percentage of capital.</strong> With $1,000 capital and 1% risk, your max risk stays ≈$10 — going from 2x to 10x leverage does not turn the allowed risk into $100.</p>
                     <p>Leverage changes your margin requirement, but risk is still driven by position size and Stop Loss.</p>`
            },
            formula: { ru: 'Примерная маржа = Номинал ÷ Плечо', en: 'Approx. Margin = Notional ÷ Leverage' },
            example: { ru: 'ОБРАЗОВАТЕЛЬНЫЙ ПРИМЕР: Позиция на $1,000 номинала с плечом 5x требует примерно $200 маржи (до комиссий и других требований биржи). Сама позиция остаётся ≈$1,000.', en: 'EDUCATIONAL EXAMPLE: A $1,000 notional position with 5x leverage requires approximately $200 margin (before fees and other exchange requirements). The position itself stays ≈$1,000.' },
            mistakes: { ru: ['Считать, что высокое плечо = высокая допустимая прибыль/риск', 'Увеличивать размер позиции просто потому что доступно больше плеча', 'Игнорировать, что плечо приближает ликвидацию при плохом размере позиции'], en: ['Assuming high leverage = higher allowed profit/risk', 'Increasing position size just because more leverage is available', 'Ignoring that leverage brings liquidation closer if the position is poorly sized'] },
            warning: { ru: 'Плечо увеличивает экспозицию и может приблизить ликвидацию при плохо рассчитанном размере позиции.', en: 'Leverage magnifies exposure and can make liquidation easier to reach if the position is poorly sized.' },
            askCoach: { ru: 'Объясни, как плечо влияет на мой риск', en: 'Explain how leverage affects my risk' }
        },
        isolated_cross: {
            icon: '🔀', difficulty: { ru: 'Средний', en: 'Intermediate' }, minutes: 4,
            title: { ru: 'Изолированная и кросс-маржа', en: 'Isolated vs Cross Margin' },
            desc: { ru: 'В чём разница между изолированной и кросс-маржой.', en: 'The difference between isolated and cross margin modes.' },
            intro: { ru: 'Большинство бирж дают выбор между изолированной и кросс-маржой для позиций с плечом.', en: 'Most exchanges let you choose between isolated and cross margin for leveraged positions.' },
            body: {
                ru: `<p><strong>Изолированная маржа (Isolated):</strong> маржа позиции отделена от остального счёта; убытки, как правило, ограничены выделенной на эту позицию маржой (с учётом механики биржи); риск легче удерживать под контролем.</p>
                     <p><strong>Кросс-маржа (Cross):</strong> доступный баланс счёта может использоваться совместно между позициями; это может дать больше запаса до ликвидации, но также может подвергнуть риску бо́льшую часть счёта.</p>`,
                en: `<p><strong>Isolated margin:</strong> the position's margin is kept separate from the rest of the account; losses are generally limited to the margin allocated to that position, subject to exchange mechanics; easier to contain risk.</p>
                     <p><strong>Cross margin:</strong> available account/margin balance may be shared across positions; this can provide more room before liquidation, but can also expose more of the account to losses.</p>`
            },
            example: { ru: 'Это общие принципы, а не гарантия поведения конкретной биржи.', en: 'These are general principles, not a guarantee of any specific exchange\'s behavior.' },
            mistakes: { ru: ['Выбирать кросс-маржу не понимая, что весь баланс под риском', 'Считать изолированную маржу «безопасной» без учёта реального размера позиции'], en: ['Choosing cross margin without realizing the whole balance is at risk', 'Assuming isolated margin is "safe" regardless of actual position size'] },
            warning: { ru: 'Точная механика маржи и ликвидации зависит от биржи, типа контракта, комиссий, поддерживающей маржи и других специфичных правил платформы.', en: 'Exact margin and liquidation mechanics depend on the exchange, contract type, fees, maintenance margin, and other platform-specific rules.' },
            askCoach: { ru: 'В чём разница между изолированной и кросс-маржой для меня?', en: 'What\'s the difference between isolated and cross margin for me?' }
        },
        liquidation: {
            icon: '⚠️', difficulty: { ru: 'Средний', en: 'Intermediate' }, minutes: 4,
            title: { ru: 'Ликвидация', en: 'Liquidation' },
            desc: { ru: 'Что такое ликвидация и от чего она зависит.', en: 'What liquidation is and what it depends on.' },
            intro: { ru: 'Ликвидация происходит, когда маржи позиции становится недостаточно для её поддержания по правилам биржи.', en: 'Liquidation happens when the position\'s margin becomes insufficient to maintain the position under the exchange\'s rules.' },
            body: {
                ru: `<p>Цена ликвидации зависит от нескольких факторов вместе: плечо, размер маржи, поддерживающая маржа (maintenance margin) и размер позиции.</p>
                     <p>Чем выше плечо при том же размере позиции — тем меньше запас до ликвидации, потому что маржи выделено меньше.</p>`,
                en: `<p>The liquidation price depends on several factors together: leverage, margin amount, maintenance margin, and position size.</p>
                     <p>Higher leverage on the same position size means less room before liquidation, because less margin is allocated.</p>`
            },
            example: { ru: 'Мы намеренно не приводим здесь «универсальную формулу» цены ликвидации — она различается между биржами и типами контрактов.', en: 'We deliberately do not give a "universal formula" for liquidation price here — it varies between exchanges and contract types.' },
            mistakes: { ru: ['Считать, что цена ликвидации одинаковая на всех биржах', 'Использовать максимальное доступное плечо без расчёта', 'Не учитывать поддерживающую маржу'], en: ['Assuming liquidation price is the same across all exchanges', 'Using the maximum available leverage without calculating anything', 'Ignoring maintenance margin'] },
            warning: { ru: 'Точный расчёт цены ликвидации зависит от конкретной биржи и контракта — уточняйте его на самой бирже.', en: 'The exact liquidation price calculation depends on the specific exchange and contract — check it directly on the exchange.' },
            askCoach: { ru: 'Объясни простыми словами, что такое ликвидация', en: 'Explain liquidation to me in simple terms' }
        },
        risk_management: {
            icon: '🛡', difficulty: { ru: 'Средний', en: 'Intermediate' }, minutes: 5,
            title: { ru: 'Риск-менеджмент', en: 'Risk Management' },
            desc: { ru: 'Комплексный взгляд на управление риском в трейдинге.', en: 'A broader look at managing risk across your trading.' },
            intro: { ru: 'Риск-менеджмент — это не одно правило, а система: риск на сделку, дневной лимит убытка, максимальная экспозиция, размер позиции, Stop Loss, соотношение риск/прибыль и торговая психология.', en: 'Risk management isn\'t one rule — it\'s a system: risk per trade, daily loss limit, maximum exposure, position sizing, Stop Loss, risk/reward, and trading psychology.' },
            body: {
                ru: `<ul>
                        <li>Риск на сделку — фиксированный % капитала на идею.</li>
                        <li>Дневной лимит убытка — точка, где вы останавливаетесь на сегодня.</li>
                        <li>Максимальная экспозиция — сколько открыто одновременно.</li>
                        <li>Risk/Reward — потенциальная прибыль относительно риска.</li>
                        <li>Избегание revenge-трейдинга после убытков.</li>
                        <li>Осторожность с избыточным плечом.</li>
                        <li>Избегание перегрузки коррелирующими позициями (например, несколько альткоинов, движущихся как BTC).</li>
                     </ul>`,
                en: `<ul>
                        <li>Risk per trade — a fixed % of capital per idea.</li>
                        <li>Daily loss limit — the point where you stop for the day.</li>
                        <li>Maximum exposure — how much is open at once.</li>
                        <li>Risk/Reward — potential gain relative to risk.</li>
                        <li>Avoiding revenge trading after losses.</li>
                        <li>Being cautious with excessive leverage.</li>
                        <li>Avoiding overexposure to correlated positions (e.g. several altcoins that move like BTC).</li>
                     </ul>`
            },
            example: { ru: 'Academy объясняет, ЧТО стоит делать. Guardian проверяет, ДЕЙСТВИТЕЛЬНО ЛИ вы это сделали — по вашим реальным сохранённым сделкам, там, где для этого достаточно данных.', en: 'Academy explains WHAT you should do. Guardian checks whether you ACTUALLY did it — using your real stored trades, wherever there is enough data to check.' },
            mistakes: { ru: ['Полагаться только на один элемент риск-менеджмента (например, только Stop Loss)', 'Игнорировать корреляцию между открытыми позициями', 'Продолжать торговать после дневного лимита убытка'], en: ['Relying on only one element of risk management (e.g. only a Stop Loss)', 'Ignoring correlation between open positions', 'Continuing to trade past the daily loss limit'] },
            warning: { ru: 'Откройте Guardian, чтобы увидеть, что из этого реально подтверждается вашими сделками.', en: 'Open Guardian to see what this actually looks like in your own trades.' },
            askCoach: { ru: 'Как выстроить свой риск-менеджмент?', en: 'How should I structure my risk management?' },
            linkGuardian: true
        }
    },

    academyOrder: ['position_size', 'risk_per_trade', 'stop_loss', 'leverage', 'isolated_cross', 'liquidation', 'risk_management'],
    // ============================================================
    // v1.1.0 — AI SCANNER
    // No vision-AI backend exists in this build, so this never invents
    // detected values — every field starts genuinely empty/"not detected"
    // and is filled in by the user. Confirming hands off to the SAME
    // existing Add Trade modal (openTradeModal → submitTradeForm), so
    // there is exactly one trade-storage path, one validation path, and
    // one save path in the whole app.
    // ============================================================
    scannerStructureList: ['fvg', 'ifvg', 'ob', 'liquidity', 'liquidity_sweep', 'bos', 'mss_choch', 'premium_discount', 'pin_bar', 'range'],
    scannerStructureLabels: {
        fvg: 'FVG', ifvg: 'IFVG', ob: 'OB', liquidity: 'Liquidity',
        liquidity_sweep: 'Liquidity Sweep', bos: 'BOS', mss_choch: 'MSS / CHOCH', premium_discount: 'Premium / Discount', pin_bar: 'Pin Bar', range: 'Range'
    },
    scannerStructureLessonMap: {
        fvg: 'fvg', ifvg: 'ifvg', ob: 'ob', liquidity: 'liquidity', liquidity_sweep: 'liquidity_sweep',
        bos: 'bos', mss_choch: 'mss_choch', premium_discount: 'premium_discount', pin_bar: 'pin_bar', range: 'range'
    },

    showScannerUpload() {
        if (this.scannerObjectUrl) {
            URL.revokeObjectURL(this.scannerObjectUrl);
            this.scannerObjectUrl = null;
        }
        this.scannerScreenshot = null;
        this.scannerDirection = 'long';
        if (this.scannerUploadView) this.scannerUploadView.style.display = 'block';
        if (this.scannerReviewView) this.scannerReviewView.style.display = 'none';
        if (this.scannerFileInput) this.scannerFileInput.value = '';
        if (this.scannerAnalysisStatus) this.scannerAnalysisStatus.textContent = '';
        if (this.scannerOcrText) this.scannerOcrText.textContent = '';
        if (this.scannerPreviewImg) this.scannerPreviewImg.removeAttribute('src');
    },

    async handleScannerFile(file) {
        if (!file) return;
        const en = this.currentLang === 'en';
        if (!file.type || !file.type.startsWith('image/')) {
            this.showToast(en ? 'Please choose a PNG, JPG or WEBP image.' : 'Выберите изображение PNG, JPG или WEBP.');
            return;
        }
        if (file.size > 25 * 1024 * 1024) {
            this.showToast(en ? 'Image must be under 25MB.' : 'Изображение должно быть меньше 25 МБ.');
            return;
        }

        try {
            const dataUrl = await this.prepareScannerImage(file);
            this.scannerScreenshot = dataUrl;
            this.renderScannerReview();
            this.showToast(en ? 'Screenshot loaded. Ready to analyze.' : 'Скриншот загружен. Можно запускать анализ.');
        } catch (err) {
            console.error('Scanner image load failed:', err);
            // Last-resort FileReader path. This also handles unusual browser image decoders.
            try {
                const dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
                    reader.readAsDataURL(file);
                });
                this.scannerScreenshot = dataUrl;
                this.renderScannerReview();
            } catch (fallbackErr) {
                console.error('Scanner fallback failed:', fallbackErr);
                this.showToast(en ? 'Could not read this image. Try another PNG/JPG.' : 'Не удалось прочитать изображение. Попробуйте другой PNG/JPG.');
            }
        }
    },

    prepareScannerImage(file) {
        return new Promise((resolve, reject) => {
            const objectUrl = URL.createObjectURL(file);
            this.scannerObjectUrl = objectUrl;
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => {
                try {
                    const sourceW = img.naturalWidth || img.width;
                    const sourceH = img.naturalHeight || img.height;
                    if (!sourceW || !sourceH) throw new Error('Invalid image dimensions');
                    const maxSide = 1800;
                    const scale = Math.min(1, maxSide / Math.max(sourceW, sourceH));
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, Math.round(sourceW * scale));
                    canvas.height = Math.max(1, Math.round(sourceH * scale));
                    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
                    if (!ctx) throw new Error('Canvas unavailable');
                    ctx.fillStyle = '#0A0A0F';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const done = (dataUrl) => {
                        URL.revokeObjectURL(objectUrl);
                        if (this.scannerObjectUrl === objectUrl) this.scannerObjectUrl = null;
                        resolve(dataUrl);
                    };
                    canvas.toBlob((blob) => {
                        if (!blob) return done(canvas.toDataURL('image/jpeg', 0.78));
                        const reader = new FileReader();
                        reader.onload = () => done(reader.result);
                        reader.onerror = () => done(canvas.toDataURL('image/jpeg', 0.78));
                        reader.readAsDataURL(blob);
                    }, 'image/jpeg', 0.78);
                } catch (e) {
                    URL.revokeObjectURL(objectUrl);
                    if (this.scannerObjectUrl === objectUrl) this.scannerObjectUrl = null;
                    reject(e);
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                if (this.scannerObjectUrl === objectUrl) this.scannerObjectUrl = null;
                reject(new Error('Browser could not decode image'));
            };
            img.src = objectUrl;
        });
    },

    renderScannerReview() {
        if (!this.scannerScreenshot) return;
        if (this.scannerPreviewImg) this.scannerPreviewImg.src = this.scannerScreenshot;
        if (this.scannerConfidenceNote) this.scannerConfidenceNote.innerHTML = `<span class="scanner-confidence-badge">${this.t('scanner_confidence_label')}</span>`;
        if (this.scannerAnalysisStatus) this.scannerAnalysisStatus.textContent = '';
        if (this.scannerOcrText) this.scannerOcrText.textContent = '';

        [this.scannerAsset, this.scannerTimeframe, this.scannerEntry, this.scannerStopLoss, this.scannerTakeProfit, this.scannerSetup].forEach(el => { if (el) el.value = ''; });
        [this.scannerAsset, this.scannerTimeframe, this.scannerEntry, this.scannerStopLoss, this.scannerTakeProfit].forEach(el => { if (el) el.placeholder = this.t('scanner_not_detected'); });
        this.scannerDirection = 'long';
        const longBtn = document.getElementById('scannerDirLong');
        const shortBtn = document.getElementById('scannerDirShort');
        if (longBtn && shortBtn) { longBtn.classList.add('active'); shortBtn.classList.remove('active'); }

        if (this.scannerStructuresGrid) {
            let html = '';
            this.scannerStructureList.forEach(key => {
                html += `<label class="scanner-structure-chip" data-structure="${key}"><input type="checkbox" data-structure-cb="${key}"> ${this.scannerStructureLabels[key]} <a href="#" class="ms-learn-link" data-learn="${key}">${this.t('scanner_learn_more')} →</a></label>`;
            });
            this.scannerStructuresGrid.innerHTML = html;
            this.scannerStructuresGrid.querySelectorAll('[data-structure-cb]').forEach(cb => cb.addEventListener('change', () => cb.closest('.scanner-structure-chip').classList.toggle('checked', cb.checked)));
            this.scannerStructuresGrid.querySelectorAll('[data-learn]').forEach(link => link.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                const lessonId = this.scannerStructureLessonMap[link.dataset.learn];
                if (lessonId) this.openMarketStructureLessonFromScanner(lessonId);
            }));
        }
        if (this.scannerUploadView) this.scannerUploadView.style.display = 'none';
        if (this.scannerReviewView) this.scannerReviewView.style.display = 'block';
    },

    async analyzeScannerImage() {
        if (!this.scannerScreenshot) return;
        const en = this.currentLang === 'en';
        const status = (text) => { if (this.scannerAnalysisStatus) this.scannerAnalysisStatus.textContent = text; };
        status(en ? 'Reading chart labels…' : 'Распознаю подписи на графике…');
        if (this.scannerAnalyzeBtn) this.scannerAnalyzeBtn.disabled = true;
        try {
            const Tesseract = await this.loadScannerOCR();
            const result = await Tesseract.recognize(this.scannerScreenshot, 'eng', {
                logger: m => {
                    if (m.status === 'recognizing text' && typeof m.progress === 'number') {
                        status((en ? 'OCR: ' : 'OCR: ') + Math.round(m.progress * 100) + '%');
                    }
                }
            });
            const text = String(result?.data?.text || '').replace(/\s+/g, ' ').trim();
            this.applyScannerOCR(text);
            if (this.scannerOcrText) this.scannerOcrText.textContent = text || (en ? 'No readable labels found.' : 'Читаемых подписей не найдено.');
            status(text ? (en ? 'Analysis complete. Review detected fields before saving.' : 'Анализ завершён. Проверь найденные поля перед сохранением.') : (en ? 'No readable labels found; manual review is required.' : 'Подписи не распознаны — проверь график вручную.'));
        } catch (err) {
            console.error('Scanner OCR failed:', err);
            status(en ? 'OCR is unavailable. The screenshot is still loaded and can be filled manually.' : 'OCR недоступен. Скриншот загружен, поля можно заполнить вручную.');
            this.showToast(en ? 'OCR could not be started. Check your internet connection.' : 'Не удалось запустить OCR. Проверьте интернет-соединение.');
        } finally {
            if (this.scannerAnalyzeBtn) this.scannerAnalyzeBtn.disabled = false;
        }
    },

    async loadScannerOCR() {
        if (window.Tesseract) return window.Tesseract;
        if (this._scannerOCRPromise) return this._scannerOCRPromise;
        this._scannerOCRPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-scanner-ocr]');
            if (existing) {
                existing.addEventListener('load', () => window.Tesseract ? resolve(window.Tesseract) : reject(new Error('Tesseract missing')));
                existing.addEventListener('error', reject);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
            script.async = true;
            script.dataset.scannerOcr = 'true';
            script.onload = () => window.Tesseract ? resolve(window.Tesseract) : reject(new Error('Tesseract missing'));
            script.onerror = () => reject(new Error('Tesseract CDN unavailable'));
            document.head.appendChild(script);
        });
        return this._scannerOCRPromise;
    },

    applyScannerOCR(text) {
        const upper = text.toUpperCase();
        const compact = upper.replace(/[^A-Z0-9/.-]+/g, ' ');
        const assets = ['BTCUSDT','BTC/USD','BTC','ETHUSDT','ETH/USD','ETH','SOLUSDT','SOL/USD','SOL','XAUUSD','XAU/USD','GOLD','EURUSD','EUR/USD','GBPUSD','GBP/USD','USDJPY','USD/JPY','AUDUSD','AUD/USD','USDCAD','USD/CAD','USDCHF','USD/CHF'];
        const foundAsset = assets.find(a => compact.includes(a.replace('/', ' ')) || upper.includes(a));
        if (foundAsset && this.scannerAsset) this.scannerAsset.value = foundAsset.replace('BTC/USD','BTCUSDT').replace('ETH/USD','ETHUSDT').replace('SOL/USD','SOLUSDT').replace('XAU/USD','XAUUSD').replace('EUR/USD','EURUSD').replace('GBP/USD','GBPUSD').replace('USD/JPY','USDJPY').replace('AUD/USD','AUDUSD').replace('USD/CAD','USDCAD').replace('USD/CHF','USDCHF');

        const tf = upper.match(/(?:^|\s)(\d{1,3}\s?(?:S|SEC|M|MIN|H|HR|D|W))(?:\s|$)/i);
        if (tf && this.scannerTimeframe) this.scannerTimeframe.value = tf[1].replace(/\s+/g,'').toUpperCase().replace('MIN','M').replace('HR','H');

        if (/\bSHORT\b/.test(upper) && this.scannerDirection === 'long') this.setScannerDirection('short');
        else if (/\bLONG\b/.test(upper)) this.setScannerDirection('long');

        const structures = [
            ['fvg', /FAIR\s*VALUE\s*GAP|\bFVG\b/], ['ifvg', /\bIFVG\b/], ['ob', /ORDER\s*BLOCK|\bOB\b/],
            ['liquidity_sweep', /LIQUIDITY\s*SWEEP|SWEEP/], ['liquidity', /LIQUIDITY/], ['bos', /\bBOS\b|BREAK\s*OF\s*STRUCTURE/],
            ['mss_choch', /\bMSS\b|\bCHOCH\b|CHANGE\s*OF\s*CHARACTER/], ['premium_discount', /PREMIUM|DISCOUNT/], ['pin_bar', /PIN\s*BAR/], ['range', /\bRANGE\b/]
        ];
        structures.forEach(([key, re]) => {
            const cb = this.scannerStructuresGrid?.querySelector(`[data-structure-cb="${key}"]`);
            if (cb && re.test(upper)) { cb.checked = true; cb.closest('.scanner-structure-chip')?.classList.add('checked'); }
        });

        const notes = [];
        if (foundAsset) notes.push(`Asset: ${foundAsset}`);
        if (tf) notes.push(`Timeframe: ${tf[1]}`);
        const foundStructures = structures.filter(([,re]) => re.test(upper)).map(([key]) => this.scannerStructureLabels[key]);
        if (foundStructures.length) notes.push((this.currentLang === 'en' ? 'OCR labels: ' : 'Метки OCR: ') + foundStructures.join(', '));
        if (notes.length && this.scannerSetup) this.scannerSetup.value = notes.join(' | ');
    },

    setScannerDirection(direction) {
        this.scannerDirection = direction === 'short' ? 'short' : 'long';
        const longBtn = document.getElementById('scannerDirLong');
        const shortBtn = document.getElementById('scannerDirShort');
        if (longBtn) longBtn.classList.toggle('active', this.scannerDirection === 'long');
        if (shortBtn) shortBtn.classList.toggle('active', this.scannerDirection === 'short');
    },

    openMarketStructureLessonFromScanner(lessonId) {
        this.navItems.forEach(n => n.classList.remove('active'));
        const targetNav = Array.from(this.navItems).find(n => n.dataset.section === 'academy');
        if (targetNav) targetNav.classList.add('active');
        this.showSection('academy');
        this.openAcademyLesson(lessonId);
    },

    // Confirm never writes to the Journal itself — it hands the user's own
    // manually-entered values to the existing Add Trade modal, so the
    // existing validation and the existing "Save" button are still the
    // only thing that actually creates a trade record.
    confirmScannerResult() {
        const asset = (this.scannerAsset?.value || '').trim();
        const entry = this.scannerEntry?.value || '';
        const stopLoss = this.scannerStopLoss?.value || '';
        const takeProfit = this.scannerTakeProfit?.value || '';
        const timeframe = (this.scannerTimeframe?.value || '').trim();
        const setup = (this.scannerSetup?.value || '').trim();
        const checkedStructures = Array.from(this.scannerStructuresGrid?.querySelectorAll('[data-structure-cb]:checked') || []).map(cb => this.scannerStructureLabels[cb.dataset.structureCb]);

        const en = this.currentLang === 'en';
        const numericFields = [['Entry', entry], ['Stop Loss', stopLoss], ['Take Profit', takeProfit]];
        const malformed = numericFields.filter(([, value]) => value !== '' && !Number.isFinite(Number(String(value).replace(',', '.'))));
        if (malformed.length) {
            this.showToast(en ? 'Entry, Stop Loss and Take Profit must be numeric when filled.' : 'Вход, Stop Loss и Take Profit должны быть числами, если они заполнены.');
            return;
        }
        let notes = setup;
        if (timeframe) notes = `[${timeframe}] ` + notes;
        if (stopLoss) notes += (notes ? ' | ' : '') + 'SL: ' + stopLoss;
        if (takeProfit) notes += (notes ? ' | ' : '') + 'TP: ' + takeProfit;
        if (checkedStructures.length) notes += (notes ? ' | ' : '') + (en ? 'Structures: ' : 'Структуры: ') + checkedStructures.join(', ');
        const marketSnapshot = this.formatMarketSnapshotForJournal();
        if (marketSnapshot) notes += (notes ? ' | ' : '') + marketSnapshot;

        // Pending screenshot is picked up by submitTradeForm() and attached
        // to the trade only once the user actually saves it there.
        this.pendingScannerScreenshot = this.scannerScreenshot;

        this.openTradeModal(null, true);
        if (this.tFields.asset) this.tFields.asset.value = asset;
        if (this.tFields.direction) this.tFields.direction.value = this.scannerDirection;
        if (this.tFields.entry) this.tFields.entry.value = entry;
        if (this.tFields.exit) this.tFields.exit.value = takeProfit || '';
        if (this.tFields.notes) this.tFields.notes.value = notes;
    },

    renderAcademyGrid() {
        if (!this.academyGrid) return;
        this.showAcademyGrid();
        const en = this.currentLang === 'en';
        const cardsHtml = (order, source) => order.map(id => {
            const l = source[id];
            return `
                <div class="academy-card">
                    <div class="academy-card-icon">${l.icon}</div>
                    <h4>${l.title[en ? 'en' : 'ru']}</h4>
                    <p>${l.desc[en ? 'en' : 'ru']}</p>
                    <div class="academy-card-meta">
                        <span>${l.difficulty[en ? 'en' : 'ru']}</span>
                        <span>${l.minutes} ${en ? 'min read' : 'мин чтения'}</span>
                    </div>
                    <button class="btn-secondary" data-lesson="${id}">${en ? 'Open lesson' : 'Открыть урок'}</button>
                </div>`;
        }).join('');

        this.academyGrid.innerHTML = cardsHtml(this.academyOrder, this.academyLessons);
        this.academyGrid.querySelectorAll('[data-lesson]').forEach(btn => {
            btn.addEventListener('click', () => this.openAcademyLesson(btn.dataset.lesson));
        });

    },

    showAcademyGrid() {
        if (this.academyGridView) this.academyGridView.style.display = 'block';
        if (this.academyLessonView) this.academyLessonView.style.display = 'none';
    },

    openAcademyLesson(id) {
        const lesson = this.academyLessons[id];
        if (!lesson || !this.academyLessonBody) return;
        this.currentLessonId = id;
        const en = this.currentLang === 'en';
        const lang = en ? 'en' : 'ru';

        let html = `
            <h2>${lesson.title[lang]}</h2>
            <p class="lesson-intro">${lesson.intro[lang]}</p>
            <section>${lesson.body[lang]}</section>`;

        if (lesson.svg) {
            html += `<section><div class="lesson-illustration">${lesson.svg()}</div></section>`;
        }
        if (lesson.formula) {
            html += `<section><h5>${en ? 'Formula' : 'Формула'}</h5><div class="lesson-formula">${lesson.formula[lang]}</div></section>`;
        }
        if (lesson.hasCalculator) {
            html += this.renderPositionCalculatorMarkup(lang);
        }
        if (lesson.example) {
            html += `<section><h5>${en ? 'Practical example' : 'Практический пример'}</h5><div class="lesson-example">${lesson.example[lang]}</div></section>`;
        }
        if (lesson.mistakes) {
            html += `<section><h5>${en ? 'Common mistakes' : 'Частые ошибки'}</h5><ul class="lesson-mistakes">${lesson.mistakes[lang].map(m => `<li>${m}</li>`).join('')}</ul></section>`;
        }
        if (lesson.warning) {
            html += `<section><h5>${en ? 'Important' : 'Важно'}</h5><div class="lesson-warning">${lesson.warning[lang]}</div></section>`;
        }
        if (lesson.linkGuardian) {
            html += `<button class="ask-coach-link" id="lessonOpenGuardianBtn" style="margin-right:8px;">🛡 ${en ? 'Open Guardian' : 'Открыть Guardian'}</button>`;
        }
        if (lesson.askCoach) {
            html += `<button class="ask-coach-link" id="lessonAskCoachBtn">💬 ${en ? 'Ask AI Coach about this' : 'Спросить AI Коуча об этом'}</button>`;
        }

        this.academyLessonBody.innerHTML = html;
        if (this.academyGridView) this.academyGridView.style.display = 'none';
        if (this.academyLessonView) this.academyLessonView.style.display = 'block';

        if (lesson.hasCalculator) this.bindPositionCalculator();

        const askBtn = document.getElementById('lessonAskCoachBtn');
        if (askBtn) askBtn.addEventListener('click', () => this.askCoachFromAcademy(lesson.askCoach[lang]));
        const guardBtn = document.getElementById('lessonOpenGuardianBtn');
        if (guardBtn) guardBtn.addEventListener('click', () => {
            this.navItems.forEach(n => n.classList.remove('active'));
            const targetNav = Array.from(this.navItems).find(n => n.dataset.section === 'guardian');
            if (targetNav) targetNav.classList.add('active');
            this.showSection('guardian');
        });
    },

    // Reuses the EXISTING AI Coach engine (handleAIQuery/generateCoachReply)
    // — Academy just navigates to the AI Coach section and submits a
    // pre-filled question through the same input the user would type into.
    askCoachFromAcademy(question) {
        this.navItems.forEach(n => n.classList.remove('active'));
        const targetNav = Array.from(this.navItems).find(n => n.dataset.section === 'intelligence');
        if (targetNav) targetNav.classList.add('active');
        this.showSection('intelligence');
        if (this.aiInput) {
            this.aiInput.value = question;
            this.handleAIQuery();
        }
    },

    // ----- Position Size Calculator -----
    // Standalone: reads only its own form inputs, never this.trades or
    // this.userData. Nothing here is saved to the account.
    renderPositionCalculatorMarkup(lang) {
        const en = lang === 'en';
        return `
            <div class="psc-calculator">
                <h5>${en ? 'Position Size Calculator' : 'Калькулятор размера позиции'}</h5>
                <div class="psc-direction">
                    <button type="button" class="active" data-dir="long" id="pscDirLong">LONG</button>
                    <button type="button" data-dir="short" id="pscDirShort">SHORT</button>
                </div>
                <div class="psc-grid">
                    <div class="psc-field"><label>${en ? 'Account Capital ($)' : 'Капитал счёта ($)'}</label><input type="number" class="form-input" id="pscCapital" value="1000" min="0" step="any"></div>
                    <div class="psc-field"><label>${en ? 'Risk (%)' : 'Риск (%)'}</label><input type="number" class="form-input" id="pscRisk" value="1" min="0" step="any"></div>
                    <div class="psc-field"><label>${en ? 'Entry Price ($)' : 'Цена входа ($)'}</label><input type="number" class="form-input" id="pscEntry" value="50000" min="0" step="any"></div>
                    <div class="psc-field"><label>${en ? 'Stop Loss Price ($)' : 'Цена Stop Loss ($)'}</label><input type="number" class="form-input" id="pscStop" value="49500" min="0" step="any"></div>
                    <div class="psc-field"><label>${en ? 'Leverage (optional)' : 'Плечо (опционально)'}</label><input type="number" class="form-input" id="pscLeverage" placeholder="${en ? 'e.g. 5' : 'напр. 5'}" min="0" step="any"></div>
                </div>
                <div id="pscError"></div>
                <div class="psc-results" id="pscResults" style="display:none;">
                    <div class="psc-result-item"><div class="psc-result-label">${en ? 'Maximum Risk' : 'Максимальный риск'}</div><div class="psc-result-value" id="pscMaxRisk">—</div></div>
                    <div class="psc-result-item"><div class="psc-result-label">${en ? 'Stop Distance' : 'Расстояние до стопа'}</div><div class="psc-result-value" id="pscStopDist">—</div></div>
                    <div class="psc-result-item"><div class="psc-result-label">${en ? 'Suggested Position Size' : 'Размер позиции'}</div><div class="psc-result-value" id="pscPosSize">—</div></div>
                    <div class="psc-result-item"><div class="psc-result-label">${en ? 'Approx. Notional' : 'Примерный номинал'}</div><div class="psc-result-value" id="pscNotional">—</div></div>
                    <div class="psc-result-item" id="pscMarginWrap" style="display:none;"><div class="psc-result-label">${en ? 'Approx. Margin' : 'Примерная маржа'}</div><div class="psc-result-value" id="pscMargin">—</div></div>
                </div>
                <p class="lesson-note" id="pscRiskNote" style="display:none;">${en ? 'Risk remains based on position size and Stop Loss — not simply on leverage.' : 'Риск по-прежнему определяется размером позиции и Stop Loss — а не просто плечом.'}</p>
                <p class="psc-disclaimer">${en ? 'Calculation is an estimate. Actual execution may differ due to fees, slippage, funding, spread, exchange rules and contract specifications.' : 'Расчёт является оценкой. Реальное исполнение может отличаться из-за комиссий, проскальзывания, funding, спреда, правил биржи и спецификации контракта.'}</p>
            </div>`;
    },

    bindPositionCalculator() {
        this.pscDirection = 'long';
        const ids = ['pscCapital', 'pscRisk', 'pscEntry', 'pscStop', 'pscLeverage'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => this.calcPositionSize());
        });
        const dirLong = document.getElementById('pscDirLong');
        const dirShort = document.getElementById('pscDirShort');
        if (dirLong) dirLong.addEventListener('click', () => { this.pscDirection = 'long'; dirLong.classList.add('active'); dirShort.classList.remove('active'); this.calcPositionSize(); });
        if (dirShort) dirShort.addEventListener('click', () => { this.pscDirection = 'short'; dirShort.classList.add('active'); dirLong.classList.remove('active'); this.calcPositionSize(); });
        this.calcPositionSize();
    },

    calcPositionSize() {
        const en = this.currentLang === 'en';
        const errEl = document.getElementById('pscError');
        const resultsEl = document.getElementById('pscResults');
        if (!errEl || !resultsEl) return;

        const capital = parseFloat(document.getElementById('pscCapital')?.value);
        const riskPct = parseFloat(document.getElementById('pscRisk')?.value);
        const entry = parseFloat(document.getElementById('pscEntry')?.value);
        const stop = parseFloat(document.getElementById('pscStop')?.value);
        const leverageRaw = document.getElementById('pscLeverage')?.value;
        const leverage = leverageRaw ? parseFloat(leverageRaw) : null;
        const dir = this.pscDirection || 'long';

        const showError = (msg) => {
            errEl.innerHTML = `<div class="psc-error">${msg}</div>`;
            resultsEl.style.display = 'none';
            const note = document.getElementById('pscRiskNote'); if (note) note.style.display = 'none';
        };

        if ([capital, riskPct, entry, stop].some(v => isNaN(v))) { showError(en ? 'Please fill in all required fields with valid numbers.' : 'Заполните все обязательные поля корректными числами.'); return; }
        if (capital <= 0) { showError(en ? 'Capital must be greater than 0.' : 'Капитал должен быть больше 0.'); return; }
        if (riskPct <= 0) { showError(en ? 'Risk % must be greater than 0.' : 'Риск % должен быть больше 0.'); return; }
        if (entry <= 0 || stop <= 0) { showError(en ? 'Prices must be greater than 0.' : 'Цены должны быть больше 0.'); return; }
        if (entry === stop) { showError(en ? 'Stop Loss cannot equal Entry price.' : 'Stop Loss не может быть равен цене входа.'); return; }
        if (dir === 'long' && stop >= entry) { showError(en ? 'For LONG, Stop Loss should be below Entry.' : 'Для LONG Stop Loss должен быть ниже цены входа.'); return; }
        if (dir === 'short' && stop <= entry) { showError(en ? 'For SHORT, Stop Loss should be above Entry.' : 'Для SHORT Stop Loss должен быть выше цены входа.'); return; }
        if (leverageRaw && (isNaN(leverage) || leverage <= 0)) { showError(en ? 'Leverage must be a positive number.' : 'Плечо должно быть положительным числом.'); return; }

        errEl.innerHTML = '';
        const maxRisk = capital * (riskPct / 100);
        const stopDistance = Math.abs(entry - stop);
        const stopDistancePct = (stopDistance / entry) * 100;
        const positionSize = maxRisk / stopDistance; // quantity of asset
        const notional = positionSize * entry;

        document.getElementById('pscMaxRisk').textContent = '$' + maxRisk.toFixed(2);
        document.getElementById('pscStopDist').textContent = stopDistancePct.toFixed(2) + '%';
        document.getElementById('pscPosSize').textContent = positionSize.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
        document.getElementById('pscNotional').textContent = '$' + notional.toLocaleString(undefined, { maximumFractionDigits: 2 });

        const marginWrap = document.getElementById('pscMarginWrap');
        const noteEl = document.getElementById('pscRiskNote');
        if (leverage) {
            const margin = notional / leverage;
            document.getElementById('pscMargin').textContent = '$' + margin.toLocaleString(undefined, { maximumFractionDigits: 2 });
            marginWrap.style.display = 'block';
            if (noteEl) noteEl.style.display = 'block';
        } else {
            marginWrap.style.display = 'none';
            if (noteEl) noteEl.style.display = 'none';
        }
        resultsEl.style.display = 'grid';
    },

    renderAll() {
        this.renderJournal();
        this.updateJournalStats();
        this.renderCalendar();
        this.updateCalendarBadge();
        this.updateAnalytics();
        this.updateGuardianStats();
        this.initGuardianChart();
        this.initEquityChart();
        this.initDashboardCharts();
        this.renderDashboardExtras();
        this.renderIntegratedCoachContext();
        this.updateDashboardStats();
        this.updateBalanceDisplay();
        this.renderNotifications();
        this.updateNotifBadge();
    }
};

// ===== INIT =====
// One global boot gate protects against duplicate script evaluation, BFCache
// restores, and multiple DOMContentLoaded paths. App.init() itself is also
// idempotent, but the gate prevents even the second call from entering the
// method.
(function bootKDIntelligence() {
    if (window.__KD_INTELLIGENCE_BOOT_STARTED__) return;
    window.__KD_INTELLIGENCE_BOOT_STARTED__ = true;
    const boot = () => {
        try { App.init(); }
        catch (error) {
            console.error('KD Intelligence AI boot failed:', error);
            window.__KD_INTELLIGENCE_BOOT_FAILED__ = true;
        }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();

window.App = App;

// v1.29.0 — last-resort navigation delegation.
// If a future partial DOM change prevents App.bindEvents() from binding a
// particular nav button, the application still has a working navigation path.
document.addEventListener('click', (event) => {
    const item = event.target?.closest?.('.nav-item[data-section]');
    if (!item || item.dataset.kdNavBound === '1') return;
    const app = window.App;
    if (!app || typeof app.showSection !== 'function') return;
    document.querySelectorAll('.nav-item').forEach(node => node.classList.remove('active'));
    item.classList.add('active');
    app.showSection(item.dataset.section);
    if (typeof app.closeMobileNav === 'function') app.closeMobileNav();
}, true);

// v1.1.3 brand dashboard bindings
(function(){
  const escapeBrandHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
  function bindBrand(){
    const first=document.getElementById('brandFirstTradeBtn');
    const add=document.getElementById('addTradeBtn');
    if(first && add && !first.dataset.bound){ first.dataset.bound='1'; first.addEventListener('click',()=>add.click()); }
    const coachMap=[['brandCoachAnalyze','dashAskBtn'],['brandCoachSetup','dashAskBtn'],['brandCoachDiscipline','dashAskBtn']];
    coachMap.forEach(([a,b])=>{const x=document.getElementById(a),y=document.getElementById(b); if(x&&y&&!x.dataset.bound){x.dataset.bound='1';x.addEventListener('click',()=>y.click())}});
    const av=document.getElementById('headerAvatar');
    if(av){ const name=window.App?.userData?.name || 'Trader'; av.textContent=String(name).trim().charAt(0).toUpperCase() || 'T'; av.style.backgroundImage='none'; av.style.border='1px solid rgba(255,211,105,.5)'; }
    const sav=document.getElementById('settingsAvatar');
    if(sav){ const name=window.App?.userData?.name || 'Trader'; sav.textContent=String(name).trim().charAt(0).toUpperCase() || 'T'; sav.style.backgroundImage='none'; }
    const actions={
      brandOpenJournal:'journal',brandQuickJournal:'journal',brandQuickAnalytics:'analytics',brandQuickAcademy:'academy',brandQuickScanner:'scanner'
    };
    Object.entries(actions).forEach(([id,section])=>{const el=document.getElementById(id);if(el&&!el.dataset.bound){el.dataset.bound='1';el.addEventListener('click',()=>window.App&&window.App.showSection(section));}});
  }

  function renderBrandRealData(){
    const trades=(window.App&&Array.isArray(window.App.trades))?window.App.trades:[];
    const total=trades.length;
    const chartWrap=document.getElementById('brandChartWrap');
    const svg=document.querySelector('.brand-equity-svg');
    const line=svg&&svg.querySelector('.brand-line');
    const area=svg&&svg.querySelector('.brand-area');
    const dot=svg&&svg.querySelector('.brand-dot');
    const marker=svg&&svg.querySelector('.brand-marker');
    const tooltip=document.querySelector('.brand-chart-tooltip');
    const donut=document.getElementById('brandDonut');
    const legend=document.getElementById('brandLegend');

    if(!total){
      if(chartWrap) chartWrap.classList.add('is-empty');
      if(donut) donut.classList.add('is-empty');
      if(legend) legend.innerHTML='<div class="brand-empty-distribution">Нет сделок — распределение появится после первой сделки.</div>';
      return;
    }

    if(chartWrap) chartWrap.classList.remove('is-empty');
    if(donut) donut.classList.remove('is-empty');

    // Build an equity curve from real stored P&L values only.
    const values=[0];
    let cumulative=0;
    trades.slice().reverse().forEach(t=>{
      cumulative += parseFloat(t.pnl)||0;
      values.push(cumulative);
    });
    const points=values.length;
    const min=Math.min(...values,0);
    const max=Math.max(...values,0);
    const range=Math.max(max-min,1);
    const x0=40, x1=740, y0=230, y1=35;
    const pts=values.map((v,i)=>{
      const x=x0+(x1-x0)*(i/(points-1||1));
      const y=y0-(v-min)/range*(y0-y1);
      return [x,y];
    });
    const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
    const areaD=d+' L '+x1+',250 L '+x0+',250 Z';
    if(line) line.setAttribute('d',d);
    if(area) area.setAttribute('d',areaD);
    const last=pts[pts.length-1];
    if(dot){dot.setAttribute('cx',last[0]);dot.setAttribute('cy',last[1]);}
    if(marker){marker.setAttribute('x1',last[0]);marker.setAttribute('x2',last[0]);marker.setAttribute('y1',last[1]);}
    if(tooltip){
      const pnl=cumulative;
      tooltip.innerHTML='<b>'+(pnl>=0?'+':'')+pnl.toFixed(2)+' $</b><span>Текущий P&L</span>';
      tooltip.style.left=Math.min(Math.max((last[0]/760)*100-10,5),72)+'%';
      tooltip.style.top=Math.max((last[1]/280)*100-6,5)+'%';
    }

    // Real asset distribution.
    const counts={};
    trades.forEach(t=>{const a=t.asset||'Другие'; counts[a]=(counts[a]||0)+1;});
    const rows=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const totalCount=trades.length;
    const palette=['#ffd369','#f97316','#8a2be2','#4b4a63','#22c55e'];
    if(legend){
      legend.innerHTML=rows.map((r,i)=>'<div><i style="background:'+palette[i%palette.length]+'"></i><span>'+escapeBrandHtml(r[0])+'</span><b>'+Math.round(r[1]/totalCount*100)+'%</b></div>').join('');
    }
    if(donut){
      let cursor=0;
      const stops=rows.map((r,i)=>{
        const start=cursor;
        cursor += r[1]/totalCount*100;
        return palette[i%palette.length]+' '+start+'% '+cursor+'%';
      }).join(',');
      donut.style.background='radial-gradient(circle,#0d0a18 0 43%,transparent 44%),conic-gradient('+stops+')';
    }
  }

  function sync(){
    const total=(window.App&&Array.isArray(window.App.trades))?window.App.trades.length:0;
    renderBrandRealData();
    const progressEl=document.getElementById('brandProgress');
    const progressBar=document.getElementById('brandProgressBar');
    const disciplineLabel=document.getElementById('brandDisciplineLabel');
    const disciplineGrade=document.getElementById('brandDisciplineGrade');
    const disciplineGood=document.getElementById('brandDisciplineGood');
    const guardianStatus=document.getElementById('brandGuardianStatus');
    const guardianList=document.getElementById('brandGuardianList');
    const realTrades=(window.App&&Array.isArray(window.App.trades))?window.App.trades:[];
    const completedChallenges=realTrades.length ? Math.min(10, realTrades.filter(t=>t&&t.status!=='open').length) : 0;
    if(progressEl) progressEl.textContent=completedChallenges+' / 10';
    if(progressBar) progressBar.style.width=(completedChallenges*10)+'%';
    if(disciplineLabel) disciplineLabel.textContent=realTrades.length?'Рассчитывается':'Нет данных';
    if(disciplineGrade) disciplineGrade.textContent='—';
    if(disciplineGood) disciplineGood.hidden = true;
    if(guardianStatus){ guardianStatus.textContent='● Нет данных'; guardianStatus.classList.remove('is-good'); guardianStatus.classList.add('is-empty'); }
    if(guardianList){ guardianList.innerHTML='<span>● Добавьте первую сделку</span><span>● Guardian проверит реальные правила</span><span>● Здесь не будет выдуманных оценок</span>'; }
    const balance=document.getElementById('balanceDisplay');
    const b=document.getElementById('brandBalance');
    const t=document.getElementById('brandTrades');
    const w=document.getElementById('brandWinrate');
    const pf=document.getElementById('brandProfitFactor');
    const pfSub=document.getElementById('brandProfitFactorSub');
    const streak=document.getElementById('brandStreak');
    const streakSub=document.getElementById('brandStreakSub');
    const donut=document.getElementById('brandDonut');
    const donutTotal=document.getElementById('brandDonutTotal');
    const legend=document.getElementById('brandLegend');
    const chartWrap=document.getElementById('brandChartWrap');

    if (b) {
      const currentBalance = window.App && typeof window.App.getCurrentBalance === 'function'
        ? Number(window.App.getCurrentBalance())
        : NaN;
      b.textContent = Number.isFinite(currentBalance)
        ? '$ ' + currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : ((balance && balance.textContent) || '$ 100,000.00');
    }
    if (t) t.textContent=String(total);
    if (w) w.textContent=total ? ((window.App && window.App.winRateDisplay && window.App.winRateDisplay.textContent) || '—') : '—';
    if (donutTotal) donutTotal.textContent=String(total);

    if(total===0){
      if(pf) pf.textContent='—';
      if(pfSub) pfSub.textContent='Недостаточно данных';
      if(streak) streak.textContent='0 дней';
      if(streakSub) streakSub.textContent='Начните журнал';
      const balanceSub=document.getElementById('brandBalanceSub');
      if(balanceSub) balanceSub.textContent='Стартовый капитал';
      if(donut) donut.classList.add('is-empty');
      if(legend) legend.innerHTML='<div class="brand-empty-distribution">Нет сделок — распределение появится после первой сделки.</div>';
      if(chartWrap) chartWrap.classList.add('is-empty');
      return;
    }

    if(donut) donut.classList.remove('is-empty');
    if(chartWrap) chartWrap.classList.remove('is-empty');

    const map=[['balanceDisplay','brandBalance'],['totalTradesDisplay','brandTrades'],['winRateDisplay','brandWinrate']];
    map.forEach(([a,bid])=>{const x=document.getElementById(a),y=document.getElementById(bid);if(x&&y)y.textContent=x.textContent;});

    // Profit factor from real stored trades only.
    const wins=(window.App.trades||[]).filter(x=>x.status==='win').reduce((s,x)=>s+(parseFloat(x.pnl)||0),0);
    const losses=Math.abs((window.App.trades||[]).filter(x=>x.status==='loss').reduce((s,x)=>s+(parseFloat(x.pnl)||0),0));
    if(pf) pf.textContent=losses>0 ? (wins/losses).toFixed(2) : '—';
    if(pfSub) pfSub.textContent=losses>0 ? 'По реальным сделкам' : 'Недостаточно данных';
    const balanceSub=document.getElementById('brandBalanceSub');
    if(balanceSub) balanceSub.textContent='По данным Journal';
    if(guardianStatus){ guardianStatus.textContent='● Отслеживается'; guardianStatus.classList.remove('is-empty'); guardianStatus.classList.add('is-good'); }
    if(guardianList){
      const violations=(window.App.guardianRules||[]).filter(r=>r.state==='failed').length;
      guardianList.innerHTML=violations
        ? `<span>● Нарушений сейчас: ${violations}</span><span>● Проверь Guardian перед следующей сделкой</span><span>● Все показатели основаны на Journal</span>`
        : '<span>● Активных нарушений не найдено</span><span>● Проверка основана на реальных сделках</span><span>● Добавляй сделки — Guardian будет обновляться</span>';
    }

    // Current winning streak from real chronological trades.
    let run=0;
    [...(window.App.trades||[])].reverse().some(x=>{ if(x.status==='win'){run++;return false;} return true; });
    if(streak) streak.textContent=run+' '+(run===1?'день':'дн.');
    if(streakSub) streakSub.textContent=run ? 'Текущая серия' : 'Нет серии';
  }
  // v1.8.5 — App can now refresh the branded Dashboard immediately
  // after adding/editing/deleting a trade.
  window.KDRefreshBrandDashboard=sync;

  document.addEventListener('DOMContentLoaded',()=>{bindBrand();sync();setTimeout(sync,700);setTimeout(sync,1800);});
  window.addEventListener('load',()=>{bindBrand();sync();});
})();


/* KD Intelligence v1.31 — analytics/strategy safety layer */
(function(){
  if (window.__KD_ANALYTICS_V131__) return;
  window.__KD_ANALYTICS_V131__ = true;
  const safeNum = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const getTrades = () => {
    try {
      const st = window.App?.state || window.state || {};
      if (Array.isArray(st.trades)) return st.trades;
      const raw = localStorage.getItem('trades');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };
  window.KDAnalytics = window.KDAnalytics || {};
  window.KDAnalytics.group = function(key){
    const out = {};
    for (const t of getTrades()) {
      const k = String(t?.[key] ?? '').trim() || 'Unknown';
      const b = out[k] ||= {name:k,trades:0,wins:0,losses:0,pnl:0,rr:0};
      b.trades++;
      const status = String(t?.status || t?.result || '').toLowerCase();
      if (status.includes('win')) b.wins++;
      if (status.includes('loss')) b.losses++;
      b.pnl += safeNum(t?.pnl);
      b.rr += safeNum(t?.rr);
    }
    return Object.values(out).map(x => ({...x, winRate:x.trades?x.wins/x.trades*100:0, avgRR:x.trades?x.rr/x.trades:0}));
  };
  window.KDAnalytics.summary = function(){
    const trades=getTrades();
    const pnl=trades.reduce((a,t)=>a+safeNum(t?.pnl),0);
    const wins=trades.filter(t=>String(t?.status||t?.result||'').toLowerCase().includes('win')).length;
    const losses=trades.filter(t=>String(t?.status||t?.result||'').toLowerCase().includes('loss')).length;
    return {trades:trades.length,pnl,wins,losses,winRate:trades.length?wins/trades*100:0,byAsset:this.group('asset'),byStrategy:this.group('strategy'),bySession:this.group('session')};
  };
})();
