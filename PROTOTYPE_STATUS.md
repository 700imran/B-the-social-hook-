# SHOWOFF Prototype — Delivery Status

## Implemented in this prototype
- Responsive visual shell and core branding
- Landing page, Explore, 3 initial niche pages/sections, challenge card, leaderboard view, roadmap cards
- Search, niche filtering, sort, feed tabs
- Submission form creating a local draft
- Preference onboarding stored in local browser storage
- Prototype vote interaction with no vote tally persisted
- Sound feedback toggle
- Preview feature gates

## Not implemented / must not be represented as live
- Server/database
- Secure authentication or account/session handling
- Email verification/password recovery
- Media upload and scanning
- Moderation queue and appeal workflows
- Real voting, ranking, anti-fraud or audit ledger
- Payments, provider checkout, verified webhook, entitlements/refunds
- Admin/operator backend
- Analytics, notifications
- Production CI/CD, hosting, backups, monitoring

## Test evidence
- `node --check app.js` passed during packaging.
- GitHub Actions prototype syntax/asset checks are included, but not executed remotely.
- Browser-based functional test has not been run in this environment.
