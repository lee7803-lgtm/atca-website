import type { Metadata } from "next";
import { CmsAssetsGrid } from "@/components/admin/CmsAdminViews";
import { requireAdminPage } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "媒体库｜国际道教与文化协会 ITCA"
};

export default function AdminContentAssetsPage() {
  requireAdminPage();
  return <CmsAssetsGrid />;
}
