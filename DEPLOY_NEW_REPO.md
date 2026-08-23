# KriptoDanik AI — clean deployment v1.12.0

## What was fixed
- Restored the real authentication modal directly in `index.html`.
- First visit opens **Registration**; returning visitors see **Login**.
- Registration asks for the nickname once and sends it to the backend.
- After login/registration the Trading Profile wizard starts from **step 2**, so the nickname is not requested again.
- Added safe navigation fallback.
- Chart initialization is guarded when Chart.js is unavailable.
- Service Worker cache bumped to `kd-intelligence-v1.12.0`.
- `sw-register.js` updated to the same cache-busting version.
- Link preview (`assets/og-image.png`) now uses **variant 2 — green KD Intelligence**.
- Favicon files are already variant 2.
- Vercel build is now a no-op static build; it will not rewrite the HTML during deployment.

## GitHub
Extract this ZIP and upload the **contents** to the root of the new `KriptoDanik_AI` repository.

Do not upload the outer ZIP file itself as the only repository file.

## Vercel
Connect the new GitHub repository as a new Vercel project.

Required environment variables for backend features:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET`
- payment/AI variables used by the API routes, if enabled

The static frontend can load without the backend, but registration/login/admin/billing require the server environment variables.
