const OPENAI_URL = 'https://api.openai.com/v1/responses';
const MODEL = process.env.PSYCHOLOGY_MODEL || 'gpt-5.6-luna';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function clampTrades(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 200).map((t) => ({
    date: String(t?.date || '').slice(0, 40),
    asset: String(t?.asset || '').slice(0, 40),
    side: String(t?.side || '').slice(0, 10),
    status: String(t?.status || '').slice(0, 20),
    pnl: Number.isFinite(Number(t?.pnl)) ? Number(t.pnl) : null,
    rr: Number.isFinite(Number(t?.rr)) ? Number(t.rr) : null,
    riskPercent: Number.isFinite(Number(t?.riskPercent)) ? Number(t.riskPercent) : null,
    session: String(t?.session || '').slice(0, 30),
    strategy: String(t?.strategy || '').slice(0, 80),
    emotionBefore: String(t?.emotionBefore || '').slice(0, 30),
    emotionAfter: String(t?.emotionAfter || '').slice(0, 30),
    notes: String(t?.notes || '').slice(0, 600)
  }));
}

function localAnalysis(trades) {
  const total = trades.length;
  const wins = trades.filter(t => t.status === 'win').length;
  const losses = trades.filter(t => t.status === 'loss').length;
  const winRate = total ? Math.round(wins / total * 100) : 0;
  const revenge = trades.filter(t => /revenge|отыг|реванш/i.test(`${t.emotionBefore} ${t.notes}`)).length;
  const fear = trades.filter(t => /fear|страх|anxious|тревож/i.test(`${t.emotionBefore} ${t.notes}`)).length;
  const greed = trades.filter(t => /greed|жадност/i.test(`${t.emotionBefore} ${t.notes}`)).length;
  const emotional = trades.filter(t => !/calm|confident|споко|увер/i.test(String(t.emotionBefore || ''))).length;
  const avgRisk = trades.map(t => Number(t.riskPercent)).filter(Number.isFinite).reduce((a,b)=>a+b,0) / (trades.filter(t=>Number.isFinite(Number(t.riskPercent))).length || 1);
  const critical = revenge >= 2 || (losses >= 3 && total > 5);
  const actions = [];
  if (revenge) actions.push('После убыточной сделки фиксируй причину входа до следующего ордера и не увеличивай риск для отыгрыша.');
  if (fear) actions.push('Перед входом используй короткий чек-лист подтверждения, чтобы тревога не меняла размер позиции или правила входа.');
  if (greed) actions.push('После серии побед отдельно проверяй размер риска: уверенность не должна автоматически увеличивать позицию.');
  if (!actions.length) actions.push('Продолжай отмечать эмоцию до и после каждой сделки — пока данных недостаточно для сильной закономерности.');
  return {
    critical_psychology_leak: critical ? 'Высокий' : (emotional ? 'Средний' : 'Низкий'),
    strong_side: total ? `В журнале ${total} сделок, Win Rate ${winRate}%.` : 'Пока нет сделок.',
    hidden_correlation: revenge ? 'Есть повторяющиеся маркеры реванш-торговли.' : (fear ? 'Есть повторяющиеся маркеры тревоги перед входом.' : 'Явной эмоциональной закономерности по локальным данным не видно.'),
    actionable_advice: actions,
    metrics: { total, wins, losses, winRate, revengeFlags: revenge, fearFlags: fear, greedFlags: greed, avgRisk: Number(avgRisk.toFixed(2)) }
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const trades = clampTrades(body.trades);
    if (trades.length > 200) return json(res, 413, { error: 'Too many trades.' });

    if (!process.env.OPENAI_API_KEY) {
      return json(res, 200, { ...localAnalysis(trades), model: 'local', local: true });
    }

    const schema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        critical_psychology_leak: { type: 'string' },
        strong_side: { type: 'string' },
        hidden_correlation: { type: 'string' },
        actionable_advice: { type: 'array', items: { type: 'string' } },
        metrics: {
          type: 'object', additionalProperties: false,
          properties: {
            total: { type: 'number' }, wins: { type: 'number' }, losses: { type: 'number' },
            winRate: { type: 'number' }, revengeFlags: { type: 'number' }, fearFlags: { type: 'number' },
            greedFlags: { type: 'number' }, avgRisk: { type: 'number' }
          },
          required: ['total','wins','losses','winRate','revengeFlags','fearFlags','greedFlags','avgRisk']
        }
      },
      required: ['critical_psychology_leak','strong_side','hidden_correlation','actionable_advice','metrics']
    };

    const input = [
      {
        role: 'developer',
        content: `Ты — модуль психологии трейдера KriptoDanik AI. Анализируй только предоставленный журнал. Не ставь медицинских диагнозов и не называй пользователя психически больным. Ищи поведенческие паттерны: revenge trading, FOMO/жадность, страх, изменение риска, повторяющиеся эмоции до/после, связь эмоций с win/loss. Не выдумывай отсутствующие данные. critical_psychology_leak — краткая оценка силы поведенческой проблемы. strong_side — конкретная сильная сторона. hidden_correlation — только если есть основание в данных. actionable_advice — 2–4 конкретных действия. Все строки на русском.`
      },
      { role: 'user', content: `Журнал сделок JSON:\n${JSON.stringify(trades)}` }
    ];

    const upstream = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        input,
        reasoning: { effort: 'medium' },
        max_output_tokens: 1400,
        store: false,
        text: { format: { type: 'json_schema', name: 'trading_psychology', strict: true, schema } }
      })
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.warn('Psychology AI unavailable:', data?.error?.message || upstream.status);
      return json(res, 200, { ...localAnalysis(trades), model: 'local', local: true, gatewayError: true });
    }

    let parsed = null;
    const text = String(data?.output_text || '').trim();
    try { parsed = JSON.parse(text); } catch (_) {}
    if (!parsed) return json(res, 200, { ...localAnalysis(trades), model: 'local', local: true });
    return json(res, 200, { ...parsed, model: MODEL, local: false });
  } catch (error) {
    console.error('Psychology gateway error:', error);
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      return json(res, 200, { ...localAnalysis(clampTrades(body.trades)), model: 'local', local: true });
    } catch (_) {
      return json(res, 500, { error: 'Psychology analysis failed.' });
    }
  }
}
