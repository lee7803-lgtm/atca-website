# V1.3 Numbering SQL Draft

> 本文档仅为 SQL 草案。第 5 阶段不得执行，不放入 `supabase/` 目录，不作为正式迁移文件。

## 1. 规划结论

第 6 阶段候选的低风险数据库调整：

- 保留 `applications.application_no`。
- 新增 `applications.member_no`。
- 新增 `applications.legacy_application_no`。
- 新增 `applications.legacy_member_no`。
- 新增 `applications.member_approved_at`。
- 新增 `numbering_sequences`。
- 暂不新增独立 `members` 表。
- 暂不强制新增 `numbering_rules` 表。
- 暂不迁移历史数据。

## 2. SQL 执行前置条件

执行前必须完成：

1. 确认正式 Supabase 数据库备份完成。
2. 只读统计 `applications.application_no` 格式分布。
3. 只读统计是否已有 `member_no`、`legacy_application_no`、`legacy_member_no`、`member_approved_at` 字段。
4. 确认当前 Render .NET API 与 Vercel 前端部署版本。
5. 准备应用层兼容逻辑：会员查询优先 `member_no`，回退旧 `application_no`。
6. 准备回滚版本，避免数据库字段已存在但代码不兼容。

## 3. applications 字段草案

```sql
alter table public.applications
  add column if not exists member_no text,
  add column if not exists legacy_application_no text,
  add column if not exists legacy_member_no text,
  add column if not exists member_approved_at timestamptz;
```

字段说明：

- `member_no`：正式会员编号，仅会员申请审核通过后写入。
- `legacy_application_no`：未来历史迁移时保留旧申请编号，不建议第 6 阶段批量写入。
- `legacy_member_no`：未来历史迁移时保留旧会员编号或旧公开核验编号，不建议第 6 阶段批量写入。
- `member_approved_at`：会员首次通过或正式会员编号生成时间。

## 4. 唯一索引草案

```sql
create unique index if not exists applications_member_no_unique_idx
  on public.applications (member_no)
  where member_no is not null;

create unique index if not exists applications_legacy_member_no_unique_idx
  on public.applications (legacy_member_no)
  where legacy_member_no is not null;
```

不建议给 `legacy_application_no` 立即加唯一索引，除非先完成历史数据去重统计。若统计确认无重复，可追加：

```sql
create unique index if not exists applications_legacy_application_no_unique_idx
  on public.applications (legacy_application_no)
  where legacy_application_no is not null;
```

## 5. 普通索引草案

```sql
create index if not exists applications_member_lookup_idx
  on public.applications (member_no, name);

create index if not exists applications_legacy_member_lookup_idx
  on public.applications (legacy_member_no, name);

create index if not exists applications_status_member_approved_idx
  on public.applications (status, member_approved_at);
```

旧查询索引 `applications_lookup_idx` 与 `applications_phone_lookup_idx` 应继续保留。

## 6. numbering_sequences 表草案

```sql
create table if not exists public.numbering_sequences (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  year integer not null,
  last_value integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint numbering_sequences_scope_year_unique unique (scope, year),
  constraint numbering_sequences_year_check check (year >= 2000 and year <= 2100),
  constraint numbering_sequences_last_value_check check (last_value >= 0)
);

create index if not exists numbering_sequences_scope_year_idx
  on public.numbering_sequences (scope, year);

drop trigger if exists numbering_sequences_set_updated_at on public.numbering_sequences;

create trigger numbering_sequences_set_updated_at
before update on public.numbering_sequences
for each row
execute function public.set_updated_at();
```

候选 `scope`：

```text
application_tao
application_member_personal
application_member_organization
certificate_tao
member_personal
member_organization
payment
notification
```

## 7. 原子取号函数草案

第 6 阶段如决定让数据库生成连续序号，可使用函数封装并由后端调用。

```sql
create or replace function public.next_numbering_sequence(
  p_scope text,
  p_year integer
)
returns integer
language plpgsql
as $$
declare
  next_value integer;
begin
  insert into public.numbering_sequences (scope, year, last_value)
  values (p_scope, p_year, 1)
  on conflict (scope, year)
  do update set
    last_value = public.numbering_sequences.last_value + 1,
    updated_at = now()
  returning last_value into next_value;

  return next_value;
end;
$$;
```

注意：函数权限、RLS 与调用路径需在正式迁移前单独确认。服务端可使用 service role 或数据库连接调用，不应从浏览器直接调用。

## 8. numbering_rules 表草案

第 6 阶段不建议执行。仅保留未来草案：

```sql
create table if not exists public.numbering_rules (
  id uuid primary key default gen_random_uuid(),
  scope text unique not null,
  prefix text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

暂缓原因：

- 当前规则数量少且已文档化。
- 引入配置表会增加后台管理、缓存、校验和误配置风险。
- 第 6 阶段目标是最小落地，不做编号规则运营系统。

## 9. members 独立表草案

第 6 阶段不建议执行。仅保留未来方向：

```sql
-- Not recommended for V1.3 Phase 6.
-- A future members table should be introduced only after membership lifecycle,
-- renewal, termination, public visibility and data-center integration are defined.
```

暂缓原因：

- 当前会员申请、后台审核、公开查询均依赖 `applications`。
- 独立表会引入同步一致性问题。
- 需要额外定义会员生命周期、续期、有效期、公开状态和审计边界。

## 10. 保留旧 application_no

不建议执行任何覆盖历史 `application_no` 的 SQL。

禁止草案：

```sql
-- Do not run in Phase 5 or Phase 6.
-- update public.applications set application_no = ...
-- update public.certification_applications set application_no = ...
```

## 11. 回滚草案

如果第 6 阶段仅新增字段和表，优先应用代码回滚，不删除字段。

如必须回滚结构，草案如下，执行前必须确认没有新代码依赖：

```sql
drop function if exists public.next_numbering_sequence(text, integer);

drop trigger if exists numbering_sequences_set_updated_at on public.numbering_sequences;

drop table if exists public.numbering_sequences;

drop index if exists applications_status_member_approved_idx;
drop index if exists applications_legacy_member_lookup_idx;
drop index if exists applications_member_lookup_idx;
drop index if exists applications_legacy_application_no_unique_idx;
drop index if exists applications_legacy_member_no_unique_idx;
drop index if exists applications_member_no_unique_idx;

alter table public.applications
  drop column if exists member_approved_at,
  drop column if exists legacy_member_no,
  drop column if exists legacy_application_no,
  drop column if exists member_no;
```

## 12. 第 5 阶段不得执行的 SQL

- 所有本文 SQL。
- 任何 `update public.applications set application_no = ...`。
- 任何 `update public.certification_applications set application_no = ...`。
- 任何历史数据批量迁移。
- 任何删除旧编号的 SQL。
- 任何 Supabase RLS / Storage / 环境变量改动。

## 13. 第 6 阶段候选 SQL

可作为第 6 阶段候选：

- `applications` 新增会员与 legacy 字段。
- `applications.member_no` 部分唯一索引。
- `applications.member_no, name` 查询索引。
- `numbering_sequences` 表。
- `next_numbering_sequence` 原子取号函数。

不建议作为第 6 阶段候选：

- `numbering_rules` 表。
- 独立 `members` 表。
- 历史编号批量改写。
- 证书编号重构。
