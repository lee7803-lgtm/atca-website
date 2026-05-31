# ITCA V1.3 email provider abstraction

This document records the Phase 11.2 to 11.6 email provider abstraction work. These phases do not add provider secrets, do not modify `.env` files, and do not add automatic email trigger points.

## Current entry point

Application and certification workflows use `sendEmailNotification()` from `lib/notifications/email/send.ts`.

The entry point:

1. Builds the applicant-facing email template.
2. Resolves the provider from `ITCA_EMAIL_PROVIDER`.
3. Calls the selected provider adapter.
4. Writes one `notification_logs` row with the final status.
5. Returns a normalized result without throwing provider errors into the main business flow.

## Provider selection

Provider selection is handled by `resolveEmailProvider()` in `lib/notifications/email/provider.ts`.

Provider configuration is read by `getEmailProviderConfig()` in `lib/notifications/email/config.ts`.

Allowed/reserved provider names:

- `none`
- `resend`
- `smtp`
- `sendgrid`
- `other`

Default behavior:

- Missing `ITCA_EMAIL_PROVIDER` means `none`.
- Blank `ITCA_EMAIL_PROVIDER` means `none`.
- Missing `ITCA_EMAIL_DRY_RUN` means dry-run safety is enabled.
- `none` does not send email and returns `sendStatus=skipped`.
- `resend` uses the Resend adapter added in Phase 11.6, but still returns `sendStatus=skipped` unless all real-send gates are satisfied.
- Other reserved real providers currently do not send email and return `sendStatus=skipped`.
- Unknown provider names currently do not send email and return `sendStatus=skipped`.

This keeps preview and production safe until a real provider adapter is intentionally implemented and reviewed.

## Normalized result shape

Provider adapters return:

- `ok`
- `sendStatus`
- `provider`
- `providerMessageId`
- `providerResponse`
- `errorMessage`
- `skippedReason`

The public send result returned by `sendEmailNotification()` includes:

- `ok`
- `status`
- `notificationLogId`
- `provider`
- `providerMessageId`
- `errorMessage`
- `skippedReason`

`error` remains for compatibility with existing workflow callers.

## `provider=none` behavior

`NoneEmailProvider` is the default safe provider.

It:

- Does not send real email.
- Returns `ok=true`.
- Returns `sendStatus=skipped`.
- Returns `provider=none`.
- Returns `skippedReason=email_provider_not_configured`.
- Allows the business workflow to continue.
- Preserves the existing `notification_logs` skipped semantics.

## Resend provider behavior

Phase 11.6 adds `ResendEmailProvider` behind `resolveEmailProvider()`.

It:

- Requires `ITCA_EMAIL_PROVIDER=resend`.
- Requires `ITCA_EMAIL_FROM`, `ITCA_EMAIL_REPLY_TO`, and `ITCA_EMAIL_PROVIDER_API_KEY` or `ITCA_RESEND_API_KEY`.
- Keeps missing `ITCA_EMAIL_DRY_RUN` safe by treating dry-run as enabled.
- Requires `ITCA_EMAIL_DRY_RUN=false` before any real provider call.
- Requires `ITCA_EMAIL_MANUAL_SEND_ENABLED=true` before any real provider call.
- Requires the caller to pass `allowRealSend=true`; the existing automatic workflow entry point does not pass this flag.
- Sends text-only email content and does not send attachments.
- Stores only the Resend message ID and small sanitized delivery metadata.
- Returns `sendStatus=skipped` for missing config, dry-run, disabled manual send, missing recipient, or non-manual paths.

The admin notification page displays safe Resend status only. It does not display API keys, provider secrets, storage paths, certificate verification tokens, PDF paths, or raw provider responses.

## Reserved provider behavior

`smtp`, `sendgrid`, and `other` remain reserved names only in this phase.

They:

- Do not import SDKs.
- Do not read API keys or passwords.
- Do not send real email.
- Return `sendStatus=skipped`.
- Return `skippedReason=email_provider_reserved_not_implemented`.

When a real provider is later implemented, only its adapter should call the external service. The default should remain `none`.

## Phase 11.4 provider configuration status

Phase 11.4 adds configuration status only. It does not enable real sending.

Supported environment variable names:

