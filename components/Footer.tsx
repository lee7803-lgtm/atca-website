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
            本网站用于 ITCA / 国际道教与文化协会的关于协会、道教文化、发展中心、会员体系、认证体系、查询核验、发展合作、资料中心与用户服务等信息。
          </p>
        </div>
        <div>
          <p className="border-b border-warmGold/20 pb-2 text-sm font-semibold text-warmGold">网站导航</p>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-white/70 sm:grid-cols-1">
            <Link href="/intro">关于协会</Link>
            <Link href="/faith">道教信仰</Link>
            <Link href="/doctrine">教理教义</Link>
            <Link href="/exchange">文化交流</Link>
            <Link href="/development">发展中心</Link>
            <Link href="/membership">会员体系</Link>
            <Link href="/certification">认证体系</Link>
            <Link href="/verification">查询核验</Link>
            <Link href="/cooperation">发展合作</Link>
            <Link href="/data">资料中心</Link>
          </div>
        </div>
        <div>
          <p className="border-b border-warmGold/20 pb-2 text-sm font-semibold text-warmGold">关于与服务</p>
          <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm text-white/70 sm:grid-cols-2 lg:grid-cols-2">
            <Link href="/intro">协会介绍</Link>
            <Link href="/rules">规章制度</Link>
            <Link href="/organization">组织架构</Link>
            <Link href="/contact">联系协会</Link>
            <Link href="/membership">会员申请</Link>
            <Link href="/certification">认证体系</Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-white/70 sm:grid-cols-2 lg:grid-cols-2">
            <Link href="/verification">查询核验</Link>
            <Link href="/certificate-query">证书公开核验</Link>
            <Link href="/member-query">会员公开核验</Link>
            <Link href="/application/query">申请进度查询</Link>
            <Link href="/account/login">登录 / 注册</Link>
            <Link href="/admin">管理入口</Link>
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
          相关申请与证书信息以 ITCA 官方审核及登记记录为准。公开核验结果以官网查询页为准。
        </p>
        <p className="mt-1.5">
          © 2026 ITCA · International Taoisme And Cultural Association. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
