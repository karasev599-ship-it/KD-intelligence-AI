/* KriptoDanik AI — AI Coach live-render compatibility fix.
 * Kept outside the Service Worker so runtime behaviour is deterministic.
 */
(() => {
  'use strict';
  try {
    const app = window.App;
    if (!app || app.__kdCoachLiveRenderFix) return;
    app.__kdCoachLiveRenderFix = true;

    const live = () => {
      const messages = document.getElementById('aiMessages');
      const input = document.getElementById('aiInput');
      if (messages) app.aiMessages = messages;
      if (input) app.aiInput = input;
      return messages;
    };

    const render = () => {
      const box = live();
      if (!box || !Array.isArray(app.aiHistory) || !app.aiHistory.length) return;
      if (typeof app.renderAIHistory === 'function') app.renderAIHistory();
      const current = document.getElementById('aiMessages');
      if (current) {
        app.aiMessages = current;
        const area = document.getElementById('aiChatArea');
        if (area) area.scrollTop = area.scrollHeight;
      }
    };

    const append = app.appendMessage;
    if (typeof append === 'function') {
      app.appendMessage = function (role, content) {
        live();
        const result = append.call(this, role, content);
        render();
        return result;
      };
    }

    const save = app.saveState;
    if (typeof save === 'function') {
      app.saveState = function () {
        const result = save.call(this);
        if (Array.isArray(this.aiHistory) && this.aiHistory.length) render();
        return result;
      };
    }

    const handle = app.handleAIQuery;
    if (typeof handle === 'function') {
      app.handleAIQuery = async function () {
        live();
        return handle.call(this);
      };
    }

    live();
  } catch (error) {
    console.warn('KD Coach live render fix failed', error);
  }
})();
