import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import { InfoCard } from "@/components/Section";

export const metadata: Metadata = {
  title: "联系合作｜国际道教与文化协会 ITCA"
};

const categories: Array<{ title: string; text: string; icon: IconBadgeName }> = [
  { title: "认证咨询", text: "用于了解道士资格认证的申请条件、材料要求、审核流程与证书核验事项。", icon: "certification" },
  { title: "会员申请", text: "用于了解个人会员、机构会员申请范围、申请资料、审核流程与后续沟通事项。", icon: "membership" },
  { title: "机构合作", text: "面向宫观道堂、文化机构、传统文化组织及相关合作方，沟通合作方向与资料对接。", icon: "institution" },
  { title: "文化交流", text: "用于联系道教文化、传统文化、经典学习、活动交流及道教文化国际交流相关事项。", icon: "international" },
  { title: "网站信息更正", text: "用于反馈官网内容、名称表述、资料展示、证书信息或页面内容中的更正需求。", icon: "certificate" }
];

const consultationItems = ["认证咨询", "会员申请", "机构合作", "文化交流", "网站信息更正"];

function ContactSection({ eyebrow, title, intro, children, compact = false }: { eyebrow?: string; title: string; intro?: string; children: ReactNode; compact?: boolean }) {
  return (
    <section>
      <div className={`mx-auto max-w-7xl px-5 sm:px-8 ${compact ? "py-12 lg:py-16" : "py-14 lg:py-20"}`}>
        <div className="mb-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            {eyebrow ? <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-gold sm:text-sm">{eyebrow}</p> : null}
            <h2 className="font-serif text-3xl leading-tight text-porcelain sm:text-4xl lg:text-[2.65rem]">{title}</h2>
          </div>
          {intro ? <p className="max-w-2xl text-sm leading-8 text-[#666666] lg:justify-self-end">{intro}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function ContactIcon({ name }: { name: IconBadgeName }) {
  return (
    <IconBadge
      name={name}
      size="lg"
      className="border-gold/45 bg-[#fffaf0] text-[#7F1D1D] shadow-[0_16px_34px_rgba(176,138,69,0.13)] [&_svg]:h-8 [&_svg]:w-8 [&_svg]:[stroke-width:1.75]"
    />
  );
}

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="联系 ITCA"
        subtitle="Contact And Cooperation"
        intro="如需了解协会事务、会员申请、道士资格认证、证书核验、机构合作或网站信息更正，可通过本页面了解联系方向。正式联系方式以后续协会公布信息为准。"
        imageSrc="/images/atca/cooperation-cultural-exchange.jpg"
        imagePosition="center 48%"
        visualDescription="以稳健、克制的协会视觉承接合作沟通场景，保持文化厚度与公共机构感。"
        visualEyebrow="Cultural Exchange"
        visualMark="Culture"
        visualSeal="合作交流"
        visualTitle="国际文化交流与合作"
      />

      <ContactSection eyebrow="Contact Category" title="联系方向">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((item, index) => (
            <InfoCard icon={<ContactIcon name={item.icon} />} index={`0${index + 1}`} key={item.title} text={item.text} title={item.title} />
          ))}
        </div>
      </ContactSection>

      <ContactSection title="联系须知" compact>
        <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-2xl border border-[#d8d0bf] bg-white/92 p-6 shadow-aureate sm:p-8">
            <div className="mb-5 flex items-center gap-4">
              <ContactIcon name="contact" />
              <div>
                <p className="text-sm leading-6 text-[#666666]">
                  如需提交咨询事项，请通过协会公布的正式联系方式与秘书处联系。
                </p>
              </div>
            </div>
            <h3 className="mb-3 text-sm font-medium text-porcelain">咨询事项</h3>
            <div className="flex flex-wrap gap-2">
              {consultationItems.map((item) => (
                <span className="rounded-full border border-[#e4ded0] bg-[#f8f7f3] px-3 py-1.5 text-sm font-medium text-[#66594d]" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gold/35 bg-[#fbf8ef] p-6 shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-8">
            <div className="mb-5 flex items-center gap-4">
              <ContactIcon name="cooperation" />
              <div>
                <h2 className="text-xl font-medium text-porcelain">联系方式说明</h2>
              </div>
            </div>
            <div className="grid gap-3 text-sm leading-7 text-[#5f5b52]">
              <p>协会正式联系方式尚未公开，官网不会展示未经确认的电话、邮箱或地址。后续以协会秘书处公布信息为准。</p>
            </div>
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link className="inline-flex rounded-full bg-[#7F1D1D] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" href="/membership">
            查看会员申请
          </Link>
          <Link className="inline-flex rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-sm font-semibold text-ink" href="/">
            返回首页
          </Link>
        </div>
      </ContactSection>
    </>
  );
}
