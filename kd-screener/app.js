"use strict";

/* KD SCREENER — base market-data layer.
   No trading signals are implemented here intentionally. */
const state = {
  symbol: "XAUUSD",
  timeframeMinutes: 5,
  intervalMs: 1000,
  ticks: 0,
  candles: [],
  current: null,
  previous: null,
  lastPrice: null,
  source: "DEMO",
  running: true,
  timer: null
};

const $ = (id) => document.getElementById(id);

function fmt(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "—";
}

function setStatus(kind, text) {
  $("statusDot").className = `dot ${kind}`;
  $("statusText").textContent = text;
  $("feedMode").textContent = state.source;
  $("source").textContent = state.source;
}

function bucketMs() {
  return state.timeframeMinutes * 60 * 1000;
}

function upsertCandle(price, ts) {
  const bucket = Math.floor(ts / bucketMs()) * bucketMs();
  let candle = state.candles[state.candles.length - 1];
  if (!candle || candle.time !== bucket) {
    candle = { time: bucket, open: price, high: price, low: price, close: price };
    state.candles.push(candle);
    if (state.candles.length > 120) state.candles.shift();
  } else {
    candle.high = Math.max(candle.high, price);
    candle.low = Math.min(candle.low, price);
    candle.close = price;
  }
  state.current = candle;
  renderCandleChart();
}

function ingestTick(tick) {
  const price = Number(tick.last ?? tick.price ?? tick.bid);
  if (!Number.isFinite(price)) return;
  const ts = Number(tick.timestamp ?? Date.now());
  state.ticks += 1;
  state.lastPrice = price;
  upsertCandle(price, ts);
  $("price").textContent = fmt(price);
  $("bid").textContent = fmt(Number(tick.bid ?? price));
  $("ask").textContent = fmt(Number(tick.ask ?? price));
  $("updated").textContent = new Date(ts).toLocaleTimeString();
  $("tickCount").textContent = state.ticks.toLocaleString();
  $("candleCount").textContent = state.candles.length.toLocaleString();
  const delta = state.previous == null ? null : price - state.previous;
  $("change").textContent = delta == null ? "Поток данных активен" : `${delta >= 0 ? "+" : ""}${delta.toFixed(2)} от предыдущего тика`;
  state.previous = price;
  updateStructure();
}

function updateStructure() {
  const c = state.current;
  if (!c) return;
  $("currentHigh").textContent = fmt(c.high);
  $("currentLow").textContent = fmt(c.low);
  $("prevHigh").textContent = "—";
  $("prevLow").textContent = "—";
}

function renderCandleChart() {
  const chart = $("chart");
  if (!chart || !state.candles.length) return;
  const w = chart.clientWidth;
  const h = chart.clientHeight;
  if (!w || !h) return;
  const canvas = chart.querySelector("canvas") || document.createElement("canvas");
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(w * ratio);
  canvas.height = Math.floor(h * ratio);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  if (!canvas.parentNode) { chart.innerHTML = ""; chart.appendChild(canvas); }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const visible = state.candles.slice(-70);
  const hi = Math.max(...visible.map(c => c.high));
  const lo = Math.min(...visible.map(c => c.low));
  const range = Math.max(hi - lo, 0.01);
  const xStep = w / Math.max(visible.length, 1);
  const bodyW = Math.max(3, xStep * .56);
  const y = p => h - ((p - lo) / range) * (h - 24) - 12;
  visible.forEach((c, i) => {
    const x = i * xStep + xStep / 2;
    const up = c.close >= c.open;
    ctx.strokeStyle = up ? "#35d49a" : "#ff5d6c";
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y(c.high)); ctx.lineTo(x, y(c.low)); ctx.stroke();
    const top = Math.min(y(c.open), y(c.close));
    const bottom = Math.max(y(c.open), y(c.close));
    ctx.fillRect(x - bodyW / 2, top, bodyW, Math.max(1, bottom - top));
  });
}

