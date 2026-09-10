import crypto from 'node:crypto';
import { sbJson } from './_supabase.js';

function clientFingerprint(req) {
  const forwarded = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || String(req.headers?.['x-real-ip'] || req.socket?.remoteAddress || 'unknown');
  const ua = String(req.headers?.['user-agent'] || '').slice(0, 256);
  return crypto.createHash('sha256').update(`${ip}|${ua}`).digest('hex');
}

async function rateLimit(req, bucket, maxHits, windowSeconds = 60, extraSubject = '') {
  const subject = crypto.createHash('sha256')
    .update(`${clientFingerprint(req)}|${String(extraSubject).slice(0, 160)}`)
    .digest('hex');
  try {
    const result = await sbJson('rpc/check_api_rate_limit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p_bucket: String(bucket).slice(0, 80),
        p_subject_hash: subject,
        p_window_seconds: windowSeconds,
        p_max_hits: maxHits
      })
    });
    return result === true;
  } catch (error) {
    console.error('Rate-limit check failed:', error);
    return false;
  }
}

function rateLimited(res, retryAfter = 60) {
  res.setHeader('Retry-After', String(retryAfter));
  res.statusCode = 429;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ error: 'Слишком много запросов. Попробуйте позже.' }));
}

export { rateLimit, rateLimited, clientFingerprint };
