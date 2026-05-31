# ITCA V1.3 Phase 10 Payment Schema Plan

本文件是支付订单与支付事件的 schema 方案，不是 SQL 迁移文件。当前轮次不新增 SQL、不执行数据库变更。

## Design Principles

- 支付订单独立于申请、会员、证书记录，避免把付款状态混入审核状态。
- `payment_orders` 保存当前状态快照，`payment_events` 保存不可变事件流水。
- 真实支付网关暂不接入，但 schema 必须预留 provider、provider order id、webhook event id 和原始 payload。
- 后台人工确认是第 10 阶段初期的主路径。
- 所有后台确认、取消、失败、退款标记都必须写 `audit_logs`。
- 关键节点只写 `notification_logs`，provider 继续允许 `none`。

## Proposed payment_orders Table

逻辑字段：

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| id | uuid | yes | Primary key |
| order_no | text | yes | Public order number, unique |
| business_type | text | yes | member_application, organization_application, certification_application, member_renewal, certificate_review |
| business_id | uuid | yes | Canonical related record id |
| application_id | uuid | no | Related applications.id |
| certification_application_id | uuid | no | Related certification_applications.id |
| certificate_id | uuid | no | Related certificates.id |
| application_no | text | no | Display/search denormalization |
| member_no | text | no | Display/search denormalization |
| certificate_no | text | no | Display/search denormalization |
| payer_name | text | no | Snapshot |
| payer_email | text | no | Snapshot |
| payer_phone | text | no | Snapshot |
| currency | text | yes | Suggested default USD |
| amount | numeric(12,2) | yes | Must be >= 0 |
| fee_code | text | yes | Price item code |
| provider | text | yes | none, manual, stripe, paypal, bank_transfer, other |
| provider_order_id | text | no | Gateway order id |
| provider_payment_id | text | no | Gateway payment id |
| status | text | yes | draft, pending_payment, proof_submitted, processing, paid, confirmed, failed, cancelled, expired, refunded |
| payment_method | text | no | manual_bank_transfer, offline, card, wallet, unknown |
| payment_proof_url | text | no | Future storage path or URL |
| payment_proof_note | text | no | Transfer reference or admin note |
| paid_at | timestamptz | no | Provider or manual paid timestamp |
| confirmed_at | timestamptz | no | Business confirmation timestamp |
| confirmed_by | text | no | Admin email/name |
| cancelled_at | timestamptz | no | Cancel timestamp |
| cancelled_by | text | no | Admin/system |
| cancel_reason | text | no | Required when cancelled by admin |
| refunded_at | timestamptz | no | Refund marker |
| refund_reason | text | no | Refund marker |
| expires_at | timestamptz | no | Optional pending order expiry |
| metadata | jsonb | yes | Default empty object |
| created_at | timestamptz | yes | Default now |
| updated_at | timestamptz | yes | Default now |

Recommended indexes:

- unique `order_no`
- `(status, created_at desc)`
- `(business_type, business_id)`
- `application_no`
- `member_no`
- `certificate_no`
- `(provider, provider_order_id)` where `provider_order_id is not null`
- `(provider, provider_payment_id)` where `provider_payment_id is not null`

Recommended constraints:

- `amount >= 0`
- `currency` uppercase 3-letter code if the team wants stricter validation.
- `business_type` check list.
- `status` check list.
- `provider` check list.
- At least one business reference should be present according to `business_type`.

## Proposed payment_events Table

逻辑字段：

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| id | uuid | yes | Primary key |
| payment_order_id | uuid | yes | References payment_orders.id |
| order_no | text | yes | Denormalized for search |
| event_type | text | yes | created, provider_created, proof_submitted, paid, confirmed, failed, cancelled, expired, refunded, webhook_received, admin_note |
| from_status | text | no | Previous order status |
| to_status | text | no | New order status |
| provider | text | yes | Same provider vocabulary |
| provider_event_id | text | no | Webhook id for idempotency |
| payload_json | jsonb | yes | Event payload snapshot |
| created_by | text | yes | system, applicant, admin email |
| created_at | timestamptz | yes | Default now |

Recommended indexes:

- `(payment_order_id, created_at desc)`
- `(order_no, created_at desc)`
- `(event_type, created_at desc)`
- unique `(provider, provider_event_id)` where `provider_event_id is not null`

## Order Number Recommendation

Suggested format:

- `ITCA-PAY-YYYY-XXXXXX`

Generation rules:

- Use the same random suffix style as existing ITCA public numbers.
- Do not reuse application number or certificate number as payment order number.
- Keep `order_no` stable even if the related application or certificate status changes.

## Business Type Mapping

