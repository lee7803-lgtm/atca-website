create extension if not exists "pgcrypto";

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  application_no text unique not null,
  application_type text not null check (application_type in ('personal_member', 'organization_member')),
  status text not null default 'submitted' check (status in ('submitted', 'pending_review', 'under_review', 'need_more_info', 'approved', 'rejected', 'archived')),
  name text not null,
  contact_name text,
  phone text not null,
  email text not null,
  country text not null,
  organization_type text,
  profile text,
  purpose text,
  receive_notice boolean default false,
  truth_confirmed boolean default false,
  terms_accepted boolean default false,
  privacy_accepted boolean default false,
  confirmed_at timestamptz,
  admin_note text,
  supplemental_submissions jsonb default '[]'::jsonb,
  supplement_submitted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.applications
  add column if not exists truth_confirmed boolean default false,
  add column if not exists terms_accepted boolean default false,
  add column if not exists privacy_accepted boolean default false,
  add column if not exists confirmed_at timestamptz,
  add column if not exists supplemental_submissions jsonb default '[]'::jsonb,
  add column if not exists supplement_submitted_at timestamptz;

do $$
begin
  alter table public.applications
    drop constraint if exists applications_status_check;

  alter table public.applications
    add constraint applications_status_check
    check (status in ('submitted', 'pending_review', 'under_review', 'need_more_info', 'approved', 'rejected', 'archived'));
end $$;

create index if not exists applications_lookup_idx
  on public.applications (application_no, email);

create index if not exists applications_phone_lookup_idx
  on public.applications (application_no, phone);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists applications_set_updated_at on public.applications;

create trigger applications_set_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();

alter table public.applications enable row level security;

-- Service role access is used by Next.js server API routes.
-- Add explicit RLS policies before exposing any direct browser access.

