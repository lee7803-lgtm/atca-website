# V1.3 Admin Auth And Audit Foundation

## 本阶段范围

本阶段建立正式管理员账号表和后台操作审计表基础，同时保留现有 `ADMIN_PASSWORD` emergency login 和 `ITCA_ADMIN_API_TOKEN` 服务间鉴权。

本阶段没有替换后台整体权限模型，没有做完整 RBAC 管理界面，也没有改动证书核验、会员公开查询或申请进度查询。

## admin_users

新增 SQL 文件：

```text
supabase/admin-users-and-audit-logs.sql
```

`admin_users` 用于保存正式后台管理员账号：

- `email`：管理员邮箱，唯一。
- `display_name`：后台显示名称。
- `password_hash`：密码哈希，不保存明文密码。
- `role`：`super_admin`、`admin`、`reviewer`、`viewer`。
- `status`：`active` 或 `disabled`。
- `last_login_at`：最近登录时间。

Next.js 登录接口会优先尝试用 `admin_users` 中的 active 账号完成 email/password 登录。当前密码哈希格式使用 Node.js 内置 `crypto.scrypt`，不引入额外依赖。

## audit_logs

`audit_logs` 用于保存后台关键写操作记录：

- 操作者：`actor_admin_id`、`actor_email`、`actor_name`、`actor_role`、`actor_type`。
- 动作：`action`。
- 资源：`resource_type`、`resource_id`、`resource_no`。
- 变化：`before_data`、`after_data`。
- 请求上下文：`ip_address`、`user_agent`。
- 时间：`created_at`。

已新增基础只读页面：

```text
app/admin/audit-logs/page.tsx
```

该页面只读取最近操作记录，不提供复杂筛选和导出。

## ADMIN_PASSWORD 兼容

现有 `ADMIN_PASSWORD` 登录仍保留。

- 登录表单中邮箱可以留空。
- 只输入原后台密码时，仍按 legacy login 成功进入后台。
- legacy session 的审计操作者类型为 `legacy_admin`。
- 当前 session cookie 机制仍兼容旧 token。

正式管理员账号登录成功后，cookie 中保存签名后的最小 actor 信息，不暴露 `password_hash`。

## ITCA_ADMIN_API_TOKEN 兼容

`.NET` Admin API 继续使用：

```text
X-ITCA-ADMIN-API-TOKEN
```

环境变量仍为：

```text
ITCA_ADMIN_API_TOKEN
```

该 token 只作为 Next.js 到 .NET 的服务间鉴权，不作为真实管理员身份。Next.js 会在调用会员申请审核 PATCH 时额外转发当前 actor 信息给 .NET，用于写入审计日志。

## 已写入 audit log 的操作

本阶段已接入：

- 会员申请审核状态和备注修改成功后，写入 `audit_logs`。

对应 action：

```text
member_application.review_update
```

审计写入包含 before/after 的申请编号、申请类型、状态、审核备注和更新时间。

审计写入失败不会阻断主业务审核保存；.NET 服务端会记录 warning 日志，并继续返回主业务结果。

## 预留但未接入的操作

以下操作本阶段只预留，未强行接入：

- 认证申请状态修改。
- 认证材料审核项修改。
- 证书生成。
- 标记证书已下发。
- 更正证书未下发。
- 认证申请归档。
- 登录和登出审计。
- 导出和附件签名 URL 审计。

认证申请写操作当前集中在 Next.js API 里，并包含证书生成和回滚逻辑。本阶段为了降低风险，没有改动该流程。

## 手动创建第一个正式管理员账号

不要把真实密码或真实密码哈希写入代码、SQL 或文档。

在本地临时生成 scrypt 哈希：

```bash
node -e "const { randomBytes, scryptSync } = require('crypto'); const password = process.argv[1]; const salt = randomBytes(16); const N = 16384, r = 8, p = 1, keylen = 64; const hash = scryptSync(password, salt, keylen, { N, r, p }); console.log(['scrypt', N, r, p, salt.toString('base64'), hash.toString('base64'), keylen].join('$'));" '你的临时强密码'
```

然后在 Supabase SQL Editor 手动插入：

```sql
insert into public.admin_users (email, display_name, password_hash, role, status)
values (
  'admin@example.com',
  'ITCA Admin',
  '<上一步生成的 password_hash>',
  'super_admin',
  'active'
);
```

插入后使用邮箱和原始密码登录后台。

## 本阶段未做

- 未新增管理员账号管理 UI。
- 未新增密码重置、密码轮换、锁定、2FA。
- 未强制角色权限校验。
- 未移除 `ADMIN_PASSWORD`。
- 未移除 `ITCA_ADMIN_API_TOKEN`。
- 未改动现有业务表结构。
- 未改动 `/certificate-query` 的 `vt` 机制。
- 未改动 `/member-query`。
- 未改动 `/application/query`。
- 未做编号规则、PDF 证书、在线支付、自动通知、内容运营系统或多语言完整体系。
