import Link from "next/link";
import { AdminPageHeader, AdminSectionCard, AdminStatCard, AdminStatusBadge } from "@/components/admin/AdminUI";
import {
  cmsAssets,
  cmsBlockLibrary,
  cmsChannels,
  cmsContentItems,
  cmsReviewItems,
  cmsRevisions,
  formatCmsStatus,
  formatRiskLevel,
  getCmsChannel,
  type CmsPublishStatus,
  type CmsRiskLevel
} from "@/lib/v3/cms";

function statusTone(status: CmsPublishStatus): "neutral" | "success" | "danger" | "warning" {
  if (status === "published") return "success";
  if (status === "offline" || status === "archived") return "neutral";
  if (status === "legal_review") return "danger";
  return "warning";
}

function riskTone(level: CmsRiskLevel): "neutral" | "success" | "danger" | "warning" {
  if (level === "sensitive") return "danger";
  if (level === "protected") return "warning";
  return "neutral";
}

export function CmsLinkButton({ href, label }: { href: string; label: string }) {
  return (
    <Link className="rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-[#7F1D1D] hover:text-[#7F1D1D]" href={href}>
      {label}
    </Link>
  );
}

export function CmsQuickLinks() {
  const links = [
    { href: "/admin/content/channels", label: "栏目管理" },
    { href: "/admin/content/pages", label: "页面管理" },
    { href: "/admin/content/block-library", label: "版式库" },
    { href: "/admin/content/reviews", label: "审核发布" },
    { href: "/admin/content/assets", label: "媒体库" },
    { href: "/admin/content/revisions", label: "版本记录" }
  ];

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {links.map((link) => <CmsLinkButton key={link.href} {...link} />)}
    </div>
  );
}

export function CmsDashboard() {
  const reviewCount = cmsChannels.filter((item) => item.status === "review").length + cmsReviewItems.filter((item) => item.status === "review").length;
  const legalCount = cmsChannels.filter((item) => item.status === "legal_review").length + cmsReviewItems.filter((item) => item.status === "legal_review").length;
  const protectedCount = cmsChannels.filter((item) => item.protectedRoute).length;

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <AdminPageHeader actions={<CmsQuickLinks />} eyebrow="CMS V3.0" intro="内容管理 V3.0 用于管理顶部导航、频道页面、受控版式、发布审核、媒体库和版本记录；第一版使用结构化配置数据，不连接数据库。" title="内容管理工作台" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="频道栏目" note="包含顶部导航和核心频道页" value={cmsChannels.length} />
        <AdminStatCard label="核心保护入口" note="隐藏或改路径需二次确认" value={protectedCount} />
        <AdminStatCard label="待审核" note="包含频道页和内容条目" value={reviewCount} />
        <AdminStatCard label="待合规确认" note="认证、道医、数据公开等高风险内容" value={legalCount} />
      </div>
      <AdminSectionCard title="V3.0 内容治理原则">
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4">
            <h3 className="font-medium text-porcelain">受控版式</h3>
            <p className="mt-2 text-sm leading-7 text-[#5f5b52]">页面通过 Hero、卡片组、富文本、时间线、FAQ、边界说明等组件化区块配置，不开放任意 HTML。</p>
          </div>
          <div className="rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4">
            <h3 className="font-medium text-porcelain">核心入口保护</h3>
            <p className="mt-2 text-sm leading-7 text-[#5f5b52]">首页、会员、认证、查询核验、申请进度等入口可以管理说明文案，但不能被 CMS 绕开业务逻辑。</p>
          </div>
          <div className="rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4">
            <h3 className="font-medium text-porcelain">审核留痕</h3>
            <p className="mt-2 text-sm leading-7 text-[#5f5b52]">制度、认证、道医、易学、隐私、费用和数据公开内容必须进入加强审核并保留版本记录。</p>
          </div>
        </div>
      </AdminSectionCard>
      <CmsReviewBoard compact />
    </div>
  );
}

