# ITCA V1.3 Record Disposition Plan

Scope: Phase 12.4-A read-only scan and draft plan for test / archived / voided record governance.

This document is a planning artifact only. No SQL has been executed and no business code has been changed in this round.

## Scan Summary

### Member applications

Current table: `applications`.

Current workflow status values:

- `submitted`
- `pending_review`
- `under_review`
- `need_more_info`
- `approved`
- `rejected`
- `archived`

Current read/write entry points scanned:

- Admin list/detail: `app/admin/applications/page.tsx`, `app/admin/applications/[id]/page.tsx`
- Next.js helper: `lib/api/admin-applications.ts`, `lib/supabase/server.ts`
- .NET admin list/update: `backend/Itca.Api/Features/Applications/ApplicationAdminQueries.cs`, `ApplicationAdminCommands.cs`
- Public application query: `app/application/query/page.tsx`, `app/api/applications/query/route.ts`, `backend/Itca.Api/Program.cs`, `ApplicationQueries.cs`
- Supplement flow: `app/api/applications/supplement/route.ts`

Key findings:

- `status='archived'` is currently a member application workflow state and appears in admin filters and status labels.
- Open application duplicate checks use active workflow statuses: `submitted`, `pending_review`, `under_review`, `need_more_info`, `approved`.
- Applicant query finds by `application_no` plus email or phone and currently does not distinguish test / voided records.
- Supplement submission is allowed only when `status='need_more_info'`.

### Certification applications

Current table: `certification_applications`.

Current workflow status values:

- `submitted`
- `under_review`
- `need_more_info`
- `approved`
- `rejected`
- `certificate_issued`
- `cert_issued`
- `delivered`
- `archived`
- `revoked`

Current read/write entry points scanned:

- Admin list/detail: `app/admin/certification-applications/page.tsx`, `app/admin/certification-applications/[id]/page.tsx`
- Supabase helper: `lib/supabase/server.ts`
- Admin update route: `app/api/admin/certification-applications/[id]/route.ts`
- Public application query: `backend/Itca.Api/Features/Applications/ApplicationQueries.cs`
- Supplement flow: `app/api/applications/supplement/route.ts`

Key findings:

- `status='archived'` and `status='revoked'` are workflow / certificate lifecycle states, not general record governance states.
- Certification applicant query can return any matching certification application by application number and contact.
- Supplement submission is allowed only when `status='need_more_info'`.
- Certificate, PDF, delivery, and revocation workflows are separate from test / archived / voided record governance and should not be repurposed.

### Payment, notification, audit records

Current tables scanned:

- `payment_orders`
- `payment_events`
- `notification_logs`
- `audit_logs`

Key findings:

- Payment orders are linked through `application_id`, `certification_application_id`, `application_no`, `member_no`, and `certificate_no`.
- Existing active payment order prevention checks `pending_payment`, `manual_review`, and `paid` orders linked to a source.
- Notification logs are linked through application/certification/certificate identifiers and contain recipient contact and message metadata.
- Audit logs already support generic actions, resource type/id/no, before/after data, and summary.
- Payment, notification, and audit records should remain immutable trace records. They should not be structurally changed for 12.4-A.

## Why `status='archived'` Is Not Enough

`status` currently represents business workflow. It answers questions like:

- Has the application been submitted?
- Is it under review?
- Does it need more information?
- Was it approved, rejected, issued, delivered, archived, or revoked?

Test / archived / voided governance answers a different question:

- Should this database record participate in normal operations, duplicate checks, applicant lookup, dashboards, and default admin lists?

Using only `status='archived'` is insufficient because:

- Test data can exist in many workflow states, including `submitted`, `approved`, and `certificate_issued`.
- A real rejected application may still be a normal business record and should not be treated as test or voided.
- A certification `archived` status means the certification workflow is complete; it does not mean the row should be hidden from normal reports or excluded from applicant lookup.
- A voided record needs an explicit reason and actor/timestamp without destroying the workflow status history.
- Duplicate contact checks should ignore test / voided / governance-archived rows while preserving their original workflow status.

Recommendation: keep `status` as workflow state and add a separate record governance field.

## Recommended Fields

Add the same fields to both `applications` and `certification_applications`:

- `record_disposition text not null default 'normal'`
- `record_disposition_note text`
- `record_disposition_at timestamptz`
- `record_disposition_by text`

