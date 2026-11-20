# P0 Acceptance & Release Checklist

This is the operator's evidence checklist. A route existing in source code is not proof that a workflow is production-ready.

## Public discovery

- [ ] Guest can load `/`, `/explore`, `/fields`, `/fields/creators`, `/fields/startups-products` and `/fields/design-digital-builds`.
- [ ] Empty states show honest zero state; no generated user counts or testimonials.
- [ ] Search, niche filtering and sort behaviour match their labels.
- [ ] Guests can open published public submissions and profiles.
- [ ] Private and pending submissions never appear publicly or in public leaderboards.
- [ ] All three public launch niches can be browsed regardless of onboarding preferences.

## Identity and preferences

- [ ] Signup, email verification, login, reset, logout and expired-session paths pass.
- [ ] Account and profile data belongs to the authenticated user.
- [ ] Preferences save and can be changed; primary niche does not restrict cross-field browsing.
- [ ] Public/private profile behavior is correct.
- [ ] Admin and finance roles cannot be assigned by normal users.

## Showcase and moderation

- [ ] Submission validation runs on server/database as well as UI.
- [ ] Thumbnail MIME and size restrictions enforced; signed/private media access verified.
- [ ] Submissions enter pending state and cannot self-publish.
- [ ] Moderator can publish/reject/archive with reason and audit record.
- [ ] Owner can see current review state, save drafts, edit/re-submit where permitted, archive published work and delete own nonpublished work.
- [ ] Reports, appeals, comments and structured feedback work under the configured policies.

## Battles and ranking

- [ ] Battle rules, dates and result method are public before entry/voting.
- [ ] Entry eligibility, entry window, account cap and submission ownership enforced server-side.
- [ ] Verified user can vote only once per battle and cannot self-vote.
- [ ] Live vote totals remain hidden until completion.
- [ ] Vote exclusions are recorded separately with operator and reason.
- [ ] Battle results and community popularity are separate from sponsored placements.
- [ ] Community popularity supports week, month and all-time periods with a minimum sample threshold.
- [ ] Low-sample results are labelled rather than presented as meaningful rank.

## Revenue and entitlements

- [ ] Product is disabled until real price, available inventory and terms are approved.
- [ ] Checkout creates provider order server-side with correct user/product/submission.
- [ ] Browser redirect without webhook does not grant entitlement.
- [ ] Valid webhook verifies signature, event ID, order, amount and currency.
- [ ] Duplicate event cannot provision duplicate entitlement.
- [ ] Refund can be reconciled from its gateway payment ID and cancels the related campaign.
- [ ] A submission cannot open overlapping paid promotion campaigns.
- [ ] Entitlement owner is the exact purchaser; another account cannot use it.
- [ ] Refund event updates order/entitlement/campaign status.
- [ ] Sponsored label is visible and paid promotion does not affect organic ranking or votes.

## Engagement and accessibility

- [ ] Every major mutation displays a real success/error state based on server response.
- [ ] Sound is off by default and can be disabled.
- [ ] Reduced motion and OS reduced-motion settings are respected.
- [ ] Keyboard navigation and visible focus work on every critical form.
- [ ] Mobile has no horizontal overflow and minimum touch targets are usable.
- [ ] WCAG 2.2 AA audit is performed before launch; source-level CSS alone is not proof.

## Operations and release evidence

- [ ] Admin actions create audit logs.
- [ ] Export endpoint returns only the signed-in user's records.
- [ ] Account deletion request is logged and routed to an assigned operator.
- [ ] CI passes on the actual repository with committed lockfile.
- [ ] Playwright smoke paths pass on desktop and mobile.
- [ ] Staging integration/security tests pass with multiple test accounts.
- [ ] Backup restore has been tested.
- [ ] Legal/privacy copy is reviewed for the launch jurisdiction.
