import { getTranslations } from "next-intl/server";
import { PanePlaceholder } from "@/components/shell/pane-placeholder";

export default async function SettingsPage({ params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  const t = await getTranslations("settingsPage");
  return <PanePlaceholder title={t("title")} phase="A9" context={sid} />;
}
