# SHOWOFF REST API

Base path `/api`, JSON in and out, `cache-control: no-store` on all current routes. Runs as a Cloudflare Pages Function with D1 (SQLite). Errors look like `{"error":"code"}` with a matching HTTP status.

## Identity (current vs target)
- **Now:** anonymous `player` = a client-generated UUID. Good enough for a prototype; it **cannot** stop one person creating many players.
- **Target:** verified accounts; `Authorization: Bearer <JWT>`; the player id comes from the token, never from the body.

## Implemented endpoints
| Method | Path | Body / query | Success | Errors |
|---|---|---|---|---|
| POST | `/players` | `{id (uuid), name (1-24)}` upserts | `201` player `{id,name,xp,streak,last_day}` | `400 invalid_input` |
| GET | `/players/{id}` | | `200` player | `404 not_found` |
| GET | `/battles/{battleId}?player={id}` | battleId `d<dayNumber>` | `{battle,mine:null}` before voting; `{battle,mine,a,b}` after (totals hidden until you vote) | |
| POST | `/battles/{battleId}/vote` | `{player,choice:"a"|"b"}` | `200 {mine,gained,xp,streak,level,a,b}` | `400`, `404 unknown_player`, `409 already_voted` |
| GET | `/leaderboard` | | `{top:[{id,name,xp,streak,level}]}` (top 20) | |

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
| Launch to a few thousand daily players | None; edge functions scale automatically, D1 handles this | Keep indexes (already in `schema.sql`) |
| Leaderboard reads dominate | Repeated `ORDER BY xp` queries | Cache `/leaderboard` for 5-30 s at the edge (or KV); recompute on a schedule |
| Many votes per second on one battle (e.g. a sponsored final) | D1 serialises writes to one database | Count votes in a Durable Object per battle (single-threaded, strongly consistent), flush to D1 in batches; or queue votes and aggregate |
| Real-time "live battle" feel | Polling | WebSockets via Durable Objects |
| Fraud and abuse | Anonymous or multi-account voting | Verified accounts, Cloudflare rate limiting and Turnstile, vote exclusion table with reasons |
| Data growth | Large `votes` table | Archive finished battles to R2, keep aggregates; move to a Postgres/Supabase tier if relational needs outgrow D1 |

Do not split into microservices until a specific workload (votes, media, payments) needs independent scaling.

## Testing
Locally: `npx wrangler d1 execute showoff --local --file=schema.sql` then `npx wrangler pages dev`.
