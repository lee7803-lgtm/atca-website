"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";

type Field = {
  id: string;
  label: string;
  kind?: "text" | "email" | "date" | "select" | "textarea" | "file" | "checkbox";
  required?: boolean;
  badge?: "选填" | "按情况提交";
  options?: string[];
};

type Step = {
  title: string;
  icon: IconBadgeName;
  help?: string;
  groups: Array<{ title: string; fields: Field[] }>;
  checks?: string[];
};

const steps: Step[] = [
  {
    title: "个人基本资料",
    icon: "individual",
    groups: [
      {
        title: "个人身份与联络资料",
        fields: [
          { id: "nameCn", label: "中文姓名", required: true },
          { id: "nameEn", label: "英文姓名", badge: "选填" },
          { id: "photo", label: "2 寸道装照", kind: "file", badge: "按情况提交" },
          { id: "birthPlace", label: "出生地点", badge: "按情况提交" },
          { id: "birthDate", label: "出生日期", kind: "date", required: true },
          { id: "nationality", label: "国籍", required: true },
          { id: "age", label: "年龄", badge: "选填" },
          { id: "gender", label: "性别", kind: "select", required: true, options: ["男", "女", "其他"] },
          { id: "idNumber", label: "身份证件号码", required: true },
          { id: "nativePlace", label: "籍贯", badge: "按情况提交" },
          { id: "occupation", label: "职业", badge: "按情况提交" },
          { id: "mobile", label: "手提电话", required: true },
          { id: "email", label: "电邮", kind: "email", required: true },
          { id: "homeAddress", label: "住宅地址", badge: "按情况提交" }
        ]
      }
    ]
  },
  {
    title: "道教相关资料",
    icon: "value",
    groups: [
      {
        title: "道教背景与申请理由",
        fields: [
          { id: "taoistName", label: "道号", badge: "按情况提交" },
          { id: "entryDate", label: "入道时间", badge: "按情况提交" },
          { id: "deity", label: "皈依神仙", badge: "按情况提交" },
          { id: "temple", label: "所属道堂", badge: "按情况提交" },
          { id: "templePhone", label: "道堂电话", badge: "按情况提交" },
          { id: "templeAddress", label: "道堂地址", badge: "按情况提交" },
          { id: "templeEmail", label: "道堂电邮", kind: "email", badge: "按情况提交" },
          { id: "reason", label: "申请理由", kind: "textarea", required: true }
        ]
      }
    ]
  },
  {
    title: "介绍人 / 引荐人",
    icon: "contact",
    help: "介绍人和引荐人信息用于辅助协会审核申请人背景及入会理由，具体要求以后续正式申请表为准。",
    groups: [
      {
        title: "介绍与引荐资料",
        fields: [
          { id: "intro1Name", label: "介绍人一姓名", badge: "按情况提交" },
          { id: "intro1Sign", label: "介绍人一签署说明", badge: "按情况提交" },
          { id: "intro2Name", label: "介绍人二姓名", badge: "按情况提交" },
          { id: "intro2Sign", label: "介绍人二签署说明", badge: "按情况提交" },
          { id: "recommenderTitle", label: "引荐人职务", badge: "按情况提交" },
          { id: "recommenderName", label: "引荐人姓名", badge: "按情况提交" },
          { id: "recommenderSign", label: "引荐人签署说明", badge: "按情况提交" }
        ]
      }
    ]
  },
  {
    title: "确认与提交",
    icon: "membership",
    groups: [
      {
        title: "确认事项",
        fields: [
          { id: "truthConfirm", label: "资料真实性确认", kind: "checkbox", required: true },
          { id: "privacyConfirm", label: "个人资料用途确认", kind: "checkbox", required: true },
          { id: "membershipBoundary", label: "会员与认证关系确认", kind: "checkbox", required: true }
        ]
      }
    ],
    checks: ["姓名与身份证明文件是否一致", "电话和电邮是否可正常联系", "道教相关资料是否按实际情况填写", "介绍人或引荐人资料是否完整", "签署与申请日期是否齐备"]
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

export default function IndividualMembershipPage() {
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
        eyebrow="Individual Member"
        title="个人会员申请"
        subtitle="Individual Membership Application"
        intro="个人会员申请用于登记申请人的个人身份、联系方式、道教文化学习或修持背景、所属道堂及介绍人信息。申请资料将用于会员审核、档案管理及协会后续沟通。"
        imageSrc="/images/atca/member-gathering.jpg"
        imagePosition="center 46%"
        visualDescription="为个人会员提供申请登记、资料提交、服务对接与后续参与协会活动的基础入口。"
        visualEyebrow="Membership Service"
        visualMark="Member"
        visualSeal="个人"
        visualTitle="个人会员申请"
      />

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-5 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)]">
          请按步骤填写个人会员申请资料。带 <span className="font-semibold text-[#7F1D1D]">*</span> 的项目为必填项，其他资料可按实际情况补充。当前个人会员申请可通过官网在线提交，提交后请妥善保存申请编号以便查询进度。
        </div>

        <StepNav current={current} steps={steps.map((item) => item.title)} />

        <section className="rounded-2xl border border-[#e4ded0] bg-white/92 p-6 shadow-aureate sm:p-8">
          <div className="mb-7 flex items-start gap-4">
            <FormIcon name={step.icon} />
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
                  {group.fields.map((field) => <FormField errors={errors} field={field} key={field.id} setValue={setValue} value={values[field.id] ?? ""} />)}
                </div>
              </div>
            ))}
          </div>

          {current === steps.length - 1 ? (
            <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_0.95fr]">
              <SummaryList items={step.checks ?? []} title="提交前检查摘要" />
              <div className="rounded-2xl border border-gold/35 bg-[#fbf8ef] p-5 text-sm leading-7 text-[#5f5b52]">
                申请资料仅用于会员申请审核、协会档案管理及后续联系沟通。提交资料将由协会按内部流程保密存档。个人会员身份不等于道士资格认证，认证需另行申请。
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
              <Link className="rounded-full bg-[#7F1D1D] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(127,29,29,0.12)]" href="/member/apply">
                前往在线提交
              </Link>
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
    <div className="my-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
