# V1.3 Admin Security And Audit Plan

This document records the current administrator authentication, admin API protection, server-to-server token boundary, and audit logging gaps. It is a migration planning document. It does not introduce a new admin account system, database table, role model, or login flow.

## Current admin login mechanism

The current admin console uses a single shared password stored in the server environment variable named `ADMIN_PASSWORD`.

Login flow:

```text
app/admin/page.tsx
app/admin/AdminLoginForm.tsx
app/api/admin/login/route.ts
lib/admin/auth.ts
```

The browser posts a password to:

```text
POST /api/admin/login
```

The API compares the submitted password with the server-side configured password using constant-time comparison. On success, it sets an admin session cookie.

There is no admin username, no per-admin identity, no password hash table, no account status, no password rotation workflow, and no role model yet.

## ADMIN_PASSWORD boundary

`ADMIN_PASSWORD` is used only on the Next.js server side:

- To verify the login password.
- To derive the admin session cookie value.
- To validate incoming admin session cookies.

The current session token is:

```text
sha256("atca-admin:" + ADMIN_PASSWORD)
```

The password value must never be logged, returned in API responses, written into source files, written into docs, or exposed to client-side JavaScript.

Current limitation: because the session token is deterministically derived from the password, changing `ADMIN_PASSWORD` invalidates all active sessions, but all administrators still share one credential.

## ITCA_ADMIN_API_TOKEN boundary

`ITCA_ADMIN_API_TOKEN` is used for server-to-server calls from Next.js to the .NET admin APIs.

Current Next.js caller:

```text
lib/api/admin-applications.ts
```

This module is marked with:

```text
import "server-only";
```

It reads the token from the server environment and sends it in the `X-ITCA-ADMIN-API-TOKEN` header. The token is not passed to client components and should never be exposed in browser code.

Current .NET guard:

```text
backend/Itca.Api/Features/Admin/AdminGuard.cs
```

It reads the expected token from the server environment and compares the request header using fixed-time comparison.

The token is currently a service-to-service shared secret. It is not an end-user admin identity and should not be treated as an audit principal.

## Next.js admin page authorization

Admin pages check the admin session cookie server-side before rendering protected content.

Protected pages include:

- `app/admin/applications/page.tsx`
- `app/admin/applications/[id]/page.tsx`
- `app/admin/certification-applications/page.tsx`
- `app/admin/certification-applications/[id]/page.tsx`

When the cookie is missing or invalid, pages redirect to:

```text
/admin
```

The admin landing page itself decides whether to show the login form or the admin entry cards based on cookie validity.

## Next.js admin API authorization

Current Next.js admin APIs validate the same admin session cookie before returning or mutating protected data.

Protected APIs include:

- `GET /api/admin/applications`
- `GET /api/admin/applications/{id}`
- `PATCH /api/admin/applications/{id}`
- `PATCH /api/admin/certification-applications/{id}`
- `GET /api/admin/certification-applications/{id}/export`

The route handlers parse the cookie header, extract the admin session cookie, and validate it with `isValidAdminSessionToken`.

The current login and logout APIs are intentionally public endpoints:

- `POST /api/admin/login`
- `POST /api/admin/logout`

## .NET admin API authorization

Current .NET admin APIs call `AdminGuard.RequireAdminToken(request)` before reading or writing admin data.

Protected .NET admin APIs include:

- `GET /api/admin/applications`
- `GET /api/admin/applications/{id}`
- `PATCH /api/admin/applications/{id}/review`

Unauthorized or missing-token requests return a generic admin verification message. Missing admin token configuration returns a generic security configuration message.

The current .NET admin API does not read the Next.js admin cookie directly. Next.js remains the browser-facing admin session boundary, and .NET uses the server-to-server token boundary.

## Current cookie settings

Cookie name:

```text
atca_admin_session
```

Login sets:

- `httpOnly: true`
- `sameSite: "lax"`
- `secure: process.env.NODE_ENV === "production"`
- `path: "/"`
- `maxAge: 8 hours`

Logout clears the same cookie with:

- `httpOnly: true`
- `sameSite: "lax"`
- `secure: process.env.NODE_ENV === "production"`
- `path: "/"`
- `maxAge: 0`

This round does not change the cookie mechanism because the core security attributes are already present and changing the mechanism would risk the current working admin flow.

## Sensitive information protection rules

Current rules to preserve:

- Do not return passwords, admin tokens, database connection strings, database credentials, or service role keys in API responses.
- Do not write secrets into source files, docs, or env files.
- Do not expose server-only tokens to client components.
- Keep `ITCA_ADMIN_API_TOKEN` in server-to-server headers only.
- Keep Supabase service role access on the server side only.
- Do not expose raw Storage paths on public pages.
- Admin signed URLs must remain short-lived and admin-session protected.

Low-risk security patch in this round:

- Next.js member admin API configuration errors now use generic messages instead of listing missing configuration variable names.

## Error response safety rules

Admin and public APIs should return stable user-facing messages:

- No stack traces.
- No token values.
- No password values.
- No database connection strings.
- No database host, username, or password.
- No service role key.
- No raw SQL error details.
- No raw Storage object paths in public responses.

Implementation status:

