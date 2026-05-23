"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import {
  certificationLevelLabels,
  certificationPathLabels,
  type CertificationLevel,
  type CertificationPath,
  type CertificationStatus,
  type MaterialReview
} from "@/types/certification";

const statusOptions: Array<{ value: CertificationStatus; label: string }> = [
  { value: "under_review", label: "设为审核中" },
  { value: "need_more_info", label: "要求补充材料" },
  { value: "approved", label: "审核通过" },
  { value: "rejected", label: "审核驳回" }
];

const statusText: Record<string, string> = {
  submitted: "已提交",
  under_review: "审核中",
  need_more_info: "需补充材料",
  approved: "审核通过",
  rejected: "审核未通过",
  certificate_issued: "已生成证书",
  cert_issued: "已生成证书",
  delivered: "已下发",
  archived: "已归档",
  revoked: "已撤销"
};

const certificationPathOptions: Array<{ value: "" | CertificationPath; label: string }> = [
  { value: "", label: "暂不核定" },
  ...Object.entries(certificationPathLabels).map(([value, label]) => ({ value: value as CertificationPath, label }))
];

const certificationLevelOptions: Array<{ value: "" | CertificationLevel; label: string }> = [
  { value: "", label: "暂不核定" },
  ...Object.entries(certificationLevelLabels).map(([value, label]) => ({ value: value as CertificationLevel, label }))
];

const terminalStatuses: CertificationStatus[] = ["certificate_issued", "cert_issued", "delivered", "archived", "revoked"];

const committeeReviewTemplates = [
  { label: "资料完整", text: "申请资料完整，师承 / 传承信息、资质文件、推荐资料及实践经历说明基本符合审核要求，建议审核通过。" },
  { label: "需补充材料", text: "申请资料尚需补充，建议申请人补充师承 / 传承证明、资质文件、推荐说明或实践经历材料后再复核。" },
  { label: "暂缓通过", text: "当前资料尚不足以完成认证判断，建议暂缓通过，待补充材料或进一步人工核验后再作决定。" },
  { label: "建议不通过", text: "当前资料暂不符合本项认证申请要求，建议不予通过。" }
];

const applicantFeedbackTemplates = [
  { label: "审核通过", text: "您的申请资料已通过审核，后续将根据协会流程生成证书记录并完成证书下发安排。" },
  { label: "请补充资料", text: "您的申请资料尚需补充，请根据本页提示补充相关证明材料或说明后重新提交。" },
  { label: "待复核", text: "您提交的补充资料已收到，协会将进行复核，请等待后续审核结果。" },
  { label: "未通过说明", text: "经审核，当前资料暂不符合本项认证申请要求，暂无法通过本次申请。" }
];

const internalReviewTemplates = [
  { label: "已核对", text: "已核对基本身份资料、师承 / 传承信息、推荐人资料及上传材料，待进一步审核确认。" },
  { label: "待复核", text: "该申请仍需人工复核材料真实性、传承信息与资质证明。" },
  { label: "已要求补充", text: "已要求申请人补充资料，待申请人在线补充 / 修改后再继续复核。" },
  { label: "发证前复查", text: "发证前需确认申请状态为审核通过、核定信息完整，且所有材料审核项均已通过。" }
];

function buildReviewNote(reviewNote: string, taoistRank: string) {
  const cleaned = reviewNote.replace(/\n?证书等级 \/ 项目：.*$/m, "").trim();
  const rankLine = `证书等级 / 项目：${taoistRank || "道士资格认证"}`;
  return cleaned ? `${cleaned}\n${rankLine}` : rankLine;
}

