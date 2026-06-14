import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { IconBadge } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import { NoticeBox, Section } from "@/components/Section";
import type { V2Action, V2Card, V2PageData, V2Section, V2StructuredItem } from "@/lib/v2/content";

function V2Actions({ actions }: { actions: V2Action[] }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
      {actions.map((action, index) => {
        const isPrimary = action.variant ? action.variant === "primary" : index === 0;
        const className = isPrimary
          ? "max-w-full rounded-full bg-[#7F1D1D] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]"
          : "max-w-full rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink transition hover:border-[#7F1D1D] hover:text-[#7F1D1D]";

        return (
          <Link className={className} href={action.href} key={`${action.href}-${action.label}`}>
            {action.label}
          </Link>
        );
      })}
    </div>
  );
}

function V2Icon({ item }: { item: V2Card }) {
  if (!item.icon) return undefined;

  return (
    <IconBadge
      name={item.icon}
      size="lg"
      className="border-gold/45 bg-[#fffaf0] text-[#7F1D1D] shadow-[0_16px_34px_rgba(176,138,69,0.13)] [&_svg]:h-8 [&_svg]:w-8 [&_svg]:[stroke-width:1.75]"
    />
  );
}

function V2CardBody({ item }: { item: V2Card }) {
  return (
    <>
      {item.href ? (
        <Link className="inline-flex text-sm font-semibold text-[#8a6b3e] transition hover:text-[#7F1D1D]" href={item.href}>
          进入栏目
        </Link>
      ) : null}
    </>
  );
}

