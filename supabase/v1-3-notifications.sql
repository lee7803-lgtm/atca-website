-- ITCA V1.3 Phase 9.2 notification logs foundation.
-- Do not run automatically. Apply manually after review.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  notification_type text not null,
  channel text not null check (channel in ('email', 'whatsapp', 'system', 'manual')),
  send_status text not null default 'pending' check (send_status in ('pending', 'sent', 'failed', 'skipped')),
  idempotency_key text,

  application_id uuid,
  certification_application_id uuid,
  certificate_id uuid,
  application_no text,
  member_no text,
  certificate_no text,
  source_type text,
  source_action text,

  recipient_name text,
  recipient_email text,
  recipient_phone text,

  subject text,
  message_body text not null,
  template_key text,
  payload_json jsonb default '{}'::jsonb,

  provider text,
  provider_message_id text,
  provider_response jsonb,
  error_message text,

  created_by text default 'system',
  created_at timestamptz default now(),
  scheduled_at timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  skipped_at timestamptz,
  updated_at timestamptz default now()
);

create index if not exists notification_logs_created_at_idx
  on public.notification_logs (created_at desc);

create index if not exists notification_logs_status_channel_idx
  on public.notification_logs (send_status, channel);

create index if not exists notification_logs_type_idx
  on public.notification_logs (notification_type);

create index if not exists notification_logs_application_no_idx
  on public.notification_logs (application_no);

create index if not exists notification_logs_member_no_idx
  on public.notification_logs (member_no);

create index if not exists notification_logs_certificate_no_idx
  on public.notification_logs (certificate_no);

create unique index if not exists notification_logs_idempotency_key_unique_idx
  on public.notification_logs (idempotency_key)
  where idempotency_key is not null;

drop trigger if exists notification_logs_set_updated_at on public.notification_logs;

create trigger notification_logs_set_updated_at
before update on public.notification_logs
for each row
execute function public.set_updated_at();

alter table public.notification_logs enable row level security;

-- Notification records may contain contact details and applicant-facing message text.
-- Do not add public select/insert/update policies for anon or authenticated roles.
-- Server-side code must access this table only with the Supabase service role.
revoke all on table public.notification_logs from anon, authenticated;
