"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { IconBadge } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { queryPublicMember } from "@/lib/api/members";
import type { MemberQueryResult } from "@/types/member";

export default function MemberQueryPage() {
  const [memberNo, setMemberNo] = useState("");
  const [holderName, setHolderName] = useState("");
  const [member, setMember] = useState<MemberQueryResult | null>(null);
  const [message, setMessage] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const memberNoParam = params.get("memberNo");
    const holderNameParam = params.get("holderName");
    if (memberNoParam) setMemberNo(memberNoParam);
    if (holderNameParam) setHolderName(holderNameParam);
  }, []);

  const submitQuery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isQuerying) return;

    if (isApplicationNo(memberNo)) {
      setMember(null);
      setMessage("请使用正式会员编号进行公开核验；申请编号请前往申请进度查询。");
      return;
    }

    setIsQuerying(true);
    setMessage("");
    setMember(null);

    try {
      const { response, result } = await queryPublicMember(memberNo, holderName);

      if (!response.ok || !result.success) {
        if (response.status === 400) {
          setMessage("请填写完整的会员编号和姓名 / 机构名称。");
        } else if (response.status === 404) {
          setMessage(
            isApplicationNo(memberNo)
              ? "请使用正式会员编号进行公开核验；申请编号请前往申请进度查询。"
              : "未查询到匹配会员记录。请确认会员编号和姓名 / 机构名称是否准确。"
          );
        } else {
          setMessage("会员核验服务暂时不可用，请稍后重试或联系协会秘书处。");
        }
        return;
      }

      setMember(result.member);
    } catch {
      setMessage("会员核验服务暂时不可用，请稍后重试或联系协会秘书处。");
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <>
      <PageHero
        actions={[
          { label: "会员公开核验", href: "/member-query" },
          { label: "会员申请", href: "/membership" },
          { label: "查询核验", href: "/verification" }
        ]}
        eyebrow="Member Verification"
        title="会员公开核验"
        subtitle="Public Member Verification"
        intro="会员公开核验供公众、合作方及第三方机构核验 ITCA / 国际道教与文化协会会员登记信息。"
        backgroundImageSrc="/images/atca/member-gathering.jpg"
        backgroundImagePosition="center 48%"
        imageSrc="/images/itca/04-service-membership.png"
        imagePosition="center 46%"
        visualDescription="请输入会员编号与姓名或机构名称，核验会员公开登记信息。"
        visualEyebrow="Member Verify"
        visualMark="Member"
        visualSeal="核验"
        visualTitle="会员公开核验"
      />

      <Section eyebrow="Query" title="会员公开核验" afterHero>
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <form className="rounded-2xl border border-[#d8d0bf] bg-white/92 p-6 shadow-aureate sm:p-8" onSubmit={submitQuery}>
            <div className="mb-6 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
              <p className="mb-3">请输入会员编号与姓名 / 机构名称，用于核验公开会员登记信息。核验结果不展示联系电话、邮箱、地址、申请说明、补充资料、审核备注或上传材料。</p>
              <p>如需查询申请办理进度，请前往申请进度查询页面。</p>
              <Link className="mt-3 inline-flex w-full rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink sm:w-auto" href="/application/query">
                前往申请进度查询
              </Link>
            </div>
            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-porcelain">会员编号</span>
                <input className="form-input" placeholder="例如 ITCA-M-2026-000001" required value={memberNo} onChange={(event) => setMemberNo(event.target.value)} />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-porcelain">姓名 / 机构名称</span>
                <input className="form-input" required value={holderName} onChange={(event) => setHolderName(event.target.value)} />
              </label>
            </div>
            {message ? <div className="mt-6 border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-4 text-sm leading-7 text-[#7F1D1D]" role="alert">{message}</div> : null}
            <button className="mt-7 w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60" disabled={isQuerying} type="submit">
              {isQuerying ? "正在核验..." : "核验会员公开记录"}
            </button>
          </form>

          <div className="rounded-2xl border border-[#e4ded0] bg-[#f8f7f3] p-6 shadow-aureate sm:p-8">
            <IconBadge name="membership" />
            <h2 className="mt-4 font-serif text-2xl text-porcelain">核验结果</h2>
            {member ? (
              <div className="mt-6 grid gap-3">
                <ResultRow label="会员编号" value={member.memberNo} />
                <ResultRow label="姓名 / 机构名称" value={member.holderName} />
                <ResultRow label="会员类型" value={member.memberType} />
                <ResultRow label="有效期开始" value={formatMemberDate(member.memberValidFrom)} />
                <ResultRow label="有效期截止" value={formatMemberDate(member.memberValidUntil)} />
                <ResultRow label="当前状态" value={member.effectiveStatusLabel || member.statusLabel} />
                <ResultRow label="登记机构" value={member.issuer} />
                <ResultRow label="登记日期" value={formatDate(member.registeredAt)} />
                {member.approvedAt ? <ResultRow label="通过日期" value={formatDate(member.approvedAt)} /> : null}
                <ResultRow label="公开核验说明" value={member.verificationNote} />
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-[#666666]">请输入会员编号与姓名 / 机构名称后查询。若查询不到记录，请确认信息是否与会员登记信息一致，或联系 ITCA / 国际道教与文化协会进行核对。</p>
            )}
          </div>
        </div>
      </Section>

      <Section title="会员核验说明" tone="soft">
        <div className="border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-7">
          本页面仅展示会员公开核验信息。会员申请资料、联系方式、补充材料、审核备注及其他申请人资料不在公开核验页面显示。
        </div>
      </Section>
    </>
  );
}

function isApplicationNo(value: string) {
  return /^ARID-ITCA-(M|ORG)-\d{4}-[A-Z0-9]{6}$/i.test(value.trim());
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 rounded-xl border border-[#e4ded0] bg-white px-4 py-3 sm:grid-cols-[9rem_1fr]">
      <p className="text-sm font-medium text-porcelain">{label}</p>
      <p className="break-words text-sm leading-6 text-[#666666]">{value || "未记录"}</p>
    </div>
  );
}

function formatDate(value: string) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function formatMemberDate(value?: string | null) {
  if (!value) return "有效期未设置";
  return formatDate(value);
}
