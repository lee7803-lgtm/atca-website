# ITCA V1.3 email provider selection guide

This document prepares Phase 11.6 provider selection. It does not enable real email sending, add SDK dependencies, write secrets, modify environment files, add SQL, or change business workflows.

## 1. Provider comparison

| Option | Fit for this project | Strengths | Tradeoffs |
| --- | --- | --- | --- |
| Resend | Best first candidate for a Vercel + Next.js transactional email path. | API-first, simple server-side integration shape, documented Next.js flow, Vercel integration path, domain verification flow. | Requires a verified sender domain and API key; still needs explicit rate limits, idempotency, and allowlist before real sends. |
| SMTP | Useful fallback when ITCA already has an institutional mailbox provider with SMTP enabled. | Provider-neutral protocol; easy to move between mail hosts by changing connection settings. | Requires Nodemailer or equivalent dependency, SMTP credentials, port/security handling, deliverability tuning, and stricter timeout/error handling. |
| SendGrid | Good enterprise-grade option when delivery analytics, scale, or existing Twilio/SendGrid operations are already in place. | Mature Mail Send API, Node.js quickstart, domain authentication support, strong operational tooling. | Heavier product surface; usually more setup than needed for the first small transactional-email phase. |

Primary references:

- Resend Next.js guide: https://resend.com/nextjs
- Resend domain management: https://resend.com/docs/dashboard/domains/introduction
- Vercel environment variables: https://vercel.com/docs/projects/environment-variables
- Vercel Resend integration: https://vercel.com/integrations/resend
- Nodemailer SMTP transport: https://nodemailer.com/smtp
- Twilio SendGrid Node.js quickstart: https://www.twilio.com/docs/sendgrid/for-developers/sending-email/quickstart-nodejs
- SendGrid domain authentication: https://support.sendgrid.com/hc/en-us/articles/21415314709147-SendGrid-Automated-Security-Domain-Authentication

## 2. Recommendation

For the current Vercel + Next.js site, Resend is the most suitable first real provider candidate.

Reasons:

- The current notification code is already server-side TypeScript and API-oriented.
- The app is deployed on Vercel, and Resend has an explicit Vercel integration path.
- The first ITCA use case is transactional notification email, not marketing campaigns.
- Resend keeps the Phase 11.6 implementation surface smaller than SMTP or SendGrid.

SMTP should be treated as fallback if ITCA already has a managed mailbox provider and wants all outbound mail to go through that provider. SendGrid should be considered if ITCA needs broader delivery analytics, subusers, high-volume operation, or an existing SendGrid account.

## 3. Sender domain and addresses

Do not invent or commit a real domain in code. Before real sending, ITCA should choose and verify an official domain controlled by the association.

Recommended sender pattern:

- `no-reply@<official-domain>` for system notifications that should not receive direct replies.
- `admin@<official-domain>` or `secretariat@<official-domain>` only if ITCA wants recipients to recognize an administrative sender.

Recommended reply-to:

- Use a monitored mailbox, for example `secretariat@<official-domain>` or another official support mailbox.
- Do not use a personal mailbox unless ITCA explicitly approves it.
- Do not use the no-reply mailbox as reply-to if applicants may need operational help.

Recommended display name:

- `ITCA`
- `ITCA Secretariat`
- `International Taoisme And Cultural Association`

The final display name should be approved by ITCA before enabling real sending.

## 4. Preview and Production separation

Vercel supports environment-scoped variables for Production, Preview, and Development. The email configuration should use that separation.

Recommended policy:

- Production: real provider variables may be present only after approval, DNS verification, and allowlist setup.
- Preview: keep `ITCA_EMAIL_DRY_RUN=true`; do not send to real applicants.
- Development: keep `ITCA_EMAIL_PROVIDER=none` unless a developer is explicitly testing a sandbox.

Preview should never share the Production API key unless there is a specific approved reason. If Preview real sending is ever needed, use a separate provider key and restrict recipients to internal test addresses.

## 5. Environment variables

Only variable names are documented here. Do not commit real values.

Common:

- `ITCA_EMAIL_PROVIDER`
- `ITCA_EMAIL_DRY_RUN`
- `ITCA_EMAIL_FROM`
- `ITCA_EMAIL_FROM_NAME`
- `ITCA_EMAIL_REPLY_TO`
- `ITCA_EMAIL_PROVIDER_API_KEY`
- `ITCA_EMAIL_WEBHOOK_SECRET`

Resend:

- `ITCA_RESEND_API_KEY`

SendGrid:

- `ITCA_SENDGRID_API_KEY`

SMTP:

- `ITCA_SMTP_HOST`
- `ITCA_SMTP_PORT`
- `ITCA_SMTP_USER`
- `ITCA_SMTP_PASSWORD`
- `ITCA_SMTP_SECURE`

Operational safeguards:

- `ITCA_EMAIL_ALLOWED_RECIPIENTS`
- `ITCA_EMAIL_AUTO_SEND_ENABLED`
- `ITCA_EMAIL_MANUAL_SEND_ENABLED`
- `ITCA_EMAIL_RATE_LIMIT_PER_MINUTE`

These safeguard names are recommendations for later phases; Phase 11.5 does not implement them.

## 6. DNS and domain verification checklist

Before any real provider sends applicant-facing email:

- Add and verify the sending domain in the selected provider dashboard.
- Configure provider-required SPF records or provider-managed SPF delegation.
- Configure DKIM records.
- Configure DMARC policy for the sender domain.
- Confirm the visible From domain aligns with the authenticated sender domain.
- Confirm reply-to mailbox exists and is monitored.
- Send internal-only test emails and inspect authentication results in the received headers.
- Confirm bounce handling and provider dashboard access.

