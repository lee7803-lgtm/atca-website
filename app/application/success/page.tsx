import Link from "next/link";
import { PageHero } from "@/components/PageHero";

type SuccessPageProps = {
  searchParams?: {
    number?: string;
    type?: string;
  };
};

export default function ApplicationSuccessPage({ searchParams }: SuccessPageProps) {
  const applicationNumber = searchParams?.number || "ATCA-M-20260510-0001";
  const applicationType = searchParams?.type === "organization" ? "机构会员申请" : "个人会员申请";

  return (
    <>
      <PageHero
        eyebrow="Application Submitted"
        title="申请已提交成功"
        subtitle="Application Submitted"
        intro="您的申请资料已完成前台提交。本阶段为 MVP 静态流程，申请编号用于后续接入数据库与审核流程时关联申请记录。"
        imageSrc="/images/atca/member-gathering.jpg"
        imagePosition="center 46%"
        visualDescription="请妥善保存申请编号，并通过申请进度查询页面查看后续审核状态。"
        visualEyebrow="Success"
        visualMark="ATCA"
        visualSeal="提交"
        visualTitle="申请提交成功"
      />

      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:py-16">
        <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 text-center shadow-aureate sm:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Application Number</p>
          <h2 className="mt-4 font-serif text-3xl leading-tight text-porcelain sm:text-4xl">申请已提交成功</h2>
          <div className="mx-auto mt-8 max-w-2xl border-y border-[#e4ded0] bg-[#fbf8ef] px-5 py-7">
            <p className="text-sm text-[#666666]">{applicationType}</p>
            <p className="mt-3 break-all font-serif text-3xl text-[#7F1D1D]">{applicationNumber}</p>
          </div>
          <p className="mx-auto mt-7 max-w-2xl text-sm leading-8 text-[#5f5b52]">
            请妥善保存申请编号。后续可通过申请进度查询页面查看审核状态；正式审核记录将在下一阶段接入数据库后保存。
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link className="rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" href={`/application/query?number=${applicationNumber}`}>
              查看申请进度
            </Link>
            <Link className="rounded-full border border-[#d8d0bf] bg-white px-7 py-3 text-sm font-semibold text-ink" href="/membership">
              返回会员申请
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
