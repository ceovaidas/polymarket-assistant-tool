# Clipwright — app (login, credits, AI video)

Next.js 15 + Supabase (accounts, database) + Stripe (payments) + Kie.ai (video models).

## What is inside

| Part | Where |
|---|---|
| Register / sign in / Google / password reset | `app/register`, `app/login`, `app/forgot`, `app/auth/*` |
| Pages that need sign-in | `middleware.ts` (`/studio`, `/dashboard`, `/credits`) |
| Database: profiles, credit history, jobs + safe credit functions | `supabase/migrations/0001_init.sql` |
| Credit packs and model prices | `lib/pricing.ts` |
| Buy credits (Stripe Checkout) + webhook that adds them | `app/api/checkout`, `app/api/stripe/webhook` |
| Start a video (charges credits, refunds on failure) | `app/api/generate` |
| Video finished callback + status | `app/api/kie/callback`, `app/api/jobs/[id]` |

Rules the code enforces:
- Prices are calculated on the server, never taken from the browser.
- Credits change only through `spend_credits` / `add_credits` in the database (atomic, cannot go below 0).
- A paid Stripe session adds credits once, even if Stripe sends the webhook twice.
- A failed video is refunded once.
- The browser can read only its own balance, history and jobs.

## Setup (about 30 minutes)

1. **Supabase** (free): create a project → SQL Editor → paste and run `supabase/migrations/0001_init.sql`.
   Authentication → URL Configuration: set Site URL to your domain and add `https://YOUR-DOMAIN/auth/callback` to Redirect URLs.
   Optional: Authentication → Providers → Google.
2. **Stripe**: Developers → API keys (secret key). Webhooks → add endpoint `https://YOUR-DOMAIN/api/stripe/webhook`,
   events `checkout.session.completed` and `checkout.session.async_payment_succeeded` → copy the signing secret.
3. **Kie.ai**: create an API key and add balance.
4. **Vercel** (free): import this folder, add the variables from `.env.example`, deploy.
   `KIE_CALLBACK_TOKEN` is any long random string.
5. Test with Stripe test mode (card `4242 4242 4242 4242`) before going live.

Local run: `cp .env.example .env.local`, fill it in, `npm install`, `npm run dev`.

## Before launch
- Check current provider prices and adjust `providerUsdPerSec` / `creditsPerSec` in `lib/pricing.ts`.
- Add Terms, Privacy Policy and a refund policy page (needed for Stripe and the EU).
- Add rate limiting on `/api/generate` (e.g. Upstash) to stop abuse of the free credits.
