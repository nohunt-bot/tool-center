import { getTranslations } from "next-intl/server";
import { PanePlaceholder } from "@/components/shell/pane-placeholder";

export default async function HistoryPage({ params }: { params: Promise<{ tid: string }> }) {
  const { tid } = await params;
  const t = await getTranslations("toolPages");
  return <PanePlaceholder title={t("historyTitle")} phase="A4" context={tid} />;
}
