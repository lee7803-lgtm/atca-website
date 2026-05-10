import { CulturePattern } from "@/components/CulturePattern";
import { IconBadge } from "@/components/IconBadge";
import { Section } from "@/components/Section";

const fields = ["证书编号", "持证人姓名", "验证码或安全校验"];

const resultFields = [
  ["证书编号", "用于核对协会签发证书的唯一编号。"],
  ["持证人姓名", "用于与证书登记信息进行基础匹配。"],
  ["道名", "用于核对持证人在证书登记中的道名。"],
  ["道士等级", "用于显示证书登记的道士等级。"],
  ["签发日期", "用于显示证书经协会审定后的签发时间。"],
  ["有效期", "用于显示证书有效期限或复核期限。"]
];

const sampleFields = [
  ["Certificate No. / 证书编号", "ATCA-TAO-********"],
  ["Taoist Name / 道名", "****"],
  ["Full Name / 姓名", "****"],
  ["Taoist Ranking / 道士等级", "****"],
  ["Gender / 性别", "-"],
  ["Nationality / 国籍", "-"],
  ["Validity Period / 有效期", "YYYY/MM/DD - YYYY/MM/DD"],
  ["ID Document No. / 身份证件号码", "********"],
  ["Taoist Sect / 道派", "****"],
  ["Taoist Mentorship / 道教师承", "****"],
  ["Issuing Authority / 认证机构", "Asean Taoism And Cultural Association"]
];

function CertificateSample() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d8d0bf] bg-white p-5 shadow-[0_18px_45px_rgba(31,42,40,0.07)] sm:p-7">
      <div className="absolute right-6 top-5 font-serif text-7xl text-[#7F1D1D]/5">道</div>
      <div className="relative flex flex-col gap-5 border-b border-[#e4ded0] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">证书样式参考 / Sample Only</p>
          <h2 className="mt-3 font-serif text-2xl text-porcelain">Taoist Qualification Certificate</h2>
          <p className="mt-2 text-sm text-[#666666]">证书样式参考 / 仅作样式说明，不作为有效证书</p>
        </div>
        <div className="grid h-28 w-24 place-items-center border border-[#d8d0bf] bg-[#f8f7f3] text-xs uppercase tracking-[0.18em] text-[#8a6b3e]">
          Photo
        </div>
      </div>
      <div className="relative mt-6 grid gap-3">
        {sampleFields.map(([label, value]) => (
          <div className="grid gap-1 border-b border-[#eee7da] pb-3 last:border-b-0 sm:grid-cols-[13rem_1fr]" key={label}>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8a6b3e]">{label}</p>
            <p className="text-sm text-porcelain">{value}</p>
          </div>
        ))}
      </div>
      <div className="relative mt-6 border border-[#d8d0bf] bg-[#fbf8ef] px-4 py-3 text-center text-xs uppercase tracking-[0.22em] text-[#7F1D1D]">
        Sample Only / Not A Valid Certificate
      </div>
    </div>
  );
}

export default function CertificateQueryPage() {
  return (
    <>
      <section className="paper-wash relative overflow-hidden border-b border-[#e4ded0]">
        <CulturePattern variant="cloud" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.28em] text-gold">Certificate Query</p>
          <h1 className="font-serif text-4xl leading-tight text-porcelain sm:text-6xl">证书查询</h1>
          <p className="mt-4 font-serif text-2xl leading-snug text-[#8a6b3e]">Certificate Verification And Query</p>
          <p className="mt-6 max-w-3xl text-lg leading-9 text-[#5f5148]">
            本页面用于说明道士资格认证证书的查询方式与人工核验安排。线上查询服务暂未开放，最终结果以协会秘书处备案记录和人工核验为准。
          </p>
        </div>
      </section>

      <Section
        eyebrow="Query Notice"
        title="查询须知"
        intro="证书核验通常需要提供证书编号、持证人姓名、道名及其他必要资料。线上查询服务开放前，核验结果以协会秘书处备案记录和人工核验为准。"
      >
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-[#d8d0bf] bg-white/92 p-6 shadow-aureate sm:p-8">
            <div className="grid gap-5">
              {fields.map((item) => (
                <label className="grid gap-2" key={item}>
                  <span className="text-sm font-medium text-porcelain">{item}</span>
                  <input
                    className="h-12 rounded-xl border border-[#d8d0bf] bg-[#f8f7f3] px-4 text-sm text-[#666666] outline-none"
                    placeholder={`请输入${item}`}
                    readOnly
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#e4ded0] bg-[#f8f7f3] p-6 shadow-aureate sm:p-8">
            <IconBadge name="certificate" />
            <p className="mt-4 text-sm leading-7 text-[#666666]">
              线上查询服务暂未开放。本页面不显示具体证书结果，证书记录以协会秘书处备案资料及人工核验结果为准。
            </p>
          </div>
        </div>
      </Section>

      <Section eyebrow="Certificate Sample" title="证书样式参考" tone="soft">
        <CertificateSample />
      </Section>

      <Section title="核验所需资料">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl border border-[#e4ded0] bg-[#f8f7f3] p-6 shadow-aureate sm:p-8">
            <IconBadge name="certificate" />
            <div className="mt-6 grid gap-3">
              {resultFields.map(([label, value]) => (
                <div className="grid gap-2 rounded-xl border border-[#e4ded0] bg-white px-4 py-3 sm:grid-cols-[9rem_1fr]" key={label}>
                  <p className="text-sm font-medium text-porcelain">{label}</p>
                  <p className="text-sm leading-6 text-[#666666]">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#e4ded0] bg-white p-6 shadow-aureate sm:p-8">
            <div className="flex items-center gap-4">
              <IconBadge name="query" />
              <div>
                <p className="text-sm tracking-[0.18em] text-gold">人工核验</p>
                <h2 className="mt-2 font-serif text-2xl text-porcelain">人工核验结果</h2>
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-[#e4ded0] bg-[#f8f7f3] px-4 py-4">
              <p className="text-sm leading-7 text-[#666666]">
                如需确认证书记录、复核状态、暂停或撤销事项，应以协会秘书处书面确认为准。
              </p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
