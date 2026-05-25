# ITCA 官网 V1.3 架构说明

## 1. V1.3 目标架构

V1.3 的目标是把官网从当前 V1.2 的 Next.js 单体闭环，逐步演进为前后端职责更清晰的架构：

- Supabase PostgreSQL 作为正式业务数据库。
- Supabase Storage 作为正式文件存储。
- .NET API 作为正式后台业务逻辑、权限控制和数据接口层。
- Next.js 继续承担官网前端、后台管理界面和 API 调用层职责。

本轮只建立基础骨架，不迁移现有业务数据，不替换现有业务接口。

## 2. Next.js 职责

Next.js 在 V1.3 中保留以下职责：

- 官网公开页面展示。
- 后台管理界面展示。
- 前端表单、查询、审核等交互流程。
- 通过统一 API client 调用 .NET API。
- 在迁移完成前继续保留现有 V1.2 API routes，确保现有闭环可用。

新增的 `lib/api/client.ts` 是后续调用 .NET API 的基础层，暂不强制改造现有页面。

## 3. .NET API 职责

.NET API 在 V1.3 中作为正式后台业务接口层，后续逐步承接：

- 业务数据读写。
- 管理后台权限与接口授权。
- 申请、审核、证书、公告等业务规则。
- Supabase PostgreSQL 访问。
- Supabase Storage 文件读写与权限封装。

本轮新增 `backend/Itca.Api`，仅提供基础启动结构、CORS 和 `GET /api/health` 健康检查接口。

## 4. Supabase PostgreSQL 职责

Supabase PostgreSQL 是 V1.3 的正式数据库，后续用于存储：

- 会员和机构申请数据。
- 道教教职人员认定申请数据。
- 审核状态和审核记录。
- 证书与查询数据。
- 公告和运营内容数据。
- 后台权限相关数据。

本轮只在 .NET API 中预留 `Supabase:Postgres:ConnectionString` 配置结构，不创建 schema，不迁移数据。

## 5. Supabase Storage 职责

Supabase Storage 是 V1.3 的正式文件存储，后续用于存储：

- 申请材料附件。
- 证书相关文件。
- 后台上传的运营素材。
- 公告和内容管理相关媒体文件。

本轮只在 .NET API 中预留 `Supabase:Storage` 配置结构，不实现文件上传、下载或权限策略。

## 6. 本地开发启动方式

启动 .NET API：

```bash
dotnet run --project backend/Itca.Api
```

默认本地地址：

```text
http://localhost:5001
```

健康检查：

```bash
curl http://localhost:5001/api/health
```

启动 Next.js：

```bash
npm run dev
```

默认本地地址：

```text
http://localhost:3000
```

Next.js 调用 .NET API 的基础地址通过环境变量配置：

```bash
NEXT_PUBLIC_ITCA_API_BASE_URL=http://localhost:5001
```

如未配置，前端 API client 默认使用 `http://localhost:5001`。以后正式环境部署时，只需要通过 `NEXT_PUBLIC_ITCA_API_BASE_URL` 切换 API 地址，不需要改动前端调用代码。

## 7. 后续接口迁移顺序

建议后续按风险从低到高迁移：

1. 健康检查、只读配置、基础状态接口。
2. 公告和运营内容只读接口。
3. 证书查询、申请查询等只读查询接口。
4. 新申请提交接口。
5. 后台登录、权限校验和会话管理。
6. 后台审核、状态流转、材料审核接口。
7. 文件上传、下载、访问控制和 Storage 策略。
8. 历史数据整理与正式迁移。

每一阶段迁移都应保留可回退路径，并在验证通过后再替换对应页面调用。

## 8. 当前 V1.2 闭环保护原则

V1.3 改造期间必须保护当前 V1.2 业务闭环：

- 不删除现有 Next.js API routes。
- 不强制改造现有业务页面调用。
- 不在未验证前迁移生产业务数据。
- 不改变现有申请、查询、审核、证书验证等主流程行为。
- 新增 .NET API 与 Next.js 调用层先以并行方式存在。
- 每次接口迁移都应单独验证前端页面、后台页面、数据读写和错误处理。
