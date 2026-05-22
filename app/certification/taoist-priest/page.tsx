"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FormTemplateHelper } from "@/components/FormTemplateHelper";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import { certificationLevelLabels, certificationPathLabels, type CertificationLevel, type CertificationPath, type CertificationSubmitResponse } from "@/types/certification";

type Field = {
  id: string;
  label: string;
  kind?: "text" | "email" | "date" | "select" | "textarea" | "file" | "checkbox";
  required?: boolean;
  badge?: "选填" | "按情况提交" | "建议提交" | "按协会要求提交" | "适用于国际申请情形";
  options?: Array<string | { label: string; value: string }>;
};

type Step = {
  title: string;
  icon: IconBadgeName;
  help?: string;
  groups: Array<{ title: string; fields: Field[] }>;
  checks?: string[];
};

type ValidationIssue = {
  stepIndex: number;
  fieldId: string;
  fieldLabel: string;
  message: string;
};

const steps: Step[] = [
  {
    title: "申请人基本资料",
    icon: "individual",
    groups: [
      {
        title: "身份与联络资料",
        fields: [
          { id: "certificationType", label: "申请认证类型", kind: "select", required: true, options: ["道士资格认证"] },
          {
            id: "certificationPath",
            label: "传承体系",
            kind: "select",
            required: true,
            options: Object.entries(certificationPathLabels).map(([value, label]) => ({ value, label }))
          },
          {
            id: "requestedLevel",
            label: "申请认证等级",
            kind: "select",
            required: true,
            options: Object.entries(certificationLevelLabels).map(([value, label]) => ({ value, label }))
          },
          { id: "nameCn", label: "姓名（中文）", required: true },
          { id: "nameEn", label: "英文名 / 拼音", required: true },
          { id: "taoistName", label: "法名 / 道名", required: true },
          { id: "gender", label: "性别", kind: "select", required: true, options: ["男", "女", "其他"] },
          { id: "birthDate", label: "出生日期", kind: "date", required: true },
          { id: "nationality", label: "国家 / 地区", required: true },
          { id: "residence", label: "现居地", required: true },
          { id: "phone", label: "电话", required: true },
          { id: "email", label: "邮箱", kind: "email", required: true },
          { id: "address", label: "地址", badge: "按情况提交" }
        ]
      }
    ]
  },
  {
    title: "师承信息",
    icon: "structure",
    help: "师承信息是道士资格认证的重要审核内容，请尽量填写真实、完整、可核验的资料。",
    groups: [
      {
        title: "传承与师父资料",
        fields: [
          { id: "lineage", label: "道派 / 传承体系", kind: "select", required: true, options: ["正一教", "全真教", "其他"] },
          { id: "sectFullName", label: "师承或传承说明", required: true },
          { id: "masterName", label: "师父姓名", required: true },
          { id: "masterTaoistName", label: "师父道名 / 法名", required: true },
          { id: "masterTemple", label: "宫观 / 机构 / 所属组织", required: true },
          { id: "masterContact", label: "师父联系方式 / 地址", badge: "按情况提交" },
          { id: "apprenticeDate", label: "拜师时间", badge: "按情况提交" },
          { id: "witnessName", label: "拜师仪式见证人", badge: "按情况提交" },
          { id: "witnessContact", label: "见证人联系方式", badge: "按情况提交" }
        ]
      }
    ]
  },
  {
    title: "宗教资质与证明文件",
    icon: "certificate",
    help: "不同流派、不同申请人所需资质文件不同，申请人应按实际情况提交，协会可根据审核需要要求补充材料。",
    groups: [
      {
        title: "资质文件上传",
        fields: [
          { id: "luDocument", label: "授箓 / 升箓《箓牒》《职牒》", kind: "file", badge: "按情况提交" },
          { id: "jieDocument", label: "传戒 / 授戒《戒牒》", kind: "file", badge: "按情况提交" },
          { id: "duDocument", label: "传度《度牒》《教职》", kind: "file", badge: "按情况提交" },
          { id: "guanJinDocument", label: "冠巾《冠巾状牒》", kind: "file", badge: "按情况提交" },
          { id: "lineageProof", label: "师门《传承谱系证明》", kind: "file", badge: "建议提交" },
          { id: "templeProof", label: "道场《修行 / 职务证明》", kind: "file", badge: "按情况提交" },
          { id: "internalVoucher", label: "流派内部《过教帖 / 法券》", kind: "file", badge: "按情况提交" }
        ]
      }
    ]
  },
  {
    title: "实践经历与引荐人",
    icon: "international",
    groups: [
      {
        title: "实践经历",
        fields: [
          { id: "templeName", label: "所属道场 / 宫观名称", badge: "按情况提交" },
          { id: "templeAddress", label: "道场 / 宫观地址", badge: "按情况提交" },
          { id: "position", label: "职务", kind: "select", options: ["住持", "高功", "执事", "经生", "其他"], badge: "按情况提交" },
          { id: "practiceHistory", label: "道教履历说明", kind: "textarea", required: true },
          { id: "applicationReason", label: "申请理由", kind: "textarea", required: true },
          { id: "additionalNote", label: "补充备注", kind: "textarea", badge: "选填" },
          { id: "practiceType", label: "实践类型", badge: "按情况提交" },
          { id: "practiceTime", label: "时间", badge: "按情况提交" },
          { id: "practicePlace", label: "地点", badge: "按情况提交" },
          { id: "practiceRole", label: "担任角色", badge: "按情况提交" }
        ]
      },
      {
        title: "推荐人信息",
        fields: [
          { id: "recommenderName", label: "推荐人姓名", required: true },
          { id: "recommenderContact", label: "推荐人联系方式", required: true },
          { id: "recommenderRelation", label: "推荐人与申请人的关系 / 推荐说明", required: true }
        ]
      }
    ]
  },
  {
    title: "补充材料上传",
    icon: "certificate",
    groups: [
      {
        title: "补充材料",
        fields: [
          { id: "idProof", label: "身份证明：护照或身份证影本", kind: "file", required: true },
          { id: "photo", label: "近期白底道装证件照", kind: "file", required: true },
          { id: "criminalRecord", label: "无刑事犯罪及邪教历史证明", kind: "file", badge: "按协会要求提交" },
          { id: "educationProof", label: "学历证明及培训证明", kind: "file", badge: "按情况提交" },
          { id: "practiceReport", label: "道教实践报告", kind: "file", badge: "建议提交" },
          { id: "organizationLetter", label: "本国道教组织推荐信", kind: "file", badge: "按情况提交" },
          { id: "crossCulturePlan", label: "跨文化传道计划", kind: "file", badge: "适用于国际申请情形" }
        ]
      }
    ]
  },
  {
    title: "声明承诺与提交",
    icon: "value",
    groups: [
      {
        title: "声明承诺",
        fields: [
          { id: "truthConfirm", label: "我确认所提交的姓名、联系方式、身份资料、师承资料、证书材料及上传文件真实、完整、合法，且为本人或经合法授权提交。协会有权对申请资料进行人工核验；对于资料不完整、无法核验、疑似冒用、伪造、虚假陈述或恶意提交的申请，协会有权要求补充材料、暂停审核、驳回申请，或在证书生成后撤销相关记录。", kind: "checkbox", required: true },
          { id: "dataUseConfirm", label: "我同意 ITCA 将本人提交的资料用于认证申请审核、资料核对、证书记录建立及后续联系。", kind: "checkbox", required: true },
          { id: "reviewConfirm", label: "我理解申请提交后将进入人工审核，审核结果以 ITCA 审核记录为准。", kind: "checkbox", required: true },
          { id: "supplementConfirm", label: "我理解如资料不完整，ITCA 可要求补充材料；如资料不实，ITCA 可驳回申请或撤销相关记录。", kind: "checkbox", required: true },
          { id: "certificatePublicConfirm", label: "我同意审核通过并生成证书后，证书编号、姓名、认证类型、签发日期及证书状态等必要信息可用于官网证书核验。", kind: "checkbox", required: true },
          { id: "termsPrivacyConfirm", label: "我已阅读并同意《申请须知》《资料使用说明》《服务条款》《隐私政策》。", kind: "checkbox", required: true }
        ]
      }
    ],
    checks: ["身份资料是否与证件一致", "师承信息是否真实完整", "资质文件是否清晰可核验", "实践经历是否有时间、地点、角色", "联系方式是否可用于后续补充资料"]
  }
];

