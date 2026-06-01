# ITCA V1.3 表单填写规则治理方案

## 1. 本轮扫描范围

本方案基于第 12.6-A 轮只读扫描，覆盖：

- 个人会员申请：`app/member/apply/page.tsx`、`app/api/applications/route.ts`、`backend/Itca.Api/Features/Applications/ApplicationSubmissionService.cs`、`lib/api/applications.ts`
- 机构会员申请：`app/organization/apply/page.tsx`、`app/api/applications/route.ts`、`backend/Itca.Api/Features/Applications/ApplicationSubmissionService.cs`、`lib/api/applications.ts`
- 道士资格认证申请：`app/certification/taoist-priest/page.tsx`、`app/api/certification-applications/route.ts`、`lib/supabase/server.ts`、`types/certification.ts`
- 补充资料：`app/api/applications/supplement/route.ts`、`app/application/query/page.tsx`
- 共用 UI / helper：`FormTemplateHelper`、局部 `Field` / `ConfirmCheckbox` / `FormField`、全局 `.form-input`

本轮不新增 SQL、不执行 SQL、不修改数据库结构、不改业务代码。

## 2. 当前字段清单

### 2.1 个人会员申请

| 字段 | 前端字段 | API 字段 | 当前要求 |
| --- | --- | --- | --- |
| 会员类型 | `memberType` | `applicationType=personal_member` | 必填，当前固定个人会员 |
| 姓名 | `name` | `name` / `contactName=name` | 必填，2-50 字符 |
| 手机 / WhatsApp | `contact` | `phone` | 必填，宽松电话格式 |
| 邮箱 | `email` | `email` | 必填，邮箱格式 |
| 国家 / 地区 | `region` | `country` | 必填 |
| 补充备注 | `profile` | `profile` | 选填，最多 1000 字 |
| 会员申请说明 | `reason` | `purpose` | 必填，20-1500 字 |
| 接收通知 | `notice` | `receiveNotice` | 选填 |
| 真实性确认 | `truthConfirmed` | `truthConfirmed` | 必填 |
| 服务条款确认 | `termsAccepted` | `termsAccepted` | 必填 |
| 隐私政策确认 | `privacyAccepted` | `privacyAccepted` | 必填 |
| 蜜罐字段 | `companyWebsite` | `companyWebsite` / `websiteUrl` | 必须为空 |

### 2.2 机构会员申请

| 字段 | 前端字段 | API 字段 | 当前要求 |
| --- | --- | --- | --- |
| 机构名称 | `organizationName` | `name` | 必填，2-80 字符 |
| 负责人姓名 | `principalName` | `contactName` | 必填，2-50 字符 |
| 手机 / WhatsApp | `contact` | `phone` | 必填，宽松电话格式 |
| 邮箱 | `email` | `email` | 必填，邮箱格式 |
| 所在国家 / 地区 | `region` | `country` | 必填 |
| 机构类型 | `organizationType` | `organizationType` | 必填，限定枚举 |
| 机构介绍 | `profile` | `profile` | 必填，30-2000 字 |
| 合作意向说明 | `cooperation` | `purpose` | 选填，最多 1500 字 |
| 真实性确认 | `truthConfirmed` | `truthConfirmed` | 必填 |
| 服务条款确认 | `termsAccepted` | `termsAccepted` | 必填 |
| 隐私政策确认 | `privacyAccepted` | `privacyAccepted` | 必填 |
| 蜜罐字段 | `companyWebsite` | `companyWebsite` / `websiteUrl` | 必须为空 |

### 2.3 道士资格认证申请

