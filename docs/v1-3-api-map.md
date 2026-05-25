# ITCA 官网 V1.3 API 接口地图

## 1. 目标架构

V1.3 的目标是把当前 V1.2 Next.js 业务闭环逐步拆分为清晰的前后端边界：

- Next.js：官网前端、后台界面、表单交互、查询展示、API 调用层。
- .NET API：正式后台业务逻辑、权限接口、审核逻辑、证书逻辑。
- Supabase PostgreSQL：正式数据库。
- Supabase Storage：正式文件存储。

迁移期间必须保留现有 Next.js API routes，避免破坏 V1.2 已完成的申请、审核、补充资料、发证、核验和信息隔离闭环。

## 2. 基础与公开只读接口

### 2.1 健康检查 API

- API 名称：健康检查。
- 请求方式：GET。
- 建议路径：`/api/health`。
- 调用页面：本地开发、部署探活、监控。
- 请求参数：无。
- 返回数据：`status`、`service`。
- 权限要求：公开。
- 是否读取 Supabase PostgreSQL：否。
- 是否写入 Supabase PostgreSQL：否。
- 是否涉及 Supabase Storage：否。
- 是否需要操作日志：否。
- 当前对应的 Next.js 文件或逻辑：无；已在 `backend/Itca.Api/Program.cs` 建立。
- 迁移优先级：已完成。
- 迁移风险：低。

### 2.2 证书公开查询 API

- API 名称：证书公开查询。
- 请求方式：GET。
- 建议路径：`/api/certificates/query`。
- 调用页面：`app/certificate-query/page.tsx`。
- 请求参数：`certificateNo`、`holderName`。
- 返回数据：证书编号、持证人姓名、认证类型、传承体系、认证等级、签发机构、签发日期、有效期、证书状态、详情页链接。
- 权限要求：公开，但必须同时提供证书编号和持证人姓名。
- 是否读取 Supabase PostgreSQL：是，读取 `certificates`。
- 是否写入 Supabase PostgreSQL：否。
- 是否涉及 Supabase Storage：否。
- 是否需要操作日志：可选；建议只记录异常和高频失败。
- 当前对应的 Next.js 文件或逻辑：`app/api/certificates/query/route.ts`、`findCertificateByNoAndHolder`。
- 迁移优先级：高。
- 迁移风险：低。

### 2.3 证书核验详情 API

- API 名称：证书核验详情。
- 请求方式：GET。
- 建议路径：`/api/certificates/{certificateNo}`。
- 调用页面：`app/certificates/[certificateNo]/page.tsx`。
- 请求参数：`certificateNo`。
- 返回数据：证书公开核验详情，不包含联系方式、申请材料、审核备注或后台记录。
- 权限要求：公开。
- 是否读取 Supabase PostgreSQL：是，读取 `certificates`。
- 是否写入 Supabase PostgreSQL：否。
- 是否涉及 Supabase Storage：否。
- 是否需要操作日志：可选。
- 当前对应的 Next.js 文件或逻辑：`app/certificates/[certificateNo]/page.tsx`、`findPublicCertificateByNo`。
- 迁移优先级：高。
- 迁移风险：低。

### 2.4 申请进度查询 API

- API 名称：申请进度查询。
- 请求方式：GET。
- 建议路径：`/api/applications/query`。
- 调用页面：`app/application/query/page.tsx`。
- 请求参数：`mode`、`applicationNo`、`contact`；旧身份查询模式后续可废弃或单独设计。
- 返回数据：申请编号、申请类型、姓名脱敏前源数据、状态、反馈、证书摘要、是否可补充资料、可编辑字段。
- 权限要求：公开，但必须使用申请编号和登记联系方式校验。
- 是否读取 Supabase PostgreSQL：是，读取 `applications`、`certification_applications`、`certificates`。
- 是否写入 Supabase PostgreSQL：否。
- 是否涉及 Supabase Storage：可能涉及证书照片短期签名 URL。
- 是否需要操作日志：可选；建议记录异常和敏感失败。
- 当前对应的 Next.js 文件或逻辑：`app/api/applications/query/route.ts`、`findApplicationByNoAndContact`、`findCertificationByNoAndContact`。
- 迁移优先级：高。
- 迁移风险：中。

