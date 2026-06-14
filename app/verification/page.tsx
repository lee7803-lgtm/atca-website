import Link from "next/link";
import type { Metadata } from "next";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import { InfoCard, NoticeBox, Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "查询核验｜国际道教与文化协会 ITCA"
};

const verificationEntries: Array<{
  href: string;
  icon: IconBadgeName;
  text: string;
  title: string;
}> = [
  {
    href: "/certificate-query",
    icon: "certificate",
    title: "证书公开核验",
    text: "公众可通过证书编号与持证人姓名核验证书公开登记状态；查询成功后，证书详情仍使用短期 vt 链接访问。"
  },
  {
    href: "/member-query",
    icon: "membership",
    title: "会员公开核验",
    text: "公众可通过会员编号与姓名 / 机构名称核验会员公开登记信息，只展示经规则允许的最小公开字段。"
  },
  {
    href: "/application/query",
    icon: "query",
    title: "申请进度查询",
    text: "申请人可凭申请编号与登记联系方式查询会员、机构或认证申请进度、补件提示和付款说明。"
  }
];

function VerificationIcon({ name }: { name: IconBadgeName }) {
  return (
    <IconBadge
      name={name}
      size="lg"
      className="border-gold/45 bg-[#fffaf0] text-[#7F1D1D] shadow-[0_16px_34px_rgba(176,138,69,0.13)] [&_svg]:h-8 [&_svg]:w-8 [&_svg]:[stroke-width:1.75]"
    />
  );
}

export default function VerificationPage() {
  return (
    <>
      <PageHero
        actions={[
          { href: "/certificate-query", label: "证书公开核验" },
          { href: "/member-query", label: "会员公开核验", variant: "secondary" },
          { href: "/application/query", label: "申请进度查询", variant: "secondary" }
        ]}
        atmosphere="credential"
        backgroundImageSrc="/images/atca/certificate-verification.jpg"
        backgroundImagePosition="center 50%"
        eyebrow="Verification"
        imageSrc="/images/itca/05-service-verification.png"
        intro="查询核验频道聚合证书公开核验、会员公开核验和申请进度查询，帮助公众、申请人和合作方进入对应的真实查询流程。"
        subtitle="Public Query And Verification"
        title="查询核验"
        visualDescription="公开核验只显示最小公开字段；申请进度查询需申请编号与登记联系方式。"
        visualEyebrow="Query Hub"
        visualMark="Verify"
        visualSeal="核验"
        visualTitle="查询核验"
      />

      <Section
        afterHero
        eyebrow="Entries"
        intro="请选择与事项对应的查询入口。查询表单、字段校验、公开 DTO、安全策略和 vt 访问规则不由 CMS 或页面文案修改。"
        title="核验入口"
      >
        <div className="grid min-w-0 gap-5 md:grid-cols-3">
          {verificationEntries.map((entry) => (
            <InfoCard icon={<VerificationIcon name={entry.icon} />} key={entry.href} text={entry.text} title={entry.title}>
              <Link className="inline-flex text-sm font-semibold text-[#8a6b3e] transition hover:text-[#7F1D1D]" href={entry.href}>
                进入查询
              </Link>
            </InfoCard>
          ))}
        </div>
      </Section>

      <Section eyebrow="Public Fields" title="公开字段边界" tone="soft">
        <div className="grid min-w-0 gap-5 lg:grid-cols-2">
          <NoticeBox>
            公众核验只显示最小公开字段，例如编号、公开名称、类型、状态、有效期、登记机构、核验时间和标准说明。公开结果只证明协会公开登记状态，不替代任何政府、监管机构或专业机构核查。
          </NoticeBox>
          <NoticeBox>
            查询核验页面不展示联系方式、证件资料、申请材料、付款凭证、后台审核备注、管理员信息、私有 Storage path、内部附件路径或未授权公开字段。
          </NoticeBox>
        </div>
      </Section>

      <Section eyebrow="Manual Review" title="异常与人工复核">
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-7">
            如核验结果异常、未查询到记录、信息疑似不一致或需要公开资料更正，可联系协会秘书处提交人工复核。投诉、申诉、纠错需提交必要证明材料，处理结果将按流程记录并通知申请人。
          </div>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap lg:items-start">
            <Link className="rounded-full bg-[#7F1D1D] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" href="/contact">
              联系协会
            </Link>
            <Link className="rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href="/rules">
              查看治理公开
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
