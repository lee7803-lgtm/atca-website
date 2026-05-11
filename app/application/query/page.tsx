"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Suspense } from "react";
import { PageHero } from "@/components/PageHero";

export default function ApplicationQueryPage() {
  return (
    <Suspense fallback={<QueryPageFallback />}>
      <ApplicationQueryContent />
    </Suspense>
  );
}

function ApplicationQueryContent() {
  const searchParams = useSearchParams();
  const [applicationNumber, setApplicationNumber] = useState(searchParams.get("number") || "");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitQuery = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: Replace the static preview with a request to an application query API after Supabase is connected.
    setSubmitted(true);
  };

  return (
    <>
      <PageHero
        eyebrow="Application Query"
        title="申请进度查询"
        subtitle="Application Status Query"
        intro="用于申请人通过申请编号与邮箱查询审核进度。本阶段暂不接数据库，提交后展示静态示例结果区域，便于后续接入真实记录。"
        imageSrc="/images/atca/certificate-verification.jpg"
        imagePosition="center 58%"
        visualDescription="请输入申请编号与邮箱，后续将用于匹配申请记录和审核状态。"
        visualEyebrow="Query"
        visualMark="Status"
        visualSeal="查询"
        visualTitle="申请进度查询"
      />

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
        <section className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <form className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8" onSubmit={submitQuery}>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Query Form</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-porcelain">查询申请记录</h2>
            <div className="mt-7 grid gap-5">
              <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
                <span className="text-sm font-medium text-porcelain">申请编号 <span className="text-[#7F1D1D]">*</span></span>
                <input className="form-input" required value={applicationNumber} onChange={(event) => setApplicationNumber(event.target.value)} />
              </label>
              <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
                <span className="text-sm font-medium text-porcelain">邮箱 <span className="text-[#7F1D1D]">*</span></span>
                <input className="form-input" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
            </div>
            <button className="mt-7 w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" type="submit">
              查询申请进度
            </button>
          </form>

          <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-6 shadow-aureate sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Status Preview</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-porcelain">示例查询结果</h2>
            {submitted ? (
              <div className="mt-7 grid gap-4">
                <StatusRow label="申请编号" value={applicationNumber} />
                <StatusRow label="登记邮箱" value={email} />
                <StatusRow label="当前状态" value="资料已收到，待秘书处初审" />
                <StatusRow label="下一步" value="协会秘书处将核对基础资料，并在需要补充材料时通过邮箱或 WhatsApp 联系申请人。" />
              </div>
            ) : (
              <p className="mt-7 text-sm leading-8 text-[#5f5b52]">
                填写申请编号与邮箱后，此区域将展示静态示例进度。下一阶段将通过查询接口匹配 Supabase 中的真实申请记录、审核节点和补充材料提示。
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function QueryPageFallback() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="rounded-2xl border border-[#e4ded0] bg-white/94 p-8 text-sm text-[#5f5b52] shadow-aureate">
        正在载入申请进度查询...
      </div>
    </main>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#e4ded0] pb-4 last:border-b-0">
      <p className="text-xs tracking-[0.22em] text-[#8a6b3e]">{label}</p>
      <p className="mt-2 text-sm leading-7 text-porcelain">{value}</p>
    </div>
  );
}
