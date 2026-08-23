/* KriptoDanik AI v1.11.0 — safe AI Scanner PRO enhancement.
   Non-invasive: uses existing Scanner fields and existing Journal save flow. */
(function () {
  "use strict";
  function boot() {
    const ids = ["scannerEntry","scannerStopLoss","scannerTakeProfit","scannerAsset","scannerTimeframe","scannerSetup","scannerStructuresGrid"];
    const els = {};
    ids.forEach(id => els[id] = document.getElementById(id));
    if (!els.scannerEntry || !els.scannerStopLoss || !els.scannerTakeProfit) return;

    const review = document.querySelector(".scanner-review-form");
    if (!review || document.getElementById("scannerProPanel")) return;

    const panel = document.createElement("div");
    panel.id = "scannerProPanel";
    panel.className = "scanner-pro-panel";
    panel.innerHTML = `
      <div class="scanner-pro-head">
        <strong>AI Scanner — Setup Check</strong>
        <span id="scannerProScore" class="scanner-pro-score">— / 100</span>
      </div>
      <div id="scannerProStatus" class="scanner-pro-status">Заполни Entry, SL и TP — проверю сетап.</div>
      <div class="scanner-pro-grid">
        <div><span>RR</span><b id="scannerProRR">—</b></div>
        <div><span>Risk distance</span><b id="scannerProRiskDist">—</b></div>
        <div><span>Reward distance</span><b id="scannerProRewardDist">—</b></div>
        <div><span>Structures</span><b id="scannerProStructures">0</b></div>
      </div>
      <div id="scannerProWarnings" class="scanner-pro-warnings"></div>
    `;
    const disclaimer = review.querySelector(".psc-disclaimer");
    if (disclaimer) review.insertBefore(panel, disclaimer);
    else review.appendChild(panel);

    const style = document.createElement("style");
    style.textContent = `
      .scanner-pro-panel{margin-top:16px;padding:14px 16px;border:1px solid rgba(160,120,255,.28);border-radius:14px;background:rgba(20,16,35,.55)}
      .scanner-pro-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}
      .scanner-pro-score{font-weight:800;font-size:18px}
      .scanner-pro-status{font-size:13px;opacity:.85;margin-bottom:10px}
      .scanner-pro-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
      .scanner-pro-grid div{padding:9px;border-radius:10px;background:rgba(255,255,255,.04)}
      .scanner-pro-grid span{display:block;font-size:11px;opacity:.65}.scanner-pro-grid b{display:block;margin-top:3px}
      .scanner-pro-warnings{margin-top:10px;font-size:12px;line-height:1.5}
      .scanner-pro-warning{margin-top:4px}
      @media(max-width:700px){.scanner-pro-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
    document.head.appendChild(style);

    const q = id => document.getElementById(id);
    function num(el){ const n = parseFloat(el && el.value); return Number.isFinite(n) ? n : null; }

    function update() {
      const entry = num(els.scannerEntry), sl = num(els.scannerStopLoss), tp = num(els.scannerTakeProfit);
      const dir = document.getElementById("scannerDirShort")?.classList.contains("active") ? "short" : "long";
      const checks = [];
      let score = 0;

      if (entry !== null && sl !== null && tp !== null) {
        const risk = Math.abs(entry-sl), reward = Math.abs(tp-entry);
        const rr = risk > 0 ? reward/risk : null;
        q("scannerProRR").textContent = rr !== null ? rr.toFixed(2) : "—";
        q("scannerProRiskDist").textContent = risk ? risk.toFixed(4) : "0";
        q("scannerProRewardDist").textContent = reward ? reward.toFixed(4) : "0";

        const directionOK = dir === "long" ? (sl < entry && tp > entry) : (sl > entry && tp < entry);
        if (directionOK) { score += 35; checks.push("✓ Entry / SL / TP стоят с правильной стороны."); }
        else checks.push("⚠ Проверь направление Entry / SL / TP.");

        if (rr >= 2) { score += 30; checks.push("✓ RR ≥ 1:2."); }
        else if (rr >= 1.5) { score += 20; checks.push("✓ RR приемлемый, но ниже 1:2."); }
        else checks.push("⚠ RR ниже 1:1.5.");

        if (risk > 0 && reward > 0) score += 15;
      } else {
        q("scannerProRR").textContent = "—";
        q("scannerProRiskDist").textContent = "—";
        q("scannerProRewardDist").textContent = "—";
        checks.push("Заполни Entry, Stop Loss и Take Profit.");
      }

      const count = els.scannerStructuresGrid ? els.scannerStructuresGrid.querySelectorAll('input[type="checkbox"]:checked').length : 0;
      q("scannerProStructures").textContent = String(count);
      score += Math.min(20, count * 4);
      if (count) checks.push("✓ Учтено структур: " + count + ".");
      else checks.push("⚠ Не отмечены структуры.");

      q("scannerProScore").textContent = score + " / 100";
      q("scannerProWarnings").innerHTML = checks.map(x => `<div class="scanner-pro-warning">${x}</div>`).join("");
      q("scannerProStatus").textContent =
        score >= 80 ? "Сильная математическая конфигурация. Проверь контекст графика вручную."
        : score >= 60 ? "Умеренный сетап. Нужна ручная проверка структуры и контекста."
        : "Сетап требует дополнительной проверки. Это не торговый сигнал.";
    }

    [els.scannerEntry,els.scannerStopLoss,els.scannerTakeProfit].forEach(el => el.addEventListener("input", update));
    els.scannerStructuresGrid.addEventListener("change", update);
    ["scannerDirLong","scannerDirShort"].forEach(id => q(id)?.addEventListener("click", () => setTimeout(update,0)));
    update();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