## 3. 申请提交接口

### 3.1 个人会员申请提交 API

- API 名称：个人会员申请提交。
- 请求方式：POST。
- 建议路径：`/api/member-applications`。
- 调用页面：`app/member/apply/page.tsx`。
- 请求参数：姓名、联系方式、邮箱、国家或地区、个人说明、申请说明、通知意愿、真实性确认、条款确认、隐私确认、反垃圾字段。
- 返回数据：提交结果、申请编号、初始状态、字段错误。
- 权限要求：公开。
- 是否读取 Supabase PostgreSQL：是，用于检查重复开放申请。
- 是否写入 Supabase PostgreSQL：是，写入 `applications`。
- 是否涉及 Supabase Storage：否。
- 是否需要操作日志：是。
- 当前对应的 Next.js 文件或逻辑：`app/api/applications/route.ts`、`insertApplication`。
- 迁移优先级：中。
- 迁移风险：中。

### 3.2 机构会员申请提交 API

- API 名称：机构会员申请提交。
- 请求方式：POST。
- 建议路径：`/api/organization-applications`。
- 调用页面：`app/organization/apply/page.tsx`。
- 请求参数：机构名称、负责人、联系方式、邮箱、国家或地区、机构类型、机构介绍、合作意向、真实性确认、条款确认、隐私确认、反垃圾字段。
- 返回数据：提交结果、申请编号、初始状态、字段错误。
- 权限要求：公开。
- 是否读取 Supabase PostgreSQL：是，用于检查重复开放申请。
- 是否写入 Supabase PostgreSQL：是，写入 `applications`。
- 是否涉及 Supabase Storage：否。
- 是否需要操作日志：是。
- 当前对应的 Next.js 文件或逻辑：`app/api/applications/route.ts`、`insertApplication`。
- 迁移优先级：中。
- 迁移风险：中。

### 3.3 认证申请提交 API

- API 名称：认证申请提交。
- 请求方式：POST。
- 建议路径：`/api/certification-applications`。
- 调用页面：`app/certification/taoist-priest/page.tsx`。
- 请求参数：multipart 表单；包含身份资料、师承资料、推荐人资料、经历说明、声明确认和附件。
- 返回数据：提交结果、申请编号、初始状态、字段错误。
- 权限要求：公开。
- 是否读取 Supabase PostgreSQL：是，用于检查重复开放申请。
- 是否写入 Supabase PostgreSQL：是，写入 `certification_applications`。
- 是否涉及 Supabase Storage：是，上传认证材料到私有 bucket。
- 是否需要操作日志：是。
- 当前对应的 Next.js 文件或逻辑：`app/api/certification-applications/route.ts`、`insertCertificationApplication`、`uploadCertificationAttachment`。
- 迁移优先级：中后。
- 迁移风险：高。

### 3.4 文件上传 / 授权 API

- API 名称：文件上传授权。
- 请求方式：POST。
- 建议路径：`/api/files/upload-authorizations` 或作为申请提交 API 内部能力。
- 调用页面：认证申请、补充资料、后台材料读取。
- 请求参数：文件名、MIME、大小、业务上下文、申请编号、字段名、来源。
- 返回数据：服务端上传结果、文件元数据、短期上传授权或短期读取 URL。
- 权限要求：公开提交时需校验申请上下文；后台读取需管理员权限。
- 是否读取 Supabase PostgreSQL：可选，校验申请状态。
- 是否写入 Supabase PostgreSQL：可选，未来建议写入 `files` 或 `attachments`。
- 是否涉及 Supabase Storage：是。
- 是否需要操作日志：是。
- 当前对应的 Next.js 文件或逻辑：`uploadCertificationAttachment`、`createCertificationAttachmentSignedUrl`。
- 迁移优先级：中后。
- 迁移风险：高。