create table if not exists public.certification_applications (
  id uuid primary key default gen_random_uuid(),
  application_no text unique not null,
  certification_type text not null default 'taoist_priest' check (certification_type in ('taoist_priest')),
  certification_path text check (certification_path in ('zhengyi', 'quanzhen', 'other_international')),
  requested_level text check (requested_level in ('refuge_entry', 'transmission_or_crowning', 'register_or_precept', 'senior_taoist', 'special_lineage')),
  applicant_name text not null,
  applicant_name_en text,
  taoist_name text,
  gender text,
  birth_date date,
  nationality text,
  residence text,
  phone text not null,
  email text not null,
  address text,
  master_name text,
  master_taoist_name text,
  lineage text,
  temple_or_organization text,
  sect text,
  practice_years text,
  experience_summary text,
  application_reason text,
  additional_note text,
  recommender_name text,
  recommender_contact text,
  recommender_relation text,
  existing_certificates jsonb default '[]'::jsonb,
  supporting_documents jsonb default '[]'::jsonb,
  declaration_accepted boolean default false,
  ethics_confirmed boolean default false,
  boundary_confirmed boolean default false,
  data_use_accepted boolean default false,
  certificate_public_accepted boolean default false,
  terms_accepted boolean default false,
  privacy_accepted boolean default false,
  confirmed_at timestamptz,
  status text not null default 'submitted' check (status in ('submitted', 'under_review', 'need_more_info', 'approved', 'rejected', 'certificate_issued', 'cert_issued', 'delivered', 'archived', 'revoked')),
  review_note text,
  internal_review_note text,
  applicant_feedback text,
  approved_path text check (approved_path in ('zhengyi', 'quanzhen', 'other_international')),
  approved_level text check (approved_level in ('refuge_entry', 'transmission_or_crowning', 'register_or_precept', 'senior_taoist', 'special_lineage')),
  material_review jsonb default '{}'::jsonb,
  committee_review_note text,
  certificate_photo_path text,
  reviewer text,
  reviewed_at timestamptz,
  delivery_status text default 'not_delivered' check (delivery_status in ('not_delivered', 'delivered')),
  delivered_at timestamptz,
  supplemental_submissions jsonb default '[]'::jsonb,
  supplement_submitted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.certification_applications
  add column if not exists certification_type text not null default 'taoist_priest',
  add column if not exists certification_path text,
  add column if not exists requested_level text,
  add column if not exists application_reason text,
  add column if not exists additional_note text,
  add column if not exists recommender_name text,
  add column if not exists recommender_contact text,
  add column if not exists recommender_relation text,
  add column if not exists ethics_confirmed boolean default false,
  add column if not exists boundary_confirmed boolean default false,
  add column if not exists data_use_accepted boolean default false,
  add column if not exists certificate_public_accepted boolean default false,
  add column if not exists terms_accepted boolean default false,
  add column if not exists privacy_accepted boolean default false,
  add column if not exists confirmed_at timestamptz,
  add column if not exists internal_review_note text,
  add column if not exists applicant_feedback text,
  add column if not exists approved_path text,
  add column if not exists approved_level text,
  add column if not exists material_review jsonb default '{}'::jsonb,
  add column if not exists committee_review_note text,
  add column if not exists certificate_photo_path text,
  add column if not exists delivery_status text default 'not_delivered',
  add column if not exists delivered_at timestamptz,
  add column if not exists supplemental_submissions jsonb default '[]'::jsonb,
  add column if not exists supplement_submitted_at timestamptz;

do $$
begin
  alter table public.certification_applications
    drop constraint if exists certification_applications_status_check;

  alter table public.certification_applications
    add constraint certification_applications_status_check
    check (status in ('submitted', 'under_review', 'need_more_info', 'approved', 'rejected', 'certificate_issued', 'cert_issued', 'delivered', 'archived', 'revoked'));

  alter table public.certification_applications
    drop constraint if exists certification_applications_delivery_status_check;

  alter table public.certification_applications
    add constraint certification_applications_delivery_status_check
    check (delivery_status in ('not_delivered', 'delivered'));

  alter table public.certification_applications
    drop constraint if exists certification_applications_certification_path_check;

  alter table public.certification_applications
    add constraint certification_applications_certification_path_check
    check (certification_path is null or certification_path in ('zhengyi', 'quanzhen', 'other_international'));

  alter table public.certification_applications
    drop constraint if exists certification_applications_requested_level_check;

  alter table public.certification_applications
    add constraint certification_applications_requested_level_check
    check (requested_level is null or requested_level in ('refuge_entry', 'transmission_or_crowning', 'register_or_precept', 'senior_taoist', 'special_lineage'));

  alter table public.certification_applications
    drop constraint if exists certification_applications_approved_path_check;

  alter table public.certification_applications
    add constraint certification_applications_approved_path_check
    check (approved_path is null or approved_path in ('zhengyi', 'quanzhen', 'other_international'));

  alter table public.certification_applications
    drop constraint if exists certification_applications_approved_level_check;

  alter table public.certification_applications
    add constraint certification_applications_approved_level_check
    check (approved_level is null or approved_level in ('refuge_entry', 'transmission_or_crowning', 'register_or_precept', 'senior_taoist', 'special_lineage'));
end $$;

alter table public.certification_applications
  alter column existing_certificates type jsonb using
    case
      when existing_certificates is null or existing_certificates::text = '' then '[]'::jsonb
      when left(existing_certificates::text, 1) in ('[', '{') then existing_certificates::jsonb
      else jsonb_build_array(jsonb_build_object('original_name', existing_certificates::text, 'field_name', 'existing_certificates'))
    end,
  alter column existing_certificates set default '[]'::jsonb,
  alter column supporting_documents type jsonb using
    case
      when supporting_documents is null or supporting_documents::text = '' then '[]'::jsonb
      when left(supporting_documents::text, 1) in ('[', '{') then supporting_documents::jsonb
      else jsonb_build_array(jsonb_build_object('original_name', supporting_documents::text, 'field_name', 'supporting_documents'))
    end,
  alter column supporting_documents set default '[]'::jsonb;

create index if not exists certification_applications_no_idx
  on public.certification_applications (application_no);

create index if not exists certification_applications_contact_idx
  on public.certification_applications (email, phone);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_no text unique not null,
  application_id uuid references public.certification_applications(id) on delete set null,
  holder_name text not null,
  taoist_name text,
  taoist_rank text,
  sect text,
  certification_path text check (certification_path in ('zhengyi', 'quanzhen', 'other_international')),
  certification_level text,
  lineage_or_temple text,
  certificate_photo_path text,
  issued_date date not null,
  valid_from date not null,
  valid_until date not null,
  status text not null default 'valid' check (status in ('pending', 'valid', 'revoked', 'expired')),
  public_query_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists certificates_lookup_idx
  on public.certificates (certificate_no, holder_name);

alter table public.certificates
  add column if not exists certification_path text,
  add column if not exists certification_level text,
  add column if not exists lineage_or_temple text,
  add column if not exists certificate_photo_path text;

do $$
begin
  alter table public.certificates
    drop constraint if exists certificates_status_check;

  alter table public.certificates
    add constraint certificates_status_check
    check (status in ('pending', 'valid', 'revoked', 'expired'));

  alter table public.certificates
    drop constraint if exists certificates_certification_path_check;

  alter table public.certificates
    add constraint certificates_certification_path_check
    check (certification_path is null or certification_path in ('zhengyi', 'quanzhen', 'other_international'));
end $$;

drop trigger if exists certification_applications_set_updated_at on public.certification_applications;

create trigger certification_applications_set_updated_at
before update on public.certification_applications
for each row
execute function public.set_updated_at();

drop trigger if exists certificates_set_updated_at on public.certificates;

create trigger certificates_set_updated_at
before update on public.certificates
for each row
execute function public.set_updated_at();

alter table public.certification_applications enable row level security;
alter table public.certificates enable row level security;

-- Optional Storage setup for certification attachments.
-- Server API routes upload and read files with the service role key.
insert into storage.buckets (id, name, public)
values ('certification-documents', 'certification-documents', false)
on conflict (id) do nothing;
