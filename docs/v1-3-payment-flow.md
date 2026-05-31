# ITCA V1.3 Phase 10 Payment Flow Plan

本文件用于第 10 阶段在线支付与后台确认闭环设计。当前轮次只做方案，不修改业务代码、不新增 SQL、不执行数据库变更、不新增支付页面。

## Current Scan Summary

- 会员申请主表为 `applications`，申请状态为 `submitted / pending_review / under_review / need_more_info / approved / rejected / archived`。
- 认证申请主表为 `certification_applications`，审核、发证、下发状态已经拆分为申请状态、证书记录和下发状态。
- 证书主表为 `certificates`，证书状态包含 `pending / valid / revoked / expired`，复审/续期态目前通过 `certificate_review_status` 承载。
- 会员有效期和续期态目前挂在 `applications.member_valid_from / member_valid_until / member_status / member_renewal_status / last_renewed_at / member_status_note`。
- 通知记录通过 `notification_logs` 承载，现有 provider 为 `none`，业务节点会写入通知日志但不真实发送邮件。
- 审计记录通过 `audit_logs` 承载，会员审核、会员有效期维护、证书状态维护已经有写入路径。
- Next.js 目前既有 Supabase fallback，也会优先调用 .NET API 的部分会员管理与公开查询能力；认证后台仍主要在 Next.js API 中完成。

## Payment Order Model Recommendation

建议新增 `payment_orders` 作为支付订单主表，订单只表达“应收款、支付状态、业务归属和人工确认结果”，不直接替代申请、会员或证书业务状态。

建议字段：

- `id`: uuid 主键。
- `order_no`: 对外订单号，建议 `ITCA-PAY-YYYY-XXXXXX`，唯一。
- `business_type`: `member_application / organization_application / certification_application / member_renewal / certificate_review`。
- `business_id`: 关联业务记录 id。会员相关指向 `applications.id`，认证/复审相关可指向 `certification_applications.id` 或 `certificates.id`，需配合 `business_type` 解释。
- `application_id`: 可选，会员申请 id。
- `certification_application_id`: 可选，认证申请 id。
- `certificate_id`: 可选，证书 id。
- `application_no / member_no / certificate_no`: 冗余展示与查询字段。
- `payer_name / payer_email / payer_phone`: 付款人信息快照。
- `currency`: 默认 `USD` 或按协会最终收费规则设置。
- `amount`: decimal，订单应付金额。
- `fee_code`: `member_new_personal / member_new_org / certification_taoist / member_renewal / certificate_review` 等。
- `provider`: `manual / none / stripe / paypal / bank_transfer / fps / other`，初期用 `manual` 或 `none`。
- `provider_order_id`: 网关侧订单号，预留。
- `provider_payment_id`: 网关侧支付流水号，预留。
- `status`: 支付订单状态，见下方状态流。
- `payment_method`: `manual_bank_transfer / offline / card / wallet / unknown`。
- `payment_proof_url`: 线下转账凭证或后台附件预留。
- `payment_proof_note`: 付款备注、转账参考号。
- `paid_at`: 网关或后台确认的付款时间。
- `confirmed_at / confirmed_by`: 后台确认时间和管理员。
- `cancelled_at / cancelled_by / cancel_reason`: 取消记录。
- `refunded_at / refund_reason`: 退款预留。
- `expires_at`: 支付链接或待付款订单过期时间。
- `metadata`: jsonb，保存价格版本、地区、税费、折扣、网关原始摘要等。
- `created_at / updated_at`。

## Payment Events Model Recommendation

建议新增 `payment_events` 作为订单状态变化、网关回调、后台人工确认的不可变事件表。

建议字段：

- `id`: uuid 主键。
- `payment_order_id`: 关联 `payment_orders.id`。
- `order_no`: 冗余订单号。
- `event_type`: `created / provider_created / proof_uploaded / paid / confirmed / failed / cancelled / expired / refunded / webhook_received / admin_note`。
- `from_status / to_status`: 状态流快照。
- `provider`: 与订单一致。
- `provider_event_id`: 网关事件 id，唯一约束可按 provider 组合。
- `payload_json`: 网关回调、后台操作摘要或系统事件详情。
- `created_by`: `system / applicant / admin email`。
- `created_at`。

`payment_events` 应只追加，不更新，用于对账和排障；`payment_orders.status` 是当前状态快照。

## Payment Status Flow

建议订单状态：

- `draft`: 订单草稿，业务记录尚未展示支付入口或金额尚未锁定。
- `pending_payment`: 已生成订单，等待付款。
- `proof_submitted`: 线下付款凭证已提交，等待后台确认。
- `processing`: 网关已返回处理中，或后台确认前的中间状态。
- `paid`: 网关确认已付款，但业务侧尚未完成入账确认或状态推进。
- `confirmed`: 后台或系统确认付款有效，允许推进业务状态。
- `failed`: 支付失败。
- `cancelled`: 订单取消。
- `expired`: 超时未付款。
- `refunded`: 已退款。

状态推进原则：

- `confirmed` 才能触发会员续期、认证复审通过后的有效期更新等业务动作。
- `paid` 不等于业务完成；网关接入后仍需经过幂等业务处理。
- 后台人工确认初期可以从 `pending_payment / proof_submitted / paid` 推到 `confirmed`。
- 已 `confirmed / refunded / cancelled` 的订单原则上不可回退，只能追加新订单或退款事件。

## New Application Payment Flow

会员新申请和认证新申请建议先不阻断现有提交链路，而是在提交后补一层“待付款/付款确认”闭环。

