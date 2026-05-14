import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { PageHero } from "@/components/PageHero";

type SuccessPageProps = {
  searchParams?: {
    number?: string;
    type?: string;
  };
};

export default function ApplicationSuccessPage({ searchParams }: SuccessPageProps) {
  const applicationNumber = searchParams?.number?.trim() || "";
  const applicationType = searchParams?.type === "organization" ? "机构会员申请" : searchParams?.type === "certification" ? "道士资格认证申请" : "个人会员申请";
  const returnHref = searchParams?.type === "organization" ? "/organization/apply" : searchParams?.type === "certification" ? "/certification" : "/member/apply";
  const returnLabel = searchParams?.type === "certification" ? "返回认证体系" : "返回对应申请页";
  const queryLabel = searchParams?.type === "certification" ? "查询认证申请进度" : "查询申请进度";

  return (
    <>
      <PageHero
        eyebrow="Application Submitted"
        title="申请已提交"
        subtitle="Application Submitted"
        intro="您的申请资料已完成提交。申请编号可用于后续查询申请进度。"
        imageSrc="/images/atca/member-gathering.jpg"
        imagePosition="center 46%"
        visualDescription="请妥善保存申请编号，并通过申请进度查询页面查看后续审核状态。"
        visualEyebrow="Success"
        visualMark="ITCA"
        visualSeal="提交"
        visualTitle="申请已提交"
      />

      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:py-16">
        <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 text-center shadow-aureate sm:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Application Number</p>
          <h2 className="mt-4 font-serif text-3xl leading-tight text-porcelain sm:text-4xl">
            {applicationNumber ? "申请已提交" : "未找到申请编号"}
          </h2>
          <div className="mx-auto mt-8 max-w-2xl border-y border-[#e4ded0] bg-[#fbf8ef] px-5 py-7">
            <p className="text-sm text-[#666666]">{applicationType}</p>
            <p className="mt-3 break-all font-serif text-3xl text-[#7F1D1D]">
              {applicationNumber || "请返回申请页面重新提交，或联系协会秘书处确认。"}
            </p>
          </div>
          <p className="mx-auto mt-7 max-w-2xl text-sm leading-8 text-[#5f5b52]">
            {applicationNumber
              ? "请妥善保存申请编号，后续可用于查询申请进度。协会秘书处将在收到资料后进行初步审核。"
              : "当前页面缺少申请编号参数，无法展示对应申请记录。请从申请提交成功后的页面进入，或使用已保存的申请编号进行查询。"}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <CopyButton text={applicationNumber} />
            <Link className="rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" href={applicationNumber ? `/application/query?number=${applicationNumber}` : "/application/query"}>
              {queryLabel}
            </Link>
            <Link className="rounded-full border border-[#d8d0bf] bg-white px-7 py-3 text-sm font-semibold text-ink" href={returnHref}>
              {returnLabel}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
