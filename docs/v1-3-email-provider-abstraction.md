# ITCA V1.3 email provider abstraction

This document records the Phase 11.2 email provider abstraction update. This phase does not connect a real email SDK, does not add provider secrets, and does not send real email.

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

Allowed/reserved provider names:

- `none`
- `resend`
- `smtp`
- `sendgrid`
- `other`

Default behavior:

- Missing `ITCA_EMAIL_PROVIDER` means `none`.
- Blank `ITCA_EMAIL_PROVIDER` means `none`.
- `none` does not send email and returns `sendStatus=skipped`.
- Reserved real providers currently do not send email and return `sendStatus=skipped`.
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

## Reserved provider behavior

`resend`, `smtp`, `sendgrid`, and `other` are reserved names only in this phase.

They:

- Do not import SDKs.
- Do not read API keys or passwords.
- Do not send real email.
- Return `sendStatus=skipped`.
- Return `skippedReason=email_provider_reserved_not_implemented`.

When a real provider is later implemented, only its adapter should call the external service. The default should remain `none`.

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

