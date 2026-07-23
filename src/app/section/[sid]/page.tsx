import { PanePlaceholder } from "@/components/shell/pane-placeholder";

export default async function OverviewPage({ params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  return <PanePlaceholder title="機台一覽" phase="A2" context={sid} />;
}
