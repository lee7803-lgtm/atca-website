-- ITCA V2.0 Preview admin RBAC test accounts SQL draft.
-- Status: draft only. Do not execute automatically.
--
-- Scope and status:
-- - Preview / test Supabase project only.
-- - Current test accounts are not created.
-- - This file is only a SQL draft.
-- - Do not execute if the target database cannot be proven to be a test database.
-- - Do not run against Production.
--
-- Password hash handling:
-- - Before execution, the operator must generate password_hash values locally.
-- - The repository keeps placeholders only.
-- - Do not record plaintext credentials in this SQL file, docs, commit messages,
--   logs, tickets, or chat.
--
-- Execution guard:
-- - The guard block below intentionally stops accidental execution.
-- - Remove the guard only after confirming all of the following:
--   1. The Supabase project is an independent Preview / test database.
--   2. Production is not the target.
--   3. Every password_hash placeholder has been replaced with a locally
--      generated hash.
--   4. The rollback section below has been reviewed.
--
-- Tables changed when executed after the guard is removed:
-- - public.admin_users: upsert seven clearly marked itca-test-* accounts.
-- - public.admin_user_roles: optional role links for those test accounts only,
--   and only when both public.admin_user_roles and public.admin_roles exist.
--
-- Shared structure intentionally not changed by this draft:
-- - No admin_users role constraint drop/add.
-- - No admin_roles insert/update.
-- - No admin_permissions insert/update.
--
-- Production impact if the guard is removed and this is run in the wrong project:
-- - Creates or updates only admin_users rows whose email starts with itca-test-
--   and ends with @example.com.
-- - May create admin_user_roles links only for those itca-test-* rows.
-- - Existing formal admin accounts are not updated by the upsert filter.
-- - Even so, running this in Production is forbidden.
--
-- Rollback for this draft after a permitted Preview / test execution:
-- begin;
-- delete from public.admin_user_roles
-- where admin_user_id in (
--   select id from public.admin_users where email like 'itca-test-%@example.com'
-- );
-- delete from public.admin_users where email like 'itca-test-%@example.com';
-- commit;

do $$
begin
  raise exception 'Safety guard: confirm an independent Preview/test database and replace password_hash placeholders before execution.';
end $$;

insert into public.admin_users (email, display_name, password_hash, role, status)
values
  (
    'itca-test-superadmin@example.com',
    'ITCA Test Super Admin',
    '<GENERATE_SCRYPT_PASSWORD_HASH_LOCALLY>',
    'super_admin',
    'active'
  ),
  (
    'itca-test-content@example.com',
    'ITCA Test Content Admin',
    '<GENERATE_SCRYPT_PASSWORD_HASH_LOCALLY>',
    'content_admin',
    'active'
  ),
  (
    'itca-test-reviewer@example.com',
    'ITCA Test Application Reviewer',
    '<GENERATE_SCRYPT_PASSWORD_HASH_LOCALLY>',
    'application_reviewer',
    'active'
  ),
  (
    'itca-test-finance@example.com',
    'ITCA Test Finance Reviewer',
    '<GENERATE_SCRYPT_PASSWORD_HASH_LOCALLY>',
    'finance_admin',
    'active'
  ),
  (
    'itca-test-cert@example.com',
    'ITCA Test Certificate Admin',
    '<GENERATE_SCRYPT_PASSWORD_HASH_LOCALLY>',
    'certification_admin',
    'active'
  ),
  (
    'itca-test-data@example.com',
    'ITCA Test Data Center Admin',
    '<GENERATE_SCRYPT_PASSWORD_HASH_LOCALLY>',
    'data_center_admin',
    'active'
  ),
  (
    'itca-test-readonly@example.com',
    'ITCA Test Readonly Observer',
    '<GENERATE_SCRYPT_PASSWORD_HASH_LOCALLY>',
    'readonly_observer',
    'active'
  )
on conflict (email) do update
set
  display_name = excluded.display_name,
  password_hash = excluded.password_hash,
  role = excluded.role,
  status = excluded.status,
  updated_at = now()
where public.admin_users.email like 'itca-test-%@example.com';

do $$
begin
  if to_regclass('public.admin_user_roles') is not null and to_regclass('public.admin_roles') is not null then
    insert into public.admin_user_roles (admin_user_id, role_id)
    select u.id, r.id
    from public.admin_users u
    join public.admin_roles r on r.role_key = u.role
    where u.email like 'itca-test-%@example.com'
    on conflict (admin_user_id, role_id) do nothing;
  end if;
end $$;
