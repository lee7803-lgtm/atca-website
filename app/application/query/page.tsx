"use client";

import { useSearchParams } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { Suspense, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { queryApplicationProgress } from "@/lib/api/applications";
import { maskApplicationNo, maskName } from "@/lib/masking";
import { formatQueryStatus } from "@/lib/status-labels";
import { certificationPathLabels } from "@/types/certification";
import type { ApplicationQueryResponse, ApplicationQueryResult } from "@/types/application";

const contactEmail = "aseantaoist@gmail.com";
const applicationLookupMailto = `mailto:${contactEmail}?subject=${encodeURIComponent("找回申请编号")}`;

const deliveryStatusText: Record<string, string> = {
  not_delivered: "待下发",
  delivered: "已下发"
};

const certificateStatusText: Record<string, string> = {
  pending: "待确认",
  valid: "有效",
  revoked: "已撤销",
  expired: "已过期",
  expiring_soon: "即将到期",
  pending_review: "待复审",
  validity_not_set: "有效期未设置"
};

const typeText: Record<string, string> = {
  personal_member: "个人会员申请",
  organization_member: "机构会员申请",
  taoist_certification: "道士资格认证申请"
};

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
  const [contact, setContact] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [applications, setApplications] = useState<ApplicationQueryResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [supplementSubmitted, setSupplementSubmitted] = useState(false);
  const [supplementFiles, setSupplementFiles] = useState<string[]>([]);
  const [isLookupOpen, setIsLookupOpen] = useState(false);

  const selectedApplication = applications[selectedIndex] || null;

  const submitQuery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isQuerying) return;

    setIsQuerying(true);
    setErrorMessage("");
    setApplications([]);
    setSelectedIndex(0);
    setSupplementSubmitted(false);
    setSupplementFiles([]);

    try {
      const { response, result } = await queryApplicationProgress(applicationNumber, contact);

      if (!response.ok || !result.success) {
        setErrorMessage(result.success === false ? result.message : "申请查询未成功，请检查资料后重新查询。");
        return;
      }

      setApplications(result.applications);
    } catch {
      setErrorMessage("申请查询服务暂时不可用，请稍后重试或联系协会秘书处。");
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <>
      <PageHero
        actions={[
          { label: "查询申请", href: "/application/query" },
          { label: "会员核验", href: "/member-query" },
          { label: "证书核验", href: "/certificate-query" }
        ]}
        eyebrow="Application Query"
        title="申请查询"
        subtitle="Application Status And Result Query"
        intro="本页面供申请人本人查询认证申请进度、审核反馈、证书生成情况，以及证书查看与打印信息。"
        imageSrc="/images/itca/05-service-verification.png"
        imagePosition="center 58%"
        visualDescription="查询结果仅脱敏显示申请状态和必要备注，不公开完整申请资料。"
        visualEyebrow="Query"
        visualMark="Status"
        visualSeal="查询"
        visualTitle="申请记录查询"
      />

      <main className="mx-auto max-w-6xl px-5 pt-12 pb-12 sm:px-8 md:pt-14 lg:pt-16 lg:pb-16">
        <section className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <form className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8" onSubmit={submitQuery}>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Query Form</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-porcelain">查询申请记录</h2>
            <p className="mt-4 text-sm leading-7 text-[#5f5b52]">请输入申请编号，以及提交申请时使用的邮箱或手机 / WhatsApp，用于核对本人申请进度、申请结果、审核反馈、证书生成状态与证书查看 / 打印信息。</p>
            <p className="mt-3 text-sm leading-7 text-[#5f5b52]">
              如查询的是认证申请，证书生成后仍可继续使用申请编号与登记联系方式查询申请结果、证书生成情况及证书查看与打印信息。
            </p>

            <div className="mt-6 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-xs leading-6 text-[#666666]">
              如查询的是认证申请，证书生成后仍可继续使用申请编号与登记联系方式查询申请结果、证书生成情况及证书查看与打印信息。公众证书公开核验请使用证书编号与持证人姓名，会员公开核验请使用会员编号与姓名 / 机构名称。
            </div>
            <div className="mt-4 rounded-2xl border border-[#e4ded0] bg-white/70 p-4 text-xs leading-6 text-[#666666]">
              申请编号是申请人本人查询申请进度、补充资料和查看审核结果的重要凭证，请妥善保存。为保护申请资料安全，系统不会通过姓名和邮箱在网页上直接公开申请编号。
            </div>

            <div className="mt-7 grid gap-5">
              <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
                <span className="text-sm font-medium text-porcelain">申请编号 <span className="text-[#7F1D1D]">*</span></span>
                <input className="form-input" placeholder="例如 ARID-ITCA-M-2026-000001" required value={applicationNumber} onChange={(event) => setApplicationNumber(event.target.value)} />
              </label>
              <div className="rounded-2xl border border-[#e4ded0] bg-[#fff8ed] px-4 py-3 text-sm leading-6 text-[#5f5b52]">
                <span className="font-medium text-porcelain">忘记申请编号？</span>
                <button className="ml-1 font-semibold text-[#7F1D1D] underline underline-offset-4 transition hover:text-[#5f1515]" onClick={() => setIsLookupOpen((value) => !value)} type="button">
                  找回申请编号
                </button>
              </div>
              {isLookupOpen ? (
                <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-5">
                  <h3 className="font-serif text-2xl text-porcelain">找回申请编号</h3>
                  <p className="mt-3 text-sm leading-7 text-[#5f5b52]">
                    为保护申请资料安全，申请编号暂不支持通过姓名和邮箱在网页上直接找回。若您忘记申请编号，请使用提交申请时登记的邮箱发送邮件至协会联系邮箱，由秘书处核对后协助处理。
                  </p>
                  <div className="mt-4 rounded-xl border border-[#e4ded0] bg-white p-4 text-sm leading-7 text-[#5f5b52]">
                    <p className="font-medium text-porcelain">请在邮件中提供：</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      <li>申请人姓名 / 机构名称</li>
                      <li>登记邮箱或手机号</li>
                      <li>申请类型</li>
                      <li>大致提交时间，如可提供</li>
                    </ul>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[#5f5b52]">
                    协会核对后，将只会把申请编号回复至原登记邮箱或原登记手机号，不会在网页上直接显示申请编号。
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[#5f5b52]">
                    联系邮箱：
                    <a className="ml-1 break-all font-semibold text-[#7F1D1D] underline-offset-4 hover:underline" href={`mailto:${contactEmail}`}>
                      {contactEmail}
                    </a>
                  </p>
                  <a className="mt-4 inline-flex rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-sm font-semibold text-ink" href={applicationLookupMailto}>
                    发送邮件找回
                  </a>
                </div>
              ) : null}
              <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
                <span className="text-sm font-medium text-porcelain">邮箱或手机 / WhatsApp <span className="text-[#7F1D1D]">*</span></span>
                <input className="form-input" placeholder="请输入提交申请时填写的联络方式" required value={contact} onChange={(event) => setContact(event.target.value)} />
              </label>
            </div>

            {errorMessage ? <div className="mt-6 border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-4 text-sm leading-7 text-[#7F1D1D]" role="alert">{errorMessage}</div> : null}
            <button className="mt-7 w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60" disabled={isQuerying} type="submit">
              {isQuerying ? "正在查询..." : "查询申请进度 / 结果"}
            </button>
            <div className="mt-6 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-xs leading-6 text-[#666666]">
              支持 ARID-ITCA-M、ARID-ITCA-ORG、旧 ITCA-M / ITCA-O，以及 ITCA-TAO 开头的申请编号。查询结果仅用于申请人本人查看，不展示处理说明以外的后台操作记录或其他申请人的资料。
            </div>
          </form>

          <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-6 shadow-aureate sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Application Status</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-porcelain">申请记录查询</h2>
            {applications.length > 1 ? (
              <div className="mt-6 grid gap-3">
                <p className="text-sm leading-7 text-[#5f5b52]">查询到多条匹配记录，请选择一条查看脱敏详情。</p>
                {applications.map((item, index) => (
                  <button className={`rounded-2xl border px-4 py-3 text-left text-sm ${selectedIndex === index ? "border-[#7F1D1D] bg-white text-[#7F1D1D]" : "border-[#e4ded0] bg-white/70 text-[#5f5b52]"}`} key={item.applicationNo} onClick={() => setSelectedIndex(index)} type="button">
                    {maskApplicationNo(item.applicationNo)} · {typeText[item.applicationType]} · {maskName(item.name)} · {formatQueryStatus(item)}
                  </button>
                ))}
              </div>
            ) : null}
            {selectedApplication ? (
              <div className="mt-7 grid gap-4">
                <StatusRow label="申请编号" value={selectedApplication.applicationNo} />
                <StatusRow label="申请类型" value={typeText[selectedApplication.applicationType]} />
                <StatusRow label="申请人 / 机构名称" value={maskName(selectedApplication.name)} />
                <StatusRow label="当前状态" value={currentStatusText(selectedApplication)} />
                {selectedApplication.applicationType !== "taoist_certification" ? (
                  <>
                    <StatusRow label="会员编号" value={selectedApplication.memberNo || "审核通过后生成"} />
                    {selectedApplication.memberNo ? (
                      <>
                        <StatusRow label="会员有效期" value={`${formatMemberValidityDate(selectedApplication.memberValidFrom)} 至 ${formatMemberValidityDate(selectedApplication.memberValidUntil)}`} />
                        <StatusRow label="会员状态" value={selectedApplication.memberEffectiveStatusLabel || "有效期未设置"} />
                      </>
                    ) : null}
                  </>
                ) : null}
                <StatusRow label="提交时间" value={formatDateTime(selectedApplication.createdAt)} />
                <StatusRow label={selectedApplication.applicationType === "taoist_certification" ? "对申请人的反馈" : "审核反馈"} value={selectedApplication.adminNote || "暂无反馈"} />
                {selectedApplication.applicationType === "taoist_certification" ? (
                  <>
                    <StatusRow label="是否需要补充材料" value={selectedApplication.status === "need_more_info" ? "是，请查看反馈说明" : "否"} />
                    <StatusRow label="证书是否已生成" value={selectedApplication.certificateNo ? "是" : "否"} />
                    {selectedApplication.certificateNo ? (
                      <>
                        <StatusRow label="证书有效期" value={`${formatDate(selectedApplication.certificateValidFrom)} 至 ${formatDate(selectedApplication.certificateValidUntil)}`} />
                        <StatusRow label="证书状态" value={selectedApplication.certificateEffectiveStatusLabel || certificateStatusText[selectedApplication.certificateStatus || "pending"] || "待确认"} />
                      </>
                    ) : null}
                    <StatusRow label="证书下发状态" value={deliveryStatusText[selectedApplication.deliveryStatus || "not_delivered"]} />
                    <StatusRow label="下发时间" value={selectedApplication.deliveredAt ? formatDateTime(selectedApplication.deliveredAt) : "尚未下发"} />
                    {selectedApplication.certificateNo ? (
                      <StatusRow
                        label="证书下发说明"
                        value={
                          selectedApplication.deliveryStatus === "delivered"
                            ? "证书已下发，请以协会实际发送的证书通知或文件为准。"
                            : "证书记录已生成，协会将根据审核流程进行证书下发。"
                        }
                      />
                    ) : null}
                  </>
                ) : null}
                <StatusRow label="下一步提示" value={nextStepText(selectedApplication)} />
                {selectedApplication.certificateNo ? (
                  <div className="border-b border-[#e4ded0] pb-4 last:border-b-0">
                    <p className="text-xs tracking-[0.22em] text-[#8a6b3e]">证书编号</p>
                    <p className="mt-2 break-all text-sm leading-7 text-porcelain">{selectedApplication.certificateNo}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a className="inline-flex rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-xs font-semibold text-ink" href="/certificate-query">
                        前往证书查询页
                      </a>
                    </div>
                  </div>
                ) : null}
                {selectedApplication.certificateNo ? <ApplicantCertificatePrint application={selectedApplication} /> : null}
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-[#e4ded0] bg-white/74 p-5 text-sm leading-8 text-[#5f5b52]">
                <p className="font-medium text-porcelain">暂无查询结果</p>
                <p className="mt-2">请填写申请编号，以及提交申请时使用的邮箱或手机 / WhatsApp。若查询不到结果，请确认申请编号和联系方式是否与提交申请时一致，或联系协会秘书处协助核对。</p>
              </div>
            )}
          </div>
        </section>

        {selectedApplication?.status === "need_more_info" ? (
          <SupplementForm
            application={selectedApplication}
            contact={contact}
            onSuccess={(files) => {
              setSupplementSubmitted(true);
              setSupplementFiles(files);
              setApplications((current) =>
                current.map((item, index) =>
                  index === selectedIndex
                    ? { ...item, status: "under_review", supplementSubmittedAt: new Date().toISOString(), hasSupplementalSubmission: true }
                    : item
                )
              );
            }}
          />
        ) : null}
        {supplementSubmitted ? (
          <SupplementSuccess
            files={supplementFiles}
            onReset={() => {
              setApplications([]);
              setSelectedIndex(0);
              setSupplementSubmitted(false);
              setSupplementFiles([]);
            }}
          />
        ) : null}

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 text-sm leading-8 text-[#5f5b52] shadow-aureate sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Status</p>
            <h2 className="mt-3 font-serif text-2xl text-porcelain">状态说明</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {["已提交", "待审核", "审核中", "已补充，待复核", "需补充资料", "已通过", "已驳回", "已生成证书", "已下发", "已建档", "已撤销"].map((item) => (
                <span className="rounded-full border border-[#e4ded0] bg-[#fbf8ef] px-3 py-1.5 text-xs font-medium text-[#66594d]" key={item}>{item}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 text-sm leading-8 text-[#5f5b52] shadow-aureate sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Notice</p>
            <h2 className="mt-3 font-serif text-2xl text-porcelain">证书说明</h2>
            <p className="mt-5">如查询的是认证申请，证书生成后仍可继续使用申请编号与登记联系方式查询申请结果、证书生成情况及证书查看与打印信息。证书编号用于公众公开核验；申请编号用于申请人本人查询。</p>
          </div>
        </section>
      </main>
    </>
  );
}

function nextStepText(application: ApplicationQueryResult) {
  const status = application.status;
  if (status === "submitted") return "申请已提交，请等待秘书处审核。";
  if (status === "pending_review") return "您的申请已进入待审核队列，请等待秘书处处理。";
  if (status === "under_review" && (application.supplementSubmittedAt || application.hasSupplementalSubmission)) return "补充资料已提交，协会将基于最新资料进行复核。";
  if (status === "under_review") return "申请正在审核中，请等待秘书处审核。";
  if (status === "need_more_info") return "请根据反馈内容在线补充或修正资料，提交后申请将转为“已补充，待复核”。";
  if (status === "approved") return "申请已通过，等待生成证书或完成发证流程。";
  if (status === "certificate_issued" || status === "cert_issued") return "证书已生成，可查看证书编号、证书状态、证书查看与打印区和公开核验入口。";
  if (status === "delivered") return "证书已下发，仍可查看证书信息和公开核验入口。";
  if (status === "rejected") return "您的申请未通过审核，请查看反馈说明。";
  if (status === "archived") return "申请已归档，如需进一步核验请联系协会秘书处。";
  if (status === "revoked") return "该记录已撤销，如需核对请联系协会秘书处。";
  return "请等待秘书处审核；如联系方式变更，请主动联系更新。";
}

function currentStatusText(application: ApplicationQueryResult) {
  if (application.status === "under_review" && (application.supplementSubmittedAt || application.hasSupplementalSubmission)) return "已补充，待复核";
  if (application.applicationType === "taoist_certification" && application.status === "approved" && !application.certificateNo) return "已通过，待生成证书";
  if (application.applicationType === "taoist_certification" && (application.status === "certificate_issued" || application.status === "cert_issued") && application.certificateNo) return "审核已通过，证书记录已生成";
  if (application.applicationType === "taoist_certification" && application.status === "delivered" && application.certificateNo) return "证书记录已生成并已下发";
  return formatQueryStatus(application);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-HK", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatDate(value?: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("zh-HK", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function formatMemberValidityDate(value?: string | null) {
  if (!value) return "有效期未设置";
  return formatDate(value);
}

function SupplementForm({ application, contact, onSuccess }: { application: ApplicationQueryResult; contact: string; onSuccess: (files: string[]) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const data = application.editableData || {};
  const isCertification = application.applicationType === "taoist_certification";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage("");

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("applicationNo", application.applicationNo);
      formData.set("contact", contact);

      const response = await fetch("/api/applications/supplement", {
        method: "POST",
        body: formData
      });
      const result = (await response.json()) as { success: boolean; message?: string; files?: string[] };

      if (!response.ok || !result.success) {
        setMessage(result.message || "补充资料提交未成功，请检查后重试。");
        return;
      }

      onSuccess(result.files || []);
    } catch {
      setMessage("补充资料提交服务暂时不可用，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-[#d8d0bf] bg-[#fffdf8] p-6 shadow-aureate sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Supplement</p>
      <h3 className="mt-2 font-serif text-2xl text-porcelain">在线补充 / 修改资料</h3>
      <p className="mt-3 text-sm leading-7 text-[#5f5b52]">
        协会已要求您补充或修正相关资料。请根据审核反馈修改对应内容，并上传补充材料。提交后，系统将更新您的当前申请资料，并保留本次修改记录，后台人员将基于最新资料继续审核。
      </p>
      <div className="mt-5 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4">
        <StatusRow label="申请编号" value={application.applicationNo} />
        {application.applicationType !== "taoist_certification" ? <StatusRow label="会员编号" value={application.memberNo || "审核通过后生成"} /> : null}
        <StatusRow label="当前状态" value="需补充资料" />
        <StatusRow label="审核反馈" value={application.adminNote || "暂无反馈"} />
      </div>
      <form className="mt-6 grid gap-6" onSubmit={submit}>
        <input autoComplete="off" className="hidden" name="companyWebsite" tabIndex={-1} />
        {isCertification ? (
          <>
            <SupplementGroup title="基本资料">
              <SupplementInput defaultValue={data.applicantNameEn} label="英文名" name="applicantNameEn" />
              <SupplementInput defaultValue={data.gender} label="性别" name="gender" />
              <SupplementInput defaultValue={data.birthDate} label="出生日期" name="birthDate" type="date" />
              <SupplementInput defaultValue={data.nationality} label="国籍" name="nationality" />
              <SupplementInput defaultValue={data.residence} label="现居地" name="residence" />
              <SupplementInput defaultValue={data.address} label="地址" name="address" />
              <SupplementInput defaultValue={data.phone} label="电话 / WhatsApp" name="phone" />
              <SupplementInput defaultValue={data.email} label="邮箱" name="email" type="email" />
            </SupplementGroup>
            <SupplementGroup title="师承 / 传承资料">
              <SupplementInput defaultValue={data.masterName} label="师父姓名" name="masterName" required />
              <SupplementInput defaultValue={data.masterTaoistName} label="师父道名 / 法名" name="masterTaoistName" required />
              <SupplementInput defaultValue={data.lineage} label="道派 / 传承体系" name="lineage" required />
              <SupplementInput defaultValue={data.templeOrOrganization} label="宫观 / 机构 / 所属组织" name="templeOrOrganization" required />
              <SupplementTextarea defaultValue={data.sect} label="师承或传承说明" name="sect" required />
            </SupplementGroup>
            <SupplementGroup title="推荐人信息">
              <SupplementInput defaultValue={data.recommenderName} label="推荐人姓名" name="recommenderName" required />
              <SupplementInput defaultValue={data.recommenderContact} label="推荐人联系方式" name="recommenderContact" required />
              <SupplementTextarea defaultValue={data.recommenderRelation} label="推荐人与申请人的关系 / 推荐说明" name="recommenderRelation" required />
            </SupplementGroup>
            <SupplementGroup title="经历与补充说明">
              <SupplementInput defaultValue={data.practiceYears} label="修行年限" name="practiceYears" />
              <SupplementTextarea defaultValue={data.experienceSummary} label="经历说明" name="experienceSummary" />
              <SupplementTextarea defaultValue={data.applicationReason} label="申请理由" name="applicationReason" />
              <SupplementTextarea defaultValue={data.additionalNote} label="补充备注" name="additionalNote" />
            </SupplementGroup>
          </>
        ) : (
          <SupplementGroup title="会员申请资料">
              <SupplementInput defaultValue={data.name} label="姓名 / 机构名称" name="name" />
              <SupplementInput defaultValue={data.contactName} label="联系人" name="contactName" />
              <SupplementInput defaultValue={data.email} label="邮箱" name="email" type="email" />
              <SupplementInput defaultValue={data.phone} label="电话 / WhatsApp" name="phone" />
              <SupplementInput defaultValue={data.country} label="地址 / 国家地区" name="country" />
              <SupplementTextarea defaultValue={data.profile} label="资料说明" name="profile" />
              <SupplementTextarea defaultValue={data.purpose} label="申请说明" name="purpose" />
          </SupplementGroup>
        )}
        <SupplementGroup title="补充材料上传">
          <SupplementTextarea label="补充说明" name="supplementNote" required />
          <label className="grid gap-3 rounded-2xl border border-dashed border-gold/45 bg-[#fbf8ef] p-5 sm:col-span-2">
            <span className="text-sm font-medium text-porcelain">补充材料</span>
            <input accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="block w-full text-sm text-[#66594d] file:mr-4 file:rounded-full file:border-0 file:bg-[#7F1D1D] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" multiple name="supplementFiles" type="file" />
            <span className="text-xs leading-5 text-[#8a6b3e]">支持 PDF、JPG、JPEG、PNG，单文件不超过 2MB，单次最多 5 个文件。重新上传道装证件照时，请使用下方照片控件。</span>
          </label>
          {isCertification ? (
            <label className="grid gap-3 rounded-2xl border border-dashed border-gold/45 bg-[#fbf8ef] p-5 sm:col-span-2">
              <span className="text-sm font-medium text-porcelain">重新上传道装证件照</span>
              <input accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="block w-full text-sm text-[#66594d] file:mr-4 file:rounded-full file:border-0 file:bg-[#7F1D1D] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" name="photo" type="file" />
            </label>
          ) : null}
        </SupplementGroup>
        <p className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">提交后申请状态将转为“已补充，待复核”，协会将基于更新后的资料继续审核。</p>
        {message ? <div className="border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-4 text-sm leading-7 text-[#7F1D1D]">{message}</div> : null}
        <button className="rounded-full bg-[#7F1D1D] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
          {isSubmitting ? "正在提交..." : "提交补充 / 修改资料"}
        </button>
      </form>
    </section>
  );
}

function SupplementInput({ defaultValue = "", label, name, required = false, type = "text" }: { defaultValue?: string; label: string; name: string; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-2 rounded-2xl bg-white/55 p-3">
      <span className="text-sm font-medium text-porcelain">{label}{required ? <span className="text-[#7F1D1D]"> *</span> : null}</span>
      <input className="form-input" defaultValue={defaultValue} name={name} required={required} type={type} />
    </label>
  );
}

function SupplementGroup({ children, title }: { children: ReactNode; title: string }) {
  return (
    <fieldset className="rounded-2xl border border-[#e4ded0] bg-white/70 p-5">
      <legend className="px-2 font-serif text-xl text-porcelain">{title}</legend>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function SupplementTextarea({ defaultValue = "", label, name, required = false }: { defaultValue?: string; label: string; name: string; required?: boolean }) {
  return (
    <label className="grid gap-2 rounded-2xl bg-white/55 p-3 sm:col-span-2">
      <span className="text-sm font-medium text-porcelain">{label}{required ? <span className="text-[#7F1D1D]"> *</span> : null}</span>
      <textarea className="form-input min-h-28 resize-y" defaultValue={defaultValue} name={name} required={required} />
    </label>
  );
}

function SupplementSuccess({ files, onReset }: { files: string[]; onReset: () => void }) {
  return (
    <section className="mt-5 rounded-2xl border border-[#d8d0bf] bg-[#fffdf8] p-5 shadow-aureate sm:p-6">
      <h3 className="font-serif text-2xl text-porcelain">补充资料已提交</h3>
      <p className="mt-3 text-sm leading-7 text-[#5f5b52]">补充资料已提交，当前申请资料已更新，状态已转为“已补充，待复核”。协会将基于最新资料继续审核，请稍后通过申请编号和登记联系方式查询处理进度。</p>
      {files.length > 0 ? <p className="mt-3 text-sm leading-7 text-[#5f5b52]">已上传文件：{files.join("、")}</p> : null}
      <button className="mt-5 rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-sm font-semibold text-ink" onClick={onReset} type="button">
        重新查询申请状态
      </button>
    </section>
  );
}

function printCertificateArea() {
  const element = document.getElementById("applicant-certificate-print");
  if (!element) return;
  const printWindow = window.open("", "_blank", "width=920,height=1100");
  if (!printWindow) {
    window.print();
    return;
  }
  printWindow.document.write(`
    <html>
      <head>
        <title>证书查看与打印</title>
        <style>
          body { margin: 0; padding: 28px; color: #273331; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #fff; }
          .no-print { display: none !important; }
          img { max-width: 160px; max-height: 220px; object-fit: contain; }
          .print-grid { display: grid; grid-template-columns: 170px 1fr; gap: 24px; align-items: start; }
          .print-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 18px; }
          @page { margin: 18mm; }
        </style>
      </head>
      <body>${element.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}

function ApplicantCertificatePrint({ application }: { application: ApplicationQueryResult }) {
  const verificationUrl = "/certificate-query";

  return (
    <section className="mt-4 rounded-2xl border border-[#d8d0bf] bg-[#fffdf8] p-5 shadow-aureate sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Certificate Print</p>
          <h3 className="mt-2 font-serif text-2xl text-porcelain">证书查看与打印</h3>
          <p className="mt-2 text-sm leading-7 text-[#5f5b52]">本区域仅供申请人本人查看和通过浏览器打印，不作为公众核验页面。</p>
        </div>
        <button className="no-print rounded-full bg-[#7F1D1D] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)]" onClick={printCertificateArea} type="button">
          浏览器打印
        </button>
      </div>
      <div id="applicant-certificate-print" className="rounded-xl border border-[#e4ded0] bg-white p-5 sm:p-7">
        <div className="mb-6 border-b border-[#e4ded0] pb-5 text-center">
          <p className="text-xs tracking-[0.28em] text-gold">ITCA / 国际道教与文化协会</p>
          <h4 className="mt-3 font-serif text-3xl leading-tight text-porcelain">道士资格认证证书信息</h4>
          <p className="mt-2 text-sm leading-7 text-[#5f5b52]">Taoist Qualification Certification Record</p>
        </div>
        <div className="print-grid grid gap-6 md:grid-cols-[10.5rem_1fr] md:items-start">
          <div className="rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-center">
            <p className="mb-3 text-xs tracking-[0.18em] text-[#8a6b3e]">道装证件照</p>
            {application.certificatePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Applicant-only photo preview returned after application/contact verification.
              <img alt="道装证件照" className="mx-auto max-h-56 rounded-lg border border-[#e4ded0] bg-white object-contain" src={application.certificatePhotoUrl} />
            ) : (
              <p className="grid min-h-40 place-items-center text-xs leading-6 text-[#8a6b3e]">
                {application.certificatePhotoRecorded ? "证书照片已记录，如需核验请联系协会秘书处" : "暂未记录证书照片"}
              </p>
            )}
          </div>
          <div>
            <div className="print-fields grid gap-3 sm:grid-cols-2">
              <CertificateField label="证书编号" value={application.certificateNo || "未生成"} />
              <CertificateField label="持证人姓名" value={application.certificateHolderName || application.name} />
              <CertificateField label="道名" value={application.certificateTaoistName || "未记录"} />
              <CertificateField label="传承体系" value={application.certificationPath ? certificationPathLabels[application.certificationPath] : "未记录"} />
              <CertificateField label="认证等级" value={application.certificationLevel || "未记录"} />
              <CertificateField label="所属道派 / 法脉 / 宫观" value={application.certificateLineageOrTemple || "未记录"} />
              <CertificateField label="签发机构" value={application.certificateIssuer || "ITCA / 国际道教与文化协会"} />
              <CertificateField label="签发日期" value={formatDate(application.certificateIssuedDate)} />
              <CertificateField label="有效期" value={`${formatDate(application.certificateValidFrom)} 至 ${formatDate(application.certificateValidUntil)}`} />
              <CertificateField label="证书状态" value={application.certificateEffectiveStatusLabel || certificateStatusText[application.certificateStatus || "pending"] || "待确认"} />
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-dashed border-[#b08a45] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
          <p className="break-all">证书公开核验入口：{verificationUrl}</p>
          <p className="mt-2">公开核验需通过证书编号与持证人姓名共同验证，不能仅凭证书编号打开详情。</p>
          <p className="mt-2">认证范围说明：本认证属于协会认证与文化传承体系内的资格备案和身份记录，不具备政府机关行政许可、职业准入或宗教职务任命效力。</p>
        </div>
      </div>
    </section>
  );
}

function CertificateField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#eee7da] pb-3">
      <p className="text-xs tracking-[0.18em] text-[#8a6b3e]">{label}</p>
      <p className="mt-1 break-all text-sm leading-6 text-porcelain">{value}</p>
    </div>
  );
}

function QueryPageFallback() {
  return (
    <main className="mx-auto max-w-6xl px-5 pt-12 pb-12 sm:px-8 md:pt-14 lg:pt-16 lg:pb-16">
      <section className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
        <div className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Application Query</p>
          <h1 className="mt-3 font-serif text-3xl text-porcelain">申请查询</h1>
          <p className="mt-4 text-sm leading-8 text-[#5f5b52]">用于申请人通过申请编号和登记联系方式查询个人会员申请、机构会员申请、道士资格认证申请、证书生成情况及证书查看与打印信息。</p>
          <div className="mt-7 grid gap-5">
            <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
              <span className="text-sm font-medium text-porcelain">申请编号</span>
              <input className="form-input" placeholder="例如 ARID-ITCA-M-2026-000001" readOnly />
            </label>
            <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
              <span className="text-sm font-medium text-porcelain">邮箱或手机 / WhatsApp</span>
              <input className="form-input" placeholder="请输入提交申请时填写的联络方式" readOnly />
            </label>
          </div>
          <button className="mt-7 w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white" type="button">
            查询申请进度 / 结果
          </button>
        </div>
        <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-6 shadow-aureate sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Application Status</p>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-porcelain">查询结果</h2>
          <div className="mt-7 rounded-2xl border border-[#e4ded0] bg-white/74 p-5 text-sm leading-8 text-[#5f5b52]">
            <p className="font-medium text-porcelain">暂无查询结果</p>
            <p className="mt-2">请填写申请编号和提交申请时使用的联系方式。若查询不到结果，请确认填写信息是否与提交申请时一致，或联系协会秘书处协助核对。</p>
          </div>
        </div>
      </section>
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