## 4. 后台申请读取接口

### 4.1 后台申请列表 API

- API 名称：后台申请列表。
- 请求方式：GET。
- 建议路径：`/api/admin/applications`、`/api/admin/certification-applications`。
- 调用页面：`app/admin/applications/page.tsx`、`app/admin/certification-applications/page.tsx`。
- 请求参数：申请类型、状态、搜索关键字、分页参数。
- 返回数据：后台列表字段、分页信息、证书编号摘要。
- 权限要求：管理员。
- 是否读取 Supabase PostgreSQL：是，读取 `applications`、`certification_applications`、必要时读取 `certificates`。
- 是否写入 Supabase PostgreSQL：否。
- 是否涉及 Supabase Storage：否。
- 是否需要操作日志：可选。
- 当前对应的 Next.js 文件或逻辑：`listApplications`、`listCertificationApplications`、后台列表页面。
- 迁移优先级：中。
- 迁移风险：中。

### 4.2 后台申请详情 API

- API 名称：后台申请详情。
- 请求方式：GET。
- 建议路径：`/api/admin/applications/{id}`、`/api/admin/certification-applications/{id}`。
- 调用页面：`app/admin/applications/[id]/page.tsx`、`app/admin/certification-applications/[id]/page.tsx`。
- 请求参数：申请 ID。
- 返回数据：完整后台申请详情、补充记录、证书摘要、附件短期签名 URL。
- 权限要求：管理员。
- 是否读取 Supabase PostgreSQL：是。
- 是否写入 Supabase PostgreSQL：否。
- 是否涉及 Supabase Storage：认证申请详情涉及短期签名 URL。
- 是否需要操作日志：可选。
- 当前对应的 Next.js 文件或逻辑：`getApplicationById`、`getCertificationApplicationById`、`createCertificationAttachmentSignedUrl`。
- 迁移优先级：中。
- 迁移风险：中。

## 5. 审核与状态流转接口

### 5.1 审核状态修改 API

- API 名称：审核状态修改。
- 请求方式：PATCH。
- 建议路径：`/api/admin/applications/{id}/review`、`/api/admin/certification-applications/{id}/review`。
- 调用页面：后台会员审核和认证审核表单。
- 请求参数：状态、后台备注、申请人反馈、核定路径、核定等级、审核人。
- 返回数据：更新后的申请记录。
- 权限要求：管理员。
- 是否读取 Supabase PostgreSQL：是，读取当前状态。
- 是否写入 Supabase PostgreSQL：是。
- 是否涉及 Supabase Storage：否。
- 是否需要操作日志：是。
- 当前对应的 Next.js 文件或逻辑：`PATCH /api/admin/applications/[id]`、`PATCH /api/admin/certification-applications/[id]`、`updateApplicationReview`、`updateCertificationReview`。
- 迁移优先级：中后。
- 迁移风险：高。

### 5.2 要求补充资料 API

- API 名称：要求补充资料。
- 请求方式：POST。
- 建议路径：`/api/admin/applications/{id}/request-supplement`、`/api/admin/certification-applications/{id}/request-supplement`。
- 调用页面：后台审核表单。
- 请求参数：申请人反馈、内部备注、要求补充的字段或材料。
- 返回数据：更新后的申请记录。
- 权限要求：管理员。
- 是否读取 Supabase PostgreSQL：是。
- 是否写入 Supabase PostgreSQL：是。
- 是否涉及 Supabase Storage：否。
- 是否需要操作日志：是。
- 当前对应的 Next.js 文件或逻辑：当前通过 PATCH 设置 `need_more_info`。
- 迁移优先级：中后。
- 迁移风险：高。

### 5.3 申请人补充资料提交 API

