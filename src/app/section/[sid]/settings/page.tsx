import { PanePlaceholder } from "@/components/shell/pane-placeholder";

export default async function SettingsPage({ params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  return <PanePlaceholder title="課別設定" phase="A9" context={sid} />;
}
