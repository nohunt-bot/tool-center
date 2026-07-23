import { PanePlaceholder } from "@/components/shell/pane-placeholder";

export default async function DiagnosisPage({ params }: { params: Promise<{ tid: string }> }) {
  const { tid } = await params;
  return <PanePlaceholder title="深度診斷" phase="A7 / A8" context={tid} />;
}