Allowed `record_disposition` values:

- `normal`: active operational record, default
- `test`: internal test record, hidden from default operations and excluded from duplicate checks
- `archived`: governance archive, hidden from default operations but preserved for traceability
- `voided`: invalidated record, hidden from default operations and applicant lookup should not expose details

Both `applications` and `certification_applications` need the same fields because both can produce test records, duplicate contact conflicts, applicant lookup results, payment orders, notification logs, and audit log entries.

## Admin List Rules

Default admin list behavior should be:

- Show only `record_disposition='normal'`.
- Add a separate disposition filter with values: `normal`, `test`, `archived`, `voided`, and optionally `all`.
- Keep the existing workflow status filter unchanged.

Recommended UI model:

- Existing `status` filter continues to mean workflow state.
- New `recordDisposition` filter controls visibility of test / governance archive / voided rows.
- CSV export should follow the currently selected list filters and include a disposition column once implemented.

## Email / Phone Occupancy Rules

Only records that are both operational and open should participate in duplicate contact checks.

Recommended rule:

- Include only `record_disposition='normal'`.
- Exclude workflow statuses `rejected` and `archived`.
- Exclude governance dispositions `test`, `archived`, and `voided`.
- In practice, open member statuses remain: `submitted`, `pending_review`, `under_review`, `need_more_info`, `approved`.
- Certification applications should use an equivalent open workflow set when a duplicate prevention rule is introduced there.

This means test / governance-archived / voided records do not occupy email or phone.

## Applicant Query Rules

Recommended applicant-facing query behavior:

- `normal`: queryable according to the existing application number + contact rule.
- `test`: not queryable by default in public applicant query. If test lookup is needed, use an admin-only path or explicit internal tooling.
- `archived`: queryable only if it is a normal business archive; governance `record_disposition='archived'` should be hidden from public applicant query by default.
- `voided`: do not expose full record details. Preferred behavior is a generic not-found response. If business policy requires acknowledgement, return a narrow message such as "记录已作废，请联系协会秘书处" without exposing original content.

For public result consistency, the safest first implementation is to filter applicant queries to `record_disposition='normal'`.

## Supplement Rules

Supplement submission should require:

- Matching application number and contact.
- `record_disposition='normal'`.
- Existing workflow status `need_more_info`.

This prevents test, governance-archived, or voided records from being reactivated through public supplement submission.

## Payment And Notification Traceability

Payment orders and notification logs should not follow hidden records by being deleted or structurally mutated.

Recommended behavior:

- Admin default lists can continue to show all payment and notification records, because they are operational logs.
- Application detail pages should retain linked payment and notification records for traceability, including when the application is test / archived / voided.
- If future admin UX needs quieter operations views, add filters at the list/query layer rather than changing `payment_orders` or `notification_logs` schemas.
- Do not change `payment_orders`, `payment_events`, or `notification_logs` tables in the first record disposition migration.

## Audit Log Actions

Recommended audit action names:

- `application.record_disposition_update`
- `certification_application.record_disposition_update`

Recommended audit fields:

- `resource_type`: `application` or `certification_application`
- `resource_id`: application UUID
- `resource_no`: application number
- `before_data`: previous disposition fields
- `after_data`: new disposition fields
- `summary`: concise Chinese summary naming application number and new disposition

## Implementation Sequence Recommendation

1. Review and apply SQL migration manually after approval.
2. Update TypeScript and .NET DTOs to include record disposition fields.
3. Update admin list queries to default `record_disposition='normal'` and add disposition filters.
4. Update public applicant query and supplement target queries to require `record_disposition='normal'`.
5. Update duplicate contact checks to include only `record_disposition='normal'` and open workflow statuses.
6. Add admin detail controls for disposition update with audit log writes.
7. Keep payment / notification / audit records immutable and visible in details for traceability.

## Risks And Open Decisions

- Existing rows will default to `normal`; any test or obsolete rows must be classified later by an explicit admin action or one-time reviewed update.
- Public behavior for `voided` records needs final product wording: generic not-found is safest, but "record voided" may reduce support workload.
- Certification duplicate checks are less centralized than member application duplicate checks; implementation should audit submission paths before enforcement.
- Once disposition controls exist, permissions should decide which admin roles may mark records as test, archived, or voided.
