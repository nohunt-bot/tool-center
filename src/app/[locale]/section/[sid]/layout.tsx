import { notFound } from "next/navigation";
import { ControlBar } from "@/components/shell/control-bar";
import { Header } from "@/components/shell/header";
import { fixturesDataSource } from "@/data/fixtures";
import { canEnterSection } from "@/lib/permission";

export default async function SectionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sid: string }>;
}) {
  const { sid } = await params;
  const [user, sections, tools] = await Promise.all([
    fixturesDataSource.getCurrentUser(),
    fixturesDataSource.listSections(),
    // M1：機台清單（含 attributes 側欄用的 attributesByToolId）在這裡
    // （Server Component）取，只把 ToolSummary[]（不含 attributes）當 prop
    // 往下傳給 ControlBar。ControlBar 是 client component，若它自己
    // import @/data/fixtures/tools 來拿機台清單，整個 data-layer 模組
    // （含 attributesByToolId：機台內部 IP、PE/EE 姓名、vendor、TAP/TCS
    // 版本）就會被打進 client bundle——attributesByToolId 沒有被匯出，
    // 但 tree-shaker 沒有把它連同 getToolFixture 一起消掉，實測會直接
    // 洩漏進 .next/static/chunks/*.js（見 M1 驗收的三條 grep）。
    // Header 已經是這個模式（layout.tsx 算好 navSections 再傳下去），這裡
    // 只是讓 ControlBar 跟上同一個邊界。
    fixturesDataSource.listTools(sid),
  ]);
  const section = sections.find((candidate) => candidate.code === sid);

  // 無支援權限的課別，直接改 URL 也進不去（A1.11）。
  // B1.3 之後這個判斷會查使用者表並由 middleware 在 server 邊界擋下。
  //
  // R3：原本這裡查的是 navSectionsFixture 的靜態 accessible 欄位（跟
  // sectionsFixture 是同一份課別資料的重複副本）；收斂掉那份重複後，
  // accessible 改成用 canEnterSection() 現場算——這本來就該是動態的，不是
  // 課別本身的屬性。
  if (!section || !canEnterSection(user, sid)) {
    notFound();
  }

  const navSections = sections.map((candidate) => ({
    ...candidate,
    accessible: canEnterSection(user, candidate.code),
  }));

  return (
    <>
      <Header sectionId={sid} sections={navSections} />
      <ControlBar sectionId={sid} tools={tools} />
      <div className="flex-1 overflow-hidden">{children}</div>
    </>
  );
}
