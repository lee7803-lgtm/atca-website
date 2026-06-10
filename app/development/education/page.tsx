import type { Metadata } from "next";
import { V2InfoPage } from "@/components/v2/V2InfoPage";
import { developmentPageData } from "@/lib/v2/content";

const page = developmentPageData.education;

export const metadata: Metadata = {
  title: page.metadataTitle
};

export default function EducationCenterPage() {
  return <V2InfoPage page={page} />;
}

