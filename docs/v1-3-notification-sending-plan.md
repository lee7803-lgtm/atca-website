# ITCA V1.3 notification sending plan

This document records the Phase 11.1 read-only scan for upgrading `notification_logs` from log-only records to a real notification sending foundation. This round does not change business code, SQL, database structure, payment status flow, certificate verification token logic, PDF certificate logic, or external provider dependencies.

## 1. Current `notification_logs` schema

Source SQL: `supabase/v1-3-notifications.sql`.

| Field | Current purpose |
| --- | --- |
| `id` | Primary UUID for each notification log. |
| `notification_type` | Business event name, for example `member_application_submitted` or `payment.paid`. |
| `channel` | Delivery channel. Current allowed values are `email`, `whatsapp`, `system`, `manual`. |
| `send_status` | Delivery status. Current allowed values are `pending`, `sent`, `failed`, `skipped`; default is `pending`. |
| `idempotency_key` | Optional unique key used to avoid duplicate notification records. |
| `application_id` | Related member or organization application UUID. |
| `certification_application_id` | Related certification application UUID. |
| `certificate_id` | Related certificate UUID. |
| `application_no` | Human-facing application number. |
| `member_no` | Human-facing member number. |
| `certificate_no` | Human-facing certificate number. |
| `source_type` | Source domain, for example `application`, `certification_application`, `certificate`, `certificate_pdf`, `member`, or `payment_order`. |
| `source_action` | Source action, for example `submitted`, `review_approved`, `order_created`, or `paid`. |
| `recipient_name` | Recipient display name. |
| `recipient_email` | Recipient email address. Must be treated as sensitive contact data. |
| `recipient_phone` | Recipient phone or WhatsApp number. Must be treated as sensitive contact data. |
| `subject` | Notification subject or title. |
| `message_body` | Rendered notification body. Required. |
| `template_key` | Template identifier, usually `email.<notification_type>` for current email templates or the raw payment notification type for payment logs. |
| `payload_json` | Sanitized structured payload for audit/debug/template context. |
| `provider` | Provider name, currently `none` for log-only notifications. |
| `provider_message_id` | External provider message ID after real send succeeds. |
| `provider_response` | Sanitized provider response metadata. |
| `error_message` | Send or provider error summary. |
| `created_by` | Actor that created the log, usually `system`, `applicant`, admin email, or admin label. |
| `created_at` | Log creation time. |
| `scheduled_at` | Reserved future scheduled send time. |
| `sent_at` | Send success time. |
| `failed_at` | Send failure time. |
| `skipped_at` | Log-only or intentionally skipped time. |
| `updated_at` | Trigger-maintained update time. |

Current RLS posture is intentionally private: `anon` and `authenticated` have no table access. Server-side code uses the Supabase service role.

## 2. Current notification trigger points

### Member and organization application workflows

| Trigger | File | Notification type |
| --- | --- | --- |
| Personal or organization member application submitted | `app/api/applications/route.ts` | `member_application_submitted` or `organization_application_submitted` |
| Member or organization application review saved as approved/rejected/need more info | `app/api/admin/applications/[id]/route.ts` | `member_application_approved`, `member_application_rejected`, `member_application_need_more_info` |
| Applicant submits supplemental materials for member or organization application | `app/api/applications/supplement/route.ts` | `supplement_submitted` |
| Admin updates member validity/status | `app/api/admin/applications/[id]/member-validity/route.ts` | `member_status_updated` |

### Certification and certificate workflows

| Trigger | File | Notification type |
| --- | --- | --- |
| Taoist priest certification application submitted | `app/api/certification-applications/route.ts` | `certification_application_submitted` |
| Certification application review saved as approved/rejected/need more info | `app/api/admin/certification-applications/[id]/route.ts` | `certification_application_approved`, `certification_application_rejected`, `certification_application_need_more_info` |
| Applicant submits supplemental materials for certification application | `app/api/applications/supplement/route.ts` | `supplement_submitted` |
| Certificate record generated | `app/api/admin/certification-applications/[id]/route.ts` | `certificate_generated` |
| Certificate PDF generated | `app/api/admin/certification-applications/[id]/certificate-pdf/route.ts` | `certificate_pdf_generated` |
| Certificate marked delivered | `app/api/admin/certification-applications/[id]/route.ts` | `certificate_delivered` |
| Certificate business status updated | `app/api/admin/certification-applications/[id]/route.ts` | `certificate_status_updated` |

