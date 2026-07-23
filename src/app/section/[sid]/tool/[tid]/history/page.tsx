import { PanePlaceholder } from "@/components/shell/pane-placeholder";

export default async function HistoryPage({ params }: { params: Promise<{ tid: string }> }) {
  const { tid } = await params;
  return <PanePlaceholder title="病史分析" phase="A4" context={tid} />;
}
