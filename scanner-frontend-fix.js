/* KriptoDanik AI — AI Scanner frontend integration fix
   Bridges /api/scanner Structured Output into the EXISTING Scanner UI.
   No second form, no React, no duplicate Journal storage path.
*/
(function () {
  'use strict';

  const boot = () => {
    const app = window.App;
    if (!app || typeof app.analyzeScannerImage !== 'function') return false;
    if (app.__kdScannerFrontendFix) return true;
    app.__kdScannerFrontendFix = true;

    const original = app.analyzeScannerImage.bind(app);
    app.__kdScannerOriginalAnalyze = original;

    const text = (value) => String(value ?? '').trim();
    const setStatus = (value) => {
      if (app.scannerAnalysisStatus) app.scannerAnalysisStatus.textContent = value;
    };

    const normalizeDirection = (value) => {
      const v = text(value).toUpperCase();
      if (v === 'LONG') return 'long';
      if (v === 'SHORT') return 'short';
      return '';
    };

    const setNumber = (el, value) => {
      if (!el || value === null || value === undefined || value === '') return;
      const n = Number(value);
      if (Number.isFinite(n)) el.value = String(n);
    };

    const markStructures = (structures) => {
      if (!app.scannerStructuresGrid) return;
      const list = Array.isArray(structures) ? structures : [];
      const normalized = list.map(x => text(x).toLowerCase());
      Object.entries(app.scannerStructureLabels || {}).forEach(([key, label]) => {
        const aliases = [key, text(label).toLowerCase()];
        const found = normalized.some(item => aliases.some(alias => item === alias || item.includes(alias) || alias.includes(item)));
        if (!found) return;
        const cb = app.scannerStructuresGrid.querySelector(`[data-structure-cb="${key}"]`);
        if (cb) {
          cb.checked = true;
          cb.closest('.scanner-structure-chip')?.classList.add('checked');
        }
      });
    };

    app.analyzeScannerImage = async function () {
      if (!this.scannerScreenshot) return;
      const en = this.currentLang === 'en';
      if (this.scannerAnalyzeBtn) this.scannerAnalyzeBtn.disabled = true;
      setStatus(en ? 'AI Vision is scanning the chart…' : 'AI Vision сканирует график…');

      try {
        const response = await fetch('/api/scanner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ image: this.scannerScreenshot })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);

        // The backend accepts either the new names or the earlier bridge names.
        const asset = text(data.asset || data.symbol);
        const timeframe = text(data.timeframe || data.tf);
        const direction = normalizeDirection(data.direction || data.side);
        const entry = data.entry_price ?? data.entry ?? null;
        const stop = data.stop_loss ?? data.stopLoss ?? null;
        const target = data.take_profit ?? data.takeProfit ?? null;
        const patterns = Array.isArray(data.detected_patterns)
          ? data.detected_patterns
          : (Array.isArray(data.structures) ? data.structures : []);
        const confidence = Number(data.confidence);
        const warnings = Array.isArray(data.warnings) ? data.warnings.map(text).filter(Boolean) : [];

        if (this.scannerAsset && asset) this.scannerAsset.value = asset.toUpperCase();
        if (this.scannerTimeframe && timeframe) this.scannerTimeframe.value = timeframe;
        setNumber(this.scannerEntry, entry);
        setNumber(this.scannerStopLoss, stop);
        setNumber(this.scannerTakeProfit, target);
        if (direction) this.setScannerDirection(direction);
        markStructures(patterns);

        // Keep the existing Scanner setup/notes field as the single place for
        // the human-readable handoff into Journal.
        const parts = [];
        if (patterns.length) parts.push((en ? 'AI structures: ' : 'AI-структуры: ') + patterns.map(text).filter(Boolean).join(', '));
        if (warnings.length) parts.push((en ? 'Warnings: ' : 'Предупреждения: ') + warnings.join(' · '));
        if (parts.length && this.scannerSetup) this.scannerSetup.value = parts.join(' | ');

        if (this.scannerOcrText) {
          this.scannerOcrText.textContent = warnings.length
            ? warnings.join(' · ')
            : (en ? 'Vision scan completed. Review every detected field before saving.' : 'Vision-анализ завершён. Проверьте все распознанные поля перед сохранением.');
        }

        if (this.scannerConfidenceNote) {
          const confidenceText = Number.isFinite(confidence) && confidence >= 0
            ? `AI Vision · ${Math.round(confidence)}% confidence`
            : (en ? 'AI Vision · confidence not provided' : 'AI Vision · уверенность не указана');
          this.scannerConfidenceNote.innerHTML = `<span class="scanner-confidence-badge">${this.escapeHtml ? this.escapeHtml(confidenceText) : confidenceText}</span>`;
        }

        setStatus(en
          ? 'AI scan complete. Check the fields and then confirm → Journal.'
          : 'AI-анализ завершён. Проверьте поля и нажмите «Подтвердить → В Journal».');
      } catch (error) {
        console.warn('AI Scanner Vision unavailable; using existing OCR fallback.', error);
        setStatus(en
          ? 'AI Vision unavailable — switching to the existing OCR/manual scanner.'
          : 'AI Vision недоступен — переключаюсь на существующий OCR/ручной режим.');
        await original();
      } finally {
        if (this.scannerAnalyzeBtn) this.scannerAnalyzeBtn.disabled = false;
      }
    };

    return true;
  };

  const tryBoot = () => {
    if (boot()) return;
    setTimeout(tryBoot, 250);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryBoot, { once: true });
  else tryBoot();
  window.addEventListener('load', tryBoot, { once: true });
})();