| 步骤 | 字段 | 前端字段 | API 字段 | 当前要求 |
| --- | --- | --- | --- | --- |
| 基本资料 | 申请认证类型 | `certificationType` | `certificationType` | 必填，固定道士资格认证 / `taoist_priest` |
| 基本资料 | 传承体系 | `certificationPath` | `certificationPath` | 必填，枚举 |
| 基本资料 | 申请认证等级 | `requestedLevel` | `requestedLevel` | 必填，枚举 |
| 基本资料 | 中文姓名 | `nameCn` | `applicantName` | 必填，2-50 字符 |
| 基本资料 | 英文名 / 拼音 | `nameEn` | `applicantNameEn` | 前端必填，后端目前未强制 |
| 基本资料 | 道名 / 法名 | `taoistName` | `taoistName` | 必填 |
| 基本资料 | 性别 | `gender` | `gender` | 前端必填，后端目前未强制 |
| 基本资料 | 出生日期 | `birthDate` | `birthDate` | 前端必填，后端目前未强制年龄 |
| 基本资料 | 国家 / 地区 | `nationality` | `nationality` | 前端必填；后端接受 `nationality` 或 `residence` 至少一个 |
| 基本资料 | 现居地 | `residence` | `residence` | 必填 |
| 基本资料 | 电话 | `phone` | `phone` | 必填，宽松电话格式 |
| 基本资料 | 邮箱 | `email` | `email` | 必填，邮箱格式 |
| 基本资料 | 地址 | `address` | `address` | 按情况提交 |
| 师承信息 | 道派 / 传承体系 | `lineage` | `lineage` | 必填 |
| 师承信息 | 师承或传承说明 | `sectFullName` | `sect` | 必填 |
| 师承信息 | 师父姓名 | `masterName` | `masterName` | 必填 |
| 师承信息 | 师父道名 / 法名 | `masterTaoistName` | `masterTaoistName` | 必填 |
| 师承信息 | 宫观 / 机构 / 所属组织 | `masterTemple` / `templeName` | `templeOrOrganization` | 必填 |
| 师承信息 | 师父联系方式 / 地址 | `masterContact` | 未提交 | 按情况提交，当前未入库 |
| 师承信息 | 拜师时间 | `apprenticeDate` | 未提交 | 按情况提交，当前未入库 |
| 师承信息 | 见证人 | `witnessName` / `witnessContact` | 未提交 | 按情况提交，当前未入库 |
| 资质文件 | 箓牒 / 职牒等 | `luDocument` 等 | 上传附件 | 按情况提交 |
| 实践经历 | 道教履历说明 | `practiceHistory` | `experienceSummary` | 必填，30-2000 字 |
| 实践经历 | 申请理由 | `applicationReason` | `applicationReason` | 前端必填；后端仅在有值时校验 20-1500 字 |
| 实践经历 | 补充备注 | `additionalNote` | `additionalNote` | 选填，最多 1000 字 |
| 推荐人 | 推荐人姓名 | `recommenderName` | `recommenderName` | 必填 |
| 推荐人 | 推荐人联系方式 | `recommenderContact` | `recommenderContact` | 必填 |
| 推荐人 | 推荐关系 / 说明 | `recommenderRelation` | `recommenderRelation` | 必填 |
| 上传材料 | 身份证明 | `idProof` | 支持材料 | 前端必填；后端只校验文件格式，未强制存在 |
| 上传材料 | 道装证件照 | `photo` | 支持材料 / `certificatePhotoPath` | 前端必填；后端只校验文件格式，未强制存在 |
| 声明承诺 | 多项确认 | `truthConfirm` 等 | 多个 boolean | 必填 |
| 蜜罐字段 | `companyWebsite` | `companyWebsite` / `websiteUrl` | 必须为空 |

## 3. 当前前端校验规则

### 3.1 个人会员

- 姓名必填，长度 2-50。
- 手机 / WhatsApp 必填，使用 `^[+\d][\d\s().-]{5,29}$`。
- 邮箱必填，使用基础邮箱正则。
- 国家 / 地区必填。
- 补充备注最多 1000 字。
- 会员申请说明必填，20-1500 字。
- 真实性、服务条款、隐私政策必须确认。
- 未填字段以字段下方红色错误提示和顶部错误提示显示。

### 3.2 机构会员

- 机构名称必填，长度 2-80。
- 负责人姓名必填，长度 2-50。
- 手机 / WhatsApp 必填，使用同一宽松电话正则。
- 邮箱必填。
- 所在国家 / 地区必填。
- 机构类型必填，限定前端枚举。
- 机构介绍必填，30-2000 字。
- 合作意向说明选填，最多 1500 字。
- 三项确认必须勾选。

### 3.3 道士资格认证

- 分步骤校验，当前步骤必填项未填时不能进入下一步。
- 最终提交时聚合所有步骤的必填错误，并跳回第一条错误所在步骤。
- 邮箱使用基础邮箱正则。
- 电话使用同一宽松电话正则。
- 中文姓名只校验长度 2-50。
- 道教履历说明 30-2000 字。
- 申请理由 20-1500 字。
- 补充备注最多 1000 字。
- 上传文件类型限制 PDF/JPG/JPEG/PNG，单文件不超过 2MB。
- `idProof` 和 `photo` 前端标记为必填。

