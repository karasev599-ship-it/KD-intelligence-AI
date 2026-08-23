const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function assertConfigured() {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

async function sb(path, options = {}) {
  assertConfigured();
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers
  };
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers });
}

async function sbJson(path, options = {}) {
  const res = await sb(path, options);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = data?.message || data?.hint || data?.details || data?.error || `Supabase ${res.status}`;
    const err = new Error(String(msg)); err.status = res.status; err.data = data; throw err;
  }
  return data;
}

export { SUPABASE_URL, SERVICE_KEY, sb, sbJson, assertConfigured };
