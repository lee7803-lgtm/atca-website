# ITCA 官网 V1.3 接口迁移计划

## 1. 迁移原则

V1.3 迁移必须保护当前 V1.2 已完成业务闭环，尤其是认证申请、后台审核、补充资料、发证、证书核验和信息隔离流程。

迁移原则：

- 保护 V1.2 已完成闭环。
- 先只读，后写入。
- 先公开低风险，后后台高风险。
- 每一步都要可以回滚。
- 每轮迁移后必须验证 `npm run lint`、`npm run build`、本地预览和相关接口。
- 不一次性迁移全部业务。
- Next.js 页面调用切换必须分阶段进行，并保留清晰回退路径。
- Supabase PostgreSQL 和 Supabase Storage 的权限边界不得因为迁移而放宽。

## 2. 阶段迁移计划

### 第一阶段：保持第一轮架构骨架稳定

- 目标：稳定 `backend/Itca.Api`、`GET /api/health`、本地端口 `http://localhost:5001` 和 Next.js API client。
- 涉及页面：无直接页面影响。
- 涉及接口：`.NET GET /api/health`。
- 风险等级：低。
- 回滚方式：停止使用 .NET API；Next.js V1.2 业务保持不变。
- 验收标准：
  - `dotnet build backend/Itca.Api` 通过。
  - `GET http://localhost:5001/api/health` 返回正常。
  - `npm run lint` 和 `npm run build` 通过。

### 第二阶段：整理接口地图和数据地图

- 目标：形成 V1.3 API 地图、Supabase 表结构地图和迁移计划。
- 涉及页面：无。
- 涉及接口：无迁移。
- 风险等级：低。
- 回滚方式：文档可单独修订，不影响业务运行。
- 验收标准：
  - 文档覆盖接口、表、Storage 和迁移顺序。
  - 不修改业务代码、不修改 SQL、不迁移接口。
  - `npm run lint` 和 `npm run build` 通过。

### 第三阶段：迁移健康检查和公开只读接口

- 目标：在 .NET API 中建立公开只读接口的控制器、响应模型和 Supabase 访问基础，不立即切换所有页面。
- 涉及页面：无或仅用于独立验证。
- 涉及接口：健康检查、证书查询和核验详情的只读接口骨架。
- 风险等级：低。
- 回滚方式：继续使用现有 Next.js API routes。
- 验收标准：
  - .NET 只读接口可通过 curl 独立验证。
  - 返回结构与当前 Next.js 页面需要的数据保持兼容。
  - 不影响 V1.2 页面。

### 第四阶段：迁移证书公开查询

- 目标：将 `GET /api/certificates/query` 的业务逻辑迁移到 .NET API，并在 Next.js 调用层灰度切换。
- 涉及页面：`app/certificate-query/page.tsx`。
- 涉及接口：`GET /api/certificates/query`。
- 风险等级：低。
- 回滚方式：页面重新指向原 Next.js API route。
- 验收标准：
  - 正确证书编号和姓名可查询到证书。
  - 错误证书编号或姓名返回明确失败。
  - 返回数据不包含隐私字段。
  - `npm run lint`、`npm run build` 和本地页面查询通过。

### 第五阶段：迁移证书核验详情

- 目标：将证书详情读取迁移到 .NET API。
- 涉及页面：`app/certificates/[certificateNo]/page.tsx`。
- 涉及接口：`GET /api/certificates/{certificateNo}`。
- 风险等级：低。
- 回滚方式：页面恢复直接调用 `findPublicCertificateByNo` 或原 Next.js 数据路径。
- 验收标准：
  - 有效证书详情展示正确。
  - 不存在、关闭公开查询或状态异常时返回正确提示。
  - 不暴露申请 ID、联系方式、附件、审核意见。

### 第六阶段：迁移申请进度查询

- 目标：将申请进度查询迁移到 .NET API，覆盖会员申请、认证申请和证书摘要。
- 涉及页面：`app/application/query/page.tsx`。
- 涉及接口：`GET /api/applications/query`。
- 风险等级：中。
- 回滚方式：页面恢复调用原 Next.js API route。
- 验收标准：
  - 会员申请查询正常。
  - 认证申请查询正常。
  - 证书已生成、已下发、需补充资料等状态展示正常。
  - 证书照片授权不泄露长期 URL。

### 第七阶段：迁移会员申请提交

- 目标：迁移个人会员和机构会员申请提交。
- 涉及页面：`app/member/apply/page.tsx`、`app/organization/apply/page.tsx`。
- 涉及接口：`POST /api/member-applications`、`POST /api/organization-applications`。
- 风险等级：中。
- 回滚方式：表单恢复调用 `POST /api/applications`。
- 验收标准：
  - 前端字段校验和后端字段校验一致。
  - 重复开放申请拦截正常。
  - 成功后返回申请编号并跳转成功页。
  - 后台列表可看到新申请。

### 第八阶段：迁移认证申请提交

- 目标：迁移道士资格认证申请提交，但不改变现有用户表单体验。
- 涉及页面：`app/certification/taoist-priest/page.tsx`。
- 涉及接口：`POST /api/certification-applications`。
- 风险等级：高。
- 回滚方式：表单恢复调用原 Next.js API route；Storage 文件仍按旧路径处理。
- 验收标准：
  - multipart 表单提交成功。
  - 文件类型、大小和字段限制与 V1.2 一致。
  - 申请记录和附件元数据一致。
  - 后台认证列表和详情可读取新申请。

