import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "东盟道教与文化协会 ATCA 官网",
  description: "东盟道教与文化协会 ATCA，是面向东盟地区道教文化传承、道士资格认证、会员组织与国际交流合作的官方协会平台。",
  keywords: ["东盟道教与文化协会", "ATCA", "道士资格认证", "道教文化", "会员申请", "证书查询", "国际文化交流"]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        <div className="grain" />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
