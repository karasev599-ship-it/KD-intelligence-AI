import { sbJson } from './_supabase.js';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

const STRIPE = 'https://api.stripe.com/v1';

async function stripe(path) {
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured.');
  const r = await fetch(`${STRIPE}${path}`, { headers: { Authorization: `Bearer ${key}` } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error?.message || `Stripe error ${r.status}`);
  return d;
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function syncSubscription(subscription) {
  const userId = subscription?.metadata?.user_id;
  if (!userId) return { skipped: true, reason: 'missing user_id metadata' };
  const active = ['active', 'trialing'].includes(subscription.status);
  const end = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;
  await sbJson(`users?id=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      plan: active ? 'pro' : 'free',
      pro_until: active ? end : null,
      stripe_customer_id: subscription.customer || null,
      stripe_subscription_id: subscription.id || null
    })
  });
  return { userId, plan: active ? 'pro' : 'free', pro_until: end };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  try {
    // Stripe webhook events are fetched from Stripe by ID rather than trusting
    // the request body. Set STRIPE_WEBHOOK_SECRET when signature verification
    // is added; until then this endpoint is intentionally not advertised as a
    // public payment authority and only accepts an event_id plus the Stripe API
    // verifies the event contents.
    const raw = await getRawBody(req);
    const body = JSON.parse(raw || '{}');
    const eventId = String(body.id || '');
    if (!eventId.startsWith('evt_')) return json(res, 400, { error: 'Invalid Stripe event.' });

    const event = await stripe(`/events/${encodeURIComponent(eventId)}`);
    const type = event.type || '';
    if (type === 'customer.subscription.created' || type === 'customer.subscription.updated' || type === 'customer.subscription.deleted') {
      const result = await syncSubscription(event.data?.object);
      return json(res, 200, { received: true, result });
    }
    if (type === 'checkout.session.completed') {
      const session = event.data?.object;
      if (session?.subscription) {
        const subscription = await stripe(`/subscriptions/${encodeURIComponent(session.subscription)}`);
        const result = await syncSubscription(subscription);
        return json(res, 200, { received: true, result });
      }
    }
    return json(res, 200, { received: true, ignored: type });
  } catch (e) {
    console.error('Stripe webhook:', e);
    return json(res, 500, { error: e.message || 'Webhook failed.' });
  }
}
