# SHOWOFF — Interactive P0 Frontend Prototype

**Tagline:** Get Seen. Get Judged. Get Discovered.

This deliverable is a polished, responsive static prototype with local-only interactions. It is NOT production backend and does not claim real authentication, data persistence, payment, live rankings, votes, analytics, moderation, or deployment.

## Included
- Responsive landing page and navigation
- Explore feed with search, niche filter, sort and feed tabs
- Three launch niche cards and cross-niche discovery
- Local submission draft form (browser memory only)
- Onboarding preference selector (saved locally in browser)
- Battle voting interaction (clearly demo-only; no tally)
- Leaderboard presentation with explicitly illustrative rows
- Roadmap preview cards, disabled actions
- Optional sound toggle using generated simple tones
- Responsive mobile navigation, reduced-motion support, accessibility focus styles

## Run locally
Open `index.html` in a browser. No build or package install required.

For a local web server (optional):

```bash
python -m http.server 8080
```
Then open `http://localhost:8080`.

## Production readiness status
**Prototype only.** Live backend/authentication/database/storage/moderation/email/payments/webhooks/CI/CD/monitoring are not connected. Do not deploy this as a live product or accept money from this frontend.

## Next build phase
Implement P0 backend in a proper repository using the architecture and security documents in this folder. Replace local demo interactions with server-validated APIs. Remove sample/demo records before launch.