function V2Cards({ cards }: { cards: V2Card[] }) {
  return (
    <div className="grid min-w-0 gap-4">
      {cards.map((item, index) => (
        <article className="grid min-w-0 gap-4 rounded-2xl border border-[#e4ded0] bg-white/92 p-5 shadow-[0_12px_30px_rgba(31,42,40,0.04)] md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center" key={`${item.title}-${index}`}>
          <div className="flex min-w-0 items-center gap-3">
            {V2Icon({ item }) ?? <p className="font-serif text-3xl text-gold/70">0{index + 1}</p>}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-medium text-porcelain">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-[#666666]">{item.text}</p>
            {item.labels?.length ? (
              <div className="mt-3 flex min-w-0 flex-wrap gap-2">
                {item.labels.map((label) => (
                  <span className="max-w-full break-words rounded-full border border-[#e4ded0] bg-[#f8f7f3] px-3 py-1.5 text-xs font-medium text-[#66594d]" key={label}>
                    {label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="min-w-0 md:justify-self-end">
            <V2CardBody item={item} />
          </div>
        </article>
      ))}
    </div>
  );
}

function V2PageSection({ section, index }: { index: number; section: V2Section }) {
  return (
    <Section
      afterHero={section.afterHero ?? index === 0}
      eyebrow={section.eyebrow}
      intro={section.intro}
      title={section.title}
      tone={section.tone}
    >
      <div className="grid min-w-0 gap-7">
        {section.cards ? <V2Cards cards={section.cards} /> : null}
        {section.notice ? <NoticeBox>{section.notice}</NoticeBox> : null}
        {section.actions ? <V2Actions actions={section.actions} /> : null}
      </div>
    </Section>
  );
}

export function V2BoundaryNotice({ text, title }: { text: string; title: string }) {
  return (
    <article className="min-w-0 overflow-hidden border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-7">
      <h3 className="font-serif text-2xl text-porcelain">{title}</h3>
      <p className="mt-4">{text}</p>
    </article>
  );
}

function deriveStructuredItems(page: V2PageData, type: "featured" | "subChannel" | "resource") {
  const cards = page.sections.flatMap((section) => section.cards ?? []);
  const source = type === "featured" ? cards.slice(0, 3) : cards.filter((card) => card.href).slice(0, 6);

  return source.map((item) => ({
    href: item.href,
    meta: item.labels?.slice(0, 2).join(" / ") || page.title,
    status: type === "resource" ? "待公开" : "已发布",
    text: item.text,
    title: item.title,
    updatedAt: "以公开更新为准"
  }));
}

function ChannelPosition({ page }: { page: V2PageData }) {
  const items = [
    {
      title: "频道定位",
      text: page.intro,
      meta: "栏目范围"
    },
    {
      title: "服务对象",
      text: "面向公众、会员、申请人、合作机构、文化学习者和研究者，提供清晰的信息入口与业务分流。",
      meta: "服务对象"
    },
    {
      title: "业务关系",
      text: "与申请、审核、查询核验、资料公开、公告资讯和合作联系共同构成官网服务路径。",
      meta: "业务关系"
    }
  ];

  return (
    <Section afterHero eyebrow="Channel Home" title={`${page.title}栏目首页`} intro="本栏目汇集频道说明、重点内容、最新更新、相关服务和公开资料，帮助访客快速理解栏目范围与办理路径。">
      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        {items.map((item) => (
          <article className="min-w-0 rounded-2xl border border-[#e4ded0] bg-white/92 p-5 shadow-aureate" key={item.title}>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">{item.meta}</p>
            <h2 className="mt-3 font-serif text-2xl text-porcelain">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[#5f5b52]">{item.text}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function StructuredList({ emptyText, items, title }: { emptyText: string; items: V2StructuredItem[]; title: string }) {
  if (!items.length) {
    return <EmptyState title={title} text={emptyText} />;
  }

  return (
    <div className="grid min-w-0 gap-3">
      {items.map((item, index) => {
        const content = (
          <article className="grid min-w-0 gap-3 rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-[0_10px_24px_rgba(31,42,40,0.035)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#ead7a5] bg-[#fff8df] px-3 py-1 text-xs font-semibold text-[#8a6b3e]">{item.badge || `0${index + 1}`}</span>
                {item.status ? <span className="rounded-full border border-[#d8d0bf] bg-[#fbf8ef] px-3 py-1 text-xs text-[#66594d]">{item.status}</span> : null}
                {item.updatedAt ? <span className="text-xs text-[#8a8175]">{item.updatedAt}</span> : null}
              </div>
              <h3 className="mt-3 text-lg font-medium text-porcelain">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[#5f5b52]">{item.text}</p>
              {item.meta ? <p className="mt-2 text-xs leading-6 text-[#8a8175]">{item.meta}</p> : null}
            </div>
            {item.href ? <span className="text-sm font-semibold text-[#8a6b3e]">查看</span> : null}
          </article>
        );

        return item.href ? (
          <Link href={item.href} key={`${item.title}-${index}`}>
            {content}
          </Link>
        ) : (
          <div key={`${item.title}-${index}`}>{content}</div>
        );
      })}
    </div>
  );
}

function EmptyState({ text, title }: { text: string; title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d8d0bf] bg-[#fbf8ef] p-6 text-sm leading-7 text-[#5f5b52]">
      <p className="font-serif text-2xl text-porcelain">{title}</p>
      <p className="mt-3">{text}</p>
    </div>
  );
}

function OperationalSections({ page }: { page: V2PageData }) {
  const featuredItems = page.featuredItems ?? deriveStructuredItems(page, "featured");
  const latestItems = page.latestItems ?? [];
  const subChannelItems = page.subChannelItems ?? deriveStructuredItems(page, "subChannel");
  const resourceItems = page.resourceItems ?? deriveStructuredItems(page, "resource");
  const businessEntries = page.businessEntries ?? page.actions ?? [];
  const emptyStates = page.emptyStates ?? ["暂无最新公开内容。协会将按实际发布节奏更新。", "暂无公开项目 / 活动 / 资料入库。经审核允许公开的内容将按栏目更新。"];

  return (
    <>
      {page.title.includes("发展中心") ? <CenterOperation page={page} /> : null}

      <Section eyebrow="Featured" title="重点内容" intro="集中展示本栏目优先推荐的公告、专题、重要文件或服务信息。" tone="soft">
        <StructuredList emptyText={emptyStates[0]} items={featuredItems} title="暂无推荐内容" />
      </Section>

      <Section eyebrow="Updates" title="最新内容" intro="展示本栏目后续发布的公告、文章、活动、资料或文件记录。">
        <StructuredList emptyText={emptyStates[0]} items={latestItems} title="暂无最新内容" />
      </Section>

      {subChannelItems.length ? (
        <Section eyebrow="Sub Channels" title="子栏目与内容承接" intro="各子栏目说明内容范围、服务关系和进一步阅读路径。" tone="soft">
          <StructuredList emptyText={emptyStates[1]} items={subChannelItems} title="暂无子栏目内容" />
        </Section>
      ) : null}

      <Section eyebrow="Services" title="业务入口" intro="仅保留与本频道强相关的业务路径，避免全站入口重复堆叠。">
        {businessEntries.length ? <V2Actions actions={businessEntries} /> : <EmptyState title="暂无业务入口" text="本频道暂无可直接办理的前台业务入口。" />}
      </Section>

      <Section eyebrow="Resources" title="资料 / 文件 / 活动列表" intro="展示经审核允许公开的资料、文件、活动记录和相关说明。" tone="soft">
        <StructuredList emptyText={emptyStates[1]} items={resourceItems} title="暂无资料入库" />
      </Section>
    </>
  );
}

function CenterOperation({ page }: { page: V2PageData }) {
  const rows = [
    ["中心定位", page.intro, "已定义"],
    ["服务对象", "会员、学习者、合作机构、研究者、课程团队和文化空间。", "公开说明"],
    ["当前重点项目", "暂无公开项目。后续经确认后公布项目名称、合作方向、阶段和成果。", "空状态"],
    ["最新活动", "暂无最新活动。讲座、研修、访问、论坛、展览和文化交流活动审核后发布。", "空状态"],
    ["合作方向", "入驻、合作、项目发布和资料沉淀需通过秘书处确认，重要合作进入审核和归档。", "可申请"],
    ["资料列表", "暂无资料入库。经审核允许公开的资料将按栏目展示。", "空状态"]
  ];

  return (
    <Section eyebrow="Center Operations" title="中心运营结构" intro={`${page.title}按中心首页方式组织，明确服务对象、当前项目、活动、资料沉淀和合作路径。`}>
      <div className="grid min-w-0 gap-3">
        {rows.map(([title, text, status], index) => (
          <article className="grid min-w-0 gap-3 rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-[0_10px_24px_rgba(31,42,40,0.035)] md:grid-cols-[10rem_minmax(0,1fr)_8rem] md:items-center" key={title}>
            <div>
              <p className="text-xs tracking-[0.22em] text-gold">0{index + 1}</p>
              <h3 className="mt-2 text-base font-semibold text-porcelain">{title}</h3>
            </div>
            <p className="text-sm leading-7 text-[#5f5b52]">{text}</p>
            <span className="rounded-full border border-[#d8d0bf] bg-[#fbf8ef] px-3 py-1 text-center text-xs font-semibold text-[#66594d]">{status}</span>
          </article>
        ))}
      </div>
    </Section>
  );
}

export function V2InfoPage({ page }: { page: V2PageData }) {
  const breadcrumbItems = page.title.includes("治理公开")
    ? [{ href: "/intro", label: "关于协会" }, { label: "治理公开" }]
    : [{ label: page.title }];

  return (
    <>
      <PageHero
        actions={page.actions}
        atmosphere={page.atmosphere}
        backgroundImagePosition={page.backgroundImagePosition}
        backgroundImageSrc={page.backgroundImageSrc}
        eyebrow={page.eyebrow}
        imagePosition={page.imagePosition}
        imageSrc={page.imageSrc}
        intro={page.intro}
        subtitle={page.subtitle}
        title={page.title}
        visualDescription={page.visualDescription}
        visualEyebrow={page.visualEyebrow}
        visualMark={page.visualMark}
        visualSeal={page.visualSeal}
        visualTitle={page.visualTitle}
      />

      <Breadcrumbs items={breadcrumbItems} />

      <ChannelPosition page={page} />

      {page.sections.map((section, index) => (
        <V2PageSection index={index} key={`${section.title}-${index}`} section={section} />
      ))}

      <OperationalSections page={page} />

      {page.boundaryNotices?.length ? (
        <Section eyebrow="Boundary" title="边界说明" tone="soft">
          <div className="grid min-w-0 gap-5 lg:grid-cols-2">
            {page.boundaryNotices.map((notice) => (
              <V2BoundaryNotice key={notice.title} {...notice} />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
