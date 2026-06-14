import type { Metadata } from "next";
import { CmsBlockLibrary } from "@/components/admin/CmsAdminViews";
import { requireAdminPage } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "版式库｜国际道教与文化协会 ITCA"
};

export default function AdminContentBlockLibraryPage() {
  requireAdminPage();
  return <CmsBlockLibrary />;
}
