create extension if not exists "pgcrypto";

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  application_no text unique not null,
  application_type text not null check (application_type in ('personal_member', 'organization_member')),
  status text not null default 'submitted' check (status in ('submitted', 'pending_review', 'need_more_info', 'approved', 'rejected')),
  name text not null,
  contact_name text,
  phone text not null,
  email text not null,
  country text not null,
  organization_type text,
  profile text,
  purpose text,
  receive_notice boolean default false,
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists applications_lookup_idx
  on public.applications (application_no, email);

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
