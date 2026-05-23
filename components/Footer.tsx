import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { CulturePattern } from "@/components/CulturePattern";

const contactEmail = "aseantaoist@gmail.com";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-warmGold/35 bg-inkBrown text-white">
      <CulturePattern variant="water" className="opacity-65" />
      <div className="relative mx-auto grid max-w-7xl gap-x-8 gap-y-7 px-5 py-8 sm:px-8 sm:py-10 md:grid-cols-2 lg:grid-cols-[1.35fr_0.9fr_1.35fr_0.9fr] lg:py-11">
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
            本网站用于 ITCA / 国际道教与文化协会的协会介绍、认证申请、会员申请、证书核验与合作联系等信息服务。
          </p>
        </div>
        <div>
          <p className="border-b border-warmGold/20 pb-2 text-sm font-semibold text-warmGold">网站导航</p>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-white/70 sm:grid-cols-1">
            <Link href="/association">关于协会</Link>
            <Link href="/certification">认证体系</Link>
            <Link href="/membership">会员申请</Link>
            <Link href="/certificate-query">证书核验</Link>
            <Link href="/contact">联系合作</Link>
          </div>
        </div>
        <div>
          <p className="border-b border-warmGold/20 pb-2 text-sm font-semibold text-warmGold">服务说明</p>
          <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm text-white/70 sm:grid-cols-2 lg:grid-cols-2">
            {["网站说明", "申请须知", "资料使用说明", "核验说明", "重要提示"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-white/70 sm:grid-cols-2 lg:grid-cols-2">
            <Link href="/certificate-query">证书核验入口</Link>
            <Link href="/application/query">申请进度查询</Link>
            <Link href="/membership">隐私政策与服务条款</Link>
          </div>
        </div>
        <div>
          <p className="border-b border-warmGold/20 pb-2 text-sm font-semibold text-warmGold">联系方式</p>
          <a className="mt-3 block break-all text-sm leading-6 text-white/78 underline-offset-4 hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          <a className="mt-4 inline-flex rounded-lg border border-warmGold/45 bg-white/8 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/12" href={`mailto:${contactEmail}`}>
            发送邮件
          </a>
        </div>
      </div>
      <div className="relative border-t border-white/10 px-5 py-3.5 text-center text-xs leading-5 text-white/55 sm:py-4">
        <p className="mx-auto max-w-4xl text-white/58">
          相关申请与证书信息以 ITCA 官方审核及登记记录为准。证书状态以官网核验结果为准。
        </p>
        <p className="mt-1.5">
          © 2026 ITCA · International Taoisme And Cultural Association. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
