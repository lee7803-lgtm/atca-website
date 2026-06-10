import type { Metadata } from "next";
import { V2InfoPage } from "@/components/v2/V2InfoPage";
import { v2Pages } from "@/lib/v2/content";

export const metadata: Metadata = {
  title: v2Pages.rules.metadataTitle
};

export default function RulesPage() {
  return <V2InfoPage page={v2Pages.rules} />;
}

