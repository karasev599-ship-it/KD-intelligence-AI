// Protect /admin with HTTP Basic Auth when explicitly configured.
// The admin API (/api/admin) independently verifies the signed kd_session and
// is_admin flag, so a missing ADMIN_USER/ADMIN_PASSWORD must not brick the panel.
export default function middleware(request) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  // No Basic Auth configured: let the admin page load so its session-based
  // authorization can provide the real 401/403 response through /api/admin.
  if (!user || !pass) return;

  const auth = request.headers.get('authorization') || '';
  const [scheme, encoded] = auth.split(' ');
  let ok = false;
  if (scheme === 'Basic' && encoded) {
    try {
      const decoded = atob(encoded);
      const i = decoded.indexOf(':');
      ok = i > 0 && decoded.slice(0, i) === user && decoded.slice(i + 1) === pass;
    } catch (_) {}
  }

  if (ok) return;
  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="KriptoDanik AI Admin", charset="UTF-8"' }
  });
}

export const config = { matcher: ['/admin/:path*'] };