### Payment workflows

| Trigger | File | Notification type |
| --- | --- | --- |
| Admin creates payment order from an application | `backend/Itca.Api/Features/Payments/PaymentCommands.cs` | `payment.order_created` |
| Applicant creates renewal or rereview payment order | `app/api/payments/renewal-order/route.ts` | `renewal.payment_required` or `rereview.payment_required` |
| Admin marks payment order as paid | `backend/Itca.Api/Features/Payments/PaymentCommands.cs` | `payment.paid` |
| Admin marks payment order as manual review | `backend/Itca.Api/Features/Payments/PaymentCommands.cs` | `payment.manual_confirmed` |
| Admin cancels payment order | `backend/Itca.Api/Features/Payments/PaymentCommands.cs` | `payment.cancelled` |
| Other payment status update fallback | `backend/Itca.Api/Features/Payments/PaymentCommands.cs` | `payment.order_updated` |

## 3. Current notification types

Application and certification notification types currently defined in TypeScript labels/templates:

- `member_application_submitted`
- `organization_application_submitted`
- `certification_application_submitted`
- `member_application_approved`
- `member_application_rejected`
- `member_application_need_more_info`
- `certification_application_approved`
- `certification_application_rejected`
- `certification_application_need_more_info`
- `supplement_submitted`
- `certificate_generated`
- `certificate_pdf_generated`
- `certificate_delivered`
- `member_status_updated`
- `certificate_status_updated`

Payment notification types currently written by payment workflows:

- `payment.order_created`
- `payment.paid`
- `payment.manual_confirmed`
- `payment.cancelled`
- `payment.order_updated`
- `renewal.payment_required`
- `rereview.payment_required`

The payment schema draft also names future events that are not all implemented yet: `payment.failed`, `payment.refunded`, `renewal.payment_completed`, and `rereview.payment_completed`.

## 4. Notifications suitable for email sending

Good Phase 11 email candidates:

- Application submission confirmations: low risk, applicant-facing, already template-backed.
- Need-more-info review notices: high applicant value, should direct applicant to `/application/query` instead of embedding internal review details.
- Approved/rejected review notices: suitable if wording remains neutral and avoids detailed internal reasons.
- Supplemental material received: useful confirmation after applicant action.
- Certificate generated/PDF generated/delivered: suitable if the email never includes signed storage URLs, public verification tokens, `vt`, or PDF attachments in this phase.
- Member/certificate status updated: suitable with conservative wording and links to query pages.
- Payment order created/payment required: suitable after payment copy is finalized; email should link to `/payment/checkout?orderNo=...` but must not invent bank details.
- Payment paid/cancelled/manual-review status: suitable as status update emails after backend payment wording is confirmed.

## 5. Notifications not yet suitable for automatic sending

Keep these log-only until product and operational rules are finalized:

- WhatsApp messages: no provider, consent, template approval, or sender policy has been selected.
- Payment emails that require formal bank transfer details until the bank name, account name, account number, SWIFT/IBAN if applicable, payment recipient entity, payment reference format, proof submission method, finance confirmer, and visibility rules are provided.
- Certificate PDF delivery by attachment or signed URL. Current principle should remain applicant-only PDF access via `/application/query`.
- Internal material review details, committee notes, recommender details, identity documents, storage paths, certificate verification tokens, or service credentials.
- Automatic refund, invoice, or payment gateway callback notifications. These capabilities are outside the current payment boundary.
- Final rejection emails that include detailed reasons unless reviewed by the association, because these may contain sensitive judgment or internal notes.

## 6. Provider abstraction design

The existing Next.js notification path already has:

