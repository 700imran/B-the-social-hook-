# SHOWOFF: Business Overview

**One line:** a game-like arena where people show what they've built or made, get judged by a real audience in daily head-to-head battles, and get discovered.

## Who it is for and what each side gets

| Side | Who | Job to be done | What SHOWOFF gives them |
|---|---|---|---|
| **Creators / builders** (supply) | Creators, indie startups, designers | Get real eyes and honest signal, not likes from friends | Free submission, a fair battle slot, structured feedback, a public track record (wins, rank, level) |
| **Players / audience** (demand) | Anyone curious; early adopters; peers | Discover good work quickly and have fun judging | Daily 30-second battles, XP, levels, streaks, leaderboards, early access to rising work |
| **Clients** (revenue) | Brands, startups, studios, recruiters, investors | Find talent and launch products with an engaged audience | Sponsored battles and challenges, labelled promotion, talent discovery, audience insight |

## The core loop (why people return)
Vote on today's battle (+XP) → see the result and your rank → streak bonus for coming back tomorrow → level up → submit your own work → get battled → climb the board → repeat.
Players are the engine: more players means more votes, which makes a creator's result meaningful, which attracts creators, which creates more battles.

## Founder view
- **Moat:** a large pool of independent judgements gives a trustworthy ranking, and that data is hard to copy.
- **Revenue (in order of readiness):** (1) paid promotion, always visibly labelled and excluded from organic rankings and battle outcomes; (2) sponsored battles and brand challenges; (3) client talent-discovery access and analytics; (4) pro profiles.
- **Cost shape:** edge hosting plus a small database is cheap at low volume; the real costs are moderation, anti-fraud and community management.
- **Trust is the product.** One-vote-per-account, hidden live totals, visible sponsor labels, appeals and moderation are not extras.
- **Metrics that matter:** votes per player per day, day-7 retention, battle completion rate, submissions per week, share of battles with enough votes to be decisive, sponsor revenue per battle.

## Status and what is left (honest)
**Working now:** the public site, a daily battle with real shared votes, XP, levels, streaks, a top-players board, sound and animation, and email-link accounts via Supabase, and a REST API on Cloudflare Pages (needs your first deploy; see DEPLOYMENT.md).
**Still a demo:** submissions, niche feeds, field leaderboards and profiles are sample content.
**Left to build, in priority order:**
1. Stronger anti-abuse on top of email accounts: disposable-email blocking, rate limits and bot checks (accounts exist now; one email can still make many accounts).
2. Real submissions with image upload, moderation queue and report/block tools.
3. Battles created from real submissions, with schedules, brackets and seasons (today the battle is a rotating sample pair).
4. Anti-fraud: rate limits, device and account signals, vote exclusion with audit log.
5. Badges, seasonal ladders, per-field leaderboards, notifications.
6. Payments for promotion (Razorpay), admin console, analytics with consent.
7. Legal pages (terms, privacy, content policy), domain, accessibility audit, load testing.
