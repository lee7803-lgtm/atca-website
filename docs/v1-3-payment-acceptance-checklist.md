# ITCA V1.3 Phase 10 Payment Acceptance Checklist

## Completed Scope

- `payment_orders` and `payment_events` are established as the payment order and event foundation.
- Admin payment management is available at `/admin/payments` and `/admin/payments/[id]`.
- Admin can create payment orders from personal member, organization member, and Taoist certification applications.
- Applicant-facing pages are available at `/payment/checkout?orderNo=...` and `/payment/result?orderNo=...`.
- `/application/query` shows applicant-safe payment information after application number plus email or phone verification.
- Applicant-verified renewal and rereview order creation is available for:
  - `personal_member_renewal`
  - `organization_member_renewal`
  - `taoist_certification_renewal`
  - `taoist_certification_rereview`
- `payment_events`, `audit_logs`, and `notification_logs` are written for order creation.
- `notification_logs` remain `provider=none` and `send_status=skipped`.

## Current Payment Boundary

- No real payment gateway is connected.
- No Billplz, iPay88, Stripe, SenangPay, or payment SDK is installed.
- No real gateway callback exists.
- No automatic refund flow exists.
- No automatic invoice flow exists.
- No financial report module exists.
- The current `manual` / `none` provider flow is only an order, payment instruction, applicant display, and admin manual confirmation loop.
- `paid` can only be set by admin manual confirmation or by a future verified gateway callback.
- The public frontend cannot mark an order as `paid`.

## Bank Transfer Boundary

The site does not currently contain real bank transfer details.

If bank transfer instructions are configured later, the user must provide:

- Bank name
- Account name
- Bank account number
- SWIFT / IBAN if applicable
- Receiving legal entity
- Required payment reference format
- Payment proof submission method

Do not invent bank names, account names, account numbers, SWIFT, IBAN, or receiving entity details.

## Public Data Boundary

Applicant-facing payment pages and `/application/query` may show only safe fields:

- Payment order number
- Business type label
- Application number
- Payer display name
- Amount and currency
- Payment channel display text
- Payment status display text
- Created time
- Paid time if present
- Cancelled time if present

They must not show:

- `admin_note`
- `internal_note`
- `provider_payload`
- `payment_events`
- `audit_logs`
- `notification_logs`
- Database ids
- Service role key
- Admin token
- Database connection string
- Storage path
- Verification token
- Payment secret
- Provider secret

## Follow-Up Scope

Later phases may add:

- Real payment gateway provider abstraction
- Gateway callback verification and idempotency
- Bank transfer proof upload
- Automatic invoices
- Refund workflow
- Finance export and reporting
- Renewal reminder jobs