## 4. 当前后端 / API 校验规则

### 4.1 会员申请 Next API

- 校验 `applicationType` 只能为 `personal_member` / `organization_member`。
- 校验蜜罐字段。
- 校验姓名 / 机构名称、电话、邮箱、国家 / 地区、确认勾选。
- 个人会员要求 `purpose` 必填且 20-1500 字，`profile` 最多 1000 字。
- 机构会员要求 `contactName`、`organizationType`、`profile`，并校验 `profile` 30-2000 字、`purpose` 最多 1500 字。
- 检查同类型 open application 是否占用邮箱 / 手机号。
- 写入前生成 ARID 申请编号。

### 4.2 会员申请 .NET API

- 与 Next API 大体一致。
- 对个人会员强制 `contactName = name`，`organizationType` 置空。
- `HasOpenApplicationAsync` 只检查 `record_disposition = normal` 且业务 open 状态的记录。
- 当前电话校验仍为宽松格式，不强制国际区号。

### 4.3 认证申请 API

- 支持 JSON 和 multipart/form-data。
- 校验认证类型、传承体系枚举、申报等级枚举。
- 中文姓名必填且 2-50。
- 道名 / 法名必填。
- `nationality` 和 `residence` 至少一个。
- 电话、邮箱必填并校验基础格式。
- 师承信息必须包含师父姓名、师父道名、lineage、templeOrOrganization、sect。
- 推荐人三项必填。
- 道教履历说明必填且 30-2000。
- 申请理由如果有值，则必须 20-1500；但后端目前未明确要求必填。
- 补充备注最多 1000。
- 声明承诺组合必填。
- 上传字段白名单、文件类型、单文件 2MB 校验。
- 当前后端未强制 `applicantNameEn`、`gender`、`birthDate`、`idProof`、`photo` 必填。

### 4.4 补充资料

- 通过申请编号和登记联系方式查找记录。
- `test` 不可查，`archived` 不允许继续补充，`voided` 返回作废提示。
- 仅 `need_more_info` 状态允许补充。
- 补充说明必填。
- 最多 5 个文件，单文件 2MB，格式 PDF/JPG/JPEG/PNG。
- 认证补充要求师承和推荐人核心字段完整。
- 会员补充允许更新姓名 / 联系人 / 电话 / 邮箱 / 国家地区 / profile / purpose。

## 5. 当前缺口

| 缺口 | 当前状态 | 风险 |
| --- | --- | --- |
| 中文名称只能填写中文 | 未实现，仅长度校验 | 后台审核成本高，证书姓名显示可能混杂 |
| 英文名称只能填写英文 / 拼音 / 拉丁字母 | 未实现，认证英文名后端未强制 | 证书和国际沟通字段质量不稳定 |
| 电话必须包含国际区号 | 未实现，只要求首位为 `+` 或数字 | 海外联系失败概率高 |
| 年龄必须 18 岁以上 | 未实现，认证生日后端未强制 | 未成年人申请边界不明确 |
| 前后端必填不一致 | 认证 `nameEn/gender/birthDate/idProof/photo/applicationReason` 存在差异 | 可绕过前端提交不完整资料 |
| 必填 / 条件必填提示不够结构化 | 目前靠标签、说明和错误信息 | 申请人不知道哪些材料按流派必须提交 |
| 未填提示更明显 | 已有红字，但长表单跨步骤仍容易遗漏 | 认证长表单提交前修正成本高 |
| 上传照片 / 图片 / 材料审核标准 | 仅说明格式和大小 | 照片不符合证书用途、材料不可读 |
| 补充资料校验弱于首次申请 | 补充资料可改基础联系方式和说明，但缺少统一字段规则 | 补充后资料质量可能退化 |
| 规则重复 | 电话、邮箱、长度、文件规则散落在多个文件 | 后续修改容易漏改 |

## 6. 12.6-B 建议先落地规则

12.6-B 应优先做低风险、无数据库结构依赖、前后端一致的规则：

1. 新增共用 validation helper。
   - `lib/validation/names.ts`
   - `lib/validation/phone.ts`
   - `lib/validation/age.ts`
   - `lib/validation/forms.ts`
