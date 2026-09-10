import { SUPABASE_URL, SERVICE_KEY, assertConfigured } from './_supabase.js';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function bearer(req) {
  const raw = String(req.headers?.authorization || '');
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

async function supabaseUser(accessToken) {
  assertConfigured();
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${accessToken}` }
  });
  if (!r.ok) return null;
  return r.json().catch(() => null);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const token = bearer(req);
    if (!token || token.length > 8192) return json(res, 401, { error: 'Войдите в аккаунт.' });

    const user = await supabaseUser(token);
    if (!user?.id) return json(res, 401, { error: 'Сессия недействительна.' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const otherUserId = String(body.other_user_id || '').trim();
    if (!/^[0-9a-f-]{36}$/i.test(otherUserId) || otherUserId === user.id) {
      return json(res, 400, { error: 'Некорректный пользователь.' });
    }

    const rpc = await fetch(`${SUPABASE_URL}/rest/v1/rpc/kd_create_direct_conversation_for_user`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_user_id: user.id, p_other_user_id: otherUserId })
    });
    const data = await rpc.json().catch(() => null);
    if (!rpc.ok) {
      console.warn('Direct conversation RPC failed:', rpc.status, data?.message || data);
      return json(res, rpc.status === 404 ? 404 : 400, { error: 'Не удалось создать чат.' });
    }
    return json(res, 200, { conversation_id: data });
  } catch (error) {
    console.error('Messenger direct gateway error:', error);
    return json(res, 500, { error: 'Ошибка создания чата.' });
  }
}
