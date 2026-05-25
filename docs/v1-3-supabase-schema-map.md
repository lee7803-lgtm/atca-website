# ITCA 官网 V1.3 Supabase 数据表与文件存储地图

## 1. 当前数据边界

V1.2 当前核心业务依赖三张 Supabase PostgreSQL 表：

- `applications`：个人会员和机构会员申请。
- `certification_applications`：道士资格认证申请、审核、补充资料和发证前数据。
- `certificates`：证书记录和公开核验数据。

当前核心文件存储依赖一个 Supabase Storage 私有 bucket：

- `certification-documents`：认证申请材料、补充材料和证书照片来源文件。

本轮仅整理文档，不修改 SQL，不新增 migration，不变更数据库结构。

## 2. PostgreSQL 表结构地图

### 2.1 `applications`

#### 表用途

用于存储个人会员申请和机构会员申请。当前支撑前台提交、申请进度查询、后台列表、后台详情、审核状态修改和补充资料。

#### 主要字段与中文含义

- `id`：主键。
- `application_no`：申请编号，唯一。
- `application_type`：申请类型，`personal_member` 或 `organization_member`。
- `status`：申请状态。
- `name`：申请人姓名或机构名称。
- `contact_name`：联系人姓名。
- `phone`：联系电话或 WhatsApp。
- `email`：邮箱。
- `country`：国家或地区。
- `organization_type`：机构类型，仅机构会员申请使用。
- `profile`：个人补充备注或机构介绍。
- `purpose`：申请说明或合作意向。
- `receive_notice`：是否接收通知。
- `truth_confirmed`：资料真实性确认。
- `terms_accepted`：服务条款确认。
- `privacy_accepted`：隐私政策确认。
- `confirmed_at`：确认提交时间。
- `admin_note`：后台审核备注或给申请人的反馈。
- `supplemental_submissions`：补充资料记录 JSONB。
- `supplement_submitted_at`：最近一次补充资料提交时间。
- `created_at`：创建时间。
- `updated_at`：更新时间。

#### 当前前台可见内容

- 申请提交成功页显示申请编号。
- 申请进度查询页显示申请编号、申请类型、脱敏姓名或机构名、状态、提交时间、审核反馈、补充资料入口。
- 仅在状态为 `need_more_info` 时返回可编辑补充字段。

#### 当前后台可见内容

- 后台会员申请列表显示申请编号、类型、名称、邮箱、电话、国家或地区、状态、提交时间。
- 后台详情显示完整申请资料、确认字段、审核备注、补充记录。

#### 当前公开核验可见内容

无。会员申请不进入公开证书核验。

#### 涉及隐私的字段

- `name`、`contact_name`、`phone`、`email`、`country`。
- `profile`、`purpose`。
- `admin_note`。
- `supplemental_submissions`。

#### 是否由未来 .NET API 读写

是。未来会员申请提交、申请进度查询、后台管理、审核状态修改和补充资料都应由 .NET API 统一读写。

#### 当前已知风险

- 申请编号当前由应用层随机生成，不是数据库 sequence。
- 补充资料记录存储在 JSONB，后续审计和查询能力有限。
- 审核状态流转约束主要在应用层，数据库只做状态值约束。
- 暂无独立操作日志表。

#### 建议补强项

- 增加正式编号 sequence 或数据库侧唯一编号生成策略。
- 增加按 `status`、`created_at`、`application_type` 的后台列表索引。
- 增加状态历史或审核日志表。
- 增加操作审计字段，例如 `created_by`、`updated_by`、`last_reviewed_by`。

### 2.2 `certification_applications`

#### 表用途

用于存储道士资格认证申请、附件元数据、审核状态、材料审核结果、补充资料记录、证书照片 path 和证书下发状态。当前是 V1.2 认证闭环的核心表。

#### 主要字段与中文含义

- `id`：主键。
- `application_no`：认证申请编号，唯一。
- `certification_type`：认证类型，当前为 `taoist_priest`。
- `certification_path`：申请传承体系。
- `requested_level`：申请认证等级。
- `applicant_name`：申请人中文姓名。
- `applicant_name_en`：英文名或拼音。
- `taoist_name`：道名或法名。
- `gender`：性别。
- `birth_date`：出生日期。
- `nationality`：国籍。
- `residence`：现居地。
- `phone`：联系电话。
- `email`：邮箱。
- `address`：地址。
- `master_name`：师父姓名。
- `master_taoist_name`：师父道名或法名。
- `lineage`：传承体系。
- `temple_or_organization`：宫观、机构或所属组织。
- `sect`：所属道派或师承说明。
- `practice_years`：修行年限。
- `experience_summary`：经历说明。
- `application_reason`：申请理由。
- `additional_note`：补充备注。
- `recommender_name`：推荐人姓名。
- `recommender_contact`：推荐人联系方式。
- `recommender_relation`：推荐关系或推荐说明。
- `existing_certificates`：既有证书或资质附件元数据 JSONB。
- `supporting_documents`：补充证明材料附件元数据 JSONB。
- `declaration_accepted`：资料真实性声明确认。
- `ethics_confirmed`：伦理或资料使用相关确认。
- `boundary_confirmed`：公开边界确认。
- `data_use_accepted`：资料使用确认。
- `certificate_public_accepted`：证书公开核验信息确认。
- `terms_accepted`：服务条款确认。
- `privacy_accepted`：隐私政策确认。
- `confirmed_at`：确认提交时间。
- `status`：认证申请状态。
- `review_note`：证书项目备注。
- `internal_review_note`：后台内部审核备注。
- `applicant_feedback`：对申请人反馈。
- `approved_path`：核定传承体系。
- `approved_level`：核定认证等级。
- `material_review`：材料审核状态 JSONB。
- `committee_review_note`：认证委员会审核意见。
- `certificate_photo_path`：证书照片存储 path。
- `reviewer`：审核人。
- `reviewed_at`：审核时间。
- `delivery_status`：证书下发状态。
- `delivered_at`：证书下发时间。
- `supplemental_submissions`：补充资料记录 JSONB。
- `supplement_submitted_at`：最近一次补充提交时间。
- `created_at`：创建时间。
- `updated_at`：更新时间。

