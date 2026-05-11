"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";

type Field = {
  id: string;
  label: string;
  kind?: "text" | "email" | "select" | "textarea" | "file" | "checkbox" | "checkboxGroup";
  required?: boolean;
  badge?: "选填" | "按情况提交" | "建议提交";
  options?: string[];
};

type Step = {
  title: string;
  icon: IconBadgeName;
  groups: Array<{ title: string; fields: Field[] }>;
  checks?: string[];
};

const steps: Step[] = [
  {
    title: "机构基本资料",
    icon: "institution",
    groups: [
      {
        title: "机构基础信息",
        fields: [
          { id: "orgName", label: "机构名称", required: true },
          { id: "orgNameEn", label: "英文名称", badge: "选填" },
          { id: "country", label: "注册国家 / 地区", badge: "按情况提交" },
          { id: "regNo", label: "注册编号", badge: "按情况提交" },
          { id: "foundedAt", label: "成立时间", badge: "按情况提交" },
          { id: "orgType", label: "机构类型", kind: "select", required: true, options: ["宫观", "道堂", "文化机构", "社团组织", "研究机构", "其他"] },
          { id: "orgAddress", label: "机构地址", required: true },
          { id: "website", label: "官方网站或公开资料链接", badge: "选填" }
        ]
      }
    ]
  },
  {
    title: "负责人 / 联系人资料",
    icon: "individual",
    groups: [
      {
        title: "负责人及联系人",
        fields: [
          { id: "principalName", label: "负责人姓名", required: true },
          { id: "principalTitle", label: "职务", required: true },
          { id: "contactName", label: "联系人姓名", required: true },
          { id: "phone", label: "联系电话", required: true },
          { id: "email", label: "电邮", kind: "email", required: true },
          { id: "mailingAddress", label: "通讯地址", badge: "按情况提交" }
        ]
      }
    ]
  },
  {
    title: "机构背景与合作方向",
    icon: "cooperation",
    groups: [
      {
        title: "机构背景说明",
        fields: [
          { id: "intro", label: "机构简介", kind: "textarea", required: true },
          { id: "scope", label: "主要业务或活动范围", kind: "textarea", required: true },
          { id: "cultureBackground", label: "道教文化或传统文化相关背景", kind: "textarea", badge: "按情况提交" },
          { id: "members", label: "现有成员或服务对象概况", badge: "按情况提交" },
          { id: "records", label: "过往活动或合作记录", badge: "按情况提交" },
          { id: "directions", label: "合作方向", kind: "checkboxGroup", required: true, options: ["认证咨询", "会员合作", "机构合作", "文化交流", "学术研究与资料整理"] }
        ]
      }
    ]
  },
  {
    title: "申请材料",
    icon: "certificate",
    groups: [
      {
        title: "材料上传",
        fields: [
          { id: "registrationProof", label: "机构注册或登记证明", kind: "file", badge: "按情况提交" },
          { id: "principalId", label: "负责人身份证明", kind: "file", badge: "建议提交" },
          { id: "orgProfile", label: "机构简介资料", kind: "file", required: true },
          { id: "activityProof", label: "机构活动资料或过往合作资料", kind: "file", badge: "按情况提交" },
          { id: "recommendation", label: "推荐或介绍资料", kind: "file", badge: "按情况提交" },
          { id: "otherDocs", label: "其他协会要求补充的材料", kind: "file", badge: "按情况提交" }
        ]
      }
    ]
  },
  {
    title: "确认与提交",
    icon: "value",
    groups: [
      {
        title: "确认事项",
        fields: [
          { id: "truthConfirm", label: "资料真实性确认", kind: "checkbox", required: true },
          { id: "authorityConfirm", label: "机构授权提交确认", kind: "checkbox", required: true },
          { id: "boundaryConfirm", label: "机构会员边界确认", kind: "checkbox", required: true }
        ]
      }
    ],
    checks: ["机构名称是否与注册或公开资料一致", "负责人和联系人信息是否完整", "机构背景和合作方向是否说明清楚", "相关证明材料是否清晰可核验", "联系方式是否可用于后续沟通"]
  }
];

