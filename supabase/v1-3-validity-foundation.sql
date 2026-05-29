-- V1.3 validity foundation draft.
-- Do not run automatically. Apply manually after review.

alter table public.applications
  add column if not exists member_valid_from date,
  add column if not exists member_valid_until date,
  add column if not exists member_status text not null default 'active',
  add column if not exists member_renewal_status text not null default 'none',
  add column if not exists last_renewed_at timestamptz,
  add column if not exists member_status_note text;

create index if not exists applications_member_valid_until_idx
  on public.applications(member_valid_until);

create index if not exists applications_member_status_idx
  on public.applications(member_status);

create index if not exists applications_member_renewal_status_idx
  on public.applications(member_renewal_status);

alter table public.certificates
  add column if not exists certificate_review_status text not null default 'none',
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists certificate_status_note text;

create index if not exists certificates_valid_until_idx
  on public.certificates(valid_until);

create index if not exists certificates_certificate_review_status_idx
  on public.certificates(certificate_review_status);