建议流程：

1. 用户提交会员或认证申请，系统保持现有申请创建逻辑。
2. 服务端按申请类型创建 `payment_orders`，`business_type` 为 `member_application / organization_application / certification_application`，状态为 `pending_payment`。
3. 申请进度查询页显示付款状态摘要：待付款、已提交凭证、已确认付款、付款失败或已取消。
4. 初期不新增支付页时，由后台创建/确认订单；后续再开放用户支付入口或凭证上传入口。
5. 后台确认 `payment_orders.status=confirmed` 后，申请才进入正式审核队列：会员申请可从 `submitted` 推到 `pending_review / under_review`，认证申请可从 `submitted` 推到 `under_review`。
6. 审核通过后继续复用现有会员编号、默认一年有效期、证书生成、证书下发逻辑。

建议不要让支付订单直接把申请状态改为 `approved`。付款只代表进入审核或续期/复审处理资格，不代表业务审核通过。

## Admin Payment Management Requirements

后台建议新增支付管理模块，但本轮不实现页面。

列表能力：

- 按订单号、申请编号、会员编号、证书编号、付款人、邮箱、手机号搜索。
- 按 `business_type / status / provider / payment_method / created_at / paid_at / confirmed_at` 筛选。
- 展示金额、币种、订单状态、业务类型、业务编号、付款人、关联申请/证书、最近事件。

详情能力：

- 查看订单基础信息、业务关联、付款状态、事件时间线、通知记录摘要、审计记录摘要。
- 录入线下付款信息：付款方式、凭证说明、付款时间、内部备注。
- 后台确认付款：写 `payment_events.confirmed`，更新 `payment_orders.confirmed`，触发业务状态推进。
- 取消订单：填写原因，写事件，避免继续付款。
- 标记失败/过期：初期可人工处理，后续由定时任务或网关回调处理。

权限建议：

- `viewer` 只读。
- `reviewer/admin` 可确认付款。
- `super_admin` 可取消、退款标记、修正关键金额字段。

## Notification Logs Integration

建议新增通知类型：

- `payment_order_created`
- `payment_proof_submitted`
- `payment_confirmed`
- `payment_failed`
- `payment_cancelled`
- `member_renewal_payment_confirmed`
- `certificate_review_payment_confirmed`

写入方式：

- 支付订单创建后写 `notification_logs`，`source_type=payment_order`，`source_action=created`。
- 付款凭证提交后写 `source_action=proof_submitted`。
- 后台确认付款后写 `source_action=confirmed`，同时带上 `application_no / member_no / certificate_no`。
- provider 仍保持 `none`，先保证日志链路完整；真实邮件、WhatsApp、短信后续再接。

建议 `payload_json` 至少包含 `orderNo / amount / currency / businessType / businessId / paymentStatus / provider`。

## Audit Logs Integration

支付相关后台操作必须写 `audit_logs`：

- `payment_order.create`
- `payment_order.confirm`
- `payment_order.cancel`
- `payment_order.mark_failed`
- `payment_order.mark_refunded`
- `payment_order.link_business`
- `payment_order.update_manual_payment`

审计内容建议：

- `resource_type=payment_order`。
- `resource_id=payment_orders.id`。
- `resource_no=order_no`。
- `before_data / after_data` 保存状态、金额、provider、业务关联、确认人、确认时间。
- `summary` 使用中文摘要，例如 `支付订单 ITCA-PAY-2026-XXXXXX 已确认付款。`

业务状态被支付确认推动时，建议额外写业务审计，例如：

- `member_application.payment_confirmed`
- `certification_application.payment_confirmed`
- `member_renewal.payment_confirmed`
- `certificate_review.payment_confirmed`

## .NET API and Next.js Boundary

建议边界：

- .NET API 作为长期主业务 API，负责支付订单、支付事件、后台确认、业务状态推进和审计写入。
- Next.js 负责页面渲染、表单交互、后台 UI、前台查询 UI，并通过 `lib/api/*` 优先调用 .NET API。
- Next.js Supabase fallback 可短期保留，但支付确认类写操作应尽快集中到 .NET API，避免双写逻辑分叉。
- 网关 webhook 应由 .NET API 接收，统一做签名校验、幂等处理、事件落库和订单状态推进。
- Next.js API route 可作为临时代理或 fallback，但不建议长期直接处理真实支付网关密钥。

## Not In Scope For Phase 10 Initial Rounds

- 不直接接入 Stripe、PayPal、微信、支付宝、WhatsApp Pay 或银行实时 API。
- 不实现真实邮件、WhatsApp、短信发送。
- 不做群发、重发、催缴自动任务。
- 不做退款自动原路退回。
- 不做复杂价格、税务、折扣、优惠码系统。
- 不做公开可访问的支付页面，直到订单模型和后台确认稳定。
- 不自动改写历史申请/证书数据。

## Suggested Development Order

1. 10.2：新增 SQL 草案文档或迁移草案，定义 `payment_orders / payment_events`，仍不执行数据库变更。
2. 10.3：实现 .NET 支付订单读写、事件写入、后台确认命令和审计写入。
3. 10.4：Next.js 后台支付列表与详情页，只支持 manual/none provider。
4. 10.5：新申请创建订单和后台确认后进入审核队列。
5. 10.6：会员续期订单和确认后更新会员有效期。
6. 10.7：认证/证书复审订单和确认后进入复审处理。
7. 10.8：通知记录补齐支付相关类型和后台展示。
8. 10.9：支付 webhook/provider 抽象层，接入真实支付网关前的接口稳定化。
