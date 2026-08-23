// Protect /admin with server-side HTTP Basic Auth.
// Add ADMIN_USER and ADMIN_PASSWORD in Vercel Project Settings -> Environment Variables.
export default function middleware(request) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
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
  if (user && pass && ok) return;
  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="KriptoDanik AI Admin", charset="UTF-8"' }
  });
}
export const config = { matcher: ['/admin/:path*'] };