- `ITCA_EMAIL_PROVIDER`: `none`, `resend`, `smtp`, `sendgrid`, or `other`.
- `ITCA_EMAIL_DRY_RUN`: defaults to safe dry-run behavior when missing.
- `ITCA_EMAIL_FROM`: verified sender address, required before any real provider can be enabled.
- `ITCA_EMAIL_FROM_NAME`: sender display name.
- `ITCA_EMAIL_REPLY_TO`: reply-to address, required before any real provider can be enabled.
- `ITCA_EMAIL_PROVIDER_API_KEY`: reserved API-provider key name; never output by UI/API.
- `ITCA_RESEND_API_KEY`: reserved Resend-specific key name; never output by UI/API.
- `ITCA_SENDGRID_API_KEY`: reserved SendGrid-specific key name; never output by UI/API.
- `ITCA_SMTP_HOST`, `ITCA_SMTP_PORT`, `ITCA_SMTP_USER`, `ITCA_SMTP_PASSWORD`: reserved SMTP names; never output by UI/API.

The status model exposed to admin UI is safe-only:

- `provider`
- `mode`: `none`, `dry-run`, `reserved`, or `unavailable`
- `configured`
- `canSend`
- `displayName`
- `safeMessage`

It never includes secret values, SMTP passwords, provider keys, database connection strings, storage paths, or verification tokens.

Current status behavior:

- `provider=none`: shows `模拟发送模式`; no real email is sent.
- `provider=resend` with missing required config: shows Resend configuration incomplete; no real email is sent.
- `provider=resend` with dry-run enabled: shows Resend dry-run; no real email is sent.
- `provider=resend` with required names present and dry-run disabled but `ITCA_EMAIL_MANUAL_SEND_ENABLED` not enabled: shows Resend configured but manual send disabled; no real email is sent.
- `provider=resend` with full configuration, dry-run disabled, and manual send enabled: only the admin single-notification route may call Resend.
- `provider=smtp/sendgrid/other` with required names present: shows reserved/dry-run provider state; no real email is sent because no real adapter is implemented.
- Unknown provider names are unavailable and skipped.

Before enabling real sending, the project must complete:

- Domain verification.
- Sender address confirmation.
- Reply-to confirmation.
- Provider key configuration in deployment secrets.
- Sending frequency/rate limits.
- Idempotency protection.
- Failure retry strategy.
- Automatic-send whitelist.

Payment notifications, PDF notification delivery, WhatsApp, bulk send, and automatic trigger expansion are outside Phase 11.4.

## Template data safety

Template payloads continue to pass through `sanitizeNotificationPayload()` before being logged or passed to provider adapters.

The filter removes sensitive keys and sensitive-looking values, including:

- internal review fields
- committee fields
- material review internals
- storage paths
- PDF storage paths
- `vt` and token fields
- API keys and private keys
- service role references
- database connection strings
- passwords and secrets
- SMTP connection values
- recommender fields
- ID proof and identity fields

Provider responses are also sanitized before they are stored in `notification_logs`.

## Current non-goals

This phase does not:

- Send real email.
- Add a real email SDK.
- Add WhatsApp.
- Add group/bulk sending.
- Modify payment paid status flow.
- Modify certificate verification token logic.
- Modify PDF certificate logic.
- Add SQL.
- Execute SQL.
- Modify database structure.
- Add external service dependencies.

## Phase 11.3 manual single-notification action

The admin notification page can trigger one notification at a time through:

- `POST /api/admin/notifications/[id]/send`

The route:

- Requires an authenticated admin session.
- Reads the recipient, subject, message body, template key, and safe payload from the existing `notification_logs` row.
- Does not accept client-supplied recipient overrides.
- Supports email-channel rows only in this phase.
- Calls the existing email provider abstraction.
- Updates the same `notification_logs` row with the provider result.
- Uses existing `send_status` values only.

When the selected provider is `none`, the action is a simulation:

- No real email is sent.
- `send_status` remains an existing allowed value: `skipped`.
- `skipped_at` is refreshed.
- The admin-facing message is: `已完成模拟发送，当前未接入真实邮件服务。`

The route returns only a minimal status summary and never returns raw payloads, provider responses, service keys, storage paths, verification tokens, or applicant material details.
