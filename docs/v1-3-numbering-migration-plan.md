# V1.3 Numbering Migration Plan

## 1. 第 6 阶段最小落地建议

第 6 阶段建议做最小可控落地：

1. 保留 `applications.application_no`，不改历史记录。
2. 新会员申请生成 `ARID-ITCA-M-YYYY-000001` 或 `ARID-ITCA-ORG-YYYY-000001`。
3. 新道士认证申请生成 `ARID-ITCA-TAO-YYYY-000001`。
4. `applications` 新增 `member_no`，用于正式会员编号。
5. 会员审核通过时生成 `ITCA-M-YYYY-000001` 或 `ITCA-ORG-YYYY-000001`。
6. 公众会员查询优先查 `member_no`，查不到再兼容旧 `application_no` / `legacy_member_no`。
7. 证书编号 `certificates.certificate_no` 暂不重构。
8. 不迁移历史数据，只对新数据生效。

## 2. 新提交申请如何使用 ARID

会员申请：

- 个人会员写入 `applications.application_no = ARID-ITCA-M-YYYY-000001`。
- 机构会员写入 `applications.application_no = ARID-ITCA-ORG-YYYY-000001`。

认证申请：

- 写入 `certification_applications.application_no = ARID-ITCA-TAO-YYYY-000001`。
- 附件路径继续使用申请编号作为路径段，新旧路径并存。

## 3. 旧申请编号如何继续兼容

- 不覆盖旧 `application_no`。
- `/application/query` 继续按 `application_no` 精确查询。
- 补充资料继续按 `application_no` 定位。
- 后台搜索继续支持 `application_no`。
- 页面文案说明“旧申请编号仍可查询”。

## 4. 新会员编号何时生成

建议在会员申请审核状态首次变为 `approved` 时生成 `member_no`：

- 如果 `applications.member_no` 已有值，不重复生成。
- 如果从 `approved` 改回其他状态，不自动删除 `member_no`，由后续会员状态策略决定是否公开有效。
- `member_approved_at` 记录首次生成或首次审核通过时间。

## 5. 旧会员编号如何继续查询

公众会员查询兼容顺序：

1. `applications.member_no = @memberNo`
2. `applications.legacy_member_no = @memberNo`
3. `applications.application_no = @memberNo`

第三项仅用于历史兼容，不应用于新数据说明。

## 6. 新证书编号是否需要调整

第 6 阶段不建议调整证书编号：

- `certificates.certificate_no` 已是独立字段。
- 公众证书核验、详情页、vt 机制均依赖该字段。
- 当前申请编号和证书编号格式可能同为 `ITCA-TAO-YYYY-000001`，但新申请改 ARID 后可自然分离。

## 7. 字段与表建议

建议新增：

- `applications.member_no text`
- `applications.legacy_application_no text`
- `applications.legacy_member_no text`
- `applications.member_approved_at timestamptz`
- `numbering_sequences` 表

可暂缓：

- `numbering_rules` 表
- 独立 `members` 表

不建议在第 6 阶段新增独立 `members` 表，原因是当前会员公开核验和后台审核都围绕 `applications` 表，拆表会放大 API、后台列表、权限、审计、历史兼容的改动面。

## 8. numbering_sequences 建议

`numbering_sequences` 用于统一管理按编号类型和年份递增的序号。建议唯一键：

```text
scope + year
```

候选 scope：

- `application_tao`
- `application_member_personal`
- `application_member_organization`
- `certificate_tao`
- `member_personal`
- `member_organization`
- `payment`
- `notification`

第 6 阶段至少应覆盖 ARID 和会员编号；证书编号可后续迁入。

## 9. numbering_rules 建议

第 6 阶段可不建 `numbering_rules`。规则目前稳定且数量少，硬编码常量 + 文档更低风险。

后续出现以下需求时再建：

- 后台配置前缀。
- 多机构、多站点、多币种或多业务线。
- 编号规则启停、版本化。
- 按规则回溯生成说明。

## 10. 历史数据迁移策略

第 6 阶段建议不迁移历史数据。

未来如迁移历史数据，建议分批：

1. 只读统计现有 `application_no` 格式分布。
2. 导出历史 `id`、`application_no`、`application_type`、`status`、`created_at`。
3. 对已批准会员生成候选 `member_no` 映射表。
4. 人工复核重复、异常、旧 `ATCA-*` 格式。
5. 小批量写入 `legacy_application_no`、`legacy_member_no`、`member_no`。
6. 验证 `/application/query`、`/member-query`、后台列表。
7. 再扩大批次。

## 11. 回滚策略

第 6 阶段回滚应满足：

- 新增字段可保留为空，不影响旧逻辑。
- 会员查询可临时恢复仅查 `application_no`。
- 新 ARID 申请已经写入后，不应改回旧编号；如需回滚生成逻辑，旧数据仍按 `application_no` 查询。
- `numbering_sequences` 只作为生成辅助，回滚业务逻辑时不删除表，避免丢失已分配序号审计线索。

## 12. 验收清单

- 新个人会员申请编号为 `ARID-ITCA-M-YYYY-000001`。
- 新机构会员申请编号为 `ARID-ITCA-ORG-YYYY-000001`。
- 新认证申请编号为 `ARID-ITCA-TAO-YYYY-000001`。
- 旧申请编号仍可查申请进度。
- 新会员审核通过后生成 `member_no`。
- 公众会员查询可用新 `member_no`。
- 公众会员查询仍兼容旧 `application_no`。
- 证书公开核验不受影响。
- 证书详情 vt 不受影响。
- 后台列表和详情仍显示申请编号。
- 审计日志仍写入审核操作。
- 不执行历史数据批量迁移。
