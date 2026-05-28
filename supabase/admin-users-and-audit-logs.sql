create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text not null,
  password_hash text,
  role text not null default 'admin' check (role in ('super_admin', 'admin', 'reviewer', 'viewer')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  last_login_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_admin_id uuid references public.admin_users(id) on delete set null,
  actor_email text,
  actor_name text,
  actor_role text,
  actor_type text not null default 'admin' check (actor_type in ('admin', 'legacy_admin', 'system')),
  action text not null,
  resource_type text not null,
  resource_id text,
  resource_no text,
  before_data jsonb,
  after_data jsonb,
  summary text,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists admin_users_email_idx
  on public.admin_users (lower(email));

create index if not exists admin_users_status_role_idx
  on public.admin_users (status, role);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

create index if not exists audit_logs_actor_admin_id_idx
  on public.audit_logs (actor_admin_id);

create index if not exists audit_logs_action_idx
  on public.audit_logs (action);

create index if not exists audit_logs_resource_idx
  on public.audit_logs (resource_type, resource_id);

create index if not exists audit_logs_resource_no_idx
  on public.audit_logs (resource_no);

drop trigger if exists admin_users_set_updated_at on public.admin_users;

create trigger admin_users_set_updated_at
before update on public.admin_users
for each row
execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.audit_logs enable row level security;

revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;
