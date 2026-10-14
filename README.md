# Peak Nuts

Static storefront + admin dashboard with a single Express/MongoDB API.

## Structure

| Path | Purpose |
| --- | --- |
| `*.html`, `styles.css`, `script.js`, `account.js`, `admin.js` | Static frontend (served by Vercel) |
| `api/index.js` | The one backend: Express app (MongoDB via Mongoose). Exported as a Vercel serverless function, and runnable locally. |
| `sw.js` | Service worker (network-first, cache fallback) |
| `vercel.json` | Routing, `cleanUrls`, security headers |
| `scripts/smoke-test.js` | End-to-end smoke test |

There is intentionally **a single backend** (`api/index.js`) so local dev and
production behave identically.

## Environment variables

Set these in the Vercel project (and in a local `.env` for development):

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | yes | MongoDB connection string |
| `ADMIN_USERNAME` | yes | Admin login username |
| `ADMIN_PASSWORD` | yes | Admin login password (use a strong, unique value) |
| `EMAIL_USER` | no | Gmail address used as the sender for notification emails |
| `EMAIL_PASS` | no | Gmail app password |
| `SITE_URL` | no | Public base URL used in verification links (default: the Vercel alias) |

Order/verification emails are sent with `nodemailer`; if the email variables are
not set, the site still works and email sending is logged and skipped.

## Local development

```bash
npm install
# create .env with MONGO_URI, ADMIN_USERNAME, ADMIN_PASSWORD ...
npm start          # serves api/index.js on http://localhost:5000
```

The API reads `PORT` (default `5000`).

## Deploy

Push to the `main` branch of the Vercel-connected repository. `vercel.json`
pins `framework: null` so the static site is not mistaken for a root server, and
rewrites `/api/*` to the `api/index.js` function.

## Scripts

```bash
npm run check      # syntax-check all JS files
npm start          # run the API locally
npm run smoke      # smoke-test the live site (or: npm run smoke http://localhost:5000)
```

## API overview

Public: `GET /api/products`, `GET /api/reviews/:productId`,
`POST /api/orders`, `POST /api/subscribers`, `POST /api/register`,
`POST /api/user/login`, `POST /api/forgot-password`,
`POST /api/verify-reset-code`, `POST /api/reset-password`,
`POST /api/verify-email`.

Admin (Bearer token): `/api/login`, `/api/orders`, `/api/products`,
`/api/subscribers`, `/api/revenue`, `/api/admin/*`.

User (Bearer token): `/api/user/profile`, `/api/user/orders`,
`/api/user/wishlist`.

## Security notes

- Prices are always recomputed server-side from the catalog; client prices are ignored.
- Admin and user sessions use random 32-byte tokens with a 24h TTL.
- Rate limiting on auth and public-write endpoints; `trust proxy` is set for Vercel.
- Errors return a generic message; details are logged server-side only.
- See `vercel.json` for the Content-Security-Policy and other response headers.
