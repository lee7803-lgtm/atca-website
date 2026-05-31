# ITCA V1.3 Phase 10 Renewal and Review Flow Plan

本文件描述会员续期、认证/证书复审与支付订单的业务闭环。当前轮次只做方案，不修改业务代码、不新增 SQL、不执行数据库变更、不新增支付页面。

## Existing Validity Model

会员：

- 会员资料仍在 `applications`。
- 会员编号为 `member_no`。
- 有效期为 `member_valid_from / member_valid_until`。
- 会员业务状态为 `member_status`，当前建议值为 `active / suspended / revoked / terminated`。
- 续期状态为 `member_renewal_status`，当前建议值为 `none / pending_renewal / renewal_in_progress / renewed`。
- 后台已有会员有效期维护表单，保存时会写通知记录和审计记录。

证书：

- 证书资料在 `certificates`。
- 有效期为 `valid_from / valid_until`。
- 证书主状态为 `status`，当前值为 `pending / valid / revoked / expired`。
- 复审/续期状态为 `certificate_review_status`，当前使用 `none / pending_renewal / renewal_in_progress / renewed / suspended` 等语义。
- 后台已有证书状态维护入口，保存时会写通知记录和审计记录。

申请：

- 会员申请状态和认证申请状态仍负责审核生命周期。
- 付款不应绕过审核，也不应直接等同审核通过。

## Member Renewal Payment Flow

建议新增“续期意向/续期订单”流程，先不拆出独立会员表，继续复用 `applications` 作为会员主记录。

基础流程：

1. 系统或后台识别会员即将到期或已过期。
2. 后台创建续期支付订单，`business_type=member_renewal`，关联 `applications.id`、`application_no`、`member_no`。
3. 创建订单时，会员可保持原 `member_status=active`，并将 `member_renewal_status` 设为 `pending_renewal`，表示已进入续期提醒或待付款阶段。
4. 用户付款或提交凭证后，订单进入 `proof_submitted / paid`。
5. 后台确认付款后，订单进入 `confirmed`，同时将 `member_renewal_status` 推到 `renewal_in_progress` 或直接 `renewed`，取决于是否需要人工复核资料。
6. 若无需资料复核，后台确认付款时可更新：
   - `member_valid_from`: 通常取当前有效期次日或确认日。
   - `member_valid_until`: 新有效期截止日，建议一年后减一天。
   - `member_status=active`。
   - `member_renewal_status=renewed`。
   - `last_renewed_at=now()`。
7. 若需要人工复核，先保持 `member_renewal_status=renewal_in_progress`，后台复核完成后再改为 `renewed` 并更新有效期。

续期有效期规则建议：

- 未过期会员：新有效期从原 `member_valid_until + 1 day` 开始。
- 已过期会员：新有效期从付款确认日或后台确认日起算。
- 续期年限：初期固定一年，后续可由 `fee_code / metadata.term_months` 扩展。
- 人工覆盖：后台保留手动编辑有效期能力，但必须写 audit log。

## Member Renewal Status Flow

建议保留现有字段并明确语义：

- `member_status=active` + `member_renewal_status=none`: 当前有效，无续期流程。
- `active + pending_renewal`: 待续期或待付款。
- `active + renewal_in_progress`: 已付款或已提交资料，后台处理中。
- `active + renewed`: 已续期，可在下一次状态维护或定时归档时回到 `none`。
- `suspended / terminated / revoked + none`: 非正常会员状态，不能自动续期。

支付订单状态和会员续期状态的映射：

- `payment_orders.pending_payment` -> `member_renewal_status=pending_renewal`。
- `proof_submitted / paid` -> 可保持 `pending_renewal` 或进入 `renewal_in_progress`。
- `confirmed` -> `renewal_in_progress` 或 `renewed`。
- `cancelled / failed / expired` -> 保持或回到 `pending_renewal`，由后台决定是否取消续期流程。

## Certification and Certificate Review Payment Flow

认证/证书复审建议围绕 `certificates` 建立，但保留和原 `certification_applications` 的关联。

适用场景：

- 证书即将到期，需要复审续期。
- 证书已过期，需要恢复有效性前复审。
- 证书资料争议后恢复，需要重新审核。
- 证书等级或传承信息变更，需重新审核或增补材料。

基础流程：

1. 后台创建复审支付订单，`business_type=certificate_review`，关联 `certificates.id`、`certification_applications.id`、`certificate_no`、`application_no`。
2. 创建订单时，可将 `certificate_review_status` 设为 `pending_renewal`，证书主状态不直接改变。
3. 用户付款或提交凭证，订单状态进入 `proof_submitted / paid`。
4. 后台确认付款后，订单进入 `confirmed`，并将 `certificate_review_status=renewal_in_progress`。
5. 后台完成材料复审后：
   - 若通过：更新 `valid_from / valid_until`，`status=valid`，`certificate_review_status=renewed`，`last_reviewed_at=now()`。
   - 若不通过：保持或设置 `certificate_review_status=suspended`，必要时 `status=revoked`。
