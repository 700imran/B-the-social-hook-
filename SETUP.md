# Local Setup & First Admin

## 1. Requirements

- Node.js 22 LTS or a compatible supported Node 22 release.
- npm.
- A Supabase project with Auth, PostgreSQL and Storage enabled.
- A GitHub repository for the CI workflows.
- Razorpay account and API/webhook credentials only when you are ready to test paid promotion.

## 2. Install

```bash
cp .env.example .env.local
npm install
```

`npm install` generates `package-lock.json`. Commit that file. The CI workflows use `npm ci` once the lockfile exists and fall back to `npm install` for the initial bootstrap only.

## 3. Configure Supabase

Set these values in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The service-role key must remain server-side. Never prefix it with `NEXT_PUBLIC_`, put it in client code, or commit it.

### Apply database migrations

Apply every SQL file in `supabase/migrations/` in ascending numeric order. Use the Supabase SQL Editor or link this repository to the Supabase CLI and run `supabase db push`.

Files currently included:

1. `0001_showoff_core.sql`
2. `0002_public_metrics_and_battle_results.sql`
3. `0003_profile_relations.sql`
4. `0004_privacy_requests.sql`
5. `0005_payment_fulfillment.sql`
6. `0006_community_interactions.sql`
7. `0007_privacy_hardening.sql`
8. `0008_hide_live_vote_totals.sql`
9. `0009_battle_controls.sql`
10. `0010_analytics_consent_and_constraints.sql`
11. `0011_mask_private_profile_data.sql`
12. `0012_require_aal2_for_privileged_actions.sql`
13. `0013_submission_owner_lifecycle.sql`
14. `0014_payment_refund_reconciliation.sql`
15. `0015_scoped_popularity_leaderboards.sql`

Do not skip or reorder migrations. Apply to a staging project first and inspect the resulting RLS policies, triggers, RPC grants and storage bucket policies.

### Configure Supabase Auth

In Supabase Auth settings:

- Set the Site URL to the deployed site origin.
- Add `http://localhost:3000/auth/callback` to local redirect URLs.
- Add the production callback URL, for example `https://your-domain.com/auth/callback`.
- Enable email confirmation before public voting/commenting is opened.
- Configure email delivery and test signup, verification, password reset and session revocation.
- Set secure session and password policies appropriate to your launch market.

The app uses Supabase SSR cookies via `@supabase/ssr`. The `proxy.ts` file refreshes the auth session.

## 4. Create the first administrator

1. Sign up through `/auth/sign-up` with the operator's real email.
2. Confirm the email using Supabase's configured mail delivery.
3. Find that user's UUID in Supabase Auth > Users.
4. In SQL Editor, execute the following with the actual UUID:

```sql
insert into public.admin_roles (user_id, role)
values ('REPLACE_WITH_AUTH_USER_UUID', 'admin')
on conflict (user_id, role) do nothing;
```

5. Open `/settings/security`, enrol a TOTP authenticator and verify it. Privileged database functions require an AAL2 token. On later logins, the login form prompts for the authenticator code.
6. Visit `/admin` and verify the moderation and product panels appear.

Do not add the admin role to a shared or unverified mailbox. Keep a second, separately secured recovery administrator under controlled ownership.

## 5. Run the application

```bash
npm run dev
```

Open `http://localhost:3000`. Without Supabase variables, public pages render explanatory empty states; authentication, submissions, voting and account actions remain unavailable. That is intentional and not a mocked backend.

## 6. Payment configuration — test mode first

Promotion products are seeded with `enabled=false`. Keep them disabled until the entire flow passes sandbox tests.

Set server-only values in `.env.local`:

```dotenv
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

Configure a Razorpay webhook to:

`https://YOUR_DOMAIN/api/payments/webhook`

Subscribe to `payment.captured`, `payment.failed` and `refund.processed`. Use the exact webhook secret configured in Razorpay. A captured payment is the only event that grants an entitlement; an order-paid or browser redirect event alone does not. Do not treat a browser redirect as payment proof; this app only fulfils an order after a verified webhook.

In `/admin`, enable `featured_7d` and set its actual price only after confirming the promotion inventory and delivery terms. The seeded value is a test placeholder, not a validated price recommendation. Test:

- Successful payment and correct user entitlement.
- Wrong amount/currency and invalid signatures.
- Duplicate/replayed webhook event.
- Failed payment.
- Refund and entitlement cancellation.
- A user attempting to use another user's order/entitlement.

Do not use production keys until test-mode evidence is recorded. No card data is stored by SHOWOFF.

## 7. Enable first launch niches

The migrations seed three active launch niches:

- `creators`
- `startups-products`
- `design-digital-builds`

Additional niches are disabled. Do not enable empty categories just to create the appearance of scale. Open a new niche only after it has a moderation owner, enough real submission supply and a defined ranking methodology.

## 8. CI and tests

The GitHub Actions workflows are in `.github/workflows/`.

After creating `package-lock.json`, commit it so CI uses deterministic `npm ci`. Configure GitHub branch protection to require the CI and E2E jobs, review and status checks.

Run locally:

```bash
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

The current browser tests are smoke tests, not a complete security or payment certification. Add staging integration tests with a disposable Supabase project and payment-provider test account before public launch.
