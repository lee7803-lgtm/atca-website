create table if not exists public.master_data_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('referee', 'organization')),
  name text not null,
  display_name text not null,
  type text not null default '',
  country text not null default '',
  region text not null default '',
  status text not null default 'active' check (status in ('active', 'inactive')),
  review_status text not null default 'approved' check (review_status in ('pending', 'approved', 'rejected')),
  source text not null default 'admin_created' check (source in ('admin_created', 'applicant_submitted', 'migrated')),
  phone text not null default '',
  email text not null default '',
  note text not null default '',
  internal_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists master_data_entries_kind_name_idx
  on public.master_data_entries (kind, lower(name));

create index if not exists master_data_entries_public_lookup_idx
  on public.master_data_entries (kind, status, review_status, updated_at desc);

alter table public.master_data_entries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'master_data_entries'
      and policyname = 'Service role can manage master data entries'
  ) then
    create policy "Service role can manage master data entries"
      on public.master_data_entries
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;
