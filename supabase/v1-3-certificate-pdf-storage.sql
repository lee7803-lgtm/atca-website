-- V1.3 certificate PDF storage foundation.
-- Do not run automatically. Apply manually after review and database backup.

alter table public.certificates
  add column if not exists pdf_storage_path text,
  add column if not exists pdf_generated_at timestamptz,
  add column if not exists pdf_generated_by text,
  add column if not exists pdf_version integer not null default 0,
  add column if not exists pdf_sha256 text,
  add column if not exists pdf_file_size integer,
  add column if not exists pdf_status text not null default 'not_generated',
  add column if not exists pdf_last_downloaded_at timestamptz,
  add column if not exists pdf_download_count integer not null default 0;

do $$
begin
  alter table public.certificates
    drop constraint if exists certificates_pdf_status_check;

  alter table public.certificates
    add constraint certificates_pdf_status_check
    check (pdf_status in ('not_generated', 'generated', 'failed'));
end $$;

create index if not exists certificates_pdf_status_idx
  on public.certificates(pdf_status);

create index if not exists certificates_pdf_generated_at_idx
  on public.certificates(pdf_generated_at);

insert into storage.buckets (id, name, public)
values ('certificate-pdfs', 'certificate-pdfs', false)
on conflict (id) do update
set public = false;