#### 当前前台可见内容

- 申请提交成功页显示申请编号。
- 申请进度查询页显示申请编号、状态、反馈、证书生成与下发状态、证书摘要、补充资料入口。
- 申请人可以在 `need_more_info` 状态下看到可补充字段。
- 若证书已生成，申请进度页可显示证书编号、证书信息和短期证书照片 URL。

#### 当前后台可见内容

- 后台认证申请列表显示申请编号、推荐人、申请人、道名、道派、状态、提交时间和导出入口。
- 后台详情显示完整身份资料、联系方式、师承资料、推荐人资料、附件、材料审核状态、补充记录、审核意见、证书状态和下发状态。

#### 当前公开核验可见内容

不直接公开。本表只作为证书生成和申请进度查询的数据来源。公开核验应只读取 `certificates` 的公开字段。

#### 涉及隐私的字段

几乎整表均涉及隐私，尤其是：

- 身份资料：姓名、道名、性别、出生日期、国籍、现居地、地址。
- 联系方式：电话、邮箱。
- 师承与推荐信息：师父、宫观、推荐人、推荐人联系方式。
- 材料与附件：`existing_certificates`、`supporting_documents`、`certificate_photo_path`。
- 审核意见：`internal_review_note`、`applicant_feedback`、`committee_review_note`。
- 补充资料：`supplemental_submissions`。

#### 是否由未来 .NET API 读写

是。未来认证申请提交、后台审核、材料审核、补充资料、证书生成前校验和下发状态都应由 .NET API 统一读写。

#### 当前已知风险

- 附件元数据存储在 JSONB，不利于文件级权限、审计和清理。
- 材料审核状态存储在 JSONB，缺少逐项审核记录。
- 证书生成和申请状态更新当前跨两张表，缺少数据库事务边界。
- 状态流转规则主要在应用层。
- 暂无独立操作日志和状态历史。

#### 建议补强项

- 增加 `attachments` 或 `files` 表，把文件元数据从 JSONB 中正式化。
- 增加 `review_logs` 或 `status_history` 表，记录每次状态变化。
- 增加 `audit_logs` 表，记录管理员操作。
- 将证书生成做成 .NET API 内的事务化操作。
- 为后台搜索增加合适索引，例如 `status`、`created_at`、`application_no`、申请人姓名、道名、推荐人字段。

### 2.3 `certificates`

#### 表用途

用于存储正式证书记录，支撑公开证书查询、证书核验详情、申请进度中的证书摘要和后台证书状态展示。

#### 主要字段与中文含义

- `id`：主键。
- `certificate_no`：证书编号，唯一。
- `application_id`：关联认证申请 ID。
- `holder_name`：持证人姓名。
- `taoist_name`：道名或法名。
- `taoist_rank`：证书等级或项目名称。
- `sect`：道派或传承说明。
- `certification_path`：认证传承体系。
- `certification_level`：认证等级。
- `lineage_or_temple`：所属法脉、宫观或传承。
- `certificate_photo_path`：证书照片存储 path。
- `issued_date`：签发日期。
- `valid_from`：有效期开始日期。
- `valid_until`：有效期结束日期。
- `status`：证书状态，`pending`、`valid`、`revoked`、`expired`。
- `public_query_enabled`：是否允许公开查询。
- `created_at`：创建时间。
- `updated_at`：更新时间。

#### 当前前台可见内容

- 申请进度查询页在证书生成后显示证书编号、证书状态、持证人信息、签发日期、有效期、证书照片短期 URL。
- 证书查询页显示公开证书摘要。
- 证书详情页显示公开核验信息。

#### 当前后台可见内容

- 认证后台详情页显示证书编号、证书状态、公开核验入口和下发状态。
- 后台列表 CSV 导出可包含证书编号。

#### 当前公开核验可见内容

- 证书编号。
- 持证人姓名。
- 认证类别。
- 传承体系。
- 认证等级。
- 签发机构。
- 签发日期。
- 有效期。
- 证书状态。

