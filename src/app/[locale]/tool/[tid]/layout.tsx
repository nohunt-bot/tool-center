import { notFound } from "next/navigation";
import { SectionShell } from "@/components/shell/section-shell";
import { fixturesDataSource } from "@/data/fixtures";
import { ToolNotFoundError } from "@/data/types";

/**
 * 機台層 layout，掛 @modal parallel slot，也是機台子樹（`/tool/[tid]`）的
 * shell 掛載點。
 *
 * FDC 分析視窗因此有自己的 URL：
 *   /tool/SCN-A01/fdc/FOCUS-DRIFT-011?chart=t
 * 從頁面點開 → intercepting route，覆蓋在當前 pane 上（底下的頁面保持不動）
 * 直接開連結  → 完整頁面
 * 這是選 Next App Router 的主要理由之一（docs/decisions/0001-frontend-stack.md）。
 *
 * R5：機台子樹不帶課別段（`docs/decisions/0002-route-and-locale.md`）——
 * 課別代碼在這裡由 `getToolSection(tid)` 反查，不從 URL 拿。這是拔掉舊漏洞
 * 的關鍵（原本 `section/[sid]/tool/[tid]` 結構下，`sid` 與 `tid` 可以任意
 * 配對，權限判斷卻拿 URL 的 `sid` 算角色，等於在自己管的課的 `sid` 下掛
 * 別課的 `tid` 就能取得該機台的 admin 權限）：新結構下 `sectionCode` 只有
 * 一個合法來源（反查），呼叫端無法從 URL 偽造出「這台機台屬於哪個課」，
 * 這個配對漏洞在結構上就不存在了。
 *
 * `getToolSection` reject 時**只有** `ToolNotFoundError`（查無此機台）
 * 轉成 notFound()——跟 `SectionShell` 內部「查無課別／無支援權限」
 * notFound() 是同一種失敗語意，都是「不存在或看不到」，不需要區分成兩種
 * 錯誤畫面。
 *
 * P1 修復：舊版用 `.catch(() => undefined)` 接 `getToolSection(tid)`，
 * 把**所有**失敗（包含上游逾時／5xx／網路中斷）都轉成 notFound()——
 * Stage B 接真實 API 後，維運會把服務失敗誤讀成「使用者輸入了錯的機台
 * 代碼」，看不到真正的錯誤訊號。改成只攔 `ToolNotFoundError`（見
 * `@/data/types`），其餘錯誤原樣往上拋，讓最近的 `error.tsx`（或 Next 預設
 * 500 頁）處理，不會被誤判成 404。
 */
export default async function ToolLayout({
  children,
  modal,
  params,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
  params: Promise<{ tid: string }>;
}) {
  const { tid } = await params;
  let sectionCode: string;
  try {
    sectionCode = await fixturesDataSource.getToolSection(tid);
  } catch (error) {
    if (error instanceof ToolNotFoundError) {
      notFound();
    }
    // 不是「查無此機台」——真正的失敗（逾時／5xx／網路中斷……），往上拋，
    // 不偽裝成 404。
    throw error;
  }

  return (
    <SectionShell sectionCode={sectionCode}>
      {children}
      {modal}
    </SectionShell>
  );
}
