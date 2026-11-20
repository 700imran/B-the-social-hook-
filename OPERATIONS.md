# Operator Playbook

## Daily operating controls

1. Review the moderation queue and open reports.
2. Check active/review battles and their declared windows.
3. Reconcile orders, payment events and entitlements.
4. Check sponsored placement delivery and remove expired inventory.
5. Review abuse signals and account appeals.
6. Check database/storage errors and deployment health.

## Admin duties

- **Moderator:** review submissions/reports, record a reason, preserve evidence and respond to appeals.
- **Admin:** manage niches, feature flags, battle state, product prices and access roles.
- **Finance:** reconcile provider settlements, refunds and entitlements. Do not grant moderation/admin powers by default.

Avoid shared administrator accounts. Require a documented reason for manual ranking corrections, vote exclusions, refunds, account restrictions and niche activation.

## Opening a battle

1. Approve the niche/category and confirm a moderator is responsible.
2. Create a battle with rules, rubric, eligibility, entry/voting windows and result method.
3. Review the entry capacity; only use a cap if it is real and enforced by the database.
4. Publish the battle and monitor reports and vote integrity.
5. Move through voting/review/completed states using the admin panel with a reason.
6. Preserve excluded votes and evidence. Publish the methodology and final result once the review is complete.

## Opening a niche

Do not activate a niche solely to increase category count. Require:

- Enough genuine, policy-compliant submissions to make discovery useful.
- A named moderation owner and response coverage.
- A taxonomy and category definition.
- A transparent and defensible metric, with a sample threshold.
- A launch plan for supply and demand acquisition.

Keep it marked Coming Soon until gates are satisfied.

## Payment and refund reconciliation

- Match each Razorpay payment against `provider_order_id`, amount, currency and the relevant order row.
- Verify the corresponding webhook event record and entitlement owner.
- Do not edit ledger/payment event rows to conceal errors. Correct via a new event or audited compensating action.
- Provider-side refund is not performed by the current dashboard. Perform it in the payment provider portal after authorisation, then ensure the refund webhook updates local status and cancels the entitlement.
- If a user paid but the webhook was delayed, verify in the Razorpay dashboard and replay the signed webhook using provider tooling; never mark paid from a browser screenshot.

## Incident playbook

### Suspected account or admin compromise

1. Disable the compromised account/session and reset credentials.
2. Revoke admin role if necessary and preserve audit evidence.
3. Rotate Supabase service-role and payment/webhook secrets if exposed.
4. Review admin logs, recent deployments, API access and anomalous data reads.
5. Restore least-privilege access only after verification.

### Payment mismatch or suspected fraud

1. Pause new checkout by disabling the product or removing gateway server secrets.
2. Preserve raw event hashes, provider references and order records.
3. Reconcile amount/currency and event IDs with the provider dashboard.
4. Do not provision/revoke manually without a recorded decision.
5. Notify affected users with factual status and a documented remediation.

### Vote manipulation or battle integrity issue

1. Move the battle into review; do not publish an unverified winner.
2. Preserve source records and abuse indicators.
3. Exclude votes only through the audited RPC and a clear reason.
4. Allow procedural appeals.
5. Publish a methodology/status update that does not reveal private user data.

### Data leak or security incident

1. Contain the affected route/key/storage policy.
2. Preserve logs without exposing them publicly.
3. Rotate secrets and revoke sessions where warranted.
4. Scope affected data, accounts and duration.
5. Follow applicable legal notification requirements with qualified counsel; do not speculate publicly.
6. Complete root-cause analysis and test corrective controls before restoring the feature.

## User-facing reputation rule

Correct errors transparently. Never delete a relevant audit trail to make a public result look cleaner. Separate confirmed facts, suspected abuse and operational uncertainty.
