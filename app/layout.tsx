import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "国际道教与文化协会 ITCA 官网",
  description: "ITCA · International Taoisme And Cultural Association（国际道教与文化协会 / Persatuan Kebudayaan Dan Taoism Antarabangsa），面向道教文化传承、道士资格认证、会员组织与国际交流合作。",
  keywords: ["国际道教与文化协会", "Persatuan Kebudayaan Dan Taoism Antarabangsa", "International Taoisme And Cultural Association", "ITCA", "道士资格认证", "道教文化", "会员申请", "证书查询", "国际文化交流"]
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
