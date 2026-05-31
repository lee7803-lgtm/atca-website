# ITCA V1.3 Resend production readiness checklist

This document covers Phase 11.7 and 11.8 readiness only. It is a checklist for Resend, Vercel, sender identity, environment variables, test-recipient safeguards, and test boundaries before real email sending. It does not configure secrets, modify `.env` files, send email, add SQL, execute SQL, publish production, create test data, add WhatsApp, add bulk sending, change payment `paid` flow, change certificate verification tokens, or change PDF behavior.

## 1. Resend real-send prerequisites

### 1.1 Resend account

- Create or confirm the official ITCA-controlled Resend account.
- Confirm who owns account access, billing, audit access, and operational recovery.
- Do not use a personal Resend account for production applicant-facing email.
- Do not store API keys in the repository, documentation examples, screenshots, issue text, or chat transcripts.

### 1.2 Sender domain selection

- Choose an official domain controlled by ITCA.
- Prefer a sender domain aligned with the public website domain or an approved mail subdomain.
- Do not invent a sender domain in code or documentation.
- Confirm that the visible `From` domain matches the domain verified in Resend.

### 1.3 DNS verification

Before any real applicant-facing send:

- Add the sender domain in the Resend dashboard.
- Add all Resend-required DNS records at the domain DNS host.
- Confirm DKIM is verified.
- Confirm SPF or provider-managed SPF delegation is correct.
- Confirm DMARC policy exists for the sender domain.
- Confirm the Resend dashboard shows the domain as verified.
- After the first internal test, inspect received headers for SPF, DKIM, and DMARC pass results.

### 1.4 Sender email recommendation

Recommended sender patterns:

- `no-reply@<official-domain>` for system notifications that should not receive direct replies.
- `secretariat@<official-domain>` or `admin@<official-domain>` only if ITCA wants the sender mailbox to be recognizable as an administrative mailbox.

The final sender email and display name must be approved by ITCA before real sending.

### 1.5 Reply-to recommendation

- Use a monitored official mailbox, for example `secretariat@<official-domain>` or another approved support mailbox.
- Do not use a personal mailbox unless ITCA explicitly approves it.
- Do not use an unmonitored no-reply mailbox as reply-to if applicants may ask for help.
- Confirm the reply-to mailbox receives mail and has an operational owner.

### 1.6 Preview and Production separation

- Use separate Vercel environment scopes for Preview and Production.
- Preview should not share the Production Resend API key unless there is an explicit operational approval.
- Preview real sending, if ever tested, must be restricted to internal test recipients only.
- Production should start with `provider=none` or `resend` plus dry-run until sender domain verification and operational approval are complete.

### 1.7 Test recipient scope

- Only internal ITCA or developer-owned test mailboxes may receive test sends.
- Do not use applicant, recommender, committee, or public user email addresses during Preview testing.
- Do not use distribution lists or group aliases for the first send.
- Keep the first test to one existing safe notification row.

### 1.8 First real-send test flow

The first real-send test should be manual and single-recipient only:

1. Confirm Resend domain verification is complete.
2. Confirm Vercel variables are set in the intended environment scope.
3. Redeploy that Vercel environment after variable changes.
4. Confirm `/admin/notifications` shows the expected provider status.
5. Select one safe email-channel notification row with an internal test recipient.
6. Use the existing backend single-notification send action.
7. Confirm `notification_logs.send_status` becomes `sent` only if Resend accepted the message.
8. Confirm `provider=resend` and `provider_message_id` are stored without raw provider secrets.
9. Confirm the recipient mailbox received the email and authentication headers pass.
10. Turn any temporary Preview real-send switch back off after testing.

## 2. Recommended environment variables

Only variable names are documented here. Do not write real values into this repository.

