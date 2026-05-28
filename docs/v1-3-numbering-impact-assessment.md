# V1.3 Numbering Impact Assessment

## 1. 扫描范围

本次扫描命令：

```bash
rg "application_no|certificate_no|member_no|membership_no|ITCA-M|ITCA-TAO|ITCA-ORG|ATCA-M|ATCA-O|ARID|PAY-ITCA|NTC-ITCA" app lib types backend supabase docs
```

覆盖目录：`app/`、`lib/`、`types/`、`backend/Itca.Api/`、`supabase/`、`docs/`。

## 2. 当前代码编号使用位置清单

| 位置 | 编号字段 / 格式 | 当前用途 | 影响判断 |
| --- | --- | --- | --- |
| `lib/application-number.ts` | `ITCA-M-YYYY-xxxxxx` | Next 会员申请编号生成 | 需在第 6 阶段改为 ARID，并区分个人 / 机构 |
| `lib/application-number.ts` | `ITCA-TAO-YYYY-xxxxxx` | 认证申请编号、证书编号生成 | 申请编号需改 ARID；证书编号暂保留 |
| `app/api/applications/route.ts` | `applicationNo` / `application_no` | Next 会员申请提交写入 | 新申请改 ARID 后会影响成功页、查询入口 |
| `app/api/certification-applications/route.ts` | `applicationNo` / `application_no` | 认证申请提交、Storage path | ARID 会进入 Storage path，需确认旧路径兼容 |
| `app/api/applications/query/route.ts` | `applicationNo` | 申请进度查询路由 | 当前用前缀判断认证申请，需支持 `ARID-ITCA-TAO-` |
| `app/api/applications/supplement/route.ts` | `applicationNo` | 补充资料定位申请与 Storage path | 需继续支持旧编号与 ARID |
| `/application/query` | `applicationNumber` | 申请人进度查询 UI | 文案需从 `ITCA-M/ITCA-O/ITCA-TAO` 更新为 ARID + 旧编号兼容 |
| `/member-query` | `memberNo` | 公众会员核验 UI | 目前展示正式会员编号概念，但后端实际查 `application_no` |
| `/certificate-query` | `certificateNo` | 公众证书核验 UI | 稳定使用证书编号 |
| `/certificates/[certificateNo]` | `certificateNo` | 证书详情与 vt 校验 | 不应修改 vt 机制 |
| `lib/supabase/server.ts` | `application_no` | 插入、查询、后台列表、补充资料 | 大量依赖，ARID 落地必须保持字段兼容 |
| `lib/supabase/server.ts` | `certificate_no` | 证书查询、证书详情、删除证书 | 相对稳定 |
| `backend/Itca.Api/Features/Applications/ApplicationSubmissionService.cs` | `ITCA-M-YYYY-xxxxxx` | Render .NET 会员申请提交编号生成 | 机构申请也生成 `ITCA-M`，需修正为 ARID-M / ARID-ORG |
| `backend/Itca.Api/Features/Applications/ApplicationQueries.cs` | `applications.application_no` / `certification_applications.application_no` | .NET 申请进度查询 | ARID 可继续写入同字段，查询逻辑可保持 |
| `backend/Itca.Api/Features/Members/MemberQueries.cs` | `applications.application_no = @memberNo` | .NET 公众会员查询 | 当前最高风险：会员编号由申请编号替代 |
| `backend/Itca.Api/Features/Certificates/CertificateQueries.cs` | `certificates.certificate_no` | .NET 公众证书查询和详情 | 稳定 |
| `backend/Itca.Api/Features/Applications/ApplicationAdminQueries.cs` | `application_no` | 后台会员申请列表、详情、关键词搜索 | 需保留旧字段索引 |
| `backend/Itca.Api/Features/Applications/ApplicationAdminCommands.cs` | `application_no` | 后台会员审核、审计日志 `resource_no` | ARID 会写入审计日志，需可接受 |
| `backend/Itca.Api/Features/Admin/AuditLogWriter.cs` | `resource_no` | 审计日志资源编号 | 不限定编号类型，可兼容 |
| `supabase/applications.sql` | `application_no`, `certificate_no` | 正式表结构草案 | 缺少 `member_no`、legacy 字段、序列表 |
| `supabase/admin-users-and-audit-logs.sql` | `resource_no` | 审计日志表 | 已有普通索引，可承载申请编号或会员编号 |
| `types/application.ts` | `applicationNo`, `certificateNo` | 前端 DTO | 缺少 `memberNo` |
| `types/member.ts` | `memberNo` | 会员公开查询 DTO | 字段存在，但后端映射到 `application_no` |
| `docs/v1-3-member-public-query.md` | `applications.application_no` | 已记录临时映射 | 与本阶段结论一致 |

## 3. 当前数据库字段使用情况

`applications`：

- `application_no`：存在，唯一，当前同时承担会员申请编号、申请人查询编号、临时会员公开核验编号。
- `application_type`：存在，区分 `personal_member` / `organization_member`。
- `name`、`email`、`phone`、`status`：存在，用于提交、查询、后台审核。
- `member_no`：当前 SQL 与代码未正式使用。

`certification_applications`：

- `application_no`：存在，唯一，当前为认证申请编号。
- 认证申请上传路径使用 `application_no` 作为路径段。

`certificates`：

- `certificate_no`：存在，唯一，公众证书查询和详情页稳定依赖。
- `application_id`：存在，关联 `certification_applications.id`。
- `holder_name`、`status`：存在，公众核验依赖。

`audit_logs`：

- `resource_no`：存在，当前会员申请审核写入 `application_no`。
- `resource_type`：存在，当前会员申请审核写入 `application`。
- `action`：存在，当前会员申请审核写入 `member_application.review_update`。