- API 名称：申请人补充资料提交。
- 请求方式：POST。
- 建议路径：`/api/applications/supplement`。
- 调用页面：`app/application/query/page.tsx`。
- 请求参数：申请编号、登记联系方式、补充说明、补充字段、补充文件。
- 返回数据：提交结果、文件名列表、更新后的状态摘要。
- 权限要求：公开，但必须用申请编号和登记联系方式校验，且状态必须为 `need_more_info`。
- 是否读取 Supabase PostgreSQL：是。
- 是否写入 Supabase PostgreSQL：是，写入补充记录并将状态转回审核中。
- 是否涉及 Supabase Storage：是。
- 是否需要操作日志：是。
- 当前对应的 Next.js 文件或逻辑：`app/api/applications/supplement/route.ts`、`updateApplicationSupplement`、`updateCertificationSupplement`。
- 迁移优先级：后。
- 迁移风险：高。

### 5.4 材料审核 API

- API 名称：材料审核。
- 请求方式：PATCH。
- 建议路径：`/api/admin/certification-applications/{id}/materials`。
- 调用页面：`app/admin/certification-applications/[id]/MaterialReviewField.tsx`。
- 请求参数：材料审核项、审核状态。
- 返回数据：更新后的材料审核状态。
- 权限要求：管理员。
- 是否读取 Supabase PostgreSQL：是。
- 是否写入 Supabase PostgreSQL：是，更新 `material_review`。
- 是否涉及 Supabase Storage：只读取材料元数据或签名 URL。
- 是否需要操作日志：是。
- 当前对应的 Next.js 文件或逻辑：PATCH action `update_material_review`、`normalizeMaterialReview`。
- 迁移优先级：后。
- 迁移风险：高。

### 5.5 审核通过 API

- API 名称：审核通过。
- 请求方式：POST。
- 建议路径：`/api/admin/certification-applications/{id}/approve`。
- 调用页面：认证后台审核表单。
- 请求参数：核定传承体系、核定认证等级、审核意见、申请人反馈、审核人。
- 返回数据：更新后的申请记录。
- 权限要求：管理员。
- 是否读取 Supabase PostgreSQL：是。
- 是否写入 Supabase PostgreSQL：是。
- 是否涉及 Supabase Storage：否。
- 是否需要操作日志：是。
- 当前对应的 Next.js 文件或逻辑：当前通过 PATCH status=`approved`。
- 迁移优先级：后。
- 迁移风险：高。

### 5.6 审核驳回 API

- API 名称：审核驳回。
- 请求方式：POST。
- 建议路径：`/api/admin/certification-applications/{id}/reject`。
- 调用页面：认证后台审核表单。
- 请求参数：申请人反馈、后台备注、审核人。
- 返回数据：更新后的申请记录。
- 权限要求：管理员。
- 是否读取 Supabase PostgreSQL：是。
- 是否写入 Supabase PostgreSQL：是。
- 是否涉及 Supabase Storage：否。
- 是否需要操作日志：是。
- 当前对应的 Next.js 文件或逻辑：当前通过 PATCH status=`rejected`。
- 迁移优先级：后。
- 迁移风险：高。

## 6. 证书接口

### 6.1 生成证书 API

- API 名称：生成证书。
- 请求方式：POST。
- 建议路径：`/api/admin/certification-applications/{id}/certificate`。
- 调用页面：认证后台审核表单。
- 请求参数：申请 ID、核定信息、审核意见、审核人。
- 返回数据：证书编号、证书记录、更新后的申请状态。
- 权限要求：管理员。
- 是否读取 Supabase PostgreSQL：是，读取申请和已有证书。
- 是否写入 Supabase PostgreSQL：是，写入 `certificates` 并更新 `certification_applications`。
- 是否涉及 Supabase Storage：读取证书照片 path。
- 是否需要操作日志：是。
- 当前对应的 Next.js 文件或逻辑：PATCH action `generate_certificate`、`insertCertificate`、`deleteCertificateByNo`。
- 迁移优先级：后。
- 迁移风险：高。

### 6.2 标记证书已下发 API