| Variable | Purpose | Preview recommendation | Production recommendation |
| --- | --- | --- | --- |
| `ITCA_EMAIL_PROVIDER` | Selects the email provider resolver. | `resend` only during controlled readiness tests; otherwise `none`. | Start as `none`; switch to `resend` only after Resend domain verification and approval. |
| `ITCA_EMAIL_DRY_RUN` | Safety guard. Missing value defaults to dry-run behavior in current code. | `true`; set `false` only during an approved internal single-send test. | `true` initially; set `false` only after production readiness approval. |
| `ITCA_EMAIL_MANUAL_SEND_ENABLED` | Enables real provider calls for the admin single-notification route when other gates pass. | `false`; temporarily `true` only for a controlled internal test. | `false` initially; `true` only when manual single-send is approved. |
| `RESEND_API_KEY` | Resend API key name commonly used by Resend or Vercel integrations. Current code does not read this name directly. | Do not configure unless using a separate test key and an approved mapping to the code-read variable. | Store only in Vercel Production secrets if approved; map or duplicate to a code-read variable as needed. |
| `ITCA_EMAIL_PROVIDER_API_KEY` | Generic API-provider key read by current code for Resend. | Optional test key only; never a production key unless specifically approved. | Use for the approved Resend key, or use `ITCA_RESEND_API_KEY` instead. |
| `ITCA_RESEND_API_KEY` | Resend-specific API key name read by current code. | Optional test key only; never a production key unless specifically approved. | Use for the approved Resend key, or use `ITCA_EMAIL_PROVIDER_API_KEY` instead. |
| `ITCA_EMAIL_FROM` | Verified sender email address. | Use a verified test sender on the approved domain or sandbox domain. | Use the approved verified ITCA sender address. |
| `ITCA_EMAIL_FROM_NAME` | Visible sender display name. | Use an approved test display name, for example `ITCA Test`. | Use the approved ITCA display name. |
| `ITCA_EMAIL_REPLY_TO` | Monitored reply mailbox. | Use an internal monitored test mailbox. | Use the approved monitored ITCA mailbox. |
| `ITCA_EMAIL_ALLOWED_TEST_RECIPIENTS` | Comma-separated internal test recipient allowlist. Current code reads it case-insensitively and never displays the full list. | Required before Preview real-send testing. | Keep for smoke tests; do not treat it as a bulk-send list. |
| `NEXT_PUBLIC_SITE_URL` | Public site base URL used by email templates when links are included. | Preview deployment URL or approved Preview base URL. | Official production site URL. |

## 3. Default safety configuration

### 3.1 Preview

Recommended default:

- `ITCA_EMAIL_PROVIDER=resend`
- `ITCA_EMAIL_DRY_RUN=true`
- `ITCA_EMAIL_MANUAL_SEND_ENABLED=false`
- Do not configure a real production API key.
- If a key is needed, use a separate test key and internal recipients only.
- Configure `ITCA_EMAIL_ALLOWED_TEST_RECIPIENTS` only with internal test addresses before any real Preview send.

For a short controlled Preview real-send test, set `ITCA_EMAIL_DRY_RUN=false` and `ITCA_EMAIL_MANUAL_SEND_ENABLED=true` only for the test window, then turn the switch back off and redeploy.

### 3.2 Production initial state

Recommended initial state:

- `ITCA_EMAIL_PROVIDER=none`
- Or `ITCA_EMAIL_PROVIDER=resend` with `ITCA_EMAIL_DRY_RUN=true`
- `ITCA_EMAIL_MANUAL_SEND_ENABLED=false`
- Automatic sending remains off.
- Real sending is limited to backend single-notification manual send after all gates are approved.

Do not switch Production to real sending until the sender domain is verified, sender/reply-to are approved, Vercel variables are checked, and the first internal-only send plan is approved.

## 4. Real-send checklist

Complete this checklist before any real email leaves the system:

- [ ] Resend sender domain is verified.
- [ ] Sender email address is approved and matches the verified domain.
- [ ] Reply-to mailbox is approved, monitored, and tested.
- [ ] Vercel Preview environment variables are reviewed.
- [ ] Vercel Production environment variables are reviewed.
- [ ] Vercel deployment is redeployed after variable changes.
- [ ] `/admin/notifications` displays the expected provider status.
- [ ] Backend single-send button and response copy cannot be mistaken for sent when the provider returns `skipped`.
- [ ] One safe test notification row is identified.
- [ ] The test recipient is an internal mailbox.
- [ ] After send, `notification_logs` status, provider, provider message ID, and status timestamp match expectations.
- [ ] Payment, PDF, WhatsApp, and sensitive-material notifications are not sent.
- [ ] No Storage path, certificate `vt` token, PDF path, database connection string, API key, service role key, admin cookie, identity material, recommender detail, committee note, or internal review note appears in the email, UI, logs, audit logs, API response, or provider metadata.

## 5. First real-send notification type recommendations

These are recommendations only. Do not implement automatic sending in Phase 11.7.

Suitable first candidates after internal testing:

- Application submission confirmations:
  - `member_application_submitted`
  - `organization_application_submitted`
  - `certification_application_submitted`
