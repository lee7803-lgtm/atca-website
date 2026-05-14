"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import type { CertificationSubmitResponse } from "@/types/certification";

type Field = {
  id: string;
  label: string;
  kind?: "text" | "email" | "date" | "select" | "textarea" | "file" | "checkbox";
  required?: boolean;
  badge?: "选填" | "按情况提交" | "建议提交" | "按协会要求提交" | "适用于国际申请情形";
  options?: string[];
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
          { id: "nameCn", label: "姓名（中文）", required: true },
          { id: "nameEn", label: "英文名 / 拼音", required: true },
          { id: "taoistName", label: "法名 / 道名", required: true },
          { id: "gender", label: "性别", kind: "select", required: true, options: ["男", "女", "其他"] },
          { id: "birthDate", label: "出生日期", kind: "date", required: true },
          { id: "nationality", label: "国籍", required: true },
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
          { id: "lineage", label: "传承流派", kind: "select", required: true, options: ["正一教", "全真教", "其他"] },
          { id: "sectFullName", label: "教派名称全称", badge: "按情况提交" },
          { id: "masterName", label: "师父姓名 / 道名", required: true },
          { id: "masterTemple", label: "师父所属流派 / 道场", required: true },
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
          { id: "practiceHistory", label: "近五年实践经历", kind: "textarea", required: true },
          { id: "practiceType", label: "实践类型", badge: "按情况提交" },
          { id: "practiceTime", label: "时间", badge: "按情况提交" },
          { id: "practicePlace", label: "地点", badge: "按情况提交" },
          { id: "practiceRole", label: "担任角色", badge: "按情况提交" }
        ]
      },
      {
        title: "引荐人信息",
        fields: [
          { id: "recommenderName", label: "引荐人姓名", badge: "按情况提交" },
          { id: "recommenderContact", label: "引荐人联系方式", badge: "按情况提交" },
          { id: "recommenderSignature", label: "引荐人签署说明", badge: "按情况提交" }
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
          { id: "truthConfirm", label: "资料真实性确认", kind: "checkbox", required: true },
          { id: "ethicsConfirm", label: "遵守《道士伦理守则》", kind: "checkbox", required: true },
          { id: "boundaryConfirm", label: "认证边界确认", kind: "checkbox", required: true }
        ]
      }
    ],
    checks: ["身份资料是否与证件一致", "师承信息是否真实完整", "资质文件是否清晰可核验", "实践经历是否有时间、地点、角色", "联系方式是否可用于后续补充资料"]
  }
];

const apiFieldToFormId: Record<string, string> = {
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
  lineage: "lineage",
  sect: "lineage",
  experienceSummary: "practiceHistory",
  declarationAccepted: "truthConfirm",
  ethicsConfirmed: "ethicsConfirm",
  boundaryConfirmed: "boundaryConfirm"
};

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
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
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
        nextErrors[field.id] = "邮箱格式不正确";
      }
    });
    setErrors(nextErrors);
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
        const message = "邮箱格式不正确";
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
        masterTaoistName: values.masterName,
        lineage: values.lineage,
        templeOrOrganization: values.templeName || values.masterTemple,
        sect: values.sectFullName || values.lineage,
        practiceYears: values.practiceTime,
        experienceSummary: values.practiceHistory,
        declarationAccepted: values.truthConfirm === "true" ? "true" : "false",
        ethicsConfirmed: values.ethicsConfirm === "true" ? "true" : "false",
        boundaryConfirmed: values.boundaryConfirm === "true" ? "true" : "false"
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
        eyebrow="Taoist Priest Certification"
        title="道士资格认证"
        subtitle="Taoist Qualification Certification"
        intro="国际道教与文化协会《道士资格认证》用于登记申请人的道教身份、师承传承、宗派背景、修道经历与相关证明材料，并纳入协会道士资格备案与审核流程。"
        imageSrc="/images/itca/03-service-certification.png"
        imagePosition="center 52%"
        visualDescription="围绕申请资料、身份备案、审核流程与证书核验，建立规范、可信、可追溯的认证服务体系。"
        visualEyebrow="ITCA Certification"
        visualMark="Credential"
        visualSeal="认证"
        visualTitle="认证资料与备案"
      />

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-5 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)]">
          申请人需提交与道教身份、师承关系、学习经历及相关证明有关的资料。协会将依据提交材料进行资料核验、审核记录及认证建档。
        </div>
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#e4ded0] bg-white/94 p-5 text-sm leading-7 text-[#5f5b52] shadow-aureate sm:flex-row sm:items-center sm:justify-between">
          <span>已提交认证申请？查询认证申请进度</span>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href="/application/query">
            查询认证申请进度
          </Link>
        </div>

        <StepNav current={current} onSelect={setCurrent} steps={steps.map((item) => item.title)} />

        <form className="rounded-2xl border border-[#e4ded0] bg-white/92 p-6 shadow-aureate sm:p-8" onSubmit={submitApplication}>
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
                    <FormField errors={errors} field={field} key={field.id} setFileValue={setFileValue} setValue={setValue} value={values[field.id] ?? ""} />
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
                <p className="mt-3">ITCA 道士资格认证属于协会认证与资料建档服务，不等同于政府许可、行政许可、法定职业资格、商业授权、宗教职务任命或任何法定执业许可。</p>
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
  errors
}: {
  field: Field;
  value: string;
  setValue: (id: string, value: string) => void;
  setFileValue: (id: string, file: File | null) => void;
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
          {field.options?.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      ) : field.kind === "textarea" ? (
        <textarea className={`${commonClass} min-h-32 resize-y`} value={value} onChange={(event) => setValue(field.id, event.target.value)} />
      ) : field.kind === "file" ? (
        <span className="grid gap-3 rounded-2xl border border-dashed border-gold/45 bg-[#fbf8ef] p-5 text-sm text-[#666666]">
          <input className="block w-full text-sm text-[#66594d] file:mr-4 file:rounded-full file:border-0 file:bg-[#7F1D1D] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" type="file" onChange={(event) => setFileValue(field.id, event.target.files?.[0] ?? null)} />
          <span className="block text-xs leading-5 text-[#8a6b3e]">当前表单先记录文件名称，原件或影本可按协会后续审核要求补充。</span>
        </span>
      ) : field.kind === "checkbox" ? (
        <span className="flex items-center gap-3 rounded-xl border border-[#d8d0bf] bg-[#f8f7f3] px-4 py-3">
          <input className="h-4 w-4 accent-[#7F1D1D]" type="checkbox" checked={value === "true"} onChange={(event) => setValue(field.id, event.target.checked ? "true" : "")} />
          <span className="text-sm text-[#5f5148]">我已阅读并确认</span>
        </span>
      ) : (
        <input className={commonClass} type={field.kind ?? "text"} value={value} onChange={(event) => setValue(field.id, event.target.value)} />
      )}
      {errors[field.id] ? <span className="text-xs text-[#7F1D1D]">{errors[field.id]}</span> : null}
    </label>
  );
}
