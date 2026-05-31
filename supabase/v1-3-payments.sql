-- ITCA V1.3 Phase 10 payment orders foundation draft.
-- Do not run automatically. Apply manually after review.
--
-- Suggested notification_logs event names:
-- - payment.order_created
-- - payment.paid
-- - payment.failed
-- - payment.cancelled
-- - payment.manual_confirmed
-- - payment.refunded
-- - renewal.payment_required
-- - renewal.payment_completed
-- - rereview.payment_required
-- - rereview.payment_completed
--
-- Suggested audit_logs action names:
-- - payment_order.create
-- - payment_order.mark_paid
-- - payment_order.mark_manual_review
-- - payment_order.cancel
-- - payment_order.refund
-- - payment_order.provider_callback_received
-- - renewal.payment_confirmed
-- - rereview.payment_confirmed

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,

  business_type text not null check (
    business_type in (
      'personal_member_application',
      'organization_member_application',
      'taoist_certification_application',
      'personal_member_renewal',
      'organization_member_renewal',
      'taoist_certification_renewal',
      'taoist_certification_rereview',
      'certificate_reissue',
      'manual_adjustment'
    )
  ),
  business_id uuid,
  application_id uuid,
  certification_application_id uuid,
  certificate_id uuid,
  application_no text,
  member_no text,
  certificate_no text,

  payer_name text,
  payer_email text,
  payer_phone text,

  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  fee_code text,
  payment_channel text not null default 'manual',
  payment_method text,
  provider text not null default 'none' check (
    provider in ('none', 'manual', 'billplz', 'ipay88', 'stripe', 'senangpay', 'other')
  ),
  provider_order_id text,
  provider_transaction_id text,
  provider_payment_id text,
  provider_callback_id text,
  idempotency_key text,

  status text not null default 'pending_payment' check (
    status in ('pending_payment', 'paid', 'failed', 'cancelled', 'expired', 'manual_review', 'refunded')
  ),

  payment_proof_url text,
  payment_proof_note text,
  admin_note text,
  internal_note text,
  metadata jsonb not null default '{}'::jsonb,
  provider_payload jsonb,

  paid_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  expired_at timestamptz,
  refunded_at timestamptz,
  manual_review_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by text,
  cancelled_by text,
  cancel_reason text,
  refund_reason text,

  created_by text default 'system',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint payment_orders_business_reference_check check (
    business_id is not null
    or application_id is not null
    or certification_application_id is not null
    or certificate_id is not null
    or application_no is not null
    or member_no is not null
    or certificate_no is not null
    or business_type = 'manual_adjustment'
  )
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_order_id uuid not null references public.payment_orders(id) on delete cascade,
  order_no text not null,

  event_type text not null check (
    event_type in (
      'order_created',
      'payment_required',
      'provider_order_created',
      'provider_callback_received',
      'paid',
      'failed',
      'cancelled',
      'expired',
      'manual_review',
      'manual_confirmed',
      'refunded',
      'admin_note'
    )
  ),
  from_status text check (
    from_status is null
    or from_status in ('pending_payment', 'paid', 'failed', 'cancelled', 'expired', 'manual_review', 'refunded')
  ),
  to_status text check (
    to_status is null
    or to_status in ('pending_payment', 'paid', 'failed', 'cancelled', 'expired', 'manual_review', 'refunded')
  ),

  provider text not null default 'none' check (
    provider in ('none', 'manual', 'billplz', 'ipay88', 'stripe', 'senangpay', 'other')
  ),
  provider_event_id text,
  provider_order_id text,
  provider_transaction_id text,
  idempotency_key text,

  message text,
  admin_note text,
  payload_json jsonb not null default '{}'::jsonb,
  created_by text not null default 'system',
  created_at timestamptz default now()
);

create index if not exists payment_orders_created_at_idx
  on public.payment_orders (created_at desc);

create index if not exists payment_orders_status_created_at_idx
  on public.payment_orders (status, created_at desc);

create index if not exists payment_orders_business_idx
  on public.payment_orders (business_type, business_id);

create index if not exists payment_orders_application_id_idx
  on public.payment_orders (application_id);

create index if not exists payment_orders_certification_application_id_idx
  on public.payment_orders (certification_application_id);

create index if not exists payment_orders_certificate_id_idx
  on public.payment_orders (certificate_id);

create index if not exists payment_orders_application_no_idx
  on public.payment_orders (application_no);

create index if not exists payment_orders_member_no_idx
  on public.payment_orders (member_no);

create index if not exists payment_orders_certificate_no_idx
  on public.payment_orders (certificate_no);

create index if not exists payment_orders_provider_status_idx
  on public.payment_orders (provider, status);

create unique index if not exists payment_orders_idempotency_key_unique_idx
  on public.payment_orders (idempotency_key)
  where idempotency_key is not null;

create unique index if not exists payment_orders_provider_order_unique_idx
  on public.payment_orders (provider, provider_order_id)
  where provider_order_id is not null;

create unique index if not exists payment_orders_provider_transaction_unique_idx
  on public.payment_orders (provider, provider_transaction_id)
  where provider_transaction_id is not null;

create index if not exists payment_events_order_created_at_idx
  on public.payment_events (payment_order_id, created_at desc);

create index if not exists payment_events_order_no_created_at_idx
  on public.payment_events (order_no, created_at desc);

create index if not exists payment_events_type_created_at_idx
  on public.payment_events (event_type, created_at desc);

create index if not exists payment_events_provider_event_idx
  on public.payment_events (provider, provider_event_id)
  where provider_event_id is not null;

create unique index if not exists payment_events_provider_event_unique_idx
  on public.payment_events (provider, provider_event_id)
  where provider_event_id is not null;

create unique index if not exists payment_events_idempotency_key_unique_idx
  on public.payment_events (idempotency_key)
  where idempotency_key is not null;

drop trigger if exists payment_orders_set_updated_at on public.payment_orders;

create trigger payment_orders_set_updated_at
before update on public.payment_orders
for each row
execute function public.set_updated_at();

alter table public.payment_orders enable row level security;
alter table public.payment_events enable row level security;

-- Payment records contain payer contact details, provider identifiers, manual
-- notes, and provider callback payloads. Do not expose them directly to anon or
-- authenticated roles.
revoke all on table public.payment_orders from anon, authenticated;
revoke all on table public.payment_events from anon, authenticated;

-- Draft grant strategy:
-- - Server-side Next.js and .NET API code should use the Supabase service role
--   or direct Postgres credentials only.
-- - Do not add public select/insert/update/delete policies for applicants in
--   this phase.
-- - If applicant-facing payment status is needed later, expose a narrow API
--   response instead of granting table access.
-- - Admin UI should read and write through authenticated server-side API routes
--   that also write audit_logs.