公开核验不得展示联系方式、申请材料、后台审核备注或补充资料。

#### 涉及隐私的字段

- `holder_name`、`taoist_name`、`lineage_or_temple` 有个人身份和传承信息属性，但属于申请人已确认可公开核验的必要字段。
- `certificate_photo_path` 不应直接公开；只应通过授权场景返回短期 URL。
- `application_id` 不应在公开接口暴露。

#### 是否由未来 .NET API 读写

是。公开查询、详情读取、证书生成、证书下发和状态管理都应由 .NET API 统一处理。

#### 当前已知风险

- 证书编号当前由应用层随机生成，不是数据库 sequence。
- 证书生成与申请状态更新缺少事务化边界。
- 缺少证书撤销原因、撤销时间和操作人字段。
- `expired` 目前依赖状态字段，没有自动过期策略。

#### 建议补强项

- 增加正式证书编号生成策略。
- 增加 `status`、`public_query_enabled`、`certificate_no` 查询索引组合。
- 增加撤销、过期、补发等证书生命周期字段。
- 将证书生成、撤销、下发纳入操作日志。

## 3. 建议未来补充的表

### 3.1 `audit_logs`

- 用途：记录管理员和系统写操作。
- 建议字段：`id`、`actor_id`、`actor_label`、`action`、`entity_type`、`entity_id`、`before`、`after`、`ip_address`、`user_agent`、`created_at`。
- 本轮状态：不创建。

### 3.2 `admin_users`

- 用途：替代单一 `ADMIN_PASSWORD`，支持多管理员、角色、停用、密码轮换。
- 建议字段：`id`、`email`、`display_name`、`password_hash`、`role`、`status`、`last_login_at`、`created_at`、`updated_at`。
- 本轮状态：不创建。

### 3.3 `files` 或 `attachments`

- 用途：正式化文件元数据和权限边界。
- 建议字段：`id`、`bucket`、`storage_path`、`original_name`、`mime_type`、`size`、`entity_type`、`entity_id`、`field_name`、`source`、`uploaded_by`、`created_at`。
- 本轮状态：不创建。

### 3.4 `notification_logs`

- 用途：记录未来邮件、短信、WhatsApp 或人工通知日志。
- 建议字段：`id`、`entity_type`、`entity_id`、`channel`、`recipient`、`template`、`status`、`error`、`sent_at`、`created_at`。
- 本轮状态：可选，不创建。

### 3.5 `status_history` 或 `review_logs`

- 用途：记录申请状态变化和审核意见变化。
- 建议字段：`id`、`entity_type`、`entity_id`、`from_status`、`to_status`、`note`、`actor_id`、`created_at`。
- 本轮状态：可选，不创建。

## 4. Supabase Storage 文件逻辑

### 4.1 Bucket

- bucket 名称：`certification-documents`。
- 是否私有：是，`public=false`。
- 当前用途：认证申请材料、补充材料、道装证件照。

### 4.2 当前上传入口

- 首次认证申请：`POST /api/certification-applications`。
- 申请人补充资料：`POST /api/applications/supplement`。

### 4.3 文件类型限制

当前允许：

- `application/pdf`
- `image/jpeg`
- `image/png`
- `.pdf`
- `.jpg`
- `.jpeg`
- `.png`

### 4.4 文件大小限制

- 单文件最大：`2MB`。
- 补充资料单次最多：`5` 个文件。

### 4.5 Path 规则

当前 path 规则：

```text
certification-applications/{applicationNo}/{category}/{fieldName}/{timestamp}-{sanitizedName}
```

其中：

- `category` 当前为 `existing_certificates` 或 `supporting_documents`。
- `fieldName` 对应材料字段，例如 `photo`、`idProof`、`lineageProof`、`supplementFiles`。
- 文件名会经过简单清理。

### 4.6 当前签名 URL 使用方式

- 后台认证详情页为附件生成短期签名 URL，默认有效期 `3600` 秒。
- 申请进度页在证书已生成时可能返回证书照片短期 URL。
- 导出 HTML 当前只输出附件元数据，不直接嵌入私有文件内容。

### 4.7 绝不能公开泄露的材料

以下内容不得在公开证书核验页、公开查询接口或无权限响应中泄露：

- 身份证明。
- 无犯罪记录证明。
- 授箓、传戒、传度、冠巾等资质材料。
- 师承证明和道场证明。
- 推荐信和推荐人联系方式。
- 道装证件照原始文件。
- 申请人电话、邮箱、地址、出生日期。
- 后台内部审核备注。
- 补充资料和补充说明。

### 4.8 未来 .NET API 文件授权建议

- 所有上传和读取授权都由 .NET API 统一判断。
- Next.js 不直接拼接 Supabase Storage URL。
- 公开接口不得返回 Storage path 或签名 URL，除非业务明确允许。
- 后台读取附件必须校验管理员会话。
- 申请人补充资料必须校验申请编号、登记联系方式和申请状态。
- 建议将文件元数据写入 `files` 或 `attachments` 表，便于审计、清理和权限判断。
- 签名 URL 有效期应尽量短，并按使用场景区分后台预览、申请人查看和系统导出。