2. 中文姓名规则。
   - 个人会员 `name`：建议允许中文、间隔点、少量空格。
   - 认证 `applicantName`：建议强制中文姓名格式。
   - 机构名称不强制全中文，因为机构可能有英文或混合品牌名。
3. 英文名 / 拼音规则。
   - 认证 `applicantNameEn`：仅允许拉丁字母、空格、连字符、撇号、点号。
4. 国际电话规则。
   - 推荐先改为“必须以 + 和国家区号开头”，例如 `+852 9123 4567`。
   - 前端 placeholder 和错误提示同步更新。
5. 年龄规则。
   - 认证 `birthDate` 必填，且提交日满 18 岁。
6. 认证前后端必填一致。
   - 后端强制 `applicantNameEn`、`gender`、`birthDate`、`applicationReason`。
   - multipart 下强制 `idProof` 和 `photo` 存在。
7. 上传材料提示增强。
   - 道装证件照：JPG/PNG、清晰正面、近期、背景干净、无遮挡。
   - 身份材料：整页清晰、边角完整、文字可读。
   - PDF/JPG/PNG：不超过 2MB。
8. 补充资料复用同一规则。
   - 电话、邮箱、英文名、生日、材料文件规则复用 helper。

## 7. 留到 12.7 引荐人库 / 机构库的规则

以下规则依赖引荐人库、机构库或权威资料，不建议在 12.6-B 直接硬编码：

- 推荐人是否存在、是否有效、是否具备推荐资格。
- 推荐人联系方式是否与库内记录匹配。
- 机构名称是否为已登记机构或合作机构。
- 宫观 / 道场 / 组织名称的规范名称匹配。
- 师承、宫观、机构与推荐人的关联校验。
- 机构类型更细的业务准入规则。

## 8. 留到第 14 阶段用户系统的规则

以下规则依赖用户账号、实名资料、登录态或长期档案：

- 同一申请人身份去重和历史资料预填。
- 申请人证件姓名与账号实名一致性校验。
- 用户手机号 / 邮箱绑定、验证和变更确认。
- 草稿保存、多端继续填写。
- 上传材料长期资料库、复用和版本管理。
- 用户可查看自己的历史补充资料、审核反馈和修改记录。

## 9. 建议新增 validation helper

### `lib/validation/names.ts`

建议职责：

- `validateChinesePersonName(value)`
- `validateLatinName(value)`
- `validateOrganizationName(value)`

建议规则：

- 中文人名：2-50 字符；允许 `\u4e00-\u9fff`、`·`、空格。
- 英文 / 拼音名：2-80 字符；允许 `A-Z a-z`、空格、`-`、`'`、`.`。
- 机构名称：2-80 字符；不强制语言，但禁止明显 URL、邮箱、纯数字。

### `lib/validation/phone.ts`

建议职责：

- `normalizePhone(value)`
- `validateInternationalPhone(value)`

建议规则：

- 必须以 `+` 开头。
- `+` 后至少 6 位数字，总数字数建议 8-15。
- 允许空格、括号、短横线，仅用于展示。

### `lib/validation/age.ts`

建议职责：

- `validateAdultBirthDate(value, minAge = 18)`
- `calculateAgeOnDate(value, referenceDate)`

建议规则：

- 日期必须合法。
- 不得晚于当前日期。
- 必须满 18 岁。

### `lib/validation/forms.ts`

建议职责：

- 统一 `FieldError` 类型。
- 统一必填校验。
- 统一文件类型 / 大小校验。
- 统一将 API fieldErrors 映射回前端字段。

## 10. 建议错误提示文案

| 场景 | 建议文案 |
| --- | --- |
| 中文姓名为空 | 请填写中文姓名。 |
| 中文姓名格式错误 | 中文姓名请使用中文字符，可包含“·”或空格，长度 2-50 个字符。 |
| 英文名为空 | 请填写英文名 / 拼音。 |
| 英文名格式错误 | 英文名 / 拼音请使用拉丁字母，可包含空格、连字符、撇号或点号。 |
| 电话无国际区号 | 请填写包含国际区号的联系电话，例如 +852 9123 4567。 |
| 出生日期为空 | 请填写出生日期。 |
| 年龄不足 | 申请人须年满 18 岁。 |
| 认证申请理由为空 | 请填写申请理由，说明申请认证的目的和使用场景。 |
| 身份证明缺失 | 请上传身份证明材料，需清晰、完整、可读。 |
| 道装证件照缺失 | 请上传道装证件照，需清晰、正面、无遮挡。 |
| 文件格式错误 | 文件格式不支持，请上传 PDF、JPG、JPEG 或 PNG 文件。 |
| 文件过大 | 文件大小超过限制，请上传不超过 2MB 的文件。 |
| 机构名称疑似无效 | 机构名称请填写正式名称，不要填写网址、邮箱或纯数字。 |

