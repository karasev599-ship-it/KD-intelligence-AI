/* KriptoDanik AI — economic calendar integration */
(() => {
  'use strict';

  const boot = () => {
    const app = window.App;
    if (!app || app.__kdEconomicCalendarFix) return;
    app.__kdEconomicCalendarFix = true;
    app.economicEvents = [];

    const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    app.loadEconomicCalendar = async function () {
      try {
        const response = await fetch(`data/calendar.json?v=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`calendar.json HTTP ${response.status}`);
        const payload = await response.json();
        const sourceEvents = Array.isArray(payload?.events) ? payload.events : [];
        this.economicEvents = sourceEvents
          .map((event, index) => {
            const date = new Date(event?.date);
            if (Number.isNaN(date.getTime())) return null;
            return {
              id: `economic-${index}-${date.getTime()}`,
              date,
              title: String(event?.title || 'Economic event'),
              type: 'analysis',
              country: String(event?.country || ''),
              impact: String(event?.impact || ''),
              actual: String(event?.actual || ''),
              forecast: String(event?.forecast || ''),
              previous: String(event?.previous || ''),
              isEconomic: true
            };
          })
          .filter(Boolean);

        this.renderCalendar?.();
        this.updateCalendarBadge?.();
        this.renderNotifications?.();
        this.updateNotifBadge?.();
        console.info(`KriptoDanik economic calendar: ${this.economicEvents.length} events loaded.`);
      } catch (error) {
        console.warn('KriptoDanik economic calendar unavailable:', error);
      }
    };

    const originalGetEventsForDate = app.getEventsForDate;
    if (typeof originalGetEventsForDate === 'function') {
      app.getEventsForDate = function (date) {
        const local = originalGetEventsForDate.call(this, date) || [];
        const economic = (this.economicEvents || []).filter(event => sameDay(event.date, date));
        return local.concat(economic);
      };
    }

    const originalRenderEvents = app.renderEvents;
    if (typeof originalRenderEvents === 'function') {
      app.renderEvents = function () {
        if (!this.eventsList) return;
        const eventsForDate = this.getEventsForDate(this.selectedDate);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (this.selectedDateLabel) this.selectedDateLabel.textContent = monthNames[this.selectedDate.getMonth()] + ' ' + this.selectedDate.getDate() + ', ' + this.selectedDate.getFullYear();
        if (this.eventsCount) this.eventsCount.textContent = eventsForDate.length + ' событий';

        if (eventsForDate.length === 0) {
          this.eventsList.innerHTML = `<div class="no-events">${this.t('empty_calendar_events')}</div>`;
          return;
        }

        const colorMap = { trade: 'green', alert: 'orange', meeting: 'purple', analysis: 'yellow', break: 'secondary' };
        const impactLabel = event => event.impact ? ` · ${this.escapeHtml(event.impact)}` : '';
        this.eventsList.innerHTML = eventsForDate.map(event => {
          const type = Object.prototype.hasOwnProperty.call(colorMap, event.type) ? event.type : 'analysis';
          const meta = event.isEconomic
            ? `<span class="event-type">${this.escapeHtml(event.country || 'MACRO')}${impactLabel(event)}</span>`
            : `<span class="event-type">${this.escapeHtml(type)}</span>`;
          const values = event.isEconomic
            ? `<span class="trade-item-meta">Forecast: ${this.escapeHtml(event.forecast || '—')} · Previous: ${this.escapeHtml(event.previous || '—')}</span>`
            : '';
          const deleteButton = event.isEconomic ? '' : `<button class="event-delete" data-id="${this.escapeHtml(event.id)}" title="Delete">×</button>`;
          return `<div class="event-item-modern" style="border-left-color: var(--brand-${colorMap[type]});">
              <span class="event-dot ${type}"></span>
              <span class="event-title">${this.escapeHtml(event.title)}</span>
              ${meta}${values}${deleteButton}
            </div>`;
        }).join('');

        this.eventsList.querySelectorAll('.event-delete').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            if (confirm('Удалить это событие?')) this.deleteEvent(id);
          });
        });
      };
    }

    const originalUpdateCalendarBadge = app.updateCalendarBadge;
    if (typeof originalUpdateCalendarBadge === 'function') {
      app.updateCalendarBadge = function () {
        if (!this.calendarBadge) return;
        const now = new Date();
        const localCount = (this.events || []).filter(event => sameDayMonth(event.date, now)).length;
        const economicCount = (this.economicEvents || []).filter(event => sameDayMonth(event.date, now)).length;
        this.calendarBadge.textContent = localCount + economicCount;
      };
    }

    function sameDayMonth(a, b) {
      return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
    }

    app.loadEconomicCalendar();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