function demoTick() {
  if (!state.running) return;
  const base = state.lastPrice ?? 3300;
  const next = base + (Math.random() - 0.5) * 1.8;
  ingestTick({ price: next, bid: next - .03, ask: next + .03, timestamp: Date.now() });
}

function startDemo() {
  stopDemo();
  state.source = "DEMO";
  state.running = true;
  setStatus("demo", "DEMO STREAM");
  $("pauseBtn").textContent = "Пауза";
  $("engineState").textContent = "Поток запущен";
  demoTick();
  state.timer = setInterval(demoTick, state.intervalMs);
}

function stopDemo() {
  if (state.timer) clearInterval(state.timer);
  state.timer = null;
}

function togglePause() {
  state.running = !state.running;
  if (state.running) {
    setStatus("demo", "DEMO STREAM");
    $("pauseBtn").textContent = "Пауза";
    $("engineState").textContent = "Поток запущен";
  } else {
    setStatus("offline", "PAUSED");
    $("pauseBtn").textContent = "Продолжить";
    $("engineState").textContent = "Поток на паузе";
  }
}

function setTimeframe(minutes, button) {
  state.timeframeMinutes = minutes;
  document.querySelectorAll(".control-btn.tf").forEach(b => b.classList.remove("active"));
  button.classList.add("active");
  $("chartTitle").textContent = `${state.symbol} / ${minutes === 60 ? "1H" : `${minutes}M`}`;
  state.candles = [];
  state.current = null;
  state.previous = null;
  if (state.running) demoTick();
}

function resetEngine() {
  state.ticks = 0;
  state.candles = [];
  state.current = null;
  state.previous = null;
  state.lastPrice = null;
  $("price").textContent = "—";
  $("bid").textContent = "—";
  $("ask").textContent = "—";
  $("updated").textContent = "—";
  $("change").textContent = "Ожидание данных";
  $("tickCount").textContent = "0";
  $("candleCount").textContent = "0";
  $("prevHigh").textContent = "—";
  $("prevLow").textContent = "—";
  $("currentHigh").textContent = "—";
  $("currentLow").textContent = "—";
  const chart = $("chart");
  chart.innerHTML = '<div class="empty">Поток данных запускается…</div>';
  if (state.running) demoTick();
}

function connectWebSocket(url) {
  const ws = new WebSocket(url);
  state.source = "LIVE";
  setStatus("offline", "CONNECTING…");
  ws.onopen = () => setStatus("live", "LIVE STREAM");
  ws.onmessage = e => {
    try { ingestTick(typeof e.data === "string" ? JSON.parse(e.data) : e.data); } catch (_) {}
  };
  ws.onerror = () => setStatus("offline", "FEED ERROR");
  ws.onclose = () => setStatus("offline", "DISCONNECTED");
  return ws;
}

function bindControls() {
  $("pauseBtn").addEventListener("click", togglePause);
  $("tickBtn").addEventListener("click", () => {
    if (!state.running) state.running = true;
    demoTick();
  });
  $("resetBtn").addEventListener("click", resetEngine);
  document.querySelectorAll(".control-btn.tf").forEach(button => {
    button.addEventListener("click", () => setTimeframe(Number(button.dataset.tf), button));
  });
  document.querySelectorAll("[data-symbol]").forEach(button => {
    button.addEventListener("click", () => {
      state.symbol = button.dataset.symbol;
      document.querySelectorAll("[data-symbol]").forEach(b => b.classList.remove("active"));
      button.classList.add("active");
      $("chartTitle").textContent = `${state.symbol} / ${state.timeframeMinutes === 60 ? "1H" : `${state.timeframeMinutes}M`}`;
    });
  });
}

window.KDScreener = { ingestTick, connectWebSocket, state, resetEngine };
window.addEventListener("resize", renderCandleChart);
bindControls();
startDemo();