- `EmailProvider` interface in `lib/notifications/email/provider.ts`
- `NoneEmailProvider` in `lib/notifications/email/none-provider.ts`
- `sendEmailNotification()` in `lib/notifications/email/send.ts`
- Template rendering in `lib/notifications/templates.ts`
- Log creation in `lib/notifications/logger.ts`

Recommended direction:

1. Keep `sendEmailNotification(input)` as the business-facing API.
2. Keep provider selection behind `resolveEmailProvider()`.
3. Add one real provider implementation at a time, for example `resend`, `postmark`, `sendgrid`, or SMTP.
4. Normalize provider output to the existing `EmailProviderSendResult`: `ok`, `sendStatus`, `provider`, `providerMessageId`, `providerResponse`, `errorMessage`.
5. Ensure provider code never receives raw application records. It should receive only rendered subject/body and sanitized payload.
6. For payment notifications written by .NET, decide whether Phase 11.2 should route those events through a shared send endpoint/job or keep them log-only until the notification dispatcher exists.

## 7. `provider=none` retention strategy

`provider=none` should remain a first-class mode:

- Local development and preview environments can keep recording notifications without external sends.
- Operationally sensitive events can be intentionally skipped while still auditable.
- If no real provider is configured, the current behavior should remain `send_status=skipped`, `provider=none`, and `skipped_at` populated.
- Payment workflows should continue to use `provider=none` until a dispatcher and payment email templates are explicitly implemented.
- `none` logs should not be treated as failed sends. They mean "intentionally not sent."

## 8. Real email provider candidates and integration boundary

Candidate providers:

- Resend: simple HTTP API, good for transactional email, easy Next.js integration.
- Postmark: strong transactional email semantics and delivery logs.
- SendGrid: mature and widely supported, but heavier configuration surface.
- SMTP: broad compatibility, but deliverability, retries, and response normalization are usually weaker than API providers.

Recommended first provider: choose one API-based transactional provider after confirming sender domain ownership, DNS records, billing, sender identity, and data handling terms.

Integration boundary for Phase 11:

- Only server-side code may call the provider.
- Only send applicant-facing transactional messages.
- Do not add WhatsApp.
- Do not send attachments.
- Do not include storage paths, signed URLs, `vt`, service role keys, admin cookies, internal notes, ID documents, recommender details, or committee review details.
- Do not change payment status from email delivery callbacks.
- Do not make email send success a prerequisite for saving business state.

## 9. Suggested `send_status` flow

Current allowed statuses are enough for Phase 11 if the send is synchronous:

1. `skipped`: no provider configured or event intentionally log-only.
2. `sent`: provider accepted the message.
3. `failed`: provider call failed or provider rejected the message.
4. `pending`: reserved for queued/manual-send records.

Recommended Phase 11.2 behavior:

- For current direct-send application/certification flows, call the provider and insert a final log row as `sent`, `failed`, or `skipped`.
- Do not block the original business operation if email sending fails; record `failed` and return the business success response.
- Add exact `sent_at`, `failed_at`, or `skipped_at` based on final status.

Recommended later behavior if a send queue is introduced:

- Insert `pending` first.
- A server-only dispatcher claims pending rows.
- Dispatcher updates the same row to `sent`, `failed`, or `skipped`.
- Avoid duplicate sends by requiring `idempotency_key` and checking provider idempotency support where available.

## 10. Failure retry strategy

Phase 11.2 minimum:

- No automatic retry loop inside request handlers.
- Mark provider/network failures as `failed`.
- Store a short sanitized `error_message`.
- Store only sanitized provider metadata in `provider_response`.

Phase 11.3 or later:

- Add manual retry from the admin notification page.
- Retry only records with `send_status=failed` or explicitly selected `pending`.
- Keep the same `idempotency_key` for the business event, but create a clear retry audit trail. If the existing unique index prevents multiple rows, update the existing row with retry metadata or add a separate retry table in a later SQL phase.
- Use exponential backoff only after a queue/worker exists.
- Never retry `skipped` records automatically unless an admin explicitly sends them after configuring a provider.