6. 若只是付款确认但材料未复审完成，不应立即把证书标为 `renewed`。

## Certificate Review Status Flow

建议清晰区分证书主状态和复审状态：

- `status=valid + certificate_review_status=none`: 正常有效。
- `valid + pending_renewal`: 待续期/待付款。
- `valid + renewal_in_progress`: 续期或复审处理中。
- `valid + renewed`: 已完成复审续期。
- `valid + suspended`: 有争议或暂停公开有效性说明，但主状态仍未撤销。
- `revoked + none`: 撤销，不能通过普通续期恢复，应走专门复核。
- `expired + pending_renewal`: 已过期，待续期。

如果后续要更严谨，建议把 `certificate_review_status` 扩展为：

- `none`
- `pending_payment`
- `payment_confirmed`
- `materials_required`
- `under_review`
- `approved`
- `rejected`
- `renewed`
- `suspended`

但第 10 阶段初期可先沿用当前字段，减少迁移范围。

## Applicant Progress Query Integration

申请进度查询页建议新增支付摘要，但不新增支付页面：

- 新申请：显示“付款状态”和“后台确认后进入审核”。
- 会员续期：如果通过会员公开核验或申请查询进入，显示续期状态。
- 认证复审：在认证申请查询和证书详情中显示复审状态。

展示原则：

- 不展示内部 provider 原始响应。
- 不展示完整 audit log。
- 可展示订单号、金额、币种、状态、创建时间、确认时间和协会提示。
- 付款失败、取消、过期时给出联系协会秘书处的说明。

## Public Member Verification Integration

会员公开核验当前按 `member_no + holderName` 查询，并计算 `memberEffectiveStatus`。

续期接入后建议：

- 保持公开核验只展示会员编号、名称、会员类型、有效期、公开状态。
- 若 `member_renewal_status=pending_renewal / renewal_in_progress`，公开状态可显示“待续期”或“续期中”。
- 不展示订单金额、付款凭证、后台备注。
- `revoked / terminated / suspended` 优先级高于续期状态。

## Public Certificate Verification Integration

证书公开核验当前按证书编号和持证人查询，并计算 `effectiveStatus`。

复审接入后建议：

- 若 `certificate_review_status=pending_renewal / renewal_in_progress`，公开状态显示“待续期”或“续期中”。
- 若证书已过期，优先显示“已过期”，除非业务决定“续期中”优先。
- 证书撤销优先级最高。
- 不展示支付订单、凭证、后台审核材料。

## Notification Logs Integration

会员续期建议通知节点：

- 续期订单创建：`member_renewal_payment_created`。
- 付款凭证提交：`member_renewal_proof_submitted`。
- 付款确认：`member_renewal_payment_confirmed`。
- 续期完成：可复用或新增 `member_status_updated`，同时 payload 带 `renewalOrderNo`。

证书复审建议通知节点：

- 复审订单创建：`certificate_review_payment_created`。
- 付款确认：`certificate_review_payment_confirmed`。
- 复审进入处理：`certificate_review_started`。
- 复审完成：可复用或新增 `certificate_status_updated`，payload 带 `reviewOrderNo`。

## Audit Logs Integration

续期和复审不能只写支付审计，还要写业务审计：

- 会员续期订单确认：`member_renewal.payment_confirmed`。
- 会员有效期更新：继续使用或扩展 `member_application.validity_update`。
- 证书复审订单确认：`certificate_review.payment_confirmed`。
- 证书有效期/复审状态更新：继续使用或扩展 `certificate.status_update`。

业务审计的 `before_data / after_data` 必须包含有效期、业务状态、续期/复审状态和关联 `payment_order_id / order_no`。

## Edge Cases

- 重复订单：同一业务对象同一 `business_type` 只允许一个未关闭订单，除非后台显式取消旧订单。
- 部分付款：初期不支持；后续可用 `payment_events` 扩展。
- 多币种：订单记录币种和金额，业务流程只关心是否确认付款。
- 手动确认误操作：不回滚已确认订单，建议新增修正事件或退款/取消后重建订单。
- 会员已撤销或证书已撤销：默认禁止普通续期，只允许 super_admin 创建复核类订单。

## Suggested Development Order

1. 先做 `payment_orders / payment_events` 数据模型和 .NET 命令。
2. 再做后台人工创建订单、确认订单、取消订单。
3. 再接会员续期状态推进。
4. 再接证书复审状态推进。
5. 最后把申请进度查询、会员公开核验、证书公开核验补上付款/续期/复审摘要。