function buildNotice(params: {
  type: "approved" | "need_more_info" | "rejected" | "certificate";
  applicantName: string;
  applicationNo: string;
  status: CertificationStatus;
  certificateNo?: string;
  applicantFeedback: string;
}) {
  const base = [`${params.applicantName} 您好：`, "", `您的 ITCA 道士资格认证申请（申请编号：${params.applicationNo}）当前状态为：${statusText[params.status] || params.status}。`];

  if (params.type === "approved") {
    base.push("", params.applicantFeedback || "您的申请已通过审核。后续如生成证书记录，可继续通过官网申请进度查询查看申请状态、证书编号与证书核验详情。");
  }

  if (params.type === "need_more_info") {
    base.push("", params.applicantFeedback || "您的申请资料需要补充。请根据 ITCA 秘书处反馈补充相关材料后再继续审核。");
  }

  if (params.type === "rejected") {
    base.push("", params.applicantFeedback || "您的申请暂未通过审核。如需核对具体情况，请联系 ITCA 秘书处。");
  }

  if (params.type === "certificate") {
    base.push("", params.certificateNo ? `您的证书记录已生成，证书编号：${params.certificateNo}。` : "您的证书记录已生成或已完成下发。");
  }

  base.push("", "申请进度查询入口：/application/query");
  if (params.certificateNo) {
    base.push(`证书核验详情入口：/certificates/${encodeURIComponent(params.certificateNo)}`);
    base.push(`公开证书核验入口：/certificate-query?certificateNo=${encodeURIComponent(params.certificateNo)}&holderName=${encodeURIComponent(params.applicantName)}`);
  }
  base.push("", "如联系方式或资料需更新，请联系 ITCA 秘书处协助处理。");

  return base.join("\n");
}

type CertificationReviewFormProps = {
  applicationId: string;
  applicantName: string;
  applicationNo: string;
  certificateNo?: string;
  deliveryStatus: "not_delivered" | "delivered";
  deliveredAt: string | null;
  initialApprovedLevel: CertificationLevel | "";
  initialApprovedPath: CertificationPath | "";
  initialApplicantFeedback: string;
  initialCommitteeReviewNote: string;
  initialInternalReviewNote: string;
  initialMaterialReview: MaterialReview;
  initialReviewNote: string;
  initialStatus: CertificationStatus;
  supportingMaterials?: ReactNode;
};

