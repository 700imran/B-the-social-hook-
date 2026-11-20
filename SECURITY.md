# Security Baseline & Threat Model

## 1. Assets to protect

- Account credentials, auth sessions and email addresses.
- Private submissions and media.
- Voting integrity and battle outcomes.
- Payment order state, webhook authenticity and user entitlements.
- Admin permissions, moderation decisions and audit history.
- User reports, block/mute settings and exported personal data.

## 2. Main controls in the codebase

- Managed Supabase Auth; no custom plaintext-password storage.
- SSR-managed session cookies; the server checks the authenticated user.
- PostgreSQL RLS and ownership checks on user-owned records.
- Server-only service-role client for privileged payment fulfilment.
- Database uniqueness for one vote per account per battle and one entry per account per battle.
- Votes and payment events are not user-writable; privileged decisions are recorded separately.
- Payment webhook signature verification, event idempotency and amount/currency comparison.
- User entitlements are tied to `user_id`, `order_id` and product, then checked from the database.
- URL validation for external project links; restricted image types and a 5 MB upload cap.
- Security headers in `next.config.ts`.
- Admin audit log for moderation, battle state and product changes.
- Privileged database helpers require a Supabase Auth `aal2` claim; the operator UI includes TOTP enrollment/verification and login prompts for registered factors.
- Analytics allowlist and account consent check; PII is not an accepted property type.

## 3. Threat model & required verification

| Threat | Existing control | Release verification |
|---|---|---|
| Account takeover | Supabase Auth, verified email, reset flow | Test brute-force/rate limits and recovery flow in project settings |
| Privilege escalation | RLS, admin role table, server-only service key | Attempt admin URLs/RPCs as ordinary user |
| Cross-user data access | Owner filters and RLS | Test every profile, submission, order, entitlement and export boundary with two accounts |
| Vote manipulation | Verified email, unique DB constraint, self-vote check, hidden live totals | Test duplicate, self, unverified, concurrent and excluded votes |
| Payment forgery/replay | HMAC verification, event ID and amount/currency check | Test bad signature, replay, duplicate and mismatched amount |
| XSS / unsafe links | React escaping, URL validation, constrained content fields | Add automated and manual payload tests; do not allow raw HTML rendering |
| File abuse | MIME/type/size allowlist, owner path, private bucket and signed URLs | Add malware scanning before accepting broader file types; current build does not scan malware |
| Scraping / spam | Auth on mutations and database rules | Add WAF/rate-limit rules for production traffic; verify signup and action throttles |
| Harassment / doxxing | Report, block/mute, moderation queue and guidelines | Staff an actual moderation SLA and incident escalation path |
| Data loss | Supabase managed backups available by plan | Confirm plan, configure point-in-time recovery where appropriate, test restore |

## 4. Production secrets

- Keep service-role and Razorpay secret keys only in the deployment provider's server-side secret store.
- Never commit `.env.local`, `.env.*.local`, private keys or webhook secrets.
- Rotate secrets after a suspected leak. Review Git history, deployment logs and access permissions.
- Restrict production database and deployment access to named operators; use MFA.

## 5. Data lifecycle

- Users may export account-associated data through `/api/account/export` while signed in.
- Account deletion is initiated as a logged request. An operator must review dependencies, financial records, abuse evidence and legal retention before processing.
- Do not promise instant erasure from backup snapshots or financial/audit records.
- Document retention windows and delete/anonymise data when the relevant purpose and lawful retention period end.

## 6. Release gates

Do not go live while any critical/high severity vulnerability is open. Before public launch, test the complete auth, RLS, upload, moderation, vote, webhook, entitlement, export and deletion workflows on staging. Obtain independent security review for payment, admin and data-access paths.
