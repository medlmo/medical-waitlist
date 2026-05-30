---
name: Cookie-based JWT auth migration
description: How JWTs are stored and verified — HttpOnly cookies replacing localStorage
---

## Rule
JWTs are stored in **HttpOnly SameSite=Strict** cookies, not localStorage. Never revert to localStorage or Authorization header patterns.

- `doctor_token` cookie — 7-day expiry, set on POST `/api/auth/login`, cleared on POST `/api/auth/logout`
- `admin_token` cookie — 8-hour expiry, set on POST `/api/admin/login`, cleared on POST `/api/admin/logout`
- `backend/middleware/auth.js` reads `req.cookies.doctor_token` (cookie-parser must be loaded before routes)
- `backend/middleware/adminAuth.js` reads `req.cookies.admin_token`
- Frontend axios clients use `withCredentials: true` — no Authorization header, no localStorage token helpers

**Why:** XSS attacks cannot steal HttpOnly cookies; localStorage tokens are trivially exfiltrated by any injected script.

**How to apply:** Any new protected endpoint uses `requireDoctor` or `requireAdmin` as before — no changes needed there. Any new login flow must set the appropriate HttpOnly cookie in the response. The frontend never touches token strings directly.

## CSP
Helmet CSP enabled (was disabled with `contentSecurityPolicy: false`). Directives:
- `script-src 'self'` — no inline scripts, no CDN
- `style-src 'self' 'unsafe-inline'` — Tailwind needs unsafe-inline
- `img-src 'self' data:` — data: for QR codes (qrcode.react SVG)
- `frame-ancestors 'none'` — clickjacking protection