| business_type | Main Relation | Payment Confirmation Business Action |
| --- | --- | --- |
| member_application | applications.id | Mark payment confirmed; allow/advance review queue |
| organization_application | applications.id | Same as member_application |
| certification_application | certification_applications.id | Mark payment confirmed; allow/advance certification review |
| member_renewal | applications.id | Start or complete member renewal |
| certificate_review | certificates.id plus certification_applications.id | Start certificate review/renewal |

## Status Transition Matrix

Allowed initial statuses:

- `draft`
- `pending_payment`

Allowed transitions:

- `draft -> pending_payment`
- `pending_payment -> proof_submitted`
- `pending_payment -> processing`
- `pending_payment -> paid`
- `pending_payment -> cancelled`
- `pending_payment -> expired`
- `proof_submitted -> confirmed`
- `proof_submitted -> failed`
- `proof_submitted -> cancelled`
- `processing -> paid`
- `processing -> failed`
- `paid -> confirmed`
- `paid -> refunded`
- `confirmed -> refunded`

Terminal or near-terminal states:

- `confirmed`: no ordinary rollback.
- `cancelled`: no ordinary reopening.
- `expired`: create a new order if needed.
- `refunded`: financial reversal marker; business status needs separate review.

## Idempotency Rules

- Creating an order should be idempotent per open business object and `business_type`.
- Provider webhook should be idempotent by `(provider, provider_event_id)`.
- Manual confirm should be idempotent: confirming an already `confirmed` order returns success without duplicating business side effects.
- Business state updates should include `payment_order_id / order_no` in metadata or audit snapshots to detect duplicate handling.

## Relationship With Existing Tables

Applications:

- Do not add payment fields directly to `applications` in the initial design.
- Query payment state through `payment_orders` by `business_type + application_id` or `application_no`.
- Keep existing member status fields as business result, not financial source of truth.

Certification applications:

- Do not add payment fields directly to `certification_applications` initially.
- New application payment only gates or annotates review readiness.

Certificates:

- Do not add payment fields directly to `certificates` initially.
- Certificate review payment should update `certificate_review_status` only after payment confirmation and/or review progress.

Notification logs:

- Add `payment_order_id` only if later necessary; initial linkage can use `source_type=payment_order`, `source_action`, and `payload_json.orderNo`.
- If schema is expanded, add `payment_order_id` and `order_no` to `notification_logs` for easier joins.

Audit logs:

- Existing `audit_logs.resource_type/resource_id/resource_no` already supports `payment_order`.
- No schema change required for audit linkage.

## .NET API Shape Recommendation

Admin endpoints:

- `GET /api/admin/payment-orders`
- `GET /api/admin/payment-orders/{id}`
- `POST /api/admin/payment-orders`
- `PATCH /api/admin/payment-orders/{id}/manual-payment`
- `POST /api/admin/payment-orders/{id}/confirm`
- `POST /api/admin/payment-orders/{id}/cancel`
- `POST /api/admin/payment-orders/{id}/mark-failed`

Future provider endpoints:

- `POST /api/payment/webhooks/{provider}`
- `POST /api/payment-orders/{orderNo}/checkout-session` after a real payment page exists.

Next.js boundary:

- `lib/api/payment-orders.ts` should call .NET first.
- Next.js pages should not directly write payment tables once .NET endpoints exist.
- Supabase fallback for payment writes should be avoided unless explicitly required for local development.

## Notification Type Additions

Payment generic:

- `payment_order_created`
- `payment_proof_submitted`
- `payment_confirmed`
- `payment_failed`
- `payment_cancelled`

Business-specific:

- `member_application_payment_confirmed`
- `certification_application_payment_confirmed`
- `member_renewal_payment_confirmed`
- `certificate_review_payment_confirmed`

## Audit Action Additions

Payment:

- `payment_order.create`
- `payment_order.update_manual_payment`
- `payment_order.confirm`
- `payment_order.cancel`
- `payment_order.mark_failed`
- `payment_order.mark_refunded`

Business linkage:

- `member_application.payment_confirmed`
- `certification_application.payment_confirmed`
- `member_renewal.payment_confirmed`
- `certificate_review.payment_confirmed`

## Deferred Items

- SQL migration file.
- RLS policy decisions for applicant-facing payment records.
- Payment proof storage bucket.
- Provider-specific webhook signature validation.
- Tax invoice/receipt model.
- Refund workflow beyond status marker.
- Scheduled expiry job.
- Automated renewal reminder job.

## Suggested Next Round 10.2

10.2 建议只产出 SQL 草案，不执行：

- `supabase/v1-3-payments.sql` 草案。
- `payment_orders` and `payment_events` DDL。
- indexes, constraints, trigger, RLS revoke plan。
- optional notification type notes if no enum table exists.

10.2 仍建议不接支付网关、不做 UI，只把 schema 评审稳定下来。