- Most Next.js admin certification routes already return generic configuration and database messages.
- .NET admin token configuration errors are generic.
- Some .NET public database configuration responses still include a missing configuration field name. That should be reviewed in a separate .NET error-response hardening round because it touches public API response contracts.

## Audit logging gap

There is currently no live `audit_logs` table and no durable audit write path.

The system cannot reliably answer:

- Which administrator performed an operation.
- Which role authorized the operation.
- What fields changed.
- What the before and after values were.
- Whether the operation came through Next.js fallback or .NET.
- Which request id, IP, or user agent performed the operation.

Current reviewer value is usually a static fallback such as `admin`, not a real administrator identity.

## Operations requiring audit

Future audit logging should cover:

- Personal member application review.
- Organization member application review.
- Certification application status changes.
- Requests for supplemental materials.
- Material review changes.
- Certificate generation.
- Mark certificate delivered.
- Certificate revocation.
- Public verification status changes.
- Admin login.
- Admin logout.
- Admin export/download actions for sensitive application data.
- Signed URL generation for admin attachment preview.

## Future admin_users table

Recommended fields:

- `id`
- `email`
- `display_name`
- `password_hash`
- `password_updated_at`
- `role`
- `status`
- `last_login_at`
- `last_login_ip`
- `failed_login_count`
- `locked_until`
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`

Optional fields:

- `totp_enabled`
- `totp_secret_encrypted`
- `recovery_codes_hash`
- `notes`

The password hash should be produced by a password hashing algorithm suitable for interactive login, not a plain SHA hash.

## Future audit_logs table

Recommended fields:

- `id`
- `occurred_at`
- `actor_admin_id`
- `actor_display_name`
- `actor_role`
- `action`
- `resource_type`
- `resource_id`
- `resource_label`
- `request_id`
- `ip_address`
- `user_agent`
- `source`
- `status`
- `before`
- `after`
- `metadata`
- `error_code`
- `error_message`

Recommended action examples:

- `admin.login`
- `admin.logout`
- `member_application.review_update`
- `certification_application.status_update`
- `certification_application.material_review_update`
- `certification_application.require_supplement`
- `certificate.issue`
- `certificate.delivery_update`
- `certificate.revoke`
- `certificate.public_query_toggle`
- `admin.export`
- `admin.signed_url.create`

Sensitive values should be redacted before writing audit metadata.

## Future role permissions

Recommended roles:

`super_admin`:

Can manage administrators, roles, audit logs, all application reviews, certificate operations, and content.

`review_admin`:

Can read and review member applications and certification applications. Cannot issue, revoke, or change certificate public visibility unless explicitly granted.

`certificate_admin`:

Can perform certificate issuance, delivery updates, certificate status changes, and public verification status changes.

`content_admin`:

Can manage site content and announcements. Cannot access sensitive application materials or certificate issuance controls.

`read_only_admin`:

Can read admin lists and details for operational support. Cannot perform write operations, exports, signed URL creation, certificate issuance, or delivery changes unless explicitly granted.

## Future .NET permission APIs

Recommended endpoints:

```text
POST /api/admin/auth/login
```

Validates admin credentials, creates a session, and writes a login audit event.

```text
POST /api/admin/auth/logout
```

Invalidates the session and writes a logout audit event.

```text
GET /api/admin/auth/me
```

Returns the current admin identity, role, and permissions.

```text
GET /api/admin/audit-logs
```

Returns filtered audit events for authorized administrators.

```text
POST /api/admin/audit-logs
```

Internal endpoint or service method for writing audit events from admin write operations.

## Migration route

Step 1: Keep the current `ADMIN_PASSWORD` plus cookie mechanism unchanged.

Step 2: Keep .NET admin APIs behind the server-to-server token boundary.

Step 3: Add an `audit_logs` table and a server-side audit writer.

Step 4: Make every admin write operation create an audit event.

Step 5: Add an `admin_users` table and account management model.

Step 6: Replace the single shared password login with per-admin login.

Step 7: Introduce role-based permissions and enforce them in both Next.js and .NET admin write paths.

## Parts not to change yet

Do not change these during the current safety round:

- Current admin login page visual design.
- Current admin cookie mechanism.
- Certification application submission.
- Supplement submission.
- Storage upload path generation.
- Certificate generation.
- Certificate delivery marking.
- Public certificate query.
- Application progress query.
- Supabase SQL schema.
- Database tables.
- Full RBAC.
- Multi-admin account system.
- Password hash and account recovery workflows.

## Rollback strategy

For any future admin security migration:

- Keep the current Next.js admin login as a feature-flagged fallback until the new login is verified.
- Keep .NET server-to-server token auth while browser-facing admin sessions move gradually.
- Add audit writes in append-only mode first.
- Do not block existing admin operations on audit write failures until reliability is proven.
- Introduce roles in read-only reporting mode before enforcing them.
- Preserve current admin API response shapes where the frontend depends on them.

## Next round recommendation

Recommended next low-risk round:

1. Define an audit event schema and redaction rules in more detail.
2. Add a no-op or fileless audit writer interface in code only if it does not change behavior.
3. Review .NET public error responses for configuration-name leakage.
4. Plan the `audit_logs` SQL migration without applying it yet.
5. Keep current admin login and all admin business workflows unchanged until audit storage and per-admin identity are ready.
