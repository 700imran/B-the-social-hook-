# Technical Architecture

## 1. Design choice

SHOWOFF is built as a modular monolith. This keeps deployment and operations affordable while the product is validating three initial niches. Do not split into microservices until independently scaling workloads and operational ownership justify it.

## 2. Stack

| Layer | Implementation | Responsibility |
|---|---|---|
| Web framework | Next.js App Router | Routing, rendering, server endpoints |
| UI | React + TypeScript + CSS design tokens | Responsive screens and interaction states |
| Identity | Supabase Auth + `@supabase/ssr` | Signup, verification, sessions, password reset |
| Database | Supabase PostgreSQL | Product data, audit records, entitlements |
| Access control | PostgreSQL RLS + server checks | Per-user ownership and least privilege |
| Media | Supabase Storage | Restricted thumbnail uploads and signed reads |
| Payments | Razorpay Orders + signed webhooks | Paid promotion order and fulfilment |
| Tests | Vitest + Playwright | Logic tests and browser smoke paths |
| CI | GitHub Actions | Pull-request validation and smoke runs |

## 3. Request boundaries

- Public reads run through server components and narrowly scoped database queries/RPCs.
- User mutations use authenticated Supabase sessions, RLS and server-side constraints.
- Privileged operations use the service-role client only inside server routes or server-side code. Never import `lib/supabase/admin.ts` into a client component.
- Payment creation verifies the authenticated owner, product state and submission eligibility on the server.
- Payment fulfilment is triggered by a verified webhook, not the browser redirect.
- Battle votes are accepted through `cast_battle_vote`; database uniqueness prevents more than one vote per verified account per battle.
- Raw vote, feedback and comment data is not exposed as a public table query; aggregate/read RPCs provide appropriate public output.

## 4. Main domains

### Identity & preferences

`profiles`, `admin_roles`, `notification_preferences`, `field_follows`, `user_follows`, `user_controls`.

User roles, primary niche, interests and goals determine default feed composition only. Public cross-niche browsing stays open.

### Showcase

`submissions`, storage object paths, owner profile relation, review state and optional `sponsored_until`.

Public content requires `status='published'` and `visibility='public'`. New submissions enter `pending` moderation. Owners may not publish directly by changing a status field.

### Competition

`battles`, `battle_entries`, `votes`, `vote_exclusions`, `appeals`.

The database enforces the account/battle vote uniqueness rule and entry cap. Live vote totals are hidden. Completed results are shown through an aggregate function; excluded votes are retained with a reason.

### Community and safety

`comments`, `feedback`, `submission_reactions`, `reports`, `moderation_actions`, `user_controls`.

Feedback is about the submission and uses fixed rubric fields. Report, block and mute controls are separate from public reputation.

### Revenue

`products`, `orders`, `payment_events`, `entitlements`, `promotion_campaigns`, `campaign_delivery`.

The order belongs to a specific account. Only a verified provider event can mark an order paid and provision an entitlement. Sponsored inventory must remain visibly labelled and is excluded from organic rankings and battle outcomes.

### Platform operations

`feature_flags`, `analytics_events`, `admin_audit_logs`, `account_deletion_requests`.

Analytics is consent-aware and disabled by default. Audit logs capture consequential operator decisions. Account deletion is a reviewable request, not an immediate promise that regulated records disappear.

## 5. Feed and leaderboard model

The feed helper targets a configurable 70/20/10 mix across primary niche, secondary interests and cross-field discovery, but it only reorders real rows it receives. It will not invent submissions to fill a quota.

Leaderboards are scoped by niche and metric. Community popularity uses public interactions, battle results use verified voting, and sponsored placement is a separate inventory surface. A low-sample threshold is applied before displaying a competitive popularity rank. The metric and threshold should be reviewed with real launch data before public claims are made.

## 6. Background work and current boundaries

No message queue or scheduled worker is deployed in this starter. Battle state changes, deletion requests, moderation and operational reviews are operator-driven. Notification preferences are stored, but outbound email/push delivery is not yet connected. Campaign delivery analytics schema exists, but impression/click instrumentation and automated campaign pacing require a later validated implementation.

## 7. Scalability stance

Start with database indexes, query limits, cursor/page pagination and storage URL signing. Measure feed query time, database load, storage egress, webhook duration and moderation backlog. Add a job runner only when actual workloads require reliable asynchronous tasks. Do not introduce microservices or a vector database before measured bottlenecks exist.
