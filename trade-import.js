/* KriptoDanik AI — Trade import foundation (CSV + exchange-ready UI). */
(function () {
  'use strict';

  const MAX_FILE_BYTES = 5 * 1024 * 1024;
  const state = { rows: [], source: 'CSV' };

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function parseCSV(text) {
    const rows = [];
    let row = [], cell = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i], next = text[i + 1];
      if (ch === '"' && quoted && next === '"') { cell += '"'; i++; continue; }
      if (ch === '"') { quoted = !quoted; continue; }
      if (ch === ',' && !quoted) { row.push(cell.trim()); cell = ''; continue; }
      if ((ch === '\n' || ch === '\r') && !quoted) {
        if (ch === '\r' && next === '\n') i++;
        row.push(cell.trim()); cell = '';
        if (row.some(Boolean)) rows.push(row);
        row = [];
        continue;
      }
      cell += ch;
    }
    if (cell || row.length) { row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); }
    if (!rows.length) return [];
    const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, ' ').trim());
    return rows.slice(1).map(values => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
      return obj;
    });
  }

  function pick(row, aliases) {
    for (const key of aliases) {
      if (row[key] !== undefined && row[key] !== '') return row[key];
    }
    return '';
  }

  function normalize(row, source) {
    const rawSide = pick(row, ['side','direction','type','сторона','направление','тип']).toUpperCase();
    const direction = rawSide.includes('SELL') || rawSide.includes('SHORT') || rawSide === 'S' ? 'SHORT' : rawSide ? 'LONG' : '';
    const num = v => { const n = Number(String(v).replace(/\s/g,'').replace(',', '.')); return Number.isFinite(n) ? n : null; };
    return {
      id: `import-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      source,
      symbol: pick(row, ['symbol','ticker','pair','instrument','asset','тикер','инструмент']),
      direction,
      entry: num(pick(row, ['entry','entry price','open price','цена входа','цена открытия'])),
      exit: num(pick(row, ['exit','exit price','close price','цена выхода','цена закрытия'])),
      stopLoss: num(pick(row, ['stop loss','stoploss','sl','стоп лосс','стоп-лосс'])),
      takeProfit: num(pick(row, ['take profit','takeprofit','tp','тейк профит','тейк-профит'])),
      quantity: num(pick(row, ['quantity','qty','size','amount','количество','объем'])),
      pnl: num(pick(row, ['pnl','p l','profit','realized pnl','реализованный pnl','прибыль'])),
      fee: num(pick(row, ['fee','fees','commission','комиссия'])),
      leverage: num(pick(row, ['leverage','плечо'])),
      openedAt: pick(row, ['entry time','open time','opened at','время входа','время открытия']),
      closedAt: pick(row, ['exit time','close time','closed at','время выхода','время закрытия'])
    };
  }

  function modal() {
    let el = document.getElementById('kdTradeImportModal');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'kdTradeImportModal';
    el.innerHTML = `<div class="kd-import-backdrop"></div><section class="kd-import-card" role="dialog" aria-modal="true" aria-label="Import trades">
      <button class="kd-import-close" aria-label="Close">×</button>
      <h2>Import trades</h2>
      <p class="kd-import-sub">CSV now. Read-only exchange connections are the next layer.</p>
      <div class="kd-import-sources"><button class="kd-import-source active" data-source="CSV">📄 CSV</button><button class="kd-import-source" data-source="Binance">Binance</button><button class="kd-import-source" data-source="Bybit">Bybit</button><button class="kd-import-source" data-source="OKX">OKX</button></div>
      <div class="kd-import-security">🔐 Exchange connections will require <b>read-only</b> API permissions. No trade or withdrawal permissions.</div>
      <label class="kd-import-drop">Choose an exchange CSV export<input id="kdTradeImportFile" type="file" accept=".csv,text/csv" hidden><span>Drop CSV here or tap to choose</span></label>
      <div id="kdTradeImportStatus" class="kd-import-status"></div><div id="kdTradeImportPreview"></div>
      <div class="kd-import-actions"><button id="kdTradeImportCancel">Cancel</button><button id="kdTradeImportConfirm" disabled>Import to Journal</button></div>
    </section>`;
    document.body.appendChild(el);
    el.querySelector('.kd-import-backdrop').onclick = close;
    el.querySelector('.kd-import-close').onclick = close;
    el.querySelector('#kdTradeImportCancel').onclick = close;
    el.querySelectorAll('.kd-import-source').forEach(b => b.onclick = () => {
      el.querySelectorAll('.kd-import-source').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); state.source = b.dataset.source;
      if (state.source !== 'CSV') setStatus(`${state.source}: read-only API connector is being prepared. CSV import remains available now.`);
    });
    el.querySelector('#kdTradeImportFile').onchange = e => handleFile(e.target.files?.[0]);
    el.querySelector('#kdTradeImportConfirm').onclick = commit;
    return el;
  }

  function setStatus(text) { const n = document.getElementById('kdTradeImportStatus'); if (n) n.textContent = text; }

  function handleFile(file) {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) return setStatus('CSV is too large. Maximum size is 5 MB.');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCSV(String(reader.result || ''));
        state.rows = parsed.map(r => normalize(r, state.source)).filter(r => r.symbol || r.entry !== null || r.exit !== null);
        if (!state.rows.length) return setStatus('No recognizable trades found. Check the CSV export.');
        setStatus(`${state.rows.length} trades recognized. Review the preview before importing.`);
        renderPreview();
        document.getElementById('kdTradeImportConfirm').disabled = false;
      } catch (e) { setStatus('Could not read this CSV. Please export it as a standard CSV file.'); }
    };
    reader.onerror = () => setStatus('Could not read the selected file.');
    reader.readAsText(file);
  }

  function renderPreview() {
    const target = document.getElementById('kdTradeImportPreview');
    if (!target) return;
    const rows = state.rows.slice(0, 8);
    target.innerHTML = `<div class="kd-import-table-wrap"><table><thead><tr><th>Symbol</th><th>Side</th><th>Entry</th><th>Exit</th><th>P&L</th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.symbol)}</td><td>${esc(r.direction)}</td><td>${esc(r.entry ?? '—')}</td><td>${esc(r.exit ?? '—')}</td><td>${esc(r.pnl ?? '—')}</td></tr>`).join('')}</tbody></table></div>${state.rows.length > 8 ? `<small>Showing 8 of ${state.rows.length}</small>` : ''}`;
  }

  function commit() {
    if (!state.rows.length) return;
    // Do not guess the app's internal trade schema. Emit a single integration event;
    // the existing Journal can consume it without creating a second storage layer.
    window.dispatchEvent(new CustomEvent('kd:trades-imported', { detail: { source: state.source, trades: state.rows } }));
    setStatus(`${state.rows.length} trades prepared for Journal.`);
    const confirm = document.getElementById('kdTradeImportConfirm');
    if (confirm) confirm.disabled = true;
    setTimeout(close, 700);
  }

  function open() { modal().classList.add('open'); document.body.classList.add('kd-import-open'); }
  function close() { const el = document.getElementById('kdTradeImportModal'); if (el) el.classList.remove('open'); document.body.classList.remove('kd-import-open'); }

  function injectButton() {
    if (document.getElementById('kdOpenTradeImport')) return;
    const btn = document.createElement('button');
    btn.id = 'kdOpenTradeImport'; btn.type = 'button'; btn.className = 'kd-import-trigger';
    btn.innerHTML = '↥ Import trades'; btn.title = 'Import trades from CSV / exchange exports'; btn.onclick = open;
    document.body.appendChild(btn);
  }

  function init() { injectButton(); }
  window.KDTradeImport = { open, init, parseCSV, normalize };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
