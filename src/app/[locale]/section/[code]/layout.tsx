import { SectionShell } from "@/components/shell/section-shell";

/**
 * 課別頁（機台一覽／課別設定）的 layout：`code`（課代碼）直接來自 URL。
 *
 * R5b：Shell（Header／ControlBar／canEnterSection 檢查）都收斂進
 * `SectionShell`，與 `tool/[tid]/layout.tsx` 共用——那邊的 `sectionCode`
 * 不是從 URL 讀，是由 tool 反查出來的，兩邊不重複寫一份 gating 邏輯。
 */
export default async function SectionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <SectionShell sectionCode={code}>{children}</SectionShell>;
}