## 11. Admin manual send / resend recommendations

Current admin page `/admin/notifications` is read-only and masks email/phone display.

Recommended next capabilities:

- Add filters by status, channel, notification type, and related number before adding resend actions.
- Add "send now" for `pending` records.
- Add "resend" for `failed` records.
- Add "copy message" or detail view for operations review, while keeping contact masking in list view.
- Add an audit log entry for every manual send/resend.
- Require admin authentication and server-side authorization for send actions.
- Show provider, provider message ID, status time, and sanitized error summary.
- Avoid showing raw provider response if it may include headers, tokens, or full recipient metadata.

## 12. Automatic sending and manual confirmation boundaries

Automatic sending is acceptable for applicant-facing status notifications after the business state has already been saved.

Manual confirmation should remain required for:

- Marking payment as `paid`.
- Cancelling payment orders.
- Any future refund workflow.
- Any future invoice issuance.
- Certificate PDF generation and delivery status decisions.
- Any message containing legal, financial, rejection, or sensitive review content that has not been approved as a standard template.

Email provider callback events must not update payment `paid` status. Payment status can only be changed by admin manual confirmation or a future real payment gateway callback.

## 13. Sensitive information principles

Notifications must not expose:

- Bank details unless provided and approved by the project owner.
- Supabase service role key, database connection string, admin session cookie, provider API key, or webhook secret.
- Storage object paths, signed URLs, or bucket names.
- Certificate verification token fields such as `vt` or raw token values.
- Internal review notes, committee notes, material review internals, recommender details, ID proof fields, or uploaded document metadata.
- Full provider responses that contain headers, credentials, request IDs tied to private dashboards, or raw recipient lists.

Existing `sanitizeNotificationPayload()` already filters many dangerous keys. Keep this filter and extend it only through reviewed code changes.

## 14. Suggested environment variables

Do not write real values into the repository.

Common variables:

- `ITCA_EMAIL_PROVIDER`: `none`, `resend`, `postmark`, `sendgrid`, `smtp`, or another selected provider.
- `ITCA_EMAIL_FROM`: verified sender address.
- `ITCA_EMAIL_REPLY_TO`: public support or secretary address.
- `ITCA_EMAIL_SENDER_NAME`: display name, for example association name.
- `ITCA_EMAIL_PROVIDER_API_KEY`: provider API key, if using an HTTP API provider.
- `ITCA_EMAIL_WEBHOOK_SECRET`: reserved for future provider webhook verification.
- `ITCA_EMAIL_DRY_RUN`: optional guard for preview environments.

SMTP-specific variables if SMTP is selected:

- `ITCA_SMTP_HOST`
- `ITCA_SMTP_PORT`
- `ITCA_SMTP_USER`
- `ITCA_SMTP_PASSWORD`
- `ITCA_SMTP_SECURE`

Operational variables:

- `NEXT_PUBLIC_SITE_URL` or existing site base URL input used by `getSiteBaseUrl()`.
- Optional admin-only feature flag such as `ITCA_NOTIFICATION_MANUAL_SEND_ENABLED`.

## 15. Recommended Phase 11 development order

### Phase 11.2: Email provider implementation behind existing abstraction

- Choose one real provider.
- Implement only the provider adapter and environment variable validation.
- Keep `provider=none` as the default.
- Do not add WhatsApp.
- Do not change database schema.
- Test with safe application/certification templates first.

### Phase 11.3: Admin notification operations

- Add notification detail view and filters.
- Add manual send/resend action for eligible records.
- Add audit logging for manual send/resend.
- Keep list masking and sensitive payload protections.
- Decide whether retries update the same row or need a later retry history schema.

### Phase 11.4: Payment notification hardening

- Add payment-specific email templates.
- Add checkout/result links where safe.
- Keep formal bank transfer copy blocked until real bank/payment instructions are provided.
- Keep `paid` changes restricted to admin confirmation or future real gateway callback.
- Keep .NET payment writer and Next.js email sender aligned through either a shared dispatcher or a server-only send endpoint.

