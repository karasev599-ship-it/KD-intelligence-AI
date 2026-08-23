const OPENAI_URL = 'https://api.openai.com/v1/responses';
const MODEL = process.env.SCANNER_MODEL || 'gpt-5.6-luna';
const MAX_IMAGE_CHARS = 14_000_000;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function localFallback(reason = 'Vision-модель недоступна.') {
  return {
    asset: null,
    direction: null,
    timeframe: null,
    entry: null,
    stop_loss: null,
    take_profit: null,
    setup: 'Автоматическое распознавание Vision пока недоступно. Проверь поля вручную.',
    structures: [],
    confidence: 0,
    warnings: [reason],
    model: 'local',
    local: true
  };
}

function parseImageDataUrl(image) {
  const match = /^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i.exec(image);
  if (!match) return null;
  return { mime: match[1].toLowerCase(), data: match[2].replace(/\s+/g, '') };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const image = String(body.image || '');

    if (!image) return json(res, 400, { error: 'Image is required.' });
    if (image.length > MAX_IMAGE_CHARS) return json(res, 413, { error: 'Image is too large.' });

    const parsedImage = parseImageDataUrl(image);
    if (!parsedImage) {
      return json(res, 400, { error: 'A valid JPEG, PNG, WEBP or GIF data URL is required.' });
    }

    if (!process.env.OPENAI_API_KEY) return json(res, 200, localFallback('OPENAI_API_KEY не настроен.'));

    const schema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        asset: { type: ['string', 'null'] },
        direction: { type: ['string', 'null'], enum: ['LONG', 'SHORT', null] },
        timeframe: { type: ['string', 'null'] },
        entry: { type: ['number', 'null'] },
        stop_loss: { type: ['number', 'null'] },
        take_profit: { type: ['number', 'null'] },
        setup: { type: 'string' },
        structures: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        warnings: { type: 'array', items: { type: 'string' } }
      },
      required: ['asset', 'direction', 'timeframe', 'entry', 'stop_loss', 'take_profit', 'setup', 'structures', 'confidence', 'warnings']
    };

    const input = [{
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: `Ты — AI Scanner графиков KriptoDanik AI. Анализируй только то, что действительно видно на изображении.

Задача:
1) Распознать тикер/актив и таймфрейм, если они читаются.
2) Определить LONG/SHORT только если направление явно обозначено на скриншоте (метка позиции, стрелка, ордер, подпись или другой однозначный визуальный маркер). По одним зелёным/красным свечам направление сделки НЕ угадывай.
3) Распознать Entry, Stop Loss и Take Profit только если соответствующий уровень явно показан/подписан. Не вычисляй и не придумывай цены.
4) Найти только визуально присутствующие торговые структуры: FVG, IFVG, Order Block, Liquidity Sweep, Liquidity, BOS, MSS/CHOCH, Premium/Discount, Pin Bar, Range.
5) setup — короткое описание фактически видимых элементов.
6) confidence 0–100 — уверенность именно в распознавании изображения, НЕ вероятность успеха сделки.
7) warnings — все неоднозначности и поля, которые лучше перепроверить вручную.

Если актив не читается — asset=null. Если направление не обозначено однозначно — direction=null. Если цена не читается явно — соответствующее поле=null. Не давай торговый прогноз и не превращай отсутствие данных в догадку. Все пояснения на русском; тикер, LONG/SHORT и названия структур оставляй в стандартном виде.`
        },
        {
          type: 'input_image',
          image_url: `data:${parsedImage.mime};base64,${parsedImage.data}`,
          detail: 'high'
        }
      ]
    }];

    const upstream = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        input,
        reasoning: { effort: 'medium' },
        max_output_tokens: 1200,
        store: false,
        text: {
          format: {
            type: 'json_schema',
            name: 'chart_scan',
            strict: true,
            schema
          }
        }
      })
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      console.warn('Scanner Vision unavailable:', data?.error?.message || upstream.status);
      return json(res, 200, localFallback(data?.error?.message || `OpenAI HTTP ${upstream.status}`));
    }

    let result = null;
    try {
      result = JSON.parse(String(data?.output_text || ''));
    } catch (_) {
      result = null;
    }

    if (!result || typeof result !== 'object') {
      return json(res, 200, localFallback('Vision-модель вернула некорректный структурированный ответ.'));
    }

    const direction = String(result.direction || '').toUpperCase();
    result.direction = direction === 'LONG' || direction === 'SHORT' ? direction : null;
    result.confidence = Math.max(0, Math.min(100, Number(result.confidence) || 0));
    result.structures = Array.isArray(result.structures) ? result.structures.slice(0, 12) : [];
    result.warnings = Array.isArray(result.warnings) ? result.warnings.slice(0, 12) : [];

    return json(res, 200, {
      ...result,
      model: MODEL,
      local: false
    });
  } catch (error) {
    console.error('Scanner gateway error:', error);
    return json(res, 200, localFallback('Временная ошибка Scanner. Повторите сканирование.'));
  }
}
