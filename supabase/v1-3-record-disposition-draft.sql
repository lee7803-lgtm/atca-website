-- ITCA V1.3 Phase 12.4-A record disposition draft.
-- Planning draft only. Do not run automatically.
--
-- Goal:
-- - Add non-destructive record governance fields to applications and
--   certification_applications.
-- - Keep existing workflow status checks unchanged.
-- - Do not change certificates, payment_orders, payment_events,
--   notification_logs, or audit_logs in this draft.
--
-- Allowed record_disposition values:
-- - normal
-- - test
-- - archived
-- - voided

alter table public.applications
  add column if not exists record_disposition text not null default 'normal',
  add column if not exists record_disposition_note text,
  add column if not exists record_disposition_at timestamptz,
  add column if not exists record_disposition_by text;

alter table public.certification_applications
  add column if not exists record_disposition text not null default 'normal',
  add column if not exists record_disposition_note text,
  add column if not exists record_disposition_at timestamptz,
  add column if not exists record_disposition_by text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'applications_record_disposition_check'
      and conrelid = 'public.applications'::regclass
  ) then
    alter table public.applications
      add constraint applications_record_disposition_check
      check (record_disposition in ('normal', 'test', 'archived', 'voided'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'certification_applications_record_disposition_check'
      and conrelid = 'public.certification_applications'::regclass
  ) then
    alter table public.certification_applications
      add constraint certification_applications_record_disposition_check
      check (record_disposition in ('normal', 'test', 'archived', 'voided'));
  end if;
end $$;

create index if not exists applications_record_disposition_idx
  on public.applications (record_disposition);

create index if not exists applications_record_disposition_status_created_idx
  on public.applications (record_disposition, status, created_at desc);

create index if not exists applications_normal_contact_idx
  on public.applications (application_type, email, phone, status, created_at desc)
  where record_disposition = 'normal';

create index if not exists applications_normal_application_no_contact_idx
  on public.applications (application_no, email, phone)
  where record_disposition = 'normal';

create index if not exists certification_applications_record_disposition_idx
  on public.certification_applications (record_disposition);

create index if not exists certification_applications_record_disposition_status_created_idx
  on public.certification_applications (record_disposition, status, created_at desc);

create index if not exists certification_applications_normal_contact_idx
  on public.certification_applications (email, phone, status, created_at desc)
  where record_disposition = 'normal';

create index if not exists certification_applications_normal_application_no_contact_idx
  on public.certification_applications (application_no, email, phone)
  where record_disposition = 'normal';