const apiFieldToFormId: Record<string, string> = {
  certificationType: "certificationType",
  certificationPath: "certificationPath",
  requestedLevel: "requestedLevel",
  applicantName: "nameCn",
  applicantNameEn: "nameEn",
  taoistName: "taoistName",
  gender: "gender",
  birthDate: "birthDate",
  nationality: "nationality",
  residence: "residence",
  phone: "phone",
  email: "email",
  masterName: "masterName",
  masterTaoistName: "masterTaoistName",
  lineage: "lineage",
  templeOrOrganization: "masterTemple",
  sect: "lineage",
  recommenderName: "recommenderName",
  recommenderContact: "recommenderContact",
  recommenderRelation: "recommenderRelation",
  experienceSummary: "practiceHistory",
  applicationReason: "applicationReason",
  additionalNote: "additionalNote",
  declarationAccepted: "truthConfirm",
  dataUseAccepted: "dataUseConfirm",
  certificatePublicAccepted: "certificatePublicConfirm",
  termsAccepted: "termsPrivacyConfirm",
  privacyAccepted: "termsPrivacyConfirm"
};

const textareaTemplates: Record<string, { hint: string; template: string }> = {
  practiceHistory: {
    hint: "请说明真实学习、师承、实践和服务经历，30–2000 字。",
    template: `本人接触道教文化及相关学习实践的时间为：【请填写年份或时间段】。

主要学习 / 实践经历包括：
1. 【请填写学习内容、课程、经典、科仪、养生、文化研究等经历】
2. 【请填写师承、指导老师、宫观、机构或学习来源】
3. 【请填写参与活动、服务、讲座、课程或实践情况】

目前本人申请认证的主要原因是：【请填写申请目的】。

本人确认以上内容真实，并愿意配合 ITCA 后续审核及资料补充。`
  },
  applicationReason: {
    hint: "请说明申请认证的真实目的和使用场景，20–1500 字。",
    template: `本人申请本项认证，主要基于以下原因：

第一，希望对本人已有的相关学习、实践和服务经历进行规范登记。

第二，希望通过 ITCA 的审核流程，获得相应的认证记录与证书核验信息。

第三，希望未来在相关文化交流、学习传播、活动参与或服务场景中，更规范地展示本人身份与经历。

本人理解本申请需经过人工审核，最终结果以 ITCA 审核记录为准。`
  },
  additionalNote: {
    hint: "可补充说明经历、证明材料、联系方式或其他事项，最多 1000 字。",
    template: `补充说明如下：

1. 关于本人经历或资料的补充说明：【请填写】
2. 关于证明材料的补充说明：【请填写】
3. 关于联系方式、证书信息或其他事项的说明：【请填写】

如以上内容仍需补充，本人愿意配合 ITCA 后续审核要求。`
  }
};

