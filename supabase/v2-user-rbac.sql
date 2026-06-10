-- ITCA V2.0 user system and RBAC SQL draft.
-- Status: draft only. Do not execute automatically.
--
-- Purpose:
-- 1. Add site user account tables for /account login, profile, membership, certification, certificates, orders and notifications.
-- 2. Add admin RBAC tables for roles, permissions and role-permission assignments.
-- 3. Preserve V1.3 application, review, payment, certificate, verification, notification and master-data workflows.
--
-- Impact:
-- - This draft is additive and avoids dropping or renaming existing V1.3 tables.
-- - Public display must follow the minimum-public principle.
-- - Existing ADMIN_PASSWORD fallback remains a compatibility mode.
--
-- Rollback strategy:
-- - If this draft is executed in a future migration and needs rollback, drop the V2 tables in reverse dependency order.
-- - Do not remove or mutate existing V1.3 application, payment, certificate, notification or master-data tables.

create extension if not exists "pgcrypto";

create table if not exists public.site_users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  phone text unique,
  display_name text not null,
  password_hash text,
  preferred_language text not null default 'zh-CN',
  account_type text not null default 'individual'
    check (account_type in ('individual', 'institution')),
  status text not null default 'active'
    check (status in ('active', 'pending_verification', 'disabled', 'deleted')),
  last_login_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.site_user_profiles (
  user_id uuid primary key references public.site_users(id) on delete cascade,
  legal_name text,
  public_display_name text,
  country_region text,
  timezone text,
  bio text,
  privacy_consent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.site_user_application_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.site_users(id) on delete cascade,
  application_type text not null
    check (application_type in ('personal_member', 'organization_member', 'taoist_priest_certification')),
  application_id text,
  application_no text not null,
  holder_name text,
  contact_hash text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected', 'revoked')),
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, application_type, application_no)
);

create table if not exists public.site_user_certificate_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.site_users(id) on delete cascade,
  certificate_no text not null,
  holder_name text not null,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected', 'revoked')),
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, certificate_no)
);

create table if not exists public.site_user_order_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.site_users(id) on delete cascade,
  order_no text not null,
  application_no text,
  payment_status text,
  linked_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_id, order_no)
);

create table if not exists public.site_user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.site_users(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  related_resource_type text,
  related_resource_id text,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  role_key text unique not null,
  display_name text not null,
  description text,
  status text not null default 'active'
    check (status in ('active', 'disabled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.admin_permissions (
  id uuid primary key default gen_random_uuid(),
  permission_key text unique not null,
  module_key text not null,
  display_name text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.admin_role_permissions (
  role_id uuid not null references public.admin_roles(id) on delete cascade,
  permission_id uuid not null references public.admin_permissions(id) on delete cascade,
  allowed_actions text[] not null default array['read'],
  created_at timestamptz default now(),
  primary key (role_id, permission_id)
);

create table if not exists public.admin_user_roles (
  admin_user_id uuid not null references public.admin_users(id) on delete cascade,
  role_id uuid not null references public.admin_roles(id) on delete cascade,
  assigned_at timestamptz default now(),
  assigned_by uuid references public.admin_users(id) on delete set null,
  primary key (admin_user_id, role_id)
);

create table if not exists public.content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  page_type text not null,
  status text not null default 'draft'
    check (status in ('draft', 'review', 'published', 'archived')),
  body jsonb not null default '{}'::jsonb,
  boundary_notes text,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.data_center_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null
    check (entry_type in ('institution', 'individual', 'platform', 'lineage', 'course', 'product', 'event', 'base')),
  display_name text not null,
  public_summary text,
  public_fields jsonb not null default '{}'::jsonb,
  internal_note text,
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected', 'hidden', 'withdrawn')),
  visibility text not null default 'private'
    check (visibility in ('public', 'private')),
  created_by_admin_id uuid references public.admin_users(id) on delete set null,
  updated_by_admin_id uuid references public.admin_users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists site_users_email_idx
  on public.site_users (lower(email));

create index if not exists site_users_phone_idx
  on public.site_users (phone);

create index if not exists site_user_application_links_application_no_idx
  on public.site_user_application_links (application_no);

create index if not exists site_user_certificate_links_certificate_no_idx
  on public.site_user_certificate_links (certificate_no);

create index if not exists admin_roles_role_key_idx
  on public.admin_roles (role_key);

create index if not exists admin_permissions_module_key_idx
  on public.admin_permissions (module_key);

create index if not exists content_pages_slug_idx
  on public.content_pages (slug);

create index if not exists data_center_entries_type_status_idx
  on public.data_center_entries (entry_type, review_status, visibility);

alter table public.site_users enable row level security;
alter table public.site_user_profiles enable row level security;
alter table public.site_user_application_links enable row level security;
alter table public.site_user_certificate_links enable row level security;
alter table public.site_user_order_links enable row level security;
alter table public.site_user_notifications enable row level security;
alter table public.admin_roles enable row level security;
alter table public.admin_permissions enable row level security;
alter table public.admin_role_permissions enable row level security;
alter table public.admin_user_roles enable row level security;
alter table public.content_pages enable row level security;
alter table public.data_center_entries enable row level security;

revoke all on table public.site_users from anon, authenticated;
revoke all on table public.site_user_profiles from anon, authenticated;
revoke all on table public.site_user_application_links from anon, authenticated;
revoke all on table public.site_user_certificate_links from anon, authenticated;
revoke all on table public.site_user_order_links from anon, authenticated;
revoke all on table public.site_user_notifications from anon, authenticated;
revoke all on table public.admin_roles from anon, authenticated;
revoke all on table public.admin_permissions from anon, authenticated;
revoke all on table public.admin_role_permissions from anon, authenticated;
revoke all on table public.admin_user_roles from anon, authenticated;
revoke all on table public.content_pages from anon, authenticated;
revoke all on table public.data_center_entries from anon, authenticated;

insert into public.admin_roles (role_key, display_name, description)
values
  ('super_admin', '超级管理员', '拥有系统配置、角色权限、关键记录处置和全部后台模块管理权限。'),
  ('secretariat_admin', '秘书处管理员', '统筹申请受理、跨模块协调、内容确认和秘书处日常运营。'),
  ('member_admin', '会员管理员', '管理个人会员、机构会员、会员有效期、续期和会员公开查询资料。'),
  ('certification_admin', '认证管理员', '处理认证申请、材料审核、证书签发、证书状态和公开核验资料。'),
  ('finance_admin', '财务管理员', '处理支付订单、收据、人工确认和财务导出。'),
  ('content_admin', '内容管理员', '维护前台内容和公告。'),
  ('development_admin', '发展中心管理员', '维护六大发展中心、专委会、课程活动和合作项目资料。'),
  ('data_center_admin', '数据中心管理员', '审核公开文化数据库资料。'),
  ('notification_admin', '通知管理员', '维护通知模板、发送记录和通知策略。'),
  ('readonly_auditor', '只读审计员', '查看后台总览、操作日志和必要审计字段。')
on conflict (role_key) do nothing;