## 4. 历史编号格式判断

代码与文档中可见格式：

- 当前会员申请：`ITCA-M-YYYY-000001`，且 .NET 会员申请对个人和机构都生成 `ITCA-M`。
- 当前认证申请：`ITCA-TAO-YYYY-000001`。
- 当前证书：`ITCA-TAO-YYYY-000001`。
- 查询页文案提到 `ITCA-O`，但扫描未发现生成逻辑。
- 扫描未发现 `ATCA-M`、`ATCA-O` 生成逻辑；不能排除正式数据库历史数据存在旧格式。
- PRD 已列出未来 `ARID`、`PAY-ITCA`、`NTC-ITCA` 方向，但代码尚未落地。

## 5. 关键风险判断

1. `applications.application_no` 是否被同时当作申请编号和会员编号使用：是。`MemberQueries.cs` 将 `memberNo` 映射到 `applications.application_no`。
2. `/member-query` 当前是否把 `memberNo` 映射到 `applications.application_no`：是，经 .NET API 查询实现确认。
3. 旧会员编号是否存在 `ATCA-M`、`ATCA-O` 或旧 `ITCA-M`：代码中未见 `ATCA-*`，旧 `ITCA-M` 已存在；正式库需另行只读统计确认。
4. 证书编号是否稳定使用 `certificates.certificate_no`：是。
5. 申请进度查询是否依赖 `application_no`：是，Next 与 .NET 都依赖。
6. 后台审核、通知文案、审计日志是否依赖 `application_no`：是，后台列表、详情、审核、通知文案、审计日志均显示或写入。
7. 未来把 `application_no` 改为 ARID 是否影响现有查询：若覆盖历史数据会高风险；若仅新数据使用 ARID 且查询继续按 `application_no` 精确匹配，风险可控。
8. 未来新增 `member_no` 后旧会员查询如何兼容：应优先查 `member_no`，再查 `legacy_member_no` / 旧 `application_no`。
9. 是否需要编号规则配置表：第 6 阶段不必需，后续需要多类型配置、启停和前缀治理时再上。
10. 是否需要编号序列表：建议第 6 阶段候选，用于避免随机数碰撞和实现年度连续编号。
11. 是否需要独立 `members` 表：第 6 阶段不建议，先在 `applications` 增加 `member_no` 更低风险。

## 6. 前台页面影响

- `/application/query`：需要支持 ARID 占位符和说明，同时保留旧 `ITCA-M`、`ITCA-O`、`ITCA-TAO` 申请编号查询。
- `/member-query`：正式逻辑应查询 `member_no`，但必须保留旧 `application_no` 兼容。
- `/certificate-query` 与 `/certificates/[certificateNo]`：证书编号路径和 vt 机制不调整。
- 申请成功页：新申请显示 ARID，并说明不是正式会员编号或证书编号。

## 7. 后台页面影响

- 会员申请列表和详情继续显示申请编号。
- 审核通过后可增加显示正式会员编号。
- 后台关键词搜索应可搜索 `application_no` 与 `member_no`。
- 认证申请后台继续显示申请编号和证书编号两个不同字段。

## 8. .NET API 影响

- 会员提交接口需生成 ARID，且机构会员使用 `ARID-ITCA-ORG`。
- 会员公开查询需从 `application_no` 切到 `member_no` 优先。
- 申请进度查询可继续按 `application_no` 查询，新增 ARID 不要求改表名。
- 证书查询无需改编号字段。

## 9. Supabase 表结构影响

最低风险结构调整：

- `applications.member_no text`
- `applications.legacy_application_no text`
- `applications.legacy_member_no text`
- `applications.member_approved_at timestamptz`
- `numbering_sequences` 表作为年度序列来源。

第 6 阶段暂不建议创建 `members` 独立表。

## 10. audit_logs 影响

`audit_logs.resource_no` 当前可承载任意资源编号。第 6 阶段无需改结构，但应明确：

- 申请审核写申请编号 ARID。
- 未来正式会员操作可写 `member_no`。
- 如同一操作同时涉及申请和会员编号，可在 `after_data` 中保留两者。

## 11. 公众查询与申请人查询影响

公众查询：

- 会员公开核验应使用正式会员编号。
- 证书公开核验继续使用证书编号。
- 公众查询不应接受 ARID 作为会员或证书公开查询的主编号。

申请人查询：

- 申请进度查询使用 ARID 或旧申请编号 + 登记联系方式。
- 申请查询可以展示已生成的正式证书编号或会员编号，但不要把它们替代申请编号。

## 12. 风险等级

总体风险：中高。

最高风险：当前 `applications.application_no` 被会员申请编号、申请人查询编号、公众会员编号三重复用。一旦直接把 `application_no` 改成 ARID，而 `/member-query` 未切换到 `member_no`，新会员的公众核验会要求输入申请编号，语义错误并影响外部核验。

可控因素：证书编号已经独立在 `certificates.certificate_no`，申请查询也可以继续使用 `application_no` 字段承载 ARID，因此第 6 阶段可以通过小范围字段增加和兼容查询落地。

## 13. 是否建议进入第 6 阶段

建议进入第 6 阶段“编号规则最小落地”，但范围必须限制为：

- 不迁移历史数据。
- 不改证书 vt 机制。
- 不新增 `members` 独立表。
- 新申请使用 ARID。
- 会员审核通过时写入 `applications.member_no`。
- `/member-query` 优先查 `member_no`，兼容旧 `application_no`。
- 引入或预备 `numbering_sequences`，避免继续使用随机数。
