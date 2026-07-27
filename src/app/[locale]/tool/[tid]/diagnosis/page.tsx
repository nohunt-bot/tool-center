import { getTranslations } from "next-intl/server";
import { PanePlaceholder } from "@/components/shell/pane-placeholder";

export default async function DiagnosisPage({ params }: { params: Promise<{ tid: string }> }) {
  const { tid } = await params;
  const t = await getTranslations("toolPages");
  return <PanePlaceholder title={t("diagnosisTitle")} phase="A7 / A8" context={tid} />;
}
