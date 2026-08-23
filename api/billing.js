import { currentUser } from './auth.js';
import { sbJson } from './_supabase.js';

const STRIPE = 'https://api.stripe.com/v1';
const PRICE_CENTS = 499;
const CURRENCY = 'usd';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function stripeKey() { return process.env.STRIPE_SECRET_KEY || ''; }

async function stripe(path, options = {}) {
  if (!stripeKey()) throw new Error('Stripe пока не подключён: добавь STRIPE_SECRET_KEY в Vercel Environment Variables.');
  const response = await fetch(`${STRIPE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${stripeKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Stripe error ${response.status}`);
  return data;
}

function formEncode(entries) {
  const p = new URLSearchParams();
  for (const [key, value] of entries) if (value !== undefined && value !== null) p.append(key, String(value));
  return p.toString();
}

async function updatePro(userId, subscription, customerId) {
  const end = subscription?.current_period_end
    ? new Date(Number(subscription.current_period_end) * 1000).toISOString()
    : null;
  const active = ['active', 'trialing'].includes(subscription?.status);
  const patch = {
    plan: active ? 'pro' : 'free',
    pro_until: active ? end : null,
    stripe_customer_id: customerId || null,
    stripe_subscription_id: subscription?.id || null
  };
  await sbJson(`users?id=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(patch)
  });
  return patch;
}

export default async function handler(req, res) {
  try {
    const user = await currentUser(req);
    if (!user) return json(res, 401, { error: 'Войдите в аккаунт.' });

    const action = String(req.query?.action || 'checkout');

    if (req.method === 'POST' && action === 'checkout') {
      if (user.pro_active) return json(res, 200, { active: true, message: 'PRO уже активен.' });

      const origin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
      const session = await stripe('/checkout/sessions', {
        method: 'POST',
        body: formEncode([
          ['mode', 'subscription'],
          ['success_url', `${origin}/?billing=success&session_id={CHECKOUT_SESSION_ID}`],
          ['cancel_url', `${origin}/?billing=cancelled`],
          ['customer_email', user.email],
          ['line_items[0][price_data][currency]', CURRENCY],
          ['line_items[0][price_data][product_data][name]', 'KriptoDanik AI PRO'],
          ['line_items[0][price_data][product_data][description]', 'Полный доступ к KriptoDanik AI PRO на месяц'],
          ['line_items[0][price_data][unit_amount]', PRICE_CENTS],
          ['line_items[0][price_data][recurring][interval]', 'month'],
          ['line_items[0][quantity]', 1],
          ['metadata[user_id]', user.id],
          ['metadata[product]', 'kriptodanik-pro'],
          ['subscription_data[metadata][user_id]', user.id],
          ['subscription_data[metadata][product]', 'kriptodanik-pro']
        ])
      });

      return json(res, 200, { checkout_url: session.url, session_id: session.id });
    }

    if (req.method === 'POST' && action === 'confirm') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const sessionId = String(body.session_id || '').trim();
      if (!sessionId || !sessionId.startsWith('cs_')) return json(res, 400, { error: 'Некорректная платёжная сессия.' });

      const session = await stripe(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
      if (session?.metadata?.user_id !== user.id) return json(res, 403, { error: 'Платёж не принадлежит этому аккаунту.' });
      if (session?.mode !== 'subscription' || session?.payment_status !== 'paid') {
        return json(res, 402, { error: 'Оплата ещё не подтверждена.', status: session?.payment_status || 'unknown' });
      }

      const subscription = session.subscription
        ? await stripe(`/subscriptions/${encodeURIComponent(session.subscription)}`)
        : null;
      if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
        return json(res, 402, { error: 'Подписка не активна.' });
      }

      await updatePro(user.id, subscription, session.customer);
      const fresh = await currentUser(req);
      return json(res, 200, { success: true, user: fresh });
    }

    return json(res, 405, { error: 'Method not allowed.' });
  } catch (e) {
    console.error('Billing API:', e);
    return json(res, 500, { error: e.message || 'Billing service failed.' });
  }
}
