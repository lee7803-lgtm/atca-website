import type { Metadata } from "next";
import { CmsEditorMock } from "@/components/admin/CmsAdminViews";
import { requireAdminPage } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "页面编辑器｜国际道教与文化协会 ITCA"
};

export default function AdminContentPageEditor({ params }: { params: { slug: string } }) {
  requireAdminPage();
  return <CmsEditorMock channelId={params.slug} />;
}