Do not enable automatic sends until these checks are complete.

## 7. First batch allowed for real sending

After provider verification, the first real-send allowlist should be small:

- `member_application_submitted`
- `organization_application_submitted`
- `certification_application_submitted`
- `supplement_submitted`
- `member_application_need_more_info`
- `certification_application_need_more_info`

These are applicant-facing, low-risk, and already use generic templates that point users back to official query pages.

## 8. Still prohibited from real sending

Keep these disabled until explicitly reviewed:

- Payment notifications, including `payment.order_created`, `payment.paid`, `payment.manual_confirmed`, `payment.cancelled`, `renewal.payment_required`, and `rereview.payment_required`.
- Certificate PDF delivery by link or attachment.
- WhatsApp notifications.
- Bulk/group notifications.
- Rejection emails containing detailed reasons or internal review text.
- Any email containing committee notes, internal review notes, material review details, recommender details, identity documents, storage paths, PDF storage paths, certificate verification tokens, provider secrets, or database identifiers.

## 9. Avoiding accidental sends

Provider implementation should keep these guardrails:

- `ITCA_EMAIL_PROVIDER=none` remains default.
- `ITCA_EMAIL_DRY_RUN=true` remains default.
- Real sending requires both a supported provider and an explicit production enable flag.
- Real sending only runs for an allowlisted notification type.
- Preview environment remains dry-run unless internal test recipients are explicitly configured.
- Manual-send actions must keep clear copy when no real send occurred.
- API responses must never say "sent" when provider result is `skipped`.
- Provider failures must not block saving the original business operation.

## 10. Manual and automatic boundaries

Manual send:

- Appropriate for admin-reviewed one-off retries.
- Must require admin authentication.
- Must read recipient and message from `notification_logs`, not from client payload.
- Must write audit logs without secrets or raw payloads.

Automatic send:

- Should be added only after the allowlist, DNS, sender identity, rate limit, idempotency, and retry policy are complete.
- Should start with application submission and need-more-info notifications only.
- Should never change payment status, certificate status, PDF status, or verification token state.

## 11. Retry, idempotency, and rate limits

Recommended retry policy:

- No automatic retry in request handlers.
- For manual retry, update the existing notification row with the latest provider result.
- Later queue-based retry should use bounded exponential backoff.
- Never retry `skipped` records automatically unless a provider has been enabled and an admin explicitly chooses retry.

Recommended idempotency:

- Continue using `idempotency_key` for notification row creation.
- Add provider-side idempotency key only if the selected provider supports it.
- Do not generate multiple real sends for the same business event unless an admin explicitly retries.

Recommended frequency limits:

- Per-recipient rate limit.
- Per-notification-type rate limit.
- Global per-minute send cap.
- Preview environment hard cap of zero real applicant sends.

## 12. Logging restrictions

Never store or expose these in `notification_logs`, audit logs, API responses, page HTML, console output, or provider response snapshots:

- Provider API keys.
- SMTP passwords.
- Supabase service role key.
- Database connection strings.
- Admin session tokens or admin passwords.
- Bearer tokens.
- Storage object paths.
- PDF storage paths.
- Certificate verification tokens.
- Identity documents or ID proof metadata.
- Recommender private information.
- Full raw provider responses if they contain headers, request signatures, or recipient metadata beyond what the admin UI needs.

## 13. Phase 11.6 if choosing Resend

Status: selected and implemented as the minimum adapter skeleton for backend single-notification manual send.

Minimum development range:

- Add `resend` package only after approval.
- Implement a single `ResendEmailProvider` adapter behind `resolveEmailProvider()`.
- Require `ITCA_EMAIL_PROVIDER=resend`.
- Require dry-run to be false and `ITCA_EMAIL_MANUAL_SEND_ENABLED=true` before real send.
- Require the admin single-notification route to pass the provider abstraction an explicit real-send allowance.
- Use the existing normalized `EmailProviderSendResult`.
- Store only provider message ID and sanitized metadata.
- Keep provider errors non-blocking for the originating business workflow.
- Add unit-level or route-level checks for missing config, dry-run, and skipped behavior.
- Do not add automatic sends in the same step unless separately approved.

Implementation notes:

- Missing provider key, missing sender/reply-to, dry-run, disabled manual send, and non-manual workflow paths all return `sendStatus=skipped`.
- Existing automatic workflow calls continue to use `sendEmailNotification()` without the real-send allowance.
- The admin notification page displays safe Resend state only and does not expose API keys, storage paths, certificate verification tokens, PDF paths, or raw provider responses.

## 14. Phase 11.6 if choosing SMTP

Minimum development range:

- Add `nodemailer` and needed types only after approval.
- Implement one SMTP adapter behind `resolveEmailProvider()`.
- Require `ITCA_EMAIL_PROVIDER=smtp`.
- Validate host, port, user, password, secure flag, from, and reply-to.
- Keep dry-run as the default.
- Set conservative connection and send timeouts.
- Disable URL/attachment fetching.
- Do not send attachments.
- Store only sanitized SMTP response metadata.
- Do not add automatic sends in the same step unless separately approved.

## 15. Open decisions before real provider work

- Final provider choice.
- Official sending domain.
- Sender address and display name.
- Monitored reply-to mailbox.
- Production and Preview variable ownership.
- First real-send notification allowlist.
- Whether manual send is enabled before automatic send.
- Rate limit values.
- Retry policy owner.
- Bounce and complaint monitoring owner.
