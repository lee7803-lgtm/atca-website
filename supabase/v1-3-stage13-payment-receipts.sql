-- ITCA V1.3 Stage 13 payment receipt private filing.
-- Do not run automatically. Apply manually after review.

insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', false)
on conflict (id) do update set public = false;

alter table public.payment_orders
  add column if not exists receipt_file_path text,
  add column if not exists receipt_file_name text,
  add column if not exists receipt_file_mime_type text,
  add column if not exists receipt_file_size integer,
  add column if not exists receipt_uploaded_at timestamptz,
  add column if not exists receipt_review_status text not null default 'not_uploaded'
    check (receipt_review_status in ('not_uploaded', 'pending_review', 'approved', 'rejected')),
  add column if not exists receipt_reviewed_at timestamptz,
  add column if not exists receipt_reviewed_by text,
  add column if not exists receipt_review_note text;

create index if not exists payment_orders_receipt_review_status_idx
  on public.payment_orders (receipt_review_status, updated_at desc);

create index if not exists payment_orders_receipt_uploaded_at_idx
  on public.payment_orders (receipt_uploaded_at desc)
  where receipt_uploaded_at is not null;
