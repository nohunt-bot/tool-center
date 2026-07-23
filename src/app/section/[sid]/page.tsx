import { OverviewPane } from "@/components/overview/overview-pane";
import { fixturesDataSource } from "@/data/fixtures";

/** 機台一覽（mockup L494–565）：使用者進課別後看到的第一頁 */
export default async function OverviewPage({ params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  const [tools, sections] = await Promise.all([
    fixturesDataSource.listTools(sid),
    fixturesDataSource.listSections(),
  ]);
  const sectionName = sections.find((section) => section.id === sid)?.name ?? sid;

  return <OverviewPane sectionId={sid} sectionName={sectionName} tools={tools} />;
}
