import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { announcements, getAnnouncement } from "@/lib/announcements";

export function generateStaticParams() {
  return announcements.map((item) => ({ slug: item.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const announcement = getAnnouncement(params.slug);
  return {
    title: announcement ? `${announcement.title}｜ITCA 协会公告` : "协会公告｜ITCA"
  };
}

export default function AnnouncementDetailPage({ params }: { params: { slug: string } }) {
  const announcement = getAnnouncement(params.slug);
  if (!announcement) notFound();

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12 lg:py-16">
      <article className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-10">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Announcement</p>
        <h1 className="mt-4 font-serif text-3xl leading-tight text-porcelain sm:text-4xl">{announcement.title}</h1>
        <p className="mt-4 text-sm text-[#8a6b3e]">{announcement.date}</p>
        <div className="mt-8 grid gap-5 text-sm leading-8 text-[#5f5b52]">
          {announcement.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link className="w-full rounded-full bg-[#7F1D1D] px-6 py-3 text-center text-sm font-semibold text-white sm:w-auto" href="/">
            返回首页
          </Link>
          <Link className="w-full rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink sm:w-auto" href="/#announcements">
            返回公告区域
          </Link>
        </div>
      </article>
    </main>
  );
}
