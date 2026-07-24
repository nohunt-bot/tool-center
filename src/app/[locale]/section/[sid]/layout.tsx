import { notFound } from "next/navigation";
import { ControlBar } from "@/components/shell/control-bar";
import { Header } from "@/components/shell/header";
import { NAV_SECTIONS } from "@/lib/nav-fixtures";

export default async function SectionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sid: string }>;
}) {
  const { sid } = await params;
  const section = NAV_SECTIONS.find((candidate) => candidate.id === sid);

  // 無支援權限的課別，直接改 URL 也進不去（A1.11）。
  // B1.3 之後這個判斷會查使用者表並由 middleware 在 server 邊界擋下。
  if (!section || !section.accessible) {
    notFound();
  }

  return (
    <>
      <Header sectionId={sid} />
      <ControlBar sectionId={sid} />
      <div className="flex-1 overflow-hidden">{children}</div>
    </>
  );
}
