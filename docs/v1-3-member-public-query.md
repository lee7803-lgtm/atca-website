# V1.3 会员公开核验

## 功能定位

会员公开核验用于公众、合作方及第三方机构核验 ITCA / 国际道教与文化协会会员登记信息。

本功能属于公开查询能力，只展示会员登记核验所需的最小字段，不展示申请资料、联系方式、审核备注、补充材料或后台内部字段。

## 查询方式

前台页面：

- `/member-query`

查询字段：

- 会员编号
- 姓名 / 机构名称

.NET API：

- `GET /api/members/query?memberNo={memberNo}&holderName={holderName}`

参数要求：

- `memberNo` 必填。
- `holderName` 必填，可为个人姓名或机构名称。

## 当前阶段字段映射

当前 `applications` 表尚未设置独立的正式会员编号字段。

V1.3 第二阶段暂使用：

- API 参数 `memberNo`
- 数据库字段 `applications.application_no`

代码对外仍使用 `MemberNo` / `memberNo` 命名，便于后续会员编号规则完成后切换到正式 `member_no` 或 `membership_no` 字段。

本阶段不重构编号规则，不修改数据库结构，不新增 SQL。

## 查询范围

会员公开核验只查询 `applications` 表中的会员申请记录：

- `application_type = personal_member`
- `application_type = organization_member`

不查询认证申请表，不查询证书表，不查询 Storage。

## 公开字段

API 只返回以下公开核验 DTO 字段：

- `memberNo`
- `holderName`
- `memberType`
- `status`
- `statusLabel`
- `registeredAt`
- `approvedAt`
- `issuer`
- `verificationNote`

前台展示字段：

- 会员编号
- 姓名 / 机构名称
- 会员类型
- 会员状态
- 登记机构
- 登记日期
- 通过日期，如当前记录可判断
- 公开核验说明

## 隐私隔离字段

公开核验 API 不返回以下字段：

- 数据库内部 `id`
- `application_id`
- 联系电话
- 邮箱
- 地址
- 国家或地区
- 个人补充备注或机构介绍
- 申请理由或合作意向
- 后台审核备注
- 补充资料记录
- 上传材料
- Supabase Storage path
- 推荐人信息
- 付款信息
- 其他申请人资料

后端查询语句只选择公开核验需要的字段，避免先读取后台详情再裁剪。

## 状态映射

当前公开状态文案：

- `submitted`：待审核
- `pending_review`：审核中
- `under_review`：审核中
- `need_more_info`：需补充资料
- `approved`：有效
- `rejected`：已驳回
- `archived`：已终止

`approvedAt` 当前阶段在 `status = approved` 时使用记录更新时间表示通过日期。后续如增加正式审核通过时间字段，应切换为该字段。

## 后续会员编号衔接

后续 V1.3 编号规则重构时，可将查询映射从：

- `applications.application_no`

切换为：

- `applications.member_no`
- 或 `applications.membership_no`
- 或独立会员档案表中的正式会员编号字段

前端页面和 API 参数可保持 `memberNo` 不变。

## 数据中台预留关系

本阶段不做数据中台实时对接。

后续如接入数据中台，可由中台提供正式会员状态、有效期、终止日期、会员类别及公开核验权限。官网公开核验 API 应继续只返回公开 DTO，不直接暴露中台原始记录或内部字段。

## .NET API 边界

`GET /api/members/query` 行为：

- 缺少 `memberNo` 或 `holderName` 返回 400。
- 未匹配到会员记录返回 404。
- 数据库配置、连接或服务异常返回 503。
- 不返回连接串、host、username、password、SQL、堆栈或异常细节。
- 不返回任何隐私字段。

当前实现不修改：

- 数据库结构
- SQL 迁移
- 认证申请
- Storage
- 补充资料
- 证书生成
- 发证下发
- 支付
- 用户系统
- PDF
- 编号规则