function FormIcon({ name }: { name: IconBadgeName }) {
  return (
    <IconBadge
      name={name}
      size="lg"
      className="border-gold/45 bg-[#fffaf0] text-[#7F1D1D] shadow-[0_16px_34px_rgba(176,138,69,0.13)] [&_svg]:h-8 [&_svg]:w-8 [&_svg]:[stroke-width:1.75]"
    />
  );
}

export default function InstitutionalMembershipPage() {
  const [current, setCurrent] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const step = steps[current];
  const requiredIds = useMemo(() => step.groups.flatMap((group) => group.fields).filter((field) => field.required).map((field) => field.id), [step]);

  const setValue = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const validateStep = () => {
    const nextErrors: Record<string, string> = {};
    requiredIds.forEach((id) => {
      if (!values[id]) nextErrors[id] = "此项为必填";
    });
    step.groups.flatMap((group) => group.fields).forEach((field) => {
      if (field.kind === "email" && values[field.id] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[field.id])) nextErrors[field.id] = "邮箱格式不正确";
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  return (
    <>
      <PageHero
        eyebrow="Institutional Member"
        title="机构会员申请"
        subtitle="Institutional Membership Application"
        intro="机构会员申请用于登记机构基础资料、负责人或联系人信息、机构背景、合作方向及相关证明材料。申请资料将用于协会审核、档案管理与后续合作沟通。"
        imageSrc="/images/atca/cooperation-cultural-exchange.jpg"
        imagePosition="center 48%"
        visualDescription="面向文化机构、宫观组织、研究机构及合作单位，提供机构会员申请与合作服务入口。"
        visualEyebrow="Organization Member"
        visualMark="Member"
        visualSeal="机构"
        visualTitle="机构会员申请"
      />

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-5 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)]">
          请按步骤填写机构会员申请资料。带 <span className="font-semibold text-[#7F1D1D]">*</span> 的项目为必填项，其他资料可按实际情况补充。线上提交服务暂未开放，申请资料提交方式以后续协会正式通知为准。
        </div>

        <StepNav current={current} steps={steps.map((item) => item.title)} />

        <section className="rounded-2xl border border-[#e4ded0] bg-white/92 p-6 shadow-aureate sm:p-8">
          <div className="mb-7 flex items-start gap-4">
            <FormIcon name={step.icon} />
            <div>
              <p className="text-xs tracking-[0.24em] text-gold">第 {current + 1} 步 / 共 {steps.length} 步</p>
              <h2 className="mt-2 font-serif text-3xl text-porcelain">{step.title}</h2>
            </div>
          </div>

          <div className="grid gap-8">
            {step.groups.map((group) => (
              <div key={group.title}>
                <h3 className="mb-5 text-base font-medium text-porcelain">{group.title}</h3>
                <div className="grid gap-5 md:grid-cols-2">
                  {group.fields.map((field) => <FormField errors={errors} field={field} key={field.id} setValue={setValue} value={values[field.id] ?? ""} />)}
                </div>
              </div>
            ))}
          </div>

          {current === steps.length - 1 ? (
            <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_0.95fr]">
              <SummaryList items={step.checks ?? []} title="提交前检查摘要" />
              <div className="rounded-2xl border border-gold/35 bg-[#fbf8ef] p-5 text-sm leading-7 text-[#5f5b52]">
                机构会员身份属于协会会员服务与合作沟通体系，不等同于认证授权、商业授权、行政许可或任何法定资质。涉及道士资格认证、证书签发或认证备案事项，需另行按照认证流程办理。
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button className="rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-45" disabled={current === 0} onClick={() => setCurrent((value) => Math.max(value - 1, 0))} type="button">
              上一步
            </button>
            {current < steps.length - 1 ? (
              <button className="rounded-full bg-[#7F1D1D] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(127,29,29,0.12)]" onClick={() => validateStep() && setCurrent((value) => Math.min(value + 1, steps.length - 1))} type="button">
                下一步
              </button>
            ) : (
              <button className="cursor-not-allowed rounded-full border border-[#d8d0bf] bg-[#efe4d3] px-6 py-3 text-sm font-semibold text-[#8a6b3e]" disabled type="button">
                提交服务暂未开放
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="text-sm font-medium text-[#8a6b3e] hover:text-ink" href="/contact">联系协会咨询</Link>
            <Link className="text-sm font-medium text-[#8a6b3e] hover:text-ink" href="/membership">返回会员申请</Link>
          </div>
        </section>
      </main>
    </>
  );
}

function StepNav({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="my-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((item, index) => (
        <div className={`rounded-2xl border px-4 py-3 text-left text-sm ${index === current ? "border-[#7F1D1D] bg-[#fffaf0] text-[#7F1D1D]" : index < current ? "border-gold/35 bg-[#fbf8ef] text-[#8a6b3e]" : "border-[#e4ded0] bg-white/72 text-[#666666]"}`} key={item}>
          <span className="block text-xs tracking-[0.2em]">第 {index + 1} 步</span>
          <span className="mt-1 block font-medium">{item}</span>
        </div>
      ))}
    </div>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-[#e4ded0] bg-[#f8f7f3] p-5">
      <h3 className="text-base font-medium text-porcelain">{title}</h3>
      <ul className="mt-4 grid gap-2 text-sm leading-6 text-[#666666]">
        {items.map((item) => <li key={item}>· {item}</li>)}
      </ul>
    </div>
  );
}

function FormField({ field, value, setValue, errors }: { field: Field; value: string; setValue: (id: string, value: string) => void; errors: Record<string, string> }) {
  const badge = field.required ? "*" : field.badge;
  const commonClass = "w-full rounded-xl border border-[#d8d0bf] bg-[#f8f7f3] px-4 py-3 text-sm text-porcelain outline-none transition focus:border-gold";

  if (field.kind === "checkboxGroup") {
    const selected = value ? value.split("|") : [];
    return (
      <div className="grid gap-3 rounded-2xl bg-white/45 p-3 md:col-span-2">
        <span className="flex flex-wrap items-center gap-2 text-sm font-medium leading-6 text-porcelain">
          <span>{field.label}</span>
          <span className="inline-flex rounded-full bg-[#f8e8e8] px-2 py-0.5 text-xs leading-5 text-[#7F1D1D]">*</span>
        </span>
        <div className="grid gap-3 rounded-2xl border border-[#d8d0bf] bg-[#f8f7f3] p-4 sm:grid-cols-2">
          {field.options?.map((item) => (
            <label className="flex items-center gap-3 text-sm text-[#5f5148]" key={item}>
              <input
                className="h-4 w-4 accent-[#7F1D1D]"
                checked={selected.includes(item)}
                type="checkbox"
                onChange={(event) => {
                  const next = event.target.checked ? [...selected, item] : selected.filter((valueItem) => valueItem !== item);
                  setValue(field.id, next.join("|"));
                }}
              />
              {item}
            </label>
          ))}
        </div>
        {errors[field.id] ? <span className="text-xs text-[#7F1D1D]">{errors[field.id]}</span> : null}
      </div>
    );
  }

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
          <input className="block w-full text-sm text-[#66594d] file:mr-4 file:rounded-full file:border-0 file:bg-[#7F1D1D] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" type="file" onChange={(event) => setValue(field.id, event.target.files?.[0]?.name ?? "")} />
          <span className="block text-xs leading-5 text-[#8a6b3e]">文件提交服务暂未开放，请以后续协会正式提交要求为准。</span>
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