- Need-more-info reminders:
  - `member_application_need_more_info`
  - `certification_application_need_more_info`
  - The email must not include material privacy details or internal review notes.
- Supplement received confirmation:
  - `supplement_submitted`
- Standard review result notifications:
  - `member_application_approved`
  - `member_application_rejected`
  - `certification_application_approved`
  - `certification_application_rejected`
  - The email must not include internal review opinions or committee notes.
- Certificate status reminders:
  - `certificate_generated`
  - `certificate_delivered`
  - Do not attach PDFs, expose PDF paths, or include short-lived certificate verification token values.
- Safe member status template:
  - `member_status_updated`

## 6. Continue prohibiting real sends

Do not real-send these until separate product, operations, and security approval:

- `payment.paid`
- `payment.manual_confirmed`
- `payment.cancelled`
- `payment.order_updated`
- `renewal.payment_required` and `rereview.payment_required`, unless payment instructions and bank details are formally approved.
- `certificate_pdf_generated` if the email contains a PDF download link, attachment, signed URL, storage path, or PDF storage path.
- WhatsApp notifications.
- Bulk or group sends.
- Any notification containing identity documents, ID proof metadata, recommender information, internal remarks, committee opinions, material review internals, Storage paths, PDF storage paths, certificate `vt` tokens, provider keys, database identifiers, database connection strings, service role keys, or admin session material.

## 7. Suggested Phase 11.8 scope

Recommended next phase: Resend Preview environment real single-notification manual-send test preparation only.

Phase 11.8 should still avoid automatic sending. Suggested scope:

1. Add a server-side test recipient allowlist such as `ITCA_EMAIL_ALLOWED_TEST_RECIPIENTS`.
2. Add clearer admin provider diagnostics for dry-run, disabled manual send, missing key, and ready states.
3. Make dry-run versus real-send copy explicit in the admin action response.
4. Prepare one safe test notification row using an internal recipient through an approved manual process.
5. Keep WhatsApp, bulk send, payment notifications, PDF delivery, automatic triggers, SQL changes, and test-data creation outside the phase.

## 8. Phase 11.8 implementation notes

Phase 11.8 prepares for a future Preview-only manual single-send test. It still does not send real email, configure real keys, or create test notification data.

Code-level safeguards now expected before real Preview testing:

- `ITCA_EMAIL_ALLOWED_TEST_RECIPIENTS` is read as a comma-separated list.
- Whitespace is trimmed and matching is case-insensitive.
- The admin page may show whether the allowlist is configured, but must never display the full email list.
- `provider=none` and `dry-run=true` continue to skip without requiring a white-listed recipient.
- `provider=resend` with `dry-run=false` and manual send enabled still cannot call Resend unless the allowlist exists and the selected notification recipient is on it.
- Payment, PDF-related, WhatsApp, and sensitive-payload notification types remain blocked from manual real-send preparation.

## 9. Preparing a safe test notification for Phase 11.9

Phase 11.9 should prepare one safe notification for a Preview environment manual single-send test only after approval. Do not create test data without explicit confirmation.

Safe test notification requirements:

1. Use only an internal test mailbox that appears in `ITCA_EMAIL_ALLOWED_TEST_RECIPIENTS`.
2. Use a low-risk email notification type, preferably an application submission confirmation such as `member_application_submitted`, `organization_application_submitted`, or `certification_application_submitted`.
3. Do not test payment notification types.
4. Do not test PDF notification types.
5. Do not test WhatsApp.
6. Do not include Storage paths, PDF paths, `vt` tokens, identity materials, recommender information, committee notes, or internal review text.
7. Confirm the message body uses a standard safe template and points users back to official query pages.

Preview variables for an approved Phase 11.9 test:

- `ITCA_EMAIL_PROVIDER=resend`
- `ITCA_EMAIL_DRY_RUN=false`
- `ITCA_EMAIL_MANUAL_SEND_ENABLED=true`
- `RESEND_API_KEY` configured only in Vercel Preview, never in code
- `ITCA_EMAIL_FROM` set to a verified-domain sender
- `ITCA_EMAIL_REPLY_TO` set to a monitored internal mailbox
- `ITCA_EMAIL_ALLOWED_TEST_RECIPIENTS` set only to internal test mailboxes

After the test, immediately restore one of these safety settings and redeploy:

- `ITCA_EMAIL_DRY_RUN=true`
- Or `ITCA_EMAIL_MANUAL_SEND_ENABLED=false`