const allowedFileTypes = ["application/pdf", "image/jpeg", "image/png"];
const allowedFileExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
const maxFileSize = 2 * 1024 * 1024;
const phonePattern = /^[+\d][\d\s().-]{5,29}$/;

const applicationNotices = [
  ["申请须知", "本认证将根据申请人的传承体系、资质凭证、实践经历、推荐材料、伦理承诺及资料完整性进行综合审核。"],
  ["传承体系", "申请人可根据自身情况选择正一、全真或其他传承，并提交对应师承与资质说明。"],
  ["申报认证等级", "申报认证等级仅作为审核参考，最终核定等级将根据资料完整性、师承证明、资质凭证、实践经历、推荐材料及认证委员会审核意见确定。"],
  ["证书说明", "申请通过后，申请人可继续使用申请编号及联系方式查询申请结果，并查看证书生成和打印信息；申请编号不会因证书核发而失效。"],
  ["照片用途", "申请时上传的“近期白底道装证件照”将用于认证审核、证书生成及申请人证书查看与打印；公众证书公开核验页默认不展示该照片。"],
  ["重要提示", "附件仅支持 PDF、JPG、JPEG、PNG，单文件不超过 2MB。上传材料仅用于申请审核与认证建档。"]
];

const lineageMaterialGuides = [
  {
    title: "正一",
    items: ["师门传承谱系证明", "传度、授箓、度牒、箓牒或相关职牒材料", "道场修行 / 职务证明", "身份证明、道装证件照、实践经历、推荐材料等"]
  },
  {
    title: "全真",
    items: ["师门传承谱系证明", "冠巾、传戒、戒牒、冠巾状牒等相关材料", "道场修行 / 职务证明", "身份证明、道装证件照、实践经历、推荐材料等"]
  },
  {
    title: "其他传承",
    items: ["传承来源说明", "师承证明", "推荐材料", "可核验的补充资料，由协会人工审核"]
  }
];