export function CertificationReviewForm({
  applicationId,
  applicantName,
  applicationNo,
  certificateNo,
  deliveryStatus,
  deliveredAt,
  initialApprovedLevel,
  initialApprovedPath,
  initialApplicantFeedback,
  initialCommitteeReviewNote,
  initialInternalReviewNote,
  initialMaterialReview,
  initialReviewNote,
  initialStatus,
  supportingMaterials
}: CertificationReviewFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<CertificationStatus>(initialStatus === "submitted" ? "under_review" : initialStatus);
  const [reviewNote, setReviewNote] = useState(initialReviewNote);
  const [internalReviewNote, setInternalReviewNote] = useState(initialInternalReviewNote);
  const [applicantFeedback, setApplicantFeedback] = useState(initialApplicantFeedback);
  const [approvedPath, setApprovedPath] = useState<CertificationPath | "">(initialApprovedPath);
  const [approvedLevel, setApprovedLevel] = useState<CertificationLevel | "">(initialApprovedLevel);
  const [committeeReviewNote, setCommitteeReviewNote] = useState(initialCommitteeReviewNote);
  const [taoistRank, setTaoistRank] = useState("道士资格认证");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const hasCertificate = Boolean(certificateNo);
  const materialReviewReady = Object.values(initialMaterialReview).every((item) => item === "passed");
  const materialReviewHasIncomplete = Object.values(initialMaterialReview).some((item) => item !== "passed");
  const isReadonlyStatus = terminalStatuses.includes(initialStatus);
  const canSaveReview = !isReadonlyStatus;
  const canGenerateCertificate = initialStatus === "approved" && !hasCertificate && Boolean(approvedPath) && Boolean(approvedLevel) && materialReviewReady;
  const canMarkDelivered = hasCertificate && deliveryStatus !== "delivered" && (initialStatus === "certificate_issued" || initialStatus === "cert_issued");
  const canCorrectNotDelivered = hasCertificate && deliveryStatus === "delivered";
  const canArchive = initialStatus === "delivered";

  const statusGuide = useMemo(() => {
    if (initialStatus === "submitted" || initialStatus === "under_review") return "当前申请处于受理或审核阶段，可保存审核中、要求补充材料、审核通过或审核驳回；审核通过前不能生成证书。";
    if (initialStatus === "need_more_info") return "当前申请等待申请人补充或秘书处线下处理。请保留清晰的对申请人反馈，本状态不能生成证书。";
    if (initialStatus === "rejected") return "当前申请已驳回。请保留对申请人的反馈，本状态不显示发证操作。";
    if (initialStatus === "approved") return "当前申请已审核通过。请确认核定传承体系、核定认证等级和各资料板块材料审核状态后生成证书。";
    if (initialStatus === "certificate_issued" || initialStatus === "cert_issued") return "证书记录已生成，不能重复生成证书；可在证书完成交付后标记已下发。";
    if (initialStatus === "delivered") return "证书已下发，不能重复生成证书；如后续处理完成，可归档申请。";
    if (initialStatus === "archived") return "申请已归档，原则上仅作记录查看，不再进行发证操作。";
    return "请根据申请资料和审核记录选择下一步操作。";
  }, [initialStatus]);

  const generateBlockedReason = useMemo(() => {
    if (hasCertificate) return "证书记录已存在，不能重复生成证书。";
    if (initialStatus !== "approved") return "当前申请尚未审核通过，不能生成证书。";
    if (!approvedPath || !approvedLevel) return "请先完成核定传承体系与核定认证等级后再生成证书。";
    if (!materialReviewReady) return "仍有材料审核项未通过或未完成，暂不能生成证书。";
    return "";
  }, [approvedLevel, approvedPath, hasCertificate, initialStatus, materialReviewReady]);

  const request = async (body: Record<string, unknown>, successMessage: string) => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/certification-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewNote: buildReviewNote(reviewNote, taoistRank),
          internalReviewNote,
          applicantFeedback,
          approvedPath,
          approvedLevel,
          committeeReviewNote,
          taoistRank,
          ...body
        })
      });
      const result = (await response.json()) as { success: boolean; message?: string; certificate?: { certificateNo?: string } };

      if (!response.ok || !result.success) {
        setMessageTone("error");
        setMessage(result.message || "操作未能保存。");
        return;
      }

      setMessageTone("success");
      setMessage(result.certificate?.certificateNo ? `${successMessage} 证书编号：${result.certificate.certificateNo}` : successMessage);
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("审核保存服务暂时不可用，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  };

  const saveStatus = () => {
    if ((status === "need_more_info" || status === "rejected") && !applicantFeedback.trim()) {
      setMessageTone("error");
      setMessage(status === "need_more_info" ? "请填写需要申请人补充或修正的资料说明。" : "请填写对申请人反馈后再保存该审核状态。");
      return;
    }
    if (status === "approved" && (!approvedPath || !approvedLevel)) {
      setMessageTone("error");
      setMessage("请先完成核定传承体系与核定认证等级后再保存审核通过状态。");
      return;
    }
    request({ status }, "审核状态、内部备注和申请人反馈已保存。");
  };
  const generateCertificate = () => {
    if (!canGenerateCertificate) {
      setMessageTone("error");
      setMessage(generateBlockedReason || "当前申请暂不能生成证书。");
      return;
    }
    request({ action: "generate_certificate", generateCertificate: true }, "证书记录已生成。");
  };
  const markDelivered = () => request({ action: "mark_delivered" }, "证书已标记为已下发。");
  const correctNotDelivered = () => request({ action: "correct_not_delivered" }, "证书下发状态已更正为未下发。");
  const archive = () => request({ action: "archive" }, "申请已归档。");

  const notices = useMemo(
    () => [
      { label: "复制审核通过通知", text: buildNotice({ type: "approved", applicantName, applicationNo, status: "approved", certificateNo, applicantFeedback }) },
      { label: "复制补充材料通知", text: buildNotice({ type: "need_more_info", applicantName, applicationNo, status: "need_more_info", certificateNo, applicantFeedback }) },
      { label: "复制审核未通过通知", text: buildNotice({ type: "rejected", applicantName, applicationNo, status: "rejected", certificateNo, applicantFeedback }) },
      { label: "复制证书通知", text: buildNotice({ type: "certificate", applicantName, applicationNo, status: deliveryStatus === "delivered" ? "delivered" : "certificate_issued", certificateNo, applicantFeedback }) }
    ],
    [applicantFeedback, applicantName, applicationNo, certificateNo, deliveryStatus]
  );

  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Review</p>
      <h2 className="mt-3 font-serif text-3xl text-porcelain">审核处理</h2>
      <div className="mt-5 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
        <p className="font-medium text-porcelain">下一步提示</p>
        <p className="mt-1">{statusGuide}</p>
        <p className="mt-2 text-[#7F1D1D]">材料审核状态请在各资料板块中逐项完成。</p>
        {materialReviewHasIncomplete && initialStatus === "approved" ? <p className="mt-2 text-[#7F1D1D]">仍有材料审核项未通过或未完成，暂不能生成证书。</p> : null}
      </div>
      <div className="mt-4 rounded-2xl border border-[#e4ded0] bg-white p-4 text-sm leading-7 text-[#5f5b52]">
        <p className="font-medium text-porcelain">申请人验真提示</p>
        <ul className="mt-2 grid list-disc gap-1 pl-5">
          <li>核对申请人姓名、联系方式、身份材料。</li>
          <li>核对道装证件照是否与申请人材料一致。</li>
          <li>核对师承 / 传承材料与证明文件。</li>
          <li>必要时联系推荐人、师父、道场或证明出具方。</li>
          <li>对疑似冒用、伪造、虚假陈述或无法核验的申请，应要求补充材料、暂停审核或驳回。</li>
        </ul>
      </div>
      <div className="mt-6 grid gap-5">
        <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-5">
          <h3 className="font-serif text-2xl text-porcelain">核定信息</h3>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="grid gap-3">
              <span className="text-sm font-medium text-porcelain">核定传承体系</span>
              <select className="form-input" disabled={isReadonlyStatus} value={approvedPath} onChange={(event) => setApprovedPath(event.target.value as CertificationPath | "")}>
                {certificationPathOptions.map((item) => <option key={item.value || "empty"} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="grid gap-3">
              <span className="text-sm font-medium text-porcelain">核定认证等级</span>
              <select className="form-input" disabled={isReadonlyStatus} value={approvedLevel} onChange={(event) => setApprovedLevel(event.target.value as CertificationLevel | "")}>
                {certificationLevelOptions.map((item) => <option key={item.value || "empty"} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="grid gap-3 md:col-span-2">
              <span className="text-sm font-medium text-porcelain">当前状态</span>
              <select className="form-input" disabled={isReadonlyStatus} value={status} onChange={(event) => setStatus(event.target.value as CertificationStatus)}>
                {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
          </div>
        </div>
        {supportingMaterials ? <div>{supportingMaterials}</div> : null}
        <div className="rounded-2xl border border-[#e4ded0] bg-white p-5">
          <h3 className="font-serif text-2xl text-porcelain">审核意见</h3>
          <div className="mt-5 grid gap-5">
            <label className="grid gap-3">
              <span className="text-sm font-medium text-porcelain">认证委员会审核意见</span>
              <textarea className="form-input min-h-32 resize-y" disabled={isReadonlyStatus} value={committeeReviewNote} onChange={(event) => setCommitteeReviewNote(event.target.value)} />
            </label>
            <TemplateButtons disabled={isReadonlyStatus} onSelect={setCommitteeReviewNote} templates={committeeReviewTemplates} />
            <label className="grid gap-3 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4">
              <span className="text-sm font-medium text-porcelain">对申请人反馈</span>
              <textarea className="form-input min-h-32 resize-y" disabled={isReadonlyStatus} value={applicantFeedback} onChange={(event) => setApplicantFeedback(event.target.value)} />
            </label>
            <TemplateButtons disabled={isReadonlyStatus} onSelect={setApplicantFeedback} templates={applicantFeedbackTemplates} />
            <label className="grid gap-3 rounded-2xl border border-[#e4ded0] bg-[#fffdf8] p-4">
              <span className="text-sm font-medium text-porcelain">后台审核备注</span>
              <textarea className="form-input min-h-32 resize-y" disabled={isReadonlyStatus} value={internalReviewNote} onChange={(event) => setInternalReviewNote(event.target.value)} />
            </label>
            <TemplateButtons disabled={isReadonlyStatus} onSelect={setInternalReviewNote} templates={internalReviewTemplates} />
          </div>
        </div>
        <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-5">
          <h3 className="font-serif text-2xl text-porcelain">证书记录</h3>
          <div className="mt-5 grid gap-5">
            <label className="grid gap-3">
              <span className="text-sm font-medium text-porcelain">证书等级 / 项目</span>
              <input className="form-input" disabled={isReadonlyStatus} value={taoistRank} onChange={(event) => setTaoistRank(event.target.value)} />
            </label>
            <label className="grid gap-3">
              <span className="text-sm font-medium text-porcelain">证书项目备注</span>
              <textarea className="form-input min-h-24 resize-y" disabled={isReadonlyStatus} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} />
            </label>
          </div>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
        <p>下发状态：{deliveryStatus === "delivered" ? "已下发" : "未下发"}</p>
        <p>下发时间：{deliveredAt ? new Date(deliveredAt).toLocaleString("zh-HK") : "未记录"}</p>
      </div>
      {message ? <div className={`mt-5 border-l-4 p-4 text-sm leading-7 ${messageTone === "success" ? "border-[#8a6b3e] bg-[#fbf8ef] text-[#5f5b52]" : "border-[#7F1D1D] bg-[#fbf0ec] text-[#7F1D1D]"}`}>{message}</div> : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {canSaveReview ? <button className="rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} onClick={saveStatus} type="button">
          {isSaving ? "正在保存..." : "保存状态与反馈"}
        </button> : null}
        {initialStatus === "approved" && !hasCertificate ? <button className="rounded-full border border-[#d8d0bf] bg-white px-7 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving || !canGenerateCertificate} onClick={generateCertificate} type="button" title={generateBlockedReason || "生成证书"}>
          生成证书
        </button> : null}
        {generateBlockedReason && initialStatus !== "rejected" && initialStatus !== "archived" ? <p className="basis-full text-sm leading-7 text-[#7F1D1D]">{generateBlockedReason}</p> : null}
        {initialStatus === "approved" && !hasCertificate ? (
        <p className="basis-full rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
            生成证书前，请确认申请人身份、联系方式、师承材料、资质凭证、道装证件照及各资料板块材料审核状态均已通过。资料无法核验、疑似冒用或存在重大疑点的申请不得生成证书。
          </p>
        ) : null}
        {canMarkDelivered ? <button className="rounded-full border border-[#d8d0bf] bg-white px-7 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} onClick={markDelivered} type="button">
          标记已下发
        </button> : null}
        {canCorrectNotDelivered ? <button className="rounded-full border border-[#d8d0bf] bg-white px-7 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} onClick={correctNotDelivered} type="button">
          更正为未下发
        </button> : null}
        {canArchive ? <button className="rounded-full border border-[#d8d0bf] bg-white px-7 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} onClick={archive} type="button">
          归档
        </button> : null}
      </div>

      <div className="mt-8 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-5">
        <h3 className="font-serif text-2xl text-porcelain">通知文案复制</h3>
        <div className="mt-5 grid gap-4">
          {notices.map((notice) => (
            <div className="rounded-xl border border-[#e4ded0] bg-white p-4" key={notice.label}>
              <textarea className="form-input min-h-32 resize-y text-xs leading-6" readOnly value={notice.text} />
              <div className="mt-3">
                <CopyButton label={notice.label} text={notice.text} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TemplateButtons({ disabled, onSelect, templates }: { disabled: boolean; onSelect: (value: string) => void; templates: Array<{ label: string; text: string }> }) {
  return (
    <div className="-mt-2 flex flex-wrap gap-2">
      {templates.map((template) => (
        <button
          className="rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-[#8a6b3e] hover:text-[#7F1D1D] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          key={template.label}
          onClick={() => onSelect(template.text)}
          type="button"
        >
          {template.label}
        </button>
      ))}
    </div>
  );
}
