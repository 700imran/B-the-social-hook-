# Deployment Runbook

## 1. Pre-deployment

- Create separate Supabase staging and production projects.
- Apply every migration to staging and verify RLS, storage and RPC grants.
- Configure Supabase Auth site/redirect URLs and email delivery.
- Assign the first admin and enable MFA.
- Generate and commit `package-lock.json`.
- Run lint, type check, unit tests, E2E tests and production build.
- Test payment flow with Razorpay test credentials and webhook events.
- Verify backup and restore procedures.

## 2. Vercel deployment (recommended simple launch path)

1. Push the source repository to GitHub.
2. Import it into Vercel as a Next.js project.
3. Use Node.js 22 for build/runtime.
4. Add the production environment variables from `.env.example` to the Vercel project settings. Add the service role and Razorpay secrets as server-only environment variables.
5. Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS domain.
6. Deploy a preview environment first; point it to the staging Supabase project.
7. Test auth, public reads, private submission access, moderation, voting and export.
8. Deploy production, configure the production Supabase URL/keys and apply migrations to the production database before opening the site to users.
9. Configure Razorpay webhook URL to `/api/payments/webhook` only after sandbox validation.

## 3. Environment variables

| Variable | Client-visible? | Purpose |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase publishable/anon key; RLS is mandatory |
| `SUPABASE_SERVICE_ROLE_KEY` | **No** | Privileged server-side webhook and analytics operations |
| `RAZORPAY_KEY_ID` | Server-side in this build | Provider key used by order creation endpoint |
| `RAZORPAY_KEY_SECRET` | **No** | Server-side order creation credential |
| `RAZORPAY_WEBHOOK_SECRET` | **No** | Verify provider webhook signature |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical origin and callback metadata |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Yes | Master switch; defaults false |
| `SUPPORT_EMAIL` | Server/config | Public support contact placeholder |

Do not put secrets in client components, source maps, analytics events or logs.

## 4. Domain and observability

- Attach the canonical domain and redirect HTTP to HTTPS.
- Add the exact callback URL in Supabase Auth.
- Add the payment webhook endpoint in Razorpay.
- Enable deployment logs and error alerting without capturing passwords, tokens, full payment payloads or private user content.
- Monitor uptime, 5xx rate, Supabase database/storage usage, auth failures, webhook retry rate and moderation backlog.

## 5. Rollback

- Revert to the previous known-good deployment from the hosting provider.
- Do not blindly roll back database migrations after data writes. Use forward-fix migrations or a tested restore plan.
- Disable payment products when fulfilment is uncertain; keep order and webhook audit evidence.
- If a security incident is suspected, rotate relevant secrets and revoke sessions in addition to code rollback.

## 6. Production launch checklist

- [ ] Staging migrations and RLS tested.
- [ ] Signup, verification, login, reset and logout verified.
- [ ] Admin MFA enabled and least-privilege roles reviewed.
- [ ] Public/private profile and submission boundaries tested with multiple accounts.
- [ ] File type/size restrictions and signed media URLs tested.
- [ ] Moderation, reports, blocks and appeals reviewed by an operator.
- [ ] Vote uniqueness, self-vote prevention and battle lifecycle tested.
- [ ] Razorpay sandbox webhook, duplicate event, failure, mismatch and refund paths tested.
- [ ] Entitlements assigned to the correct user and revoked on refund.
- [ ] Product and niche settings have accurate terms and availability.
- [ ] Privacy policy, terms and community guidelines reviewed by qualified counsel.
- [ ] Backups and restore verified.
- [ ] Critical/high security findings resolved.
- [ ] Support and incident ownership assigned.

## Going live on Cloudflare (Pages + D1)
```
npm i -g wrangler && wrangler login
wrangler d1 create showoff                    # copy database_id into wrangler.toml
wrangler d1 execute showoff --remote --file=schema.sql
wrangler pages deploy                         # uses wrangler.toml (public/ + functions/)
```
Then open the site: the arena shows "LIVE" when `/api` answers, and "PREVIEW MODE" otherwise. See `API.md`.
