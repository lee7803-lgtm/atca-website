"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdmin) {
    return (
      <>
        <div className="grain" />
        {children}
      </>
    );
  }

  return (
    <>
      <div className="grain" />
      <Header />
      <main className="w-full max-w-full overflow-x-hidden">{children}</main>
      <Footer />
    </>
  );
}
