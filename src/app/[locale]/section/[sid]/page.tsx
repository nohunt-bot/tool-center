import { getLocale } from "next-intl/server";
import { OverviewPane } from "@/components/overview/overview-pane";
import { fixturesDataSource } from "@/data/fixtures";
import { sectionDisplayName } from "@/domain/tool";

/** 機台一覽（mockup L494–565）：使用者進課別後看到的第一頁 */
export default async function OverviewPage({ params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  const [tools, sections, locale] = await Promise.all([
    fixturesDataSource.listTools(sid),
    fixturesDataSource.listSections(),
    getLocale(),
  ]);
  // sid 是課代碼（URL 與權限鍵，見 @/domain/user 的 SectionId）；顯示名的
  // 選擇（哪個 locale 看哪個名字）在這裡做一次（R5），不要往 OverviewPane
  // 裡塞轉換邏輯——OverviewPane 只認得到手上這個現成字串。
  const section = sections.find((candidate) => candidate.code === sid);
  const sectionName = section ? sectionDisplayName(section, locale) : sid;

  return <OverviewPane sectionId={sid} sectionName={sectionName} tools={tools} />;
}
