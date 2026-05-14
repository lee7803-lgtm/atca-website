import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { CulturePattern } from "@/components/CulturePattern";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-warmGold/35 bg-inkBrown text-white">
      <CulturePattern variant="water" className="opacity-65" />
      <div className="relative mx-auto grid max-w-7xl gap-x-8 gap-y-7 px-5 py-8 sm:px-8 sm:py-10 md:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr_1fr] lg:py-11">
        <div className="md:col-span-2 lg:col-span-1">
          <div className="flex max-w-full flex-wrap items-center gap-x-4 gap-y-3 sm:flex-nowrap">
            <BrandMark size="sm" className="h-12 w-12" />
            <div className="min-w-0 max-w-[19rem]">
              <p className="font-serif text-[1.7rem] leading-none text-warmGold sm:text-[1.85rem]">ITCA</p>
              <p className="mt-1.5 text-sm font-medium leading-5 text-white">国际道教与文化协会</p>
              <p className="mt-1 max-w-full text-[11px] leading-5 text-white/66 sm:text-xs">
                International Taoisme And Cultural Association
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/70 sm:mt-5">
            ITCA · International Taoisme And Cultural Association（国际道教与文化协会）面向道教文化传承、认证建档、会员服务与国际交流合作提供协会平台服务。
          </p>
        </div>
        <div>
          <p className="border-b border-warmGold/20 pb-2 text-sm font-semibold text-warmGold">网站导航</p>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-white/70 sm:grid-cols-1">
            <Link href="/association">关于协会</Link>
            <Link href="/certification">认证体系</Link>
            <Link href="/membership">会员申请</Link>
            <Link href="/certificate-query">证书查询</Link>
            <Link href="/contact">联系合作</Link>
          </div>
        </div>
        <div>
          <p className="border-b border-warmGold/20 pb-2 text-sm font-semibold text-warmGold">服务方向</p>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-white/70 sm:grid-cols-1">
            {["认证咨询", "会员申请", "机构合作", "文化交流", "资料核验"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="border-b border-warmGold/20 pb-2 text-sm font-semibold text-warmGold">联系方式</p>
          <p className="mt-3 text-sm leading-6 text-white/70">
            请以后续官网公告或协会秘书处通知为准。
          </p>
          <Link className="mt-4 inline-flex rounded-lg border border-warmGold/45 bg-white/8 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/12" href="/contact">
            联系入口
          </Link>
        </div>
      </div>
      <div className="relative border-t border-white/10 px-5 py-3.5 text-center text-xs leading-5 text-white/55 sm:py-4">
        <p className="mx-auto max-w-4xl text-white/58">
          ITCA 认证属于协会资料核验与建档服务，不等同于政府许可、法定职业资格或宗教职务任命。
        </p>
        <p className="mt-1.5">
          © 2026 ITCA · International Taoisme And Cultural Association. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
