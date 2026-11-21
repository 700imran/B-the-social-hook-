# SHOWOFF REST API

Base path `/api`, JSON in and out, `cache-control: no-store` on all current routes. Runs as a Cloudflare Pages Function in front of Supabase (Postgres + Auth). Errors look like `{"error":"code"}` with a matching HTTP status.

## Identity
Supabase Auth (email magic link). The browser gets a JWT and sends `Authorization: Bearer <JWT>`. The Function forwards that JWT to Postgres, where `auth.uid()` identifies the caller inside `SECURITY DEFINER` functions. Tables have RLS enabled with no policies, so nothing can be read or written except through those functions. The service-role key is never used.

## Implemented endpoints
| Method | Path | Auth | Body | Success | Errors |
|---|---|---|---|---|---|
| GET | `/leaderboard` | none | | `{top:[{name,xp,streak,level,me}]}` (top 20, no ids or emails) | |
| GET | `/me` | yes | | `{name,xp,streak,level}` | `401` |
| POST | `/me` | yes | `{name}` (1-24 chars) | updated profile | `400 invalid_input`, `401` |
| GET | `/battles/{id}` | optional | | `{battle,mine:null}` before voting; `{battle,mine,a,b}` after (totals hidden until you vote) | |
| POST | `/battles/{id}/vote` | yes | `{choice:"a"\|"b"}` | `{mine,gained,xp,streak,level,a,b}` | `400`, `401`, `409 already_voted` |

Battle ids look like `d<dayNumber>`. Errors are `{"error":"code"}` with a matching status.

## Gamification rules (server-authoritative)
- Vote: **+10 XP**. First vote of a UTC day: **+5 x min(streak,5)** bonus.
- Streak: +1 if you voted yesterday, same if already voted today, otherwise resets to 1.
- Level: `floor(sqrt(xp/50)) + 1` (level L starts at `50 x (L-1)^2` XP).
- One vote per player per battle, enforced by the primary key `(battle_id, player_id)`.

## Planned endpoints
`POST /auth/*` · `GET/POST /submissions` (+ media upload via signed URLs) · `GET /battles` (list, cursor paging) · `POST /battles` (admin/sponsor) · `GET /leaderboards/{field}?period=week|season` · `POST /reports` · `POST /follows` · `POST /orders` and `POST /webhooks/razorpay` (signed, idempotent) · `GET /me`.
Conventions to keep: cursor pagination (`?cursor=&limit=`), `Idempotency-Key` header on payments, versioned prefix `/api/v1` before the first external client.

## Scaling plan (what breaks first, and the fix)
| Stage | Bottleneck | Fix |
|---|---|---|
| Launch to a few thousand daily players | None; edge functions scale automatically, Supabase Postgres handles this | Keep indexes (already in the migration) |
| Leaderboard reads dominate | Repeated `ORDER BY xp` queries | Cache `/leaderboard` for 5-30 s at the edge (or KV); recompute on a schedule |
| Many votes per second on one battle (e.g. a sponsored final) | Row-level contention on one hot battle; per-row locking on profiles | Count votes in a Durable Object per battle (single-threaded, strongly consistent), flush to D1 in batches; or queue votes and aggregate |
| Real-time "live battle" feel | Polling | WebSockets via Durable Objects |
| Fraud and abuse | Anonymous or multi-account voting | Verified accounts, Cloudflare rate limiting and Turnstile, vote exclusion table with reasons |
| Data growth | Large `votes` table | Archive finished battles to R2, keep aggregates; scale the Supabase compute tier or add read replicas |

Do not split into microservices until a specific workload (votes, media, payments) needs independent scaling.

## Testing
`supabase/migrations/001_init.sql` was exercised against a local Postgres with a stubbed `auth` schema (double vote, bad input, streaks, hidden totals, permission denial). Run `npx wrangler pages dev --binding SUPABASE_URL=... --binding SUPABASE_ANON_KEY=...` for local work.
