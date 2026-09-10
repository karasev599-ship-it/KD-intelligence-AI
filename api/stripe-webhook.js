import crypto from 'node:crypto';
import { sbJson } from './_supabase.js';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

const STRIPE = 'https://api.stripe.com/v1';
const SIGNATURE_TOLERANCE_SECONDS = 300;

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
    req.on('data', chunk => {
      data += chunk;
      if (Buffer.byteLength(data, 'utf8') > 256 * 1024) reject(Object.assign(new Error('Webhook body is too large.'), { status: 413 }));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function verifyStripeSignature(rawBody, header, secret) {
  if (!secret || !header) return false;
  const parts = String(header).split(',');
  const timestampPart = parts.find(x => x.startsWith('t='));
  const signatures = parts.filter(x => x.startsWith('v1=')).map(x => x.slice(3));
  const timestamp = Number(timestampPart?.slice(2));
  if (!Number.isFinite(timestamp) || !signatures.length) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return false;
  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  return signatures.some(sig => {
    if (!/^[0-9a-f]{64}$/i.test(sig)) return false;
    const got = Buffer.from(sig, 'hex');
    return got.length === expectedBuf.length && crypto.timingSafeEqual(got, expectedBuf);
  });
}

async function syncSubscription(subscription) {
  const userId = subscription?.metadata?.user_id;
  if (!userId) return { skipped: true, reason: 'missing user_id metadata' };
  const active = ['active', 'trialing'].includes(subscription.status);
  const end = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;
  await sbJson(`users?id=${encodeURIComponent(userId)}`, {
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
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    if (!webhookSecret) return json(res, 503, { error: 'Stripe webhook verification is not configured.' });

    const raw = await getRawBody(req);
    const signature = req.headers['stripe-signature'];
    if (!verifyStripeSignature(raw, signature, webhookSecret)) {
      return json(res, 400, { error: 'Invalid Stripe webhook signature.' });
    }

    const body = JSON.parse(raw || '{}');
    const eventId = String(body.id || '');
    if (!eventId.startsWith('evt_')) return json(res, 400, { error: 'Invalid Stripe event.' });

    // Signature verification authenticates the sender; fetching the event by ID
    // from Stripe adds a second integrity check before any subscription mutation.
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
    return json(res, e.status === 413 ? 413 : 500, { error: e.message || 'Webhook failed.' });
  }
}