- API 名称：标记证书已下发。
- 请求方式：POST。
- 建议路径：`/api/admin/certification-applications/{id}/deliver`。
- 调用页面：认证后台审核表单。
- 请求参数：申请 ID、下发时间、申请人反馈、审核人。
- 返回数据：更新后的申请记录。
- 权限要求：管理员。
- 是否读取 Supabase PostgreSQL：是，确认已有证书。
- 是否写入 Supabase PostgreSQL：是，更新下发状态和申请状态。
- 是否涉及 Supabase Storage：否。
- 是否需要操作日志：是。
- 当前对应的 Next.js 文件或逻辑：PATCH action `mark_delivered`。
- 迁移优先级：后。
- 迁移风险：高。

## 7. 管理员与运营接口

### 7.1 管理员登录 API

- API 名称：管理员登录。
- 请求方式：POST。
- 建议路径：`/api/admin/auth/login`。
- 调用页面：`app/admin/page.tsx`、`app/admin/AdminLoginForm.tsx`。
- 请求参数：密码；未来可扩展用户名、验证码、多管理员。
- 返回数据：登录结果、会话 cookie 或 token。
- 权限要求：公开登录入口。
- 是否读取 Supabase PostgreSQL：当前否；未来建议读取 `admin_users`。
- 是否写入 Supabase PostgreSQL：未来可写登录日志。
- 是否涉及 Supabase Storage：否。
- 是否需要操作日志：是。
- 当前对应的 Next.js 文件或逻辑：`app/api/admin/login/route.ts`、`lib/admin/auth.ts`。
- 迁移优先级：后。
- 迁移风险：高。

### 7.2 管理员退出 API

- API 名称：管理员退出。
- 请求方式：POST。
- 建议路径：`/api/admin/auth/logout`。
- 调用页面：`app/admin/AdminLogoutButton.tsx`。
- 请求参数：无。
- 返回数据：退出结果。
- 权限要求：管理员会话。
- 是否读取 Supabase PostgreSQL：否。
- 是否写入 Supabase PostgreSQL：可选，写退出日志。
- 是否涉及 Supabase Storage：否。
- 是否需要操作日志：可选。
- 当前对应的 Next.js 文件或逻辑：`app/api/admin/logout/route.ts`。
- 迁移优先级：后。
- 迁移风险：中。

### 7.3 操作日志 API

- API 名称：操作日志记录。
- 请求方式：POST 或作为后台写操作内部服务。
- 建议路径：`/api/admin/audit-logs`。
- 调用页面：后台所有写操作。
- 请求参数：操作者、动作、对象类型、对象 ID、变更摘要、IP、User-Agent。
- 返回数据：日志 ID 或写入结果。
- 权限要求：管理员或系统内部。
- 是否读取 Supabase PostgreSQL：可选。
- 是否写入 Supabase PostgreSQL：是，未来写入 `audit_logs`。
- 是否涉及 Supabase Storage：否。
- 是否需要操作日志：本身就是操作日志。
- 当前对应的 Next.js 文件或逻辑：当前缺失独立实现。
- 迁移优先级：后。
- 迁移风险：中。

### 7.4 后台导出 API

- API 名称：后台导出。
- 请求方式：GET。
- 建议路径：`/api/admin/certification-applications/{id}/export`、后续可扩展列表导出。
- 调用页面：认证后台详情页、后台列表页。
- 请求参数：申请 ID、导出格式。
- 返回数据：HTML、CSV 或后续 PDF。
- 权限要求：管理员。
- 是否读取 Supabase PostgreSQL：是。
- 是否写入 Supabase PostgreSQL：否。
- 是否涉及 Supabase Storage：当前只列附件元数据；未来如导出附件需短期授权。
- 是否需要操作日志：是。
- 当前对应的 Next.js 文件或逻辑：`app/api/admin/certification-applications/[id]/export/route.ts`、`components/AdminCsvExport.tsx`。
- 迁移优先级：低。
- 迁移风险：中。