## 11. 建议字段必填 / 选填 / 条件必填表

### 个人会员

| 字段 | 建议规则 |
| --- | --- |
| 会员类型 | 必填 |
| 姓名 | 必填，中文姓名规则 |
| 手机 / WhatsApp | 必填，国际区号电话 |
| 邮箱 | 必填 |
| 国家 / 地区 | 必填 |
| 补充备注 | 选填 |
| 会员申请说明 | 必填 |
| 接收通知 | 选填 |
| 声明确认 | 必填 |

### 机构会员

| 字段 | 建议规则 |
| --- | --- |
| 机构名称 | 必填，机构名称规则 |
| 负责人姓名 | 必填，中文姓名规则；若海外负责人可允许英文名，需文案说明 |
| 手机 / WhatsApp | 必填，国际区号电话 |
| 邮箱 | 必填 |
| 所在国家 / 地区 | 必填 |
| 机构类型 | 必填 |
| 机构介绍 | 必填 |
| 合作意向说明 | 选填 |
| 声明确认 | 必填 |

### 道士资格认证

| 字段 | 建议规则 |
| --- | --- |
| 认证类型 | 必填 |
| 传承体系 | 必填 |
| 申报认证等级 | 必填 |
| 中文姓名 | 必填，中文姓名规则 |
| 英文名 / 拼音 | 必填，拉丁字母规则 |
| 道名 / 法名 | 必填，中文姓名扩展规则 |
| 性别 | 必填 |
| 出生日期 | 必填，年满 18 岁 |
| 国家 / 地区 | 必填 |
| 现居地 | 必填 |
| 电话 | 必填，国际区号电话 |
| 邮箱 | 必填 |
| 地址 | 条件必填：证书寄送或线下核验需要时 |
| 师承核心字段 | 必填 |
| 推荐人三项 | 必填；后续 12.7 接入推荐人库 |
| 道教履历说明 | 必填 |
| 申请理由 | 必填 |
| 身份证明 | 必填 |
| 道装证件照 | 必填 |
| 其他资质文件 | 条件必填：按传承体系和认证等级 |
| 声明确认 | 必填 |

## 12. 12.6-B 建议实施范围

建议 12.6-B 只做以下内容：

1. 新增 validation helper，不改数据库。
2. 个人会员、机构会员、认证申请三套前端表单接入统一 helper。
3. Next API 和 .NET API 同步接入同一规则口径。
4. 认证申请后端补齐前端已有必填项：英文名、性别、出生日期、申请理由、身份证明、道装证件照。
5. 电话规则升级为必须包含国际区号，并更新 placeholder 和错误文案。
6. 认证出生日期增加 18 岁校验。
7. 补充资料接口复用电话、邮箱、英文名、文件规则。
8. 不处理推荐人真实性、不处理机构真实性、不做账号验证。

## 13. 风险点

- 电话国际区号规则会让历史习惯填写本地号码的申请人遇到更多校验错误，需要同步 placeholder 和示例。
- 中文姓名强制规则对海外华人、外籍申请人可能过严；建议认证中文姓名强制，个人会员可先用提示或允许中英文混合。
- 认证申请后端强制 `idProof` / `photo` 后，JSON 提交路径需要明确是否仍支持；建议认证申请只支持 multipart 正式提交。
- 道名 / 法名可能包含中文、道号、括号、别名；不建议 12.6-B 过严。
- 机构名称不宜强制中文，否则国际机构无法提交。

## 14. 下一轮建议

12.6-B 可以进入“统一 validation helper + 前后端基础规则落地”。完成后应重点验证：

- 三类申请表单前端错误提示。
- 三类提交 API 后端 fieldErrors。
- .NET API fallback 与 Next API 规则一致。
- 补充资料不会绕过电话、邮箱、文件规则。
- 不影响 record_disposition、支付、通知、证书、PDF、vt 机制。
