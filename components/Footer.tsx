import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { CulturePattern } from "@/components/CulturePattern";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-warmGold/35 bg-inkBrown text-white">
      <CulturePattern variant="water" className="opacity-65" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.25fr_0.75fr_1fr_1.05fr]">
        <div>
          <div className="flex items-center gap-4">
            <BrandMark size="sm" />
            <div>
              <p className="font-serif text-3xl text-warmGold">ATCA</p>
              <p className="mt-1 text-sm font-medium text-white">东盟道教与文化协会</p>
              <p className="mt-2 text-xs uppercase tracking-[0.24em] text-white/55">
                Asean Taoism And Cultural Association
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/68">
            东盟道教与文化协会 ATCA，是面向东盟地区道教文化传承、道士资格认证、会员组织与国际交流合作的官方协会平台。
          </p>
        </div>
        <div>
          <p className="border-b border-warmGold/25 pb-3 text-sm font-medium text-white">快速导航</p>
          <div className="mt-4 grid gap-3 text-sm text-white/68">
            <Link href="/association">关于协会</Link>
            <Link href="/certification">认证体系</Link>
            <Link href="/membership">会员申请</Link>
            <Link href="/certificate-query">证书查询</Link>
            <Link href="/contact">联系合作</Link>
          </div>
        </div>
        <div>
          <p className="border-b border-warmGold/25 pb-3 text-sm font-medium text-white">联系方向</p>
          <div className="mt-4 grid gap-2 text-sm text-white/68">
            {["认证咨询", "会员申请", "机构合作", "文化交流", "网站信息更正"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <Link className="mt-5 inline-flex rounded-xl border border-warmGold/45 bg-white/8 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/12" href="/contact">
            联系入口
          </Link>
        </div>
        <div>
          <p className="border-b border-warmGold/25 pb-3 text-sm font-medium text-white">联系信息</p>
          <p className="mt-4 rounded-xl border border-warmGold/25 bg-white/6 px-4 py-3 text-sm font-medium text-warmGold">
            联系信息待完善
          </p>
          <p className="mt-4 text-xs leading-6 text-white/55">
            正式电话、邮箱与办公地址尚未在官网公开，后续以协会秘书处公告为准。
          </p>
          <p className="mt-6 border-b border-warmGold/25 pb-3 text-sm font-medium text-white">认证边界声明</p>
          <p className="mt-4 text-sm leading-7 text-white/68">
            ATCA 认证属于协会认证与备案性质，不替代任何国家、地区、宗教管理机构或法律机构的行政许可、执照或官方任命。
          </p>
        </div>
      </div>
      <div className="relative border-t border-white/10 px-5 py-5 text-center text-xs text-white/55">
        © 2026 东盟道教与文化协会 ATCA. All Rights Reserved.
      </div>
    </footer>
  );
}
