/**
 * 機台層 layout，掛 @modal parallel slot。
 *
 * FDC 分析視窗因此有自己的 URL（[sid] 是課代碼，不是課名，例如底下範例的
 * "SEC-1002" 對應顯示名「黃光二課」／"LITHO-02"）：
 *   /section/SEC-1002/tool/SCN-A01/fdc/FOCUS-DRIFT-011?chart=t
 * 從頁面點開 → intercepting route，覆蓋在當前 pane 上（底下的頁面保持不動）
 * 直接開連結  → 完整頁面
 *
 * 這是選 Next App Router 的主要理由之一（docs/decisions/0001-frontend-stack.md）。
 */
export default function ToolLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