export function CmsChannelTable() {
  return (
    <AdminSectionCard title="顶部导航与频道栏目">
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#fbf8ef] text-[#5f5b52]">
            <tr>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">排序</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">显示名称</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">路径</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">风险</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">状态</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">负责人</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {cmsChannels.map((channel) => (
              <tr className="border-b border-[#eee7da] last:border-b-0" key={channel.id}>
                <td className="px-4 py-4 text-[#5f5b52]">{String(channel.sortOrder).padStart(2, "0")}</td>
                <td className="px-4 py-4">
                  <div className="font-medium text-porcelain">{channel.label}</div>
                  {channel.previousLabel ? <div className="mt-1 text-xs text-[#8a6b3e]">原显示名：{channel.previousLabel}</div> : null}
                </td>
                <td className="px-4 py-4 text-[#5f5b52]">
                  <div>{channel.path}</div>
                  {channel.alias ? <div className="mt-1 text-xs text-[#8a6b3e]">兼容路径：{channel.alias}</div> : null}
                </td>
                <td className="px-4 py-4"><AdminStatusBadge tone={riskTone(channel.riskLevel)}>{formatRiskLevel(channel.riskLevel)}</AdminStatusBadge></td>
                <td className="px-4 py-4"><AdminStatusBadge tone={statusTone(channel.status)}>{formatCmsStatus(channel.status)}</AdminStatusBadge></td>
                <td className="px-4 py-4 text-[#5f5b52]">{channel.ownerRole}</td>
                <td className="px-4 py-4">
                  <Link className="rounded-full border border-[#d8d0bf] bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-[#7F1D1D] hover:text-[#7F1D1D]" href={`/admin/content/pages/${channel.id}/edit`}>
                    编辑页面
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminSectionCard>
  );
}

export function CmsPagesTable() {
  return (
    <AdminSectionCard title="频道页面">
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[1080px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#fbf8ef] text-[#5f5b52]">
            <tr>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">页面</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">SEO 标题</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">区块</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">状态</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {cmsChannels.map((channel) => (
              <tr className="border-b border-[#eee7da] last:border-b-0" key={channel.id}>
                <td className="px-4 py-4">
                  <div className="font-medium text-porcelain">{channel.label}</div>
                  <div className="mt-1 text-xs text-[#5f5b52]">{channel.description}</div>
                </td>
                <td className="px-4 py-4 text-[#5f5b52]">{channel.seoTitle}</td>
                <td className="px-4 py-4 text-[#5f5b52]">{channel.blocks.length} 个区块</td>
                <td className="px-4 py-4"><AdminStatusBadge tone={statusTone(channel.status)}>{formatCmsStatus(channel.status)}</AdminStatusBadge></td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Link className="rounded-full border border-[#d8d0bf] bg-white px-3 py-1.5 text-xs font-semibold text-ink" href={channel.path}>前台预览</Link>
                    <Link className="rounded-full border border-[#d8d0bf] bg-white px-3 py-1.5 text-xs font-semibold text-ink" href={`/admin/content/pages/${channel.id}/edit`}>编辑</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminSectionCard>
  );
}

export function CmsContentItemsTable() {
  return (
    <AdminSectionCard title="内容库">
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#fbf8ef] text-[#5f5b52]">
            <tr>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">标题</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">类型</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">栏目</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">负责人</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">状态</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">更新</th>
            </tr>
          </thead>
          <tbody>
            {cmsContentItems.map((item) => (
              <tr className="border-b border-[#eee7da] last:border-b-0" key={item.id}>
                <td className="px-4 py-4 font-medium text-porcelain">{item.title}</td>
                <td className="px-4 py-4 text-[#5f5b52]">{item.type}</td>
                <td className="px-4 py-4 text-[#5f5b52]">{item.channel}</td>
                <td className="px-4 py-4 text-[#5f5b52]">{item.owner}</td>
                <td className="px-4 py-4"><AdminStatusBadge tone={statusTone(item.status)}>{formatCmsStatus(item.status)}</AdminStatusBadge></td>
                <td className="px-4 py-4 text-[#5f5b52]">{item.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminSectionCard>
  );
}

export function CmsEditorMock({ channelId }: { channelId: string }) {
  const channel = getCmsChannel(channelId);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        actions={
          <>
            <CmsLinkButton href="/admin/content/pages" label="返回页面管理" />
            <CmsLinkButton href={channel.path} label="前台预览" />
          </>
        }
        eyebrow="Page Editor"
        intro="页面编辑器第一版为静态可运行原型，展示区块树、页面预览、属性面板、受控版式和提交审核动作。"
        title={`编辑页面：${channel.label}`}
      />
      <div className="rounded-xl border border-[#e4ded0] bg-white/94 p-4 shadow-aureate">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <AdminStatusBadge tone={statusTone(channel.status)}>{formatCmsStatus(channel.status)}</AdminStatusBadge>
            {channel.protectedRoute ? <AdminStatusBadge tone="warning">核心入口保护</AdminStatusBadge> : null}
            <AdminStatusBadge tone={riskTone(channel.riskLevel)}>{formatRiskLevel(channel.riskLevel)}</AdminStatusBadge>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-sm font-semibold text-ink">保存草稿</button>
            <button className="rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-sm font-semibold text-ink">移动端预览</button>
            <button className="rounded-full bg-[#7F1D1D] px-4 py-2 text-sm font-semibold text-white">提交审核</button>
          </div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
        <AdminSectionCard title="区块树">
          <div className="mt-5 grid gap-2">
            {channel.blocks.map((block, index) => (
              <button className={`rounded-lg border px-3 py-2 text-left text-sm ${index === 0 ? "border-[#7F1D1D] bg-[#fbf0ec] text-[#7F1D1D]" : "border-[#e4ded0] bg-[#fbf8ef] text-[#5f5b52]"}`} key={block}>
                {index + 1}. {block}
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-2">
            <Link className="rounded-lg border border-[#d8d0bf] bg-white px-3 py-2 text-center text-sm font-semibold text-ink" href="/admin/content/block-library">添加区块</Link>
          </div>
        </AdminSectionCard>
        <AdminSectionCard title="页面预览">
          <div className="mt-5 grid gap-4">
            <div className="rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-gold">Hero</p>
              <h2 className="mt-3 font-serif text-3xl text-porcelain">{channel.label}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5f5b52]">{channel.description}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {channel.blocks.slice(1).map((block) => (
                <div className="rounded-xl border border-dashed border-[#d8d0bf] bg-white p-4" key={block}>
                  <h3 className="font-medium text-porcelain">{block}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#5f5b52]">后台配置标题、摘要、卡片、链接、图片和显示规则。</p>
                </div>
              ))}
            </div>
          </div>
        </AdminSectionCard>
        <AdminSectionCard title="属性面板">
          <div className="mt-5 grid gap-4 text-sm">
            <label className="grid gap-2">
              <span className="font-medium text-porcelain">页面标题</span>
              <input className="rounded-lg border border-[#d8d0bf] bg-white px-3 py-2" defaultValue={channel.label} />
            </label>
            <label className="grid gap-2">
              <span className="font-medium text-porcelain">SEO 标题</span>
              <input className="rounded-lg border border-[#d8d0bf] bg-white px-3 py-2" defaultValue={channel.seoTitle} />
            </label>
            <label className="grid gap-2">
              <span className="font-medium text-porcelain">页面简介</span>
              <textarea className="min-h-28 rounded-lg border border-[#d8d0bf] bg-white px-3 py-2" defaultValue={channel.description} />
            </label>
            <div className="rounded-xl border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-4 leading-7 text-[#5f5b52]">
              查询核验、申请表单、支付确认、证书 vt、公开 DTO 和 Storage 隐私边界不允许通过 CMS 属性面板修改。
            </div>
          </div>
        </AdminSectionCard>
      </div>
    </div>
  );
}

export function CmsBlockLibrary() {
  return (
    <div className="grid gap-6">
      <AdminPageHeader actions={<CmsQuickLinks />} eyebrow="Block Library" intro="版式库采用受控区块，避免自由拖拽破坏前台视觉、移动端适配和合规边界。" title="版式库" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cmsBlockLibrary.map((block) => (
          <article className="rounded-xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate" key={block.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-gold">{block.category}</p>
                <h2 className="mt-2 font-serif text-2xl text-porcelain">{block.name}</h2>
              </div>
              {block.reviewRequired ? <AdminStatusBadge tone="danger">需审核</AdminStatusBadge> : <AdminStatusBadge>普通</AdminStatusBadge>}
            </div>
            <p className="mt-4 text-sm leading-7 text-[#5f5b52]">{block.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function CmsReviewBoard({ compact = false }: { compact?: boolean }) {
  return (
    <AdminSectionCard title={compact ? "待处理审核" : "审核发布队列"}>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[900px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#fbf8ef] text-[#5f5b52]">
            <tr>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">内容</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">类型</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">风险</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">状态</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">处理人</th>
            </tr>
          </thead>
          <tbody>
            {cmsReviewItems.map((item) => (
              <tr className="border-b border-[#eee7da] last:border-b-0" key={item.id}>
                <td className="px-4 py-4 font-medium text-porcelain">{item.title}</td>
                <td className="px-4 py-4 text-[#5f5b52]">{item.type}</td>
                <td className="px-4 py-4 text-[#5f5b52]">{item.risk}</td>
                <td className="px-4 py-4"><AdminStatusBadge tone={statusTone(item.status)}>{formatCmsStatus(item.status)}</AdminStatusBadge></td>
                <td className="px-4 py-4 text-[#5f5b52]">{item.assignee}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminSectionCard>
  );
}

export function CmsAssetsGrid() {
  return (
    <div className="grid gap-6">
      <AdminPageHeader actions={<CmsQuickLinks />} eyebrow="Assets" intro="媒体库只管理可公开使用的图片、PDF 和附件；申请材料、证件和私有 Storage path 不进入公开媒体库。" title="媒体库" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cmsAssets.map((asset) => (
          <article className="rounded-xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate" key={asset.id}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="break-all font-serif text-2xl text-porcelain">{asset.name}</h2>
              <AdminStatusBadge tone={asset.status === "可用" ? "success" : "warning"}>{asset.status}</AdminStatusBadge>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#5f5b52]">Alt：{asset.alt}</p>
            <p className="mt-3 text-sm leading-7 text-[#5f5b52]">授权：{asset.licenseNote}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function CmsRevisionTable() {
  return (
    <AdminSectionCard title="版本与审计记录">
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[900px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#fbf8ef] text-[#5f5b52]">
            <tr>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">时间</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">对象</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">动作</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">操作者</th>
              <th className="border-b border-[#e4ded0] px-4 py-3 font-medium">说明</th>
            </tr>
          </thead>
          <tbody>
            {cmsRevisions.map((revision) => (
              <tr className="border-b border-[#eee7da] last:border-b-0" key={revision.id}>
                <td className="px-4 py-4 text-[#5f5b52]">{revision.time}</td>
                <td className="px-4 py-4 font-medium text-porcelain">{revision.target}</td>
                <td className="px-4 py-4 text-[#5f5b52]">{revision.action}</td>
                <td className="px-4 py-4 text-[#5f5b52]">{revision.actor}</td>
                <td className="px-4 py-4 text-[#5f5b52]">{revision.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminSectionCard>
  );
}