### 第九阶段：迁移文件上传授权

- 目标：由 .NET API 统一管理 Supabase Storage 上传、读取授权和短期签名 URL。
- 涉及页面：认证申请页、补充资料表单、后台认证详情页、申请进度查询页。
- 涉及接口：`POST /api/files/upload-authorizations` 或 .NET 内部文件服务。
- 风险等级：高。
- 回滚方式：保留并恢复 `uploadCertificationAttachment` 和 `createCertificationAttachmentSignedUrl`。
- 验收标准：
  - 私有 bucket 仍保持私有。
  - 后台附件预览需要管理员权限。
  - 申请人补充资料只允许在合法状态和身份校验后上传。
  - 公开核验页不会得到任何私有文件 URL。

### 第十阶段：迁移后台申请列表和详情

- 目标：后台列表、详情读取改由 .NET API 提供。
- 涉及页面：`app/admin/applications/page.tsx`、`app/admin/applications/[id]/page.tsx`、`app/admin/certification-applications/page.tsx`、`app/admin/certification-applications/[id]/page.tsx`。
- 涉及接口：后台申请列表和详情 API。
- 风险等级：中。
- 回滚方式：后台页面恢复直接调用 Supabase helper 或原 Next.js API route。
- 验收标准：
  - 管理员权限校验有效。
  - 列表筛选和搜索正常。
  - 详情页字段完整。
  - 附件短期签名 URL 只在后台可用。

### 第十一阶段：迁移审核状态修改、补充资料、材料审核

- 目标：迁移核心审核状态流转、要求补充资料、申请人补充资料提交和材料审核。
- 涉及页面：后台审核表单、`MaterialReviewField`、`app/application/query/page.tsx` 补充资料区。
- 涉及接口：审核状态修改、要求补充资料、补充资料提交、材料审核 API。
- 风险等级：高。
- 回滚方式：保留旧 PATCH 和补充资料 Next.js route，必要时页面切回旧接口。
- 验收标准：
  - 状态流转规则与 V1.2 一致。
  - `need_more_info` 才允许申请人补充资料。
  - 补充后状态正确转回审核中。
  - 材料审核项更新正确。
  - 操作日志或状态历史至少有设计落点。

### 第十二阶段：迁移证书生成和证书下发

- 目标：将证书生成、证书记录写入、申请状态更新和下发状态修改迁移到 .NET API。
- 涉及页面：认证后台审核表单、证书核验页、申请进度页。
- 涉及接口：生成证书 API、标记证书已下发 API。
- 风险等级：高。
- 回滚方式：恢复 Next.js PATCH action；若 .NET 写入部分失败，必须保留事务或补偿策略。
- 验收标准：
  - 已审核通过且材料审核完整才可生成证书。
  - 不允许重复生成证书。
  - 证书生成与申请状态更新保持一致。
  - 下发状态可正确展示在申请进度和后台。

### 第十三阶段：迁移管理员权限和操作日志

- 目标：将管理员登录、退出、权限校验和操作审计正式化。
- 涉及页面：所有后台页面。
- 涉及接口：管理员登录、管理员退出、操作日志 API。
- 风险等级：高。
- 回滚方式：保留当前 `ADMIN_PASSWORD` 和 cookie 机制作为临时回退。
- 验收标准：
  - 管理员登录和退出稳定。
  - 后台 API 均受权限保护。
  - 关键写操作记录审计日志。
  - 不影响前台公开查询和申请入口。

## 3. 第三轮之后优先动手的接口

当前最适合优先实现和验证的 3 个接口：

1. `GET /api/certificates/query`
   - 原因：公开只读、字段少、隐私边界清楚。
   - 影响页面：`app/certificate-query/page.tsx`。

2. `GET /api/certificates/{certificateNo}`
   - 原因：公开只读、可以独立对齐详情页数据结构。
   - 影响页面：`app/certificates/[certificateNo]/page.tsx`。

3. `GET /api/applications/query`
   - 原因：用户价值高，覆盖申请进度和证书摘要，但应在证书接口稳定后迁移。
   - 影响页面：`app/application/query/page.tsx`。

## 4. 当前不适合立刻迁移的模块

### 4.1 认证申请提交

- 不适合原因：涉及复杂字段校验、重复申请判断、multipart、Storage 上传和附件元数据。
- 建议：等只读接口、会员申请和文件授权策略稳定后再迁移。

### 4.2 文件上传 / Supabase Storage

- 不适合原因：直接关系申请材料隐私，权限和短期签名 URL 设计必须先明确。
- 建议：先设计 `files` 或 `attachments` 元数据表，再迁移上传授权。

### 4.3 证书生成

- 不适合原因：涉及 `certification_applications` 和 `certificates` 双表写入、重复生成防护、材料审核完整性和状态流转。
- 建议：必须在 .NET API 中用事务或明确补偿策略实现，不应先迁移。

## 5. 每轮通用验证清单

每一轮迁移后至少执行：

```bash
npm run lint
npm run build
```

如涉及 .NET API：

```bash
dotnet build backend/Itca.Api
```

如涉及本地接口：

```bash
dotnet run --project backend/Itca.Api
curl http://localhost:5001/api/health
```

如涉及页面：

```bash
npm run dev
curl -I http://localhost:3000
```

同时应手工验证：

- 成功路径。
- 参数缺失路径。
- 未查询到数据路径。
- 权限失败路径。
- 不泄露隐私字段。
- 页面可回退到旧 Next.js API。