const materialChecklist = [
  "身份证明",
  "师承 / 传承材料",
  "正一 / 全真相关资质凭证",
  "近期白底道装证件照",
  "无刑事犯罪及邪教历史证明，如适用",
  "学历 / 培训证明，如适用",
  "道教实践报告",
  "推荐信 / 引荐人资料",
  "国际申请补充材料",
  "声明与承诺"
];

function ApplicationIcon({ name }: { name: IconBadgeName }) {
  return (
    <IconBadge
      name={name}
      size="lg"
      className="border-gold/45 bg-[#fffaf0] text-[#7F1D1D] shadow-[0_16px_34px_rgba(176,138,69,0.13)] [&_svg]:h-8 [&_svg]:w-8 [&_svg]:[stroke-width:1.75]"
    />
  );
}

export default function TaoistPriestCertificationPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({ certificationType: "道士资格认证" });
  const [files, setFiles] = useState<Record<string, File>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const stepTopRef = useRef<HTMLFormElement>(null);
  const hasMountedRef = useRef(false);
  const step = steps[current];

  const requiredIds = useMemo(() => step.groups.flatMap((group) => group.fields).filter((field) => field.required).map((field) => field.id), [step]);
  const allFields = useMemo(
    () =>
      steps.flatMap((item, stepIndex) =>
        item.groups.flatMap((group) =>
          group.fields.map((field) => ({
            ...field,
            stepIndex
          }))
        )
      ),
    []
  );

  const scrollToStepTop = () => {
    stepTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    scrollToStepTop();
  }, [current]);

  const setValue = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    setErrorMessage("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const setFileValue = (id: string, file: File | null) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (file) {
      const lowerName = file.name.toLowerCase();
      const hasAllowedExtension = allowedFileExtensions.some((extension) => lowerName.endsWith(extension));
      if (!allowedFileTypes.includes(file.type) && !hasAllowedExtension) {
        setErrors((prev) => ({ ...prev, [id]: "文件格式不支持，请上传 PDF、JPG、JPEG 或 PNG 文件" }));
        return;
      }
      if (file.size > maxFileSize) {
        setErrors((prev) => ({ ...prev, [id]: "文件大小超过限制，请上传不超过 2MB 的文件" }));
        return;
      }
    }
    setFiles((prev) => {
      const next = { ...prev };
      if (file) next[id] = file;
      else delete next[id];
      return next;
    });
    setValue(id, file?.name ?? "");
  };

  const validateStep = () => {
    const nextErrors: Record<string, string> = {};
    requiredIds.forEach((id) => {
      if (!values[id]) nextErrors[id] = "此项为必填";
    });
    step.groups.flatMap((group) => group.fields).forEach((field) => {
      if (field.kind === "email" && values[field.id] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[field.id])) {
        nextErrors[field.id] = "请输入有效邮箱地址";
      }
      if (field.id === "phone" && values[field.id] && !phonePattern.test(values[field.id])) {
        nextErrors[field.id] = "请填写有效联系电话";
      }
      if (field.id === "nameCn" && values[field.id] && (values[field.id].length < 2 || values[field.id].length > 50)) {
        nextErrors[field.id] = "姓名长度需为 2–50 个字符";
      }
      if (field.id === "practiceHistory" && values[field.id] && (values[field.id].length < 30 || values[field.id].length > 2000)) {
        nextErrors[field.id] = "请填写道教履历说明，且不少于 30 字、不超过 2000 字";
      }
      if (field.id === "applicationReason" && values[field.id] && (values[field.id].length < 20 || values[field.id].length > 1500)) {
        nextErrors[field.id] = "申请理由需不少于 20 字、不超过 1500 字";
      }
      if (field.id === "additionalNote" && values[field.id] && values[field.id].length > 1000) {
        nextErrors[field.id] = "补充备注不能超过 1000 字";
      }
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) requestAnimationFrame(scrollToStepTop);
    return Object.keys(nextErrors).length === 0;
  };

  const validateAllSteps = () => {
    const issues: ValidationIssue[] = [];
    const nextErrors: Record<string, string> = {};

    allFields.forEach((field) => {
      if (field.required && !values[field.id]) {
        const message = "此项为必填";
        nextErrors[field.id] = message;
        issues.push({ stepIndex: field.stepIndex, fieldId: field.id, fieldLabel: field.label, message });
      }

      if (field.kind === "email" && values[field.id] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[field.id])) {
        const message = "请输入有效邮箱地址";
        nextErrors[field.id] = message;
        issues.push({ stepIndex: field.stepIndex, fieldId: field.id, fieldLabel: field.label, message });
      }
      if (field.id === "phone" && values[field.id] && !phonePattern.test(values[field.id])) {
        const message = "请填写有效联系电话";
        nextErrors[field.id] = message;
        issues.push({ stepIndex: field.stepIndex, fieldId: field.id, fieldLabel: field.label, message });
      }
      if (field.id === "nameCn" && values[field.id] && (values[field.id].length < 2 || values[field.id].length > 50)) {
        const message = "姓名长度需为 2–50 个字符";
        nextErrors[field.id] = message;
        issues.push({ stepIndex: field.stepIndex, fieldId: field.id, fieldLabel: field.label, message });
      }
      if (field.id === "practiceHistory" && values[field.id] && (values[field.id].length < 30 || values[field.id].length > 2000)) {
        const message = "请填写道教履历说明，且不少于 30 字、不超过 2000 字";
        nextErrors[field.id] = message;
        issues.push({ stepIndex: field.stepIndex, fieldId: field.id, fieldLabel: field.label, message });
      }
      if (field.id === "applicationReason" && values[field.id] && (values[field.id].length < 20 || values[field.id].length > 1500)) {
        const message = "申请理由需不少于 20 字、不超过 1500 字";
        nextErrors[field.id] = message;
        issues.push({ stepIndex: field.stepIndex, fieldId: field.id, fieldLabel: field.label, message });
      }
      if (field.id === "additionalNote" && values[field.id] && values[field.id].length > 1000) {
        const message = "补充备注不能超过 1000 字";
        nextErrors[field.id] = message;
        issues.push({ stepIndex: field.stepIndex, fieldId: field.id, fieldLabel: field.label, message });
      }
    });

    setErrors(nextErrors);

    if (issues.length > 0) {
      setCurrent(issues[0].stepIndex);
      setErrorMessage(
        ["请补充以下必填资料后再提交：", ...issues.map((issue) => `- 第 ${issue.stepIndex + 1} 步：${issue.fieldLabel}`), "请返回对应步骤补充资料后重新提交。"].join("\n")
      );
      requestAnimationFrame(scrollToStepTop);
      return false;
    }

    return true;
  };

  const goNext = () => {
    if (validateStep()) setCurrent((value) => Math.min(value + 1, steps.length - 1));
  };

  const goPrev = () => {
    setErrors({});
    setCurrent((value) => Math.max(value - 1, 0));
  };

  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !validateAllSteps()) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      const fields = {
        certificationType: "taoist_priest",
        certificationPath: values.certificationPath as CertificationPath,
        requestedLevel: values.requestedLevel as CertificationLevel,
        applicantName: values.nameCn,
        applicantNameEn: values.nameEn,
        taoistName: values.taoistName,
        gender: values.gender,
        birthDate: values.birthDate,
        nationality: values.nationality,
        residence: values.residence,
        phone: values.phone,
        email: values.email,
        address: values.address,
        masterName: values.masterName,
        masterTaoistName: values.masterTaoistName,
        lineage: values.lineage,
        templeOrOrganization: values.templeName || values.masterTemple,
        sect: values.sectFullName || values.lineage,
        practiceYears: values.practiceTime,
        experienceSummary: values.practiceHistory,
        applicationReason: values.applicationReason,
        additionalNote: values.additionalNote,
        recommenderName: values.recommenderName,
        recommenderContact: values.recommenderContact,
        recommenderRelation: values.recommenderRelation,
        declarationAccepted: values.truthConfirm === "true" ? "true" : "false",
        ethicsConfirmed: values.dataUseConfirm === "true" ? "true" : "false",
        boundaryConfirmed: values.certificatePublicConfirm === "true" ? "true" : "false",
        dataUseAccepted: values.dataUseConfirm === "true" ? "true" : "false",
        certificatePublicAccepted: values.certificatePublicConfirm === "true" ? "true" : "false",
        termsAccepted: values.termsPrivacyConfirm === "true" ? "true" : "false",
        privacyAccepted: values.termsPrivacyConfirm === "true" ? "true" : "false",
        companyWebsite: String(new FormData(event.currentTarget).get("companyWebsite") || "")
      };

      Object.entries(fields).forEach(([key, value]) => formData.set(key, value || ""));
      Object.entries(files).forEach(([key, file]) => formData.set(key, file));

      const response = await fetch("/api/certification-applications", {
        method: "POST",
        body: formData
      });
      const result = (await response.json()) as CertificationSubmitResponse;

      if (!response.ok || !result.success) {
        if (result.success === false && result.fieldErrors) {
          const issues = Object.entries(result.fieldErrors).map(([fieldId, message]) => {
            const formFieldId = apiFieldToFormId[fieldId] || fieldId;
            const field = allFields.find((item) => item.id === formFieldId);
            return field ? `- 第 ${field.stepIndex + 1} 步：${field.label}（${message}）` : `- ${message}`;
          });
          setErrorMessage([result.message, ...issues].join("\n"));
        } else {
          setErrorMessage(result.success === false ? result.message : "认证申请提交未成功，请检查资料后重新提交。");
        }
        return;
      }

      router.push(`/application/success?type=certification&number=${encodeURIComponent(result.applicationNo)}`);
    } catch {
      setErrorMessage("认证申请提交服务暂时不可用，请稍后再试或联系协会秘书处。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHero
        actions={[
          { label: "认证申请", href: "/certification/taoist-priest" },
          { label: "证书公开核验", href: "/certificate-query" }
        ]}
        eyebrow="Taoist Priest Certification"
        title="道士资格认证"
        subtitle="Taoist Qualification Certification"
        intro="道士资格认证用于登记身份资料、师承关系、修学经历与证明材料，服务协会认证审核、档案建立与证书核验。"
        imageSrc="/images/itca/03-service-certification.png"
        imagePosition="center 52%"
        visualDescription="围绕申请资料、身份备案、审核流程与证书核验，建立规范、可信、可追溯的认证服务体系。"
        visualEyebrow="ITCA Certification"
        visualMark="Credential"
        visualSeal="认证"
        visualTitle="认证资料与备案"
      />

      <main className="mx-auto max-w-6xl px-5 pt-12 pb-12 sm:px-8 md:pt-14 lg:pt-16 lg:pb-16">
        <div className="border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-5 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)]">
          申请人需提交与道教身份、师承关系、学习经历及相关证明有关的资料。协会将依据提交材料进行资料核验、审核记录及认证建档。
        </div>
        <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {applicationNotices.map(([title, text]) => (
            <article className="rounded-2xl border border-[#e4ded0] bg-white/92 p-5 text-sm leading-7 text-[#5f5b52] shadow-[0_12px_28px_rgba(31,42,40,0.04)]" key={title}>
              <h2 className="text-base font-medium text-porcelain">{title}</h2>
              <p className="mt-3">{text}</p>
            </article>
          ))}
        </section>
        <section className="mt-6 rounded-2xl border border-[#e4ded0] bg-white/94 p-6 text-sm leading-8 text-[#5f5b52] shadow-aureate sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Material Guide</p>
          <h2 className="mt-3 font-serif text-2xl text-porcelain">材料清单说明</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {lineageMaterialGuides.map((guide) => (
              <article className="rounded-2xl border border-[#e4ded0] bg-[#fffdf8] p-5" key={guide.title}>
                <h3 className="text-base font-medium text-porcelain">{guide.title}</h3>
                <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm leading-7 text-[#5f5b52]">
                  {guide.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {materialChecklist.map((item) => (
              <div className="rounded-xl border border-[#e4ded0] bg-[#fbf8ef] px-4 py-3 text-sm text-[#5f5b52]" key={item}>
                {item}
              </div>
            ))}
          </div>
        </section>
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#e4ded0] bg-white/94 p-5 text-sm leading-7 text-[#5f5b52] shadow-aureate sm:flex-row sm:items-center sm:justify-between">
          <span>已提交认证申请？查询认证申请进度</span>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href="/application/query">
            查询认证申请进度
          </Link>
        </div>

        <StepNav current={current} onSelect={setCurrent} steps={steps.map((item) => item.title)} />

        <form ref={stepTopRef} className="scroll-mt-6 rounded-2xl border border-[#e4ded0] bg-white/92 p-6 shadow-aureate sm:p-8" onSubmit={submitApplication}>
          <input aria-hidden="true" autoComplete="off" className="hidden" name="companyWebsite" tabIndex={-1} type="text" />
          <div className="mb-7 flex items-start gap-4">
            <ApplicationIcon name={step.icon} />
            <div>
              <p className="text-xs tracking-[0.24em] text-gold">第 {current + 1} 步 / 共 {steps.length} 步</p>
              <h2 className="mt-2 font-serif text-3xl text-porcelain">{step.title}</h2>
              {step.help ? <p className="mt-3 text-sm leading-7 text-[#666666]">{step.help}</p> : null}
            </div>
          </div>

          <div className="grid gap-8">
            {step.groups.map((group) => (
              <div key={group.title}>
                <h3 className="mb-5 text-base font-medium text-porcelain">{group.title}</h3>
                <div className="grid gap-5 md:grid-cols-2">
                  {group.fields.map((field) => (
                    <FormField
                      errors={errors}
                      field={field}
                      key={field.id}
                      setFileValue={setFileValue}
                      setValue={setValue}
                      template={textareaTemplates[field.id]}
                      value={values[field.id] ?? ""}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {current === steps.length - 1 ? (
            <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_0.95fr]">
              <div className="rounded-2xl border border-[#e4ded0] bg-[#f8f7f3] p-5">
                <h3 className="text-base font-medium text-porcelain">提交前检查摘要</h3>
                <ul className="mt-4 grid gap-2 text-sm leading-6 text-[#666666]">
                  {step.checks?.map((item) => <li key={item}>· {item}</li>)}
                </ul>
              </div>
              <div className="rounded-2xl border border-gold/35 bg-[#fbf8ef] p-5 text-sm leading-7 text-[#5f5b52]">
                <h3 className="font-serif text-xl text-porcelain">认证说明与适用范围</h3>
                <p className="mt-3">提交认证申请前，请确认所填写资料真实、完整、可核验。ITCA 将根据申请人提交的身份资料、师承信息、学习经历、实践记录及相关证明材料进行审核与建档。</p>
                <p className="mt-3">申报认证等级仅作为审核参考，最终核定等级将根据资料完整性、师承证明、资质凭证、实践经历、推荐材料及认证委员会审核意见确定。</p>
                <p className="mt-3">本认证属于 ITCA / 国际道教与文化协会认证与备案体系内的资料审核、身份记录与证书核验服务，不具备政府机关行政许可、职业准入或宗教职务任命效力。认证结果不得用于与道教文化、协会活动、文化交流无关的商业宣传或误导性用途。</p>
              </div>
            </div>
          ) : null}

          {errorMessage ? <div className="mt-6 whitespace-pre-line border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-4 text-sm leading-7 text-[#7F1D1D]" role="alert">{errorMessage}</div> : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button className="rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-45" disabled={current === 0} onClick={goPrev} type="button">
              上一步
            </button>
            {current < steps.length - 1 ? (
              <button className="rounded-full bg-[#7F1D1D] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(127,29,29,0.12)]" onClick={goNext} type="button">
                下一步
              </button>
            ) : (
              <button className="rounded-full bg-[#7F1D1D] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(127,29,29,0.12)] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
                {isSubmitting ? "正在提交..." : "提交认证申请"}
              </button>
            )}
          </div>
        </form>
      </main>
    </>
  );
}

function StepNav({ current, onSelect, steps }: { current: number; onSelect: (index: number) => void; steps: string[] }) {
  return (
    <div className="my-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {steps.map((item, index) => (
        <button
          className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
            index === current
              ? "border-[#7F1D1D] bg-[#fffaf0] text-[#7F1D1D]"
              : index < current
                ? "border-gold/35 bg-[#fbf8ef] text-[#8a6b3e]"
                : "border-[#e4ded0] bg-white/72 text-[#666666]"
          }`}
          key={item}
          onClick={() => index <= current && onSelect(index)}
          type="button"
        >
          <span className="block text-xs tracking-[0.2em]">第 {index + 1} 步</span>
          <span className="mt-1 block font-medium">{item}</span>
        </button>
      ))}
    </div>
  );
}

function FormField({
  field,
  value,
  setValue,
  setFileValue,
  template,
  errors
}: {
  field: Field;
  value: string;
  setValue: (id: string, value: string) => void;
  setFileValue: (id: string, file: File | null) => void;
  template?: { hint: string; template: string };
  errors: Record<string, string>;
}) {
  const badge = field.required ? "*" : field.badge;
  const commonClass = "w-full rounded-xl border border-[#d8d0bf] bg-[#f8f7f3] px-4 py-3 text-sm text-porcelain outline-none transition focus:border-gold";

  return (
    <label className={field.kind === "textarea" || field.kind === "file" ? "grid gap-3 rounded-2xl bg-white/45 p-3 md:col-span-2" : "grid gap-3 rounded-2xl bg-white/45 p-3"}>
      <span className="flex flex-wrap items-center gap-2 text-sm font-medium leading-6 text-porcelain">
        <span>{field.label}</span>
        {badge ? (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs leading-5 ${field.required ? "bg-[#f8e8e8] text-[#7F1D1D]" : "bg-[#fbf8ef] text-[#8a6b3e]"}`}>
            {badge}
          </span>
        ) : null}
      </span>
      {field.kind === "select" ? (
        <select className={commonClass} value={value} onChange={(event) => setValue(field.id, event.target.value)}>
          <option value="">请选择</option>
          {field.options?.map((item) => {
            const option = typeof item === "string" ? { label: item, value: item } : item;
            return <option key={option.value} value={option.value}>{option.label}</option>;
          })}
        </select>
      ) : field.kind === "textarea" ? (
        <>
          <textarea className={`${commonClass} min-h-32 resize-y`} maxLength={field.id === "practiceHistory" ? 2000 : field.id === "applicationReason" ? 1500 : field.id === "additionalNote" ? 1000 : undefined} value={value} onChange={(event) => setValue(field.id, event.target.value)} />
          {template ? <FormTemplateHelper hint={template.hint} template={template.template} onApply={() => setValue(field.id, template.template)} /> : null}
        </>
      ) : field.kind === "file" ? (
        <span className="grid gap-3 rounded-2xl border border-dashed border-gold/45 bg-[#fbf8ef] p-5 text-sm text-[#666666]">
          <input accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="block w-full text-sm text-[#66594d] file:mr-4 file:rounded-full file:border-0 file:bg-[#7F1D1D] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" type="file" onChange={(event) => setFileValue(field.id, event.target.files?.[0] ?? null)} />
          <span className="block text-xs leading-5 text-[#8a6b3e]">请上传 PDF、JPG、JPEG 或 PNG 文件，单个文件不超过 2MB。上传材料仅用于申请审核，不公开展示；请确保材料清晰、完整、可读，且不得上传与申请无关的文件。</span>
        </span>
      ) : field.kind === "checkbox" ? (
        <span className="flex items-center gap-3 rounded-xl border border-[#d8d0bf] bg-[#f8f7f3] px-4 py-3">
          <input className="h-4 w-4 accent-[#7F1D1D]" type="checkbox" checked={value === "true"} onChange={(event) => setValue(field.id, event.target.checked ? "true" : "")} />
          <span className="text-sm text-[#5f5148]">确认</span>
        </span>
      ) : (
        <input className={commonClass} type={field.kind ?? "text"} value={value} onChange={(event) => setValue(field.id, event.target.value)} />
      )}
      {errors[field.id] ? <span className="text-xs text-[#7F1D1D]">{errors[field.id]}</span> : null}
    </label>
  );
}
